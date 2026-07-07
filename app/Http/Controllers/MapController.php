<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Reference;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    public function index(): Response
    {
        $regions = Reference::where('type', 'regions')->pluck('label', 'code');
        $industries = Reference::where('type', 'industries')->pluck('label', 'code');

        $projects = Project::query()
            ->with('organization:id,name,short_name,color')
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->get()
            ->map(fn (Project $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'lat' => (float) $p->lat,
                'lng' => (float) $p->lng,
                'locality' => $p->locality,
                'region' => $p->region,
                'region_label' => $regions[$p->region] ?? $p->region,
                'industry' => $p->industry,
                'industry_label' => $industries[$p->industry] ?? $p->industry,
                'amount' => (float) $p->amount,
                'status' => $p->status,
                'year_from' => $p->year_from,
                'year_to' => $p->year_to,
                'period' => trim(($p->year_from ? $p->year_from : '').($p->year_to ? '–'.$p->year_to : ''), '–'),
                'description' => $p->description,
                'external_url' => $p->external_url,
                'organization' => $p->organization ? [
                    'name' => $p->organization->name,
                    'short_name' => $p->organization->short_name,
                    'color' => $p->organization->color,
                ] : null,
            ]);

        // Распределение по регионам.
        $byRegion = $projects->groupBy('region')
            ->map(fn ($items, $code) => [
                'code' => $code,
                'label' => $regions[$code] ?? $code,
                'count' => $items->count(),
            ])
            ->sortByDesc('count')
            ->values();

        return Inertia::render('map', [
            'projects' => $projects,
            'byRegion' => $byRegion,
            'filters' => [
                'organizations' => $projects->pluck('organization.short_name', 'organization.short_name')
                    ->filter()->values(),
                'regions' => $projects->map(fn ($p) => ['code' => $p['region'], 'label' => $p['region_label']])
                    ->unique('code')->sortBy('label')->values(),
                'industries' => $projects->map(fn ($p) => ['code' => $p['industry'], 'label' => $p['industry_label']])
                    ->unique('code')->values(),
                'statuses' => $projects->pluck('status')->unique()->filter()->values(),
                'years' => $projects->flatMap(fn ($p) => array_filter([$p['year_from'], $p['year_to']]))
                    ->unique()->sort()->values(),
            ],
            'stats' => [
                'total' => $projects->count(),
                'regions' => $projects->pluck('region')->unique()->count(),
                'financed' => $projects->sum('amount'),
            ],
        ]);
    }
}
