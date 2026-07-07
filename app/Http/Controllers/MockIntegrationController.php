<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Имитация интеграций (п. 6.12): демонстрационная проверка ИИН/БИН в
 * государственном реестре юрлиц. Данные детерминированно генерируются по БИН —
 * реальная интеграция подключается через Единую интеграционную шину.
 */
class MockIntegrationController extends Controller
{
    /** Небольшой «реестр» известных демо-БИН. */
    private const REGISTRY = [
        '123456789012' => ['name' => 'ТОО «Вагоны Казахстана»', 'oked' => '49200 — Деятельность железнодорожного транспорта'],
        '990140000101' => ['name' => 'ТОО «АгроФерма Астык»', 'oked' => '01410 — Разведение крупного рогатого скота'],
    ];

    private const FORMS = ['ТОО', 'ИП', 'АО', 'КХ'];

    private const CITIES = ['г. Астана', 'г. Алматы', 'г. Шымкент', 'г. Караганда', 'г. Актобе', 'г. Костанай'];

    public function company(Request $request): JsonResponse
    {
        $bin = preg_replace('/\D/', '', (string) $request->query('bin'));

        if (strlen($bin) !== 12) {
            return response()->json([
                'found' => false,
                'message' => 'БИН/ИИН должен содержать 12 цифр.',
            ], 422);
        }

        if (isset(self::REGISTRY[$bin])) {
            $entry = self::REGISTRY[$bin];

            return response()->json($this->payload($bin, $entry['name'], $entry['oked']));
        }

        // Детерминированная генерация по цифрам БИН.
        $seed = (int) substr($bin, -4);
        $form = self::FORMS[$seed % count(self::FORMS)];
        $city = self::CITIES[$seed % count(self::CITIES)];
        $names = ['Бизнес', 'Строй', 'Агро', 'Трейд', 'Пром', 'Логистик', 'Инвест'];
        $name = "{$form} «".$names[$seed % count($names)].'-'.substr($bin, 0, 3).'»';

        return response()->json($this->payload($bin, $name, '46900 — Неспециализированная оптовая торговля', $city));
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(string $bin, string $name, string $oked, ?string $city = null): array
    {
        $seed = (int) substr($bin, -4);
        $city ??= self::CITIES[$seed % count(self::CITIES)];
        $year = 2005 + ($seed % 20);

        return [
            'found' => true,
            'bin' => $bin,
            'name' => $name,
            'address' => "{$city}, ул. Абая, ".(($seed % 200) + 1),
            'status' => 'Действующее',
            'registered_at' => "{$year}-".str_pad((string) (($seed % 12) + 1), 2, '0', STR_PAD_LEFT).'-15',
            'oked' => $oked,
            'source' => 'Демо-реестр юрлиц (mock через Единую интеграционную шину)',
        ];
    }
}
