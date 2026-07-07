<?php

namespace Database\Seeders;

use App\Models\Organization;
use Illuminate\Database\Seeder;

class OrganizationSeeder extends Seeder
{
    public function run(): void
    {
        $orgs = [
            [
                'slug' => 'brk',
                'name' => 'Банк Развития Казахстана',
                'short_name' => 'БРК',
                'description' => 'Финансирование крупных инвестиционных и инфраструктурных проектов, лизинг.',
                'website' => 'https://www.kdb.kz',
                'color' => '#1f6feb',
            ],
            [
                'slug' => 'damu',
                'name' => 'Фонд развития предпринимательства «Даму»',
                'short_name' => 'Даму',
                'description' => 'Поддержка малого и среднего бизнеса: субсидирование, гарантирование, обучение.',
                'website' => 'https://damu.kz',
                'color' => '#2ea043',
            ],
            [
                'slug' => 'kazakhexport',
                'name' => 'Экспортная страховая компания «KazakhExport»',
                'short_name' => 'KazakhExport',
                'description' => 'Страхование и поддержка несырьевого экспорта казахстанских компаний.',
                'website' => 'https://kazakhexport.kz',
                'color' => '#8957e5',
            ],
            [
                'slug' => 'agrocredit',
                'name' => 'Аграрная кредитная корпорация',
                'short_name' => 'АКК',
                'description' => 'Кредитование и лизинг в агропромышленном комплексе.',
                'website' => 'https://agrocredit.kz',
                'color' => '#bf8700',
            ],
            [
                'slug' => 'kaf',
                'name' => 'КазАгроФинанс',
                'short_name' => 'КАФ',
                'description' => 'Лизинг сельскохозяйственной техники и оборудования.',
                'website' => 'https://kaf.kz',
                'color' => '#e3663e',
            ],
            [
                'slug' => 'idf',
                'name' => 'Фонд развития промышленности',
                'short_name' => 'ФРП',
                'description' => 'Финансирование проектов обрабатывающей промышленности.',
                'website' => 'https://idfrk.kz',
                'color' => '#0d9488',
            ],
            [
                'slug' => 'qic',
                'name' => 'Qazaqstan Investment Corporation',
                'short_name' => 'QIC',
                'description' => 'Прямые и фондовые инвестиции в проекты развития.',
                'website' => 'https://qic.kz',
                'color' => '#d6336c',
            ],
            [
                'slug' => 'baiterek-development',
                'name' => 'Казахстанская жилищная компания',
                'short_name' => 'КЖК',
                'description' => 'Развитие арендного и доступного жилья.',
                'website' => 'https://homeportal.kz',
                'color' => '#4c6ef5',
            ],
        ];

        foreach ($orgs as $org) {
            Organization::updateOrCreate(['slug' => $org['slug']], $org);
        }
    }
}
