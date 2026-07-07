<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsItem;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
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
