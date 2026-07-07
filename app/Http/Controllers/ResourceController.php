<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResourceController extends Controller
{
    public function index(Request $request): Response
    {
        $category = $request->query('category');

        $resources = Resource::query()
            ->when($category, fn ($q) => $q->where('category', $category))
            ->orderBy('sort')
            ->get()
            ->map(fn (Resource $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'type' => $r->type,
                'category' => $r->category,
                'excerpt' => $r->excerpt,
                'icon' => $r->icon,
                'reading_minutes' => $r->reading_minutes,
                'link_url' => $r->link_url,
            ]);

        return Inertia::render('resources', [
            'resources' => $resources,
            'categories' => Resource::query()->distinct()->orderBy('category')->pluck('category')->filter()->values(),
            'filters' => ['category' => $category],
        ]);
    }
}
