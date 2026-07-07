<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\Project;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Support\ServicePresenter;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
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

        $popular = Service::published()
            ->with(['category:id,slug,name,color,icon', 'organization:id,name,short_name,color'])
            ->where('is_popular', true)
            ->latest('published_at')
            ->take(6)
            ->get()
            ->map(ServicePresenter::card(...));

        $featured = Service::published()
            ->with(['category:id,slug,name,color,icon', 'organization:id,name,short_name,color'])
            ->whereIn('slug', ['wagons-leasing', 'agro-animal'])
            ->get()
            ->map(ServicePresenter::card(...));

        $stats = [
            'services' => Service::published()->count(),
            'organizations' => Organization::count(),
            'projects' => Project::count(),
            'regions' => Project::distinct('region')->count('region'),
            'financed' => (float) Project::sum('amount'),
        ];

        return Inertia::render('welcome', [
            'categories' => $categories,
            'popularServices' => $popular,
            'featuredServices' => $featured,
            'stats' => $stats,
        ]);
    }
}
