<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Support\ServicePresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CabinetController extends Controller
{
    public function index(Request $request): Response
    {
        $applications = Application::query()
            ->where('user_id', $request->user()->id)
            ->with('service:id,slug,title')
            ->withCount(['events as unread_count' => fn ($q) => $q->where('is_read', false)])
            ->latest('updated_at')
            ->get()
            ->map(fn (Application $a) => [
                'id' => $a->id,
                'number' => $a->number,
                'status' => $a->status,
                'current_step' => $a->current_step,
                'submitted_at' => $a->submitted_at?->toDateString(),
                'updated_at' => $a->updated_at?->toDateString(),
                'unread_count' => $a->unread_count,
                'service' => [
                    'slug' => $a->service->slug,
                    'title' => $a->service->title,
                ],
            ]);

        return Inertia::render('cabinet/index', [
            'applications' => $applications,
            'stats' => [
                'total' => $applications->count(),
                'active' => $applications->whereIn('status', ['submitted', 'in_review', 'need_info'])->count(),
                'drafts' => $applications->where('status', 'draft')->count(),
            ],
        ]);
    }

    public function show(Request $request, Application $application): Response
    {
        abort_unless($application->user_id === $request->user()->id, 403);

        $application->load(['service:id,slug,title,schema,is_complex,meta', 'events']);
        $schema = $application->service->schema ?? ['steps' => []];

        // Доступность II этапа (расширенные данные) для сложной услуги.
        $hasStage2 = ! empty($application->service->meta['stage2']);
        $stage2 = $hasStage2 && $application->status !== 'draft'
            ? ['available' => true, 'submitted' => isset($application->meta['stage2_data'])]
            : null;

        return Inertia::render('cabinet/show', [
            'application' => [
                'id' => $application->id,
                'number' => $application->number,
                'status' => $application->status,
                'submitted_at' => $application->submitted_at?->toIso8601String(),
                'stage2' => $stage2,
                'service' => [
                    'slug' => $application->service->slug,
                    'title' => $application->service->title,
                ],
                'answers' => ServicePresenter::answers($schema, $application->data ?? []),
                'events' => $application->events->map(fn ($e) => [
                    'type' => $e->type,
                    'title' => $e->title,
                    'body' => $e->body,
                    'status' => $e->status,
                    'created_at' => $e->created_at?->toIso8601String(),
                ])->all(),
            ],
        ]);
    }
}
