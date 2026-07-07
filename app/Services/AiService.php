<?php

namespace App\Services;

use App\Models\Service;
use App\Support\ServicePresenter;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * AI-компонент ЕППБ. Использует Claude (Messages API) при наличии
 * ANTHROPIC_API_KEY; иначе — детерминированный эвристический fallback,
 * чтобы демо и подбор всегда работали.
 *
 * Сценарии:
 *  - suggestServices(): подбор меры поддержки по описанию ситуации;
 *  - generateServiceSchema(): генерация структуры услуги для конструктора.
 */
class AiService
{
    private const ENDPOINT = 'https://api.anthropic.com/v1/messages';

    public function enabled(): bool
    {
        return filled(config('services.anthropic.key'));
    }

    /**
     * Подбор услуг по свободному описанию ситуации предпринимателя.
     *
     * @return array{mode: string, items: array<int, array<string, mixed>>}
     */
    public function suggestServices(string $situation): array
    {
        $services = Service::published()
            ->with(['category:id,slug,name,color,icon', 'organization:id,name,short_name,color'])
            ->get();

        $picked = $this->enabled()
            ? $this->suggestViaClaude($situation, $services)
            : null;

        // Fallback (или если Claude вернул мусор) — эвристика по ключевым словам.
        $mode = 'ai';
        if ($picked === null) {
            $picked = $this->suggestViaHeuristic($situation, $services);
            $mode = 'heuristic';
        }

        $bySlug = $services->keyBy('slug');
        $items = [];
        foreach ($picked as $row) {
            $service = $bySlug->get($row['slug'] ?? null);
            if (! $service) {
                continue;
            }
            $items[] = array_merge(ServicePresenter::card($service), [
                'reason' => $row['reason'] ?? '',
            ]);
        }

        return ['mode' => $mode, 'items' => $items];
    }

    /**
     * Генерация черновика схемы услуги по текстовому описанию меры поддержки.
     *
     * @return array{mode: string, title: string, summary: string, schema: array<string, mixed>}
     */
    public function generateServiceSchema(string $description): array
    {
        if ($this->enabled()) {
            $result = $this->generateSchemaViaClaude($description);
            if ($result !== null) {
                return array_merge(['mode' => 'ai'], $result);
            }
        }

        return array_merge(['mode' => 'heuristic'], $this->generateSchemaViaHeuristic($description));
    }

    // ------------------------------------------------------------------
    // Claude
    // ------------------------------------------------------------------

    /**
     * @return array<int, array{slug: string, reason: string}>|null
     */
    private function suggestViaClaude(string $situation, $services): ?array
    {
        $catalog = $services->map(fn (Service $s) => [
            'slug' => $s->slug,
            'title' => $s->title,
            'summary' => $s->summary,
            'category' => $s->category?->name,
            'organization' => $s->organization?->short_name,
        ])->all();

        $system = 'Ты — консультант Единого портала поддержки бизнеса Холдинга «Байтерек». '
            .'По описанию ситуации предпринимателя подбери до 3 наиболее подходящих мер поддержки '
            .'СТРОГО из предоставленного каталога. Отвечай только на русском. '
            .'Верни ТОЛЬКО валидный JSON-массив вида '
            .'[{"slug":"...","reason":"1-2 предложения, почему подходит"}], без пояснений и markdown.';

        $user = "Каталог услуг (JSON):\n".json_encode($catalog, JSON_UNESCAPED_UNICODE)
            ."\n\nСитуация предпринимателя:\n".$situation;

        $text = $this->callClaude($system, $user, 1024);
        if ($text === null) {
            return null;
        }

        $data = $this->extractJson($text);

        return is_array($data) ? $data : null;
    }

    /**
     * @return array{title: string, summary: string, schema: array<string, mixed>}|null
     */
    private function generateSchemaViaClaude(string $description): ?array
    {
        $system = 'Ты — помощник бизнес-аналитика в конструкторе услуг ЕППБ. '
            .'По описанию меры господдержки сгенерируй структуру формы. Отвечай на русском. '
            .'Верни ТОЛЬКО валидный JSON без markdown в формате: '
            .'{"title":"...","summary":"...","schema":{"steps":[{"id":"step1","title":"...","description":"...",'
            .'"fields":[{"id":"snake_case_id","type":"<тип>","label":"...","required":true|false,'
            .'"hint":"?","options":[{"value":"..","label":".."}]?,"reference":"applicant_types|regions"?,'
            .'"computed":{"formula":"id1 * id2","decimals":0}?,'
            .'"visibleWhen":{"field":"id","op":"eq","value":".."}?}]}],'
            .'"settings":{"submitLabel":"Подать заявку","successMessage":"..."}}}. '
            .'Допустимые type: text, textarea, number, money, select, radio, checkbox, date, file, bin, region, computed. '
            .'Для расчётных полей используй type "computed" и формулу из id других числовых полей. '
            .'Сделай 2-4 логичных этапа: заявитель, параметры, документы.';

        $text = $this->callClaude($system, 'Мера поддержки: '.$description, 2000);
        if ($text === null) {
            return null;
        }

        $data = $this->extractJson($text);
        if (! is_array($data) || ! isset($data['schema']['steps']) || ! is_array($data['schema']['steps'])) {
            return null;
        }

        return [
            'title' => (string) ($data['title'] ?? Str::limit($description, 60, '')),
            'summary' => (string) ($data['summary'] ?? ''),
            'schema' => $data['schema'],
        ];
    }

    private function callClaude(string $system, string $user, int $maxTokens): ?string
    {
        try {
            $response = Http::withHeaders([
                'x-api-key' => config('services.anthropic.key'),
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])->timeout(30)->post(self::ENDPOINT, [
                'model' => config('services.anthropic.model'),
                'max_tokens' => $maxTokens,
                'output_config' => ['effort' => 'low'],
                'system' => $system,
                'messages' => [
                    ['role' => 'user', 'content' => $user],
                ],
            ]);

            if ($response->failed()) {
                Log::warning('AiService: Claude API error', ['status' => $response->status()]);

                return null;
            }

            // Собираем текст из всех text-блоков ответа.
            $text = collect($response->json('content', []))
                ->where('type', 'text')
                ->pluck('text')
                ->implode('');

            return $text !== '' ? $text : null;
        } catch (\Throwable $e) {
            Log::warning('AiService: Claude call failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Извлекает JSON из ответа модели (убирает возможные ```-ограждения).
     */
    private function extractJson(string $text): mixed
    {
        $text = trim($text);
        $text = preg_replace('/^```(?:json)?/i', '', $text);
        $text = preg_replace('/```$/', '', trim($text));

        return json_decode(trim($text), true);
    }

    // ------------------------------------------------------------------
    // Fallback (эвристика без внешнего API)
    // ------------------------------------------------------------------

    /**
     * @return array<int, array{slug: string, reason: string}>
     */
    private function suggestViaHeuristic(string $situation, $services): array
    {
        $needle = Str::lower($situation);
        $words = array_values(array_filter(
            preg_split('/[^\p{L}\p{N}]+/u', $needle) ?: [],
            fn ($w) => Str::length($w) >= 4,
        ));

        $scored = $services->map(function (Service $s) use ($words) {
            $haystack = Str::lower(implode(' ', [
                $s->title, $s->summary, $s->description,
                $s->category?->name, $s->organization?->name,
            ]));
            $score = 0;
            foreach ($words as $w) {
                if (Str::contains($haystack, $w)) {
                    $score++;
                }
            }
            if ($s->is_popular) {
                $score += 0.5;
            }

            return ['slug' => $s->slug, 'score' => $score, 'title' => $s->title];
        })->sortByDesc('score')->values();

        // Если совпадений нет — показываем популярные.
        $top = $scored->where('score', '>', 0)->take(3);
        if ($top->isEmpty()) {
            $top = $services->where('is_popular', true)->take(3)
                ->map(fn (Service $s) => ['slug' => $s->slug, 'title' => $s->title]);
        }

        return $top->map(fn ($row) => [
            'slug' => $row['slug'],
            'reason' => 'Подобрано по совпадению с вашим запросом. Уточните детали внутри услуги.',
        ])->values()->all();
    }

    /**
     * @return array{title: string, summary: string, schema: array<string, mixed>}
     */
    private function generateSchemaViaHeuristic(string $description): array
    {
        return [
            'title' => Str::limit(Str::ucfirst(trim($description)), 60, ''),
            'summary' => Str::limit($description, 140),
            'schema' => [
                'steps' => [
                    [
                        'id' => 'applicant',
                        'title' => 'Заявитель',
                        'description' => 'Основные сведения о заявителе.',
                        'fields' => [
                            ['id' => 'applicant_type', 'type' => 'select', 'label' => 'Тип заявителя', 'reference' => 'applicant_types', 'required' => true],
                            ['id' => 'bin', 'type' => 'bin', 'label' => 'БИН / ИИН', 'required' => true],
                            ['id' => 'company_name', 'type' => 'text', 'label' => 'Наименование', 'required' => true],
                            ['id' => 'region', 'type' => 'region', 'label' => 'Регион', 'required' => true],
                        ],
                    ],
                    [
                        'id' => 'request',
                        'title' => 'Параметры',
                        'description' => 'Опишите вашу потребность.',
                        'fields' => [
                            ['id' => 'amount', 'type' => 'money', 'label' => 'Запрашиваемая сумма, ₸', 'required' => true],
                            ['id' => 'purpose', 'type' => 'textarea', 'label' => 'Цель', 'required' => true],
                        ],
                    ],
                    [
                        'id' => 'documents',
                        'title' => 'Документы',
                        'fields' => [
                            ['id' => 'doc_main', 'type' => 'file', 'label' => 'Основной документ', 'required' => true],
                            ['id' => 'consent', 'type' => 'checkbox', 'label' => 'Согласен на обработку данных', 'required' => true],
                        ],
                    ],
                ],
                'settings' => [
                    'submitLabel' => 'Подать заявку',
                    'successMessage' => 'Заявка принята. Отслеживайте статус в личном кабинете.',
                ],
            ],
        ];
    }
}
