<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsItem;
use Illuminate\Contracts\View\View;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    /**
     * Встраиваемый (same-origin) демо-дашборд для iframe-embedding (п. 6.7).
     */
    public function embed(string $key): View
    {
        $dashboards = [
            'msb' => [
                'title' => 'Поддержка МСБ — субсидирование и гарантирование',
                'source' => 'damu.kz',
                'chartTitle' => 'Объём поддержки по кварталам, млрд ₸',
                'kpis' => [
                    ['value' => '142 млрд ₸', 'label' => 'субсидировано за год'],
                    ['value' => '3 240', 'label' => 'проектов поддержано'],
                    ['value' => '85%', 'label' => 'доля гарантии'],
                ],
                'series' => [
                    ['name' => 'I кв', 'value' => 28], ['name' => 'II кв', 'value' => 34],
                    ['name' => 'III кв', 'value' => 39], ['name' => 'IV кв', 'value' => 41],
                ],
            ],
            'export' => [
                'title' => 'Экспортная поддержка — застрахованные контракты',
                'source' => 'kazakhexport.kz',
                'chartTitle' => 'Объём страхования по отраслям, млрд ₸',
                'kpis' => [
                    ['value' => '96 млрд ₸', 'label' => 'застраховано контрактов'],
                    ['value' => '412', 'label' => 'экспортёров'],
                    ['value' => '38', 'label' => 'стран назначения'],
                ],
                'series' => [
                    ['name' => 'АПК', 'value' => 31], ['name' => 'Металл', 'value' => 24],
                    ['name' => 'Химия', 'value' => 18], ['name' => 'Машины', 'value' => 15], ['name' => 'Прочее', 'value' => 8],
                ],
            ],
            'holding' => [
                'title' => 'Холдинг «Байтерек» — годовые показатели',
                'source' => 'baiterek.gov.kz',
                'chartTitle' => 'Финансирование по годам, млрд ₸',
                'kpis' => [
                    ['value' => '1,4 трлн ₸', 'label' => 'активов группы'],
                    ['value' => '11', 'label' => 'дочерних организаций'],
                    ['value' => '+18%', 'label' => 'рост портфеля'],
                ],
                'series' => [
                    ['name' => '2022', 'value' => 780], ['name' => '2023', 'value' => 910],
                    ['name' => '2024', 'value' => 1080], ['name' => '2025', 'value' => 1240],
                ],
            ],
        ];

        $data = $dashboards[$key] ?? $dashboards['holding'];

        return view('embed.dashboard', $data);
    }

    public function index(): Response
    {
        $items = AnalyticsItem::query()
            ->with('organization:id,name,short_name,color')
            ->orderBy('sort')
            ->get()
            ->map(fn (AnalyticsItem $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'description' => $a->description,
                'type' => $a->type,
                'period' => $a->period,
                'source' => $a->source,
                'link_url' => $a->link_url,
                'embed_url' => $a->embed_url,
                'organization' => $a->organization ? [
                    'name' => $a->organization->name,
                    'short_name' => $a->organization->short_name,
                    'color' => $a->organization->color,
                ] : null,
            ]);

        return Inertia::render('analytics', [
            'items' => $items,
            'types' => $items->pluck('type')->unique()->filter()->values(),
        ]);
    }
}
