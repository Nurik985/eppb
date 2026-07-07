<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::pluck('id', 'slug');

        // [name, orgSlug, region, locality, lat, lng, industry, amount, status, from, to]
        $projects = [
            ['Завод по производству ж/д вагонов', 'brk', 'east-kz', 'Экибастуз', 49.9481, 82.6279, 'manufacturing', 12500000000, 'реализуется', 2024, 2026],
            ['Молочно-товарная ферма на 1200 голов', 'agrocredit', 'north-kz', 'Петропавловск', 54.8728, 69.1596, 'agriculture', 3200000000, 'завершён', 2022, 2024],
            ['Тепличный комплекс 15 га', 'damu', 'turkestan', 'Туркестан', 43.2973, 68.2517, 'agriculture', 1800000000, 'реализуется', 2023, 2025],
            ['Логистический хаб «Хоргос»', 'brk', 'almaty', 'Хоргос', 44.2110, 80.4000, 'transport', 8900000000, 'реализуется', 2024, 2027],
            ['Экспортное производство подсолнечного масла', 'kazakhexport', 'north-kz', 'Петропавловск', 54.8500, 69.1400, 'export', 2100000000, 'завершён', 2021, 2023],
            ['Обновление парка сельхозтехники', 'kaf', 'kostanay', 'Костанай', 53.2144, 63.6246, 'agriculture', 950000000, 'реализуется', 2024, 2025],
            ['Птицефабрика на 20 млн голов', 'agrocredit', 'almaty', 'Талгар', 43.3000, 77.2400, 'agriculture', 4300000000, 'реализуется', 2023, 2026],
            ['Завод стройматериалов', 'idf', 'karaganda', 'Караганда', 49.8047, 73.1094, 'manufacturing', 5600000000, 'реализуется', 2024, 2026],
            ['Ветропарк 50 МВт', 'qic', 'zhambyl', 'Тараз', 42.9000, 71.3667, 'energy', 15000000000, 'реализуется', 2023, 2026],
            ['Арендное жильё для молодых семей', 'baiterek-development', 'astana', 'Астана', 51.1694, 71.4491, 'construction', 6700000000, 'реализуется', 2024, 2026],
            ['Мясоперерабатывающий комбинат', 'agrocredit', 'west-kz', 'Уральск', 51.2333, 51.3667, 'agriculture', 2800000000, 'на паузе', 2023, 2025],
            ['Текстильная фабрика (экспорт)', 'kazakhexport', 'shymkent', 'Шымкент', 42.3417, 69.5901, 'export', 3900000000, 'реализуется', 2024, 2026],
            ['ИТ-парк и дата-центр', 'qic', 'astana', 'Астана', 51.1300, 71.4300, 'it', 7200000000, 'реализуется', 2024, 2027],
            ['Модернизация элеватора', 'agrocredit', 'akmola', 'Кокшетау', 53.2833, 69.3833, 'agriculture', 1200000000, 'завершён', 2022, 2023],
            ['Завод по переработке пластика', 'idf', 'pavlodar', 'Павлодар', 52.2870, 76.9674, 'manufacturing', 3100000000, 'реализуется', 2024, 2026],
            ['Туристический комплекс на Алаколе', 'damu', 'zhetysu', 'Ушарал', 46.1667, 80.9500, 'tourism', 1500000000, 'реализуется', 2023, 2025],
            ['Микрокредитование МСБ (портфель)', 'damu', 'almaty-city', 'Алматы', 43.2389, 76.8897, 'services', 2400000000, 'реализуется', 2024, 2025],
            ['Цистерны для нефтехимии в лизинг', 'brk', 'atyrau', 'Атырау', 47.0945, 51.9238, 'transport', 5100000000, 'реализуется', 2024, 2026],
        ];

        foreach ($projects as [$name, $slug, $region, $locality, $lat, $lng, $industry, $amount, $status, $from, $to]) {
            Project::updateOrCreate(
                ['name' => $name],
                [
                    'organization_id' => $org[$slug] ?? null,
                    'region' => $region,
                    'locality' => $locality,
                    'lat' => $lat,
                    'lng' => $lng,
                    'industry' => $industry,
                    'amount' => $amount,
                    'status' => $status,
                    'year_from' => $from,
                    'year_to' => $to,
                    'description' => "Проект профинансирован группой Холдинга «Байтерек». Направление: {$industry}.",
                ],
            );
        }
    }
}
