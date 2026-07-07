<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceCategory;
use App\Support\ServicePresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = trim((string) $request->query('q', ''));
        $category = $request->query('category');

        $services = Service::published()
            ->with(['category:id,slug,name,color,icon', 'organization:id,name,short_name,color'])
            ->when($category, fn ($q) => $q->whereHas('category', fn ($c) => $c->where('slug', $category)))
            ->when($query !== '', fn ($q) => $q->where(function ($sub) use ($query) {
                $sub->where('title', 'like', "%{$query}%")
                    ->orWhere('summary', 'like', "%{$query}%")
                    ->orWhere('description', 'like', "%{$query}%");
            }))
            ->orderByDesc('is_popular')
            ->orderBy('title')
            ->get()
            ->map(ServicePresenter::card(...));

        $categories = ServiceCategory::query()
            ->withCount(['services' => fn ($q) => $q->where('status', 'published')])
            ->orderBy('sort')
            ->get()
            ->map(fn (ServiceCategory $c) => [
                'slug' => $c->slug,
                'name' => $c->name,
                'icon' => $c->icon,
                'color' => $c->color,
                'services_count' => $c->services_count,
            ]);

        return Inertia::render('catalog', [
            'services' => $services,
            'categories' => $categories,
            'filters' => [
                'q' => $query,
                'category' => $category,
            ],
        ]);
    }
}
