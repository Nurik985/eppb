<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Support\ServicePresenter;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function show(Service $service): Response
    {
        abort_unless($service->status === 'published', 404);

        $service->load(['category:id,slug,name,color,icon', 'organization:id,name,short_name,color,description,website']);

        return Inertia::render('services/show', [
            'service' => array_merge(ServicePresenter::full($service), [
                'organization' => $service->organization ? [
                    'name' => $service->organization->name,
                    'short_name' => $service->organization->short_name,
                    'color' => $service->organization->color,
                    'description' => $service->organization->description,
                    'website' => $service->organization->website,
                ] : null,
            ]),
        ]);
    }
}
