<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['crediting', 'Кредитование', 'banknote', '#1f6feb'],
            ['subsidizing', 'Субсидирование', 'percent', '#2ea043'],
            ['guaranteeing', 'Гарантирование', 'shield-check', '#0d9488'],
            ['leasing', 'Лизинг', 'truck', '#e3663e'],
            ['insurance', 'Страхование', 'umbrella', '#8957e5'],
            ['investment', 'Инвестирование', 'trending-up', '#d6336c'],
            ['export', 'Поддержка экспорта', 'globe', '#0ea5e9'],
            ['grants', 'Гранты и обучение', 'graduation-cap', '#bf8700'],
        ];

        $cat = [];
        foreach ($categories as $i => [$slug, $name, $icon, $color]) {
            $cat[$slug] = ServiceCategory::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'icon' => $icon, 'color' => $color, 'sort' => $i],
            )->id;
        }

        $org = Organization::pluck('id', 'slug');

        // --- Контрольная услуга 1: сложная, многоэтапная, с ветвлением и расчётами ---
        $this->service([
            'slug' => 'wagons-leasing',
            'title' => 'Приобретение вагонов в лизинг',
            'summary' => 'Финансовый лизинг грузовых вагонов для транспортных компаний. I этап — подача заявки.',
            'description' => 'Мера поддержки для приобретения грузовых вагонов на условиях финансового лизинга. Услуга проходит в два этапа: первичная заявка и последующее предоставление расширенного пакета документов.',
            'service_category_id' => $cat['leasing'],
            'organization_id' => $org['brk'] ?? null,
            'is_complex' => true,
            'meta' => [
                'term' => 'до 7 лет',
                'amount' => 'до 5 млрд ₸',
                'rate' => 'от 5% годовых',
                'audience' => 'Транспортные и логистические компании',
                // II этап — предоставление расширенных данных после предварительного одобрения.
                'stage2' => [
                    'title' => 'Расширенные данные и документы (II этап)',
                    'description' => 'После предварительного рассмотрения предоставьте расширенный пакет для окончательного решения.',
                    'fields' => [
                        ['id' => 'collateral_type', 'type' => 'select', 'label' => 'Вид обеспечения', 'required' => true, 'options' => [
                            ['value' => 'wagons', 'label' => 'Залог приобретаемых вагонов'],
                            ['value' => 'guarantee', 'label' => 'Банковская гарантия'],
                            ['value' => 'surety', 'label' => 'Поручительство'],
                        ]],
                        ['id' => 'collateral_value', 'type' => 'money', 'label' => 'Оценочная стоимость обеспечения, ₸', 'required' => true],
                        ['id' => 'doc_financials_full', 'type' => 'file', 'label' => 'Финансовая отчётность за 3 года', 'required' => true],
                        ['id' => 'doc_contract', 'type' => 'file', 'label' => 'Проект договора поставки вагонов', 'required' => true],
                        ['id' => 'doc_collateral', 'type' => 'file', 'label' => 'Документы по обеспечению', 'required' => true],
                    ],
                ],
            ],
            'schema' => $this->wagonsSchema(),
        ]);

        // --- Контрольная услуга 2: популярная ---
        $this->service([
            'slug' => 'agro-animal',
            'title' => 'Агробизнес — животноводство',
            'summary' => 'Льготное кредитование проектов в сфере животноводства для КХ и сельхозпредприятий.',
            'description' => 'Финансирование проектов животноводства: приобретение поголовья, кормов, оборудования и модернизация ферм.',
            'service_category_id' => $cat['crediting'],
            'organization_id' => $org['agrocredit'] ?? null,
            'is_popular' => true,
            'meta' => ['term' => 'до 5 лет', 'amount' => 'до 100 млн ₸', 'rate' => 'от 2,5% годовых', 'audience' => 'КХ, ТОО в сфере АПК'],
            'schema' => $this->agroSchema(),
        ]);

        // --- Дополнительные услуги каталога (демонстрируют масштаб) ---
        $extra = [
            ['subsidy-rate', 'Субсидирование ставки вознаграждения', 'Снижение процентной ставки по действующим кредитам МСБ.', 'subsidizing', 'damu', true, false, ['term' => 'до 3 лет', 'amount' => '—', 'rate' => 'до 7% субсидии']],
            ['guarantee-sme', 'Гарантирование по кредитам МСБ', 'Гарантия Фонда «Даму» при нехватке залогового обеспечения.', 'guaranteeing', 'damu', false, false, ['amount' => 'до 85% суммы кредита']],
            ['export-insurance', 'Страхование экспортного контракта', 'Защита экспортёра от коммерческих и политических рисков.', 'insurance', 'kazakhexport', false, false, ['amount' => 'до 90% контракта']],
            ['agro-leasing', 'Лизинг сельхозтехники', 'Обновление парка сельскохозяйственной техники и оборудования.', 'leasing', 'kaf', false, true, ['term' => 'до 7 лет', 'rate' => 'от 6% годовых']],
            ['industry-finance', 'Финансирование обрабатывающей промышленности', 'Долгосрочные займы на проекты обрабатывающего сектора.', 'crediting', 'idf', false, true, ['term' => 'до 10 лет', 'amount' => 'до 7 млрд ₸']],
            ['micro-start', 'Микрокредитование для старта бизнеса', 'Займы начинающим предпринимателям на запуск дела.', 'crediting', 'damu', true, false, ['amount' => 'до 20 млн ₸']],
            ['invest-project', 'Соинвестирование проектов развития', 'Долевое участие в перспективных инвестиционных проектах.', 'investment', 'qic', false, true, ['amount' => 'по проекту']],
        ];

        foreach ($extra as [$slug, $title, $summary, $catSlug, $orgSlug, $popular, $complex, $meta]) {
            $this->service([
                'slug' => $slug,
                'title' => $title,
                'summary' => $summary,
                'service_category_id' => $cat[$catSlug],
                'organization_id' => $org[$orgSlug] ?? null,
                'is_popular' => $popular,
                'is_complex' => $complex,
                'meta' => $meta,
                'schema' => $this->simpleSchema(),
            ]);
        }
    }

    private function service(array $data): void
    {
        Service::updateOrCreate(
            ['slug' => $data['slug']],
            array_merge([
                'status' => 'published',
                'published_at' => Carbon::now(),
            ], $data),
        );
    }

    /** Минимальная одно-двухшаговая схема для услуг каталога. */
    private function simpleSchema(): array
    {
        return [
            'steps' => [
                [
                    'id' => 'applicant',
                    'title' => 'Данные заявителя',
                    'description' => 'Основные сведения о вашей компании.',
                    'fields' => [
                        ['id' => 'applicant_type', 'type' => 'select', 'label' => 'Тип заявителя', 'reference' => 'applicant_types', 'required' => true],
                        ['id' => 'bin', 'type' => 'bin', 'label' => 'БИН / ИИН', 'required' => true, 'hint' => '12 цифр — подтянем данные из mock-реестра'],
                        ['id' => 'company_name', 'type' => 'text', 'label' => 'Наименование заявителя', 'required' => true],
                        ['id' => 'region', 'type' => 'region', 'label' => 'Регион', 'required' => true],
                    ],
                ],
                [
                    'id' => 'request',
                    'title' => 'Параметры запроса',
                    'description' => 'Опишите вашу потребность.',
                    'fields' => [
                        ['id' => 'amount', 'type' => 'money', 'label' => 'Запрашиваемая сумма, ₸', 'required' => true],
                        ['id' => 'purpose', 'type' => 'textarea', 'label' => 'Цель финансирования', 'required' => true],
                    ],
                ],
            ],
            'settings' => [
                'submitLabel' => 'Подать заявку',
                'successMessage' => 'Заявка принята. Отслеживайте статус в личном кабинете.',
            ],
        ];
    }

    /** Схема контрольной услуги «Вагоны в лизинг»: ветвление + расчёты. */
    private function wagonsSchema(): array
    {
        return [
            'steps' => [
                [
                    'id' => 'applicant',
                    'title' => 'Заявитель',
                    'description' => 'Кто подаёт заявку.',
                    'fields' => [
                        ['id' => 'applicant_type', 'type' => 'select', 'label' => 'Тип заявителя', 'reference' => 'applicant_types', 'required' => true],
                        ['id' => 'bin', 'type' => 'bin', 'label' => 'БИН', 'required' => true, 'hint' => 'Подтянем наименование и адрес из mock-реестра юрлиц'],
                        ['id' => 'company_name', 'type' => 'text', 'label' => 'Наименование организации', 'required' => true],
                        ['id' => 'region', 'type' => 'region', 'label' => 'Регион регистрации', 'required' => true],
                        ['id' => 'is_resident', 'type' => 'checkbox', 'label' => 'Резидент Республики Казахстан', 'default' => true],
                    ],
                ],
                [
                    'id' => 'wagons',
                    'title' => 'Предмет лизинга',
                    'description' => 'Параметры приобретаемых вагонов.',
                    'fields' => [
                        ['id' => 'wagon_type', 'type' => 'select', 'label' => 'Тип вагонов', 'required' => true, 'options' => [
                            ['value' => 'gondola', 'label' => 'Полувагоны'],
                            ['value' => 'tank', 'label' => 'Цистерны'],
                            ['value' => 'hopper', 'label' => 'Хопперы'],
                            ['value' => 'platform', 'label' => 'Платформы'],
                        ]],
                        ['id' => 'wagon_count', 'type' => 'number', 'label' => 'Количество вагонов, шт.', 'required' => true, 'validation' => ['min' => 1, 'max' => 1000]],
                        ['id' => 'wagon_price', 'type' => 'money', 'label' => 'Цена за вагон, ₸', 'required' => true],
                        ['id' => 'total_price', 'type' => 'computed', 'label' => 'Стоимость предмета лизинга, ₸', 'computed' => ['formula' => 'wagon_count * wagon_price', 'decimals' => 0], 'hint' => 'Рассчитывается автоматически'],
                        ['id' => 'is_used', 'type' => 'checkbox', 'label' => 'Вагоны, бывшие в эксплуатации'],
                        ['id' => 'wagon_age', 'type' => 'number', 'label' => 'Возраст вагонов, лет', 'visibleWhen' => ['field' => 'is_used', 'op' => 'eq', 'value' => true], 'validation' => ['min' => 0, 'max' => 30]],
                    ],
                ],
                [
                    'id' => 'financing',
                    'title' => 'Условия финансирования',
                    'description' => 'Расчёт лизинга.',
                    'fields' => [
                        ['id' => 'advance_percent', 'type' => 'number', 'label' => 'Авансовый платёж, %', 'required' => true, 'default' => 15, 'validation' => ['min' => 10, 'max' => 50]],
                        ['id' => 'advance_amount', 'type' => 'computed', 'label' => 'Сумма аванса, ₸', 'computed' => ['formula' => 'wagon_count * wagon_price * advance_percent / 100', 'decimals' => 0]],
                        ['id' => 'lease_amount', 'type' => 'computed', 'label' => 'Сумма лизинга, ₸', 'computed' => ['formula' => 'wagon_count * wagon_price - wagon_count * wagon_price * advance_percent / 100', 'decimals' => 0]],
                        ['id' => 'term_months', 'type' => 'number', 'label' => 'Срок лизинга, мес.', 'required' => true, 'default' => 60, 'validation' => ['min' => 12, 'max' => 84]],
                        ['id' => 'monthly_payment', 'type' => 'computed', 'label' => 'Ориентировочный ежемесячный платёж, ₸', 'computed' => ['formula' => '(wagon_count * wagon_price - wagon_count * wagon_price * advance_percent / 100) / term_months', 'decimals' => 0], 'hint' => 'Без учёта вознаграждения — предварительная оценка'],
                    ],
                ],
                [
                    'id' => 'documents',
                    'title' => 'Документы',
                    'description' => 'Приложите документы I этапа.',
                    'fields' => [
                        ['id' => 'doc_application', 'type' => 'file', 'label' => 'Заявление на финансирование', 'required' => true],
                        ['id' => 'doc_financials', 'type' => 'file', 'label' => 'Финансовая отчётность за последний год', 'required' => true],
                        ['id' => 'doc_used_report', 'type' => 'file', 'label' => 'Отчёт об оценке (для б/у вагонов)', 'visibleWhen' => ['field' => 'is_used', 'op' => 'eq', 'value' => true]],
                        ['id' => 'consent', 'type' => 'checkbox', 'label' => 'Согласен на обработку персональных данных и запрос сведений в госорганах', 'required' => true],
                    ],
                ],
            ],
            'settings' => [
                'submitLabel' => 'Подать заявку (I этап)',
                'successMessage' => 'Заявка I этапа принята. После предварительного рассмотрения вам будет предложено предоставить расширенный пакет документов (II этап).',
            ],
        ];
    }

    /** Схема контрольной услуги «Агробизнес — животноводство». */
    private function agroSchema(): array
    {
        return [
            'steps' => [
                [
                    'id' => 'applicant',
                    'title' => 'Заявитель',
                    'fields' => [
                        ['id' => 'applicant_type', 'type' => 'select', 'label' => 'Тип заявителя', 'reference' => 'applicant_types', 'required' => true],
                        ['id' => 'bin', 'type' => 'bin', 'label' => 'БИН / ИИН', 'required' => true],
                        ['id' => 'company_name', 'type' => 'text', 'label' => 'Наименование / ФИО', 'required' => true],
                        ['id' => 'region', 'type' => 'region', 'label' => 'Регион', 'required' => true],
                    ],
                ],
                [
                    'id' => 'project',
                    'title' => 'Проект',
                    'description' => 'Направление и параметры проекта.',
                    'fields' => [
                        ['id' => 'direction', 'type' => 'select', 'label' => 'Направление', 'required' => true, 'options' => [
                            ['value' => 'cattle', 'label' => 'КРС (мясное/молочное)'],
                            ['value' => 'sheep', 'label' => 'Овцеводство'],
                            ['value' => 'poultry', 'label' => 'Птицеводство'],
                            ['value' => 'horse', 'label' => 'Коневодство'],
                        ]],
                        ['id' => 'livestock_count', 'type' => 'number', 'label' => 'Планируемое поголовье, голов', 'required' => true, 'validation' => ['min' => 1]],
                        ['id' => 'price_per_head', 'type' => 'money', 'label' => 'Средняя стоимость головы, ₸', 'required' => true],
                        ['id' => 'project_cost', 'type' => 'computed', 'label' => 'Стоимость проекта, ₸', 'computed' => ['formula' => 'livestock_count * price_per_head', 'decimals' => 0]],
                        ['id' => 'own_share', 'type' => 'number', 'label' => 'Собственное участие, %', 'default' => 20, 'validation' => ['min' => 0, 'max' => 100]],
                        ['id' => 'loan_amount', 'type' => 'computed', 'label' => 'Запрашиваемая сумма кредита, ₸', 'computed' => ['formula' => 'livestock_count * price_per_head * (100 - own_share) / 100', 'decimals' => 0]],
                    ],
                ],
                [
                    'id' => 'documents',
                    'title' => 'Документы',
                    'fields' => [
                        ['id' => 'doc_business_plan', 'type' => 'file', 'label' => 'Бизнес-план проекта', 'required' => true],
                        ['id' => 'consent', 'type' => 'checkbox', 'label' => 'Согласен на обработку данных', 'required' => true],
                    ],
                ],
            ],
            'settings' => [
                'submitLabel' => 'Подать заявку',
                'successMessage' => 'Заявка принята. Статус доступен в личном кабинете.',
            ],
        ];
    }
}
