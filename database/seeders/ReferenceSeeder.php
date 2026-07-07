<?php

namespace Database\Seeders;

use App\Models\Reference;
use Illuminate\Database\Seeder;

class ReferenceSeeder extends Seeder
{
    public function run(): void
    {
        // Регионы РК с координатами административных центров (для карты проектов).
        $regions = [
            ['astana', 'г. Астана', 51.1694, 71.4491],
            ['almaty-city', 'г. Алматы', 43.2389, 76.8897],
            ['shymkent', 'г. Шымкент', 42.3417, 69.5901],
            ['akmola', 'Акмолинская область', 51.9167, 69.4111],
            ['aktobe', 'Актюбинская область', 50.2839, 57.1670],
            ['almaty', 'Алматинская область', 45.0156, 78.3739],
            ['atyrau', 'Атырауская область', 47.0945, 51.9238],
            ['east-kz', 'Восточно-Казахстанская область', 49.9481, 82.6279],
            ['zhambyl', 'Жамбылская область', 42.9000, 71.3667],
            ['west-kz', 'Западно-Казахстанская область', 51.2333, 51.3667],
            ['karaganda', 'Карагандинская область', 49.8047, 73.1094],
            ['kostanay', 'Костанайская область', 53.2144, 63.6246],
            ['kyzylorda', 'Кызылординская область', 44.8479, 65.4823],
            ['mangystau', 'Мангистауская область', 43.6510, 51.1608],
            ['pavlodar', 'Павлодарская область', 52.2870, 76.9674],
            ['north-kz', 'Северо-Казахстанская область', 54.8728, 69.1596],
            ['turkestan', 'Туркестанская область', 43.2973, 68.2517],
            ['abai', 'Область Абай', 50.4111, 80.2275],
            ['zhetysu', 'Область Жетісу', 45.0156, 78.3739],
            ['ulytau', 'Область Ұлытау', 48.0056, 66.8236],
        ];

        foreach ($regions as $i => [$code, $label, $lat, $lng]) {
            Reference::updateOrCreate(
                ['type' => 'regions', 'code' => $code],
                ['label' => $label, 'meta' => ['lat' => $lat, 'lng' => $lng], 'sort' => $i],
            );
        }

        // Отрасли / направления.
        $industries = [
            'agriculture' => 'Сельское хозяйство',
            'manufacturing' => 'Обрабатывающая промышленность',
            'transport' => 'Транспорт и логистика',
            'construction' => 'Строительство',
            'energy' => 'Энергетика',
            'trade' => 'Торговля',
            'it' => 'ИТ и связь',
            'tourism' => 'Туризм',
            'export' => 'Экспорт',
            'services' => 'Услуги',
        ];
        $i = 0;
        foreach ($industries as $code => $label) {
            Reference::updateOrCreate(
                ['type' => 'industries', 'code' => $code],
                ['label' => $label, 'sort' => $i++],
            );
        }

        // Типы заявителя (используется в ветвлении форм).
        $applicantTypes = [
            'ip' => 'Индивидуальный предприниматель',
            'too' => 'ТОО',
            'ao' => 'Акционерное общество',
            'peasant' => 'Крестьянское (фермерское) хозяйство',
        ];
        $i = 0;
        foreach ($applicantTypes as $code => $label) {
            Reference::updateOrCreate(
                ['type' => 'applicant_types', 'code' => $code],
                ['label' => $label, 'sort' => $i++],
            );
        }
    }
}
