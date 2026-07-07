<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Support\ConditionEvaluator;
use App\Support\ServicePresenter;
use App\Support\ServiceSchema;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CabinetController extends Controller
{
    public function index(Request $request): Response
    {
        $applications = Application::query()
            ->where('user_id', $request->user()->id)
            ->with('service:id,slug,title')
            ->withCount(['events as unread_count' => fn ($q) => $q->where('is_read', false)])
            ->latest('updated_at')
            ->get()
            ->map(fn (Application $a) => [
                'id' => $a->id,
                'number' => $a->number,
                'status' => $a->status,
                'current_step' => $a->current_step,
                'submitted_at' => $a->submitted_at?->toDateString(),
                'updated_at' => $a->updated_at?->toDateString(),
                'unread_count' => $a->unread_count,
                'service' => [
                    'slug' => $a->service->slug,
                    'title' => $a->service->title,
                ],
            ]);

        return Inertia::render('cabinet/index', [
            'applications' => $applications,
            'stats' => [
                'total' => $applications->count(),
                'active' => $applications->whereIn('status', ['submitted', 'in_review', 'need_info'])->count(),
                'drafts' => $applications->where('status', 'draft')->count(),
            ],
        ]);
    }

    public function show(Request $request, Application $application): Response
    {
        abort_unless($application->user_id === $request->user()->id, 403);

        $application->load(['service:id,slug,title,schema,is_complex', 'events']);
        $schema = $application->service->schema ?? ['steps' => []];
        $references = ServicePresenter::references($schema);

        return Inertia::render('cabinet/show', [
            'application' => [
                'id' => $application->id,
                'number' => $application->number,
                'status' => $application->status,
                'submitted_at' => $application->submitted_at?->toIso8601String(),
                'service' => [
                    'slug' => $application->service->slug,
                    'title' => $application->service->title,
                ],
                'answers' => $this->presentAnswers($schema, $application->data ?? [], $references),
                'events' => $application->events->map(fn ($e) => [
                    'type' => $e->type,
                    'title' => $e->title,
                    'body' => $e->body,
                    'status' => $e->status,
                    'created_at' => $e->created_at?->toIso8601String(),
                ])->all(),
            ],
        ]);
    }

    /**
     * Готовит человекочитаемый обзор ответов заявки, сгруппированный по этапам.
     *
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $data
     * @param  array<string, array<int, array{value: string, label: string}>>  $references
     * @return array<int, array<string, mixed>>
     */
    private function presentAnswers(array $schema, array $data, array $references): array
    {
        $conditions = new ConditionEvaluator;
        $service = ServiceSchema::make($schema);
        $data = $service->withComputed($data);

        $result = [];
        foreach ($schema['steps'] ?? [] as $step) {
            $rows = [];
            foreach ($step['fields'] ?? [] as $field) {
                if (! $conditions->passes($field['visibleWhen'] ?? null, $data)) {
                    continue;
                }
                $value = $data[$field['id']] ?? null;
                if ($value === null || $value === '' || $value === false) {
                    continue;
                }
                $rows[] = [
                    'label' => $field['label'] ?? $field['id'],
                    'value' => $this->formatValue($field, $value, $references),
                ];
            }
            if (! empty($rows)) {
                $result[] = ['title' => $step['title'] ?? '', 'rows' => $rows];
            }
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $field
     * @param  array<string, array<int, array{value: string, label: string}>>  $references
     */
    private function formatValue(array $field, mixed $value, array $references): string
    {
        $type = $field['type'] ?? 'text';

        if ($type === 'checkbox') {
            return $value ? 'Да' : 'Нет';
        }

        if ($type === 'money' || $type === 'computed') {
            return number_format((float) $value, 0, '.', ' ').' ₸';
        }

        // Значение из справочника или списка опций — показываем метку.
        if (in_array($type, ['select', 'radio', 'region'], true)) {
            $options = $field['options'] ?? null;
            if ($type === 'region') {
                $options = $references['regions'] ?? [];
            } elseif (! empty($field['reference'])) {
                $options = $references[$field['reference']] ?? [];
            }
            foreach ($options ?? [] as $opt) {
                if ((string) ($opt['value'] ?? '') === (string) $value) {
                    return (string) ($opt['label'] ?? $value);
                }
            }
        }

        return (string) $value;
    }
}
