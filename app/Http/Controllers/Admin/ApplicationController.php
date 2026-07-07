<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Support\ServicePresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    /** Статусы, доступные администратору для установки, и их подписи. */
    public const STATUSES = [
        'in_review' => 'На рассмотрении',
        'need_info' => 'Требуются данные',
        'approved' => 'Одобрена',
        'rejected' => 'Отклонена',
    ];

    public function index(): Response
    {
        $applications = Application::query()
            ->where('status', '!=', 'draft')
            ->with(['service:id,title', 'user:id,name,email'])
            ->latest('updated_at')
            ->get()
            ->map(fn (Application $a) => [
                'id' => $a->id,
                'number' => $a->number,
                'status' => $a->status,
                'service' => $a->service?->title,
                'applicant' => $a->user?->name,
                'email' => $a->user?->email,
                'submitted_at' => $a->submitted_at?->toDateString(),
            ]);

        return Inertia::render('admin/applications/index', [
            'applications' => $applications,
            'stats' => [
                'total' => $applications->count(),
                'in_review' => $applications->where('status', 'in_review')->count(),
                'need_info' => $applications->where('status', 'need_info')->count(),
            ],
        ]);
    }

    public function show(Application $application): Response
    {
        $application->load(['service:id,title,slug,schema', 'user:id,name,email', 'events']);

        return Inertia::render('admin/applications/show', [
            'application' => [
                'id' => $application->id,
                'number' => $application->number,
                'status' => $application->status,
                'submitted_at' => $application->submitted_at?->toIso8601String(),
                'service' => $application->service?->title,
                'applicant' => [
                    'name' => $application->user?->name,
                    'email' => $application->user?->email,
                ],
                'answers' => ServicePresenter::answers($application->service?->schema, $application->data ?? []),
                'events' => $application->events->map(fn ($e) => [
                    'title' => $e->title,
                    'body' => $e->body,
                    'status' => $e->status,
                    'created_at' => $e->created_at?->toIso8601String(),
                ])->all(),
            ],
            'statuses' => collect(self::STATUSES)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
        ]);
    }

    public function updateStatus(Request $request, Application $application): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:'.implode(',', array_keys(self::STATUSES))],
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        $application->update(['status' => $validated['status']]);

        $application->events()->create([
            'type' => 'status_changed',
            'title' => 'Статус обновлён · '.self::STATUSES[$validated['status']],
            'body' => $validated['comment'] ?: null,
            'status' => $validated['status'],
        ]);

        return back()->with('success', 'Статус заявки обновлён.');
    }
}
