<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Service;
use App\Support\ServicePresenter;
use App\Support\ServiceSchema;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    /**
     * Начать подачу заявки: найти черновик пользователя по услуге или создать новый.
     */
    public function start(Request $request, Service $service): RedirectResponse
    {
        abort_unless($service->status === 'published', 404);

        $application = Application::firstOrCreate(
            [
                'user_id' => $request->user()->id,
                'service_id' => $service->id,
                'status' => 'draft',
            ],
            [
                'number' => $this->draftNumber(),
                'data' => [],
                'current_step' => 0,
            ],
        );

        return redirect()->route('applications.edit', $application);
    }

    /**
     * Экран визарда (пошаговая форма).
     */
    public function edit(Request $request, Application $application): Response
    {
        $this->authorizeOwner($request, $application);
        abort_unless($application->status === 'draft', 403);

        $service = $application->service()->with([
            'category:id,slug,name,color,icon',
            'organization:id,name,short_name,color',
        ])->firstOrFail();

        return Inertia::render('applications/wizard', [
            'application' => [
                'id' => $application->id,
                'number' => $application->number,
                'data' => $application->data ?? [],
                'current_step' => $application->current_step,
            ],
            'service' => ServicePresenter::full($service),
            'references' => ServicePresenter::references($service->schema),
        ]);
    }

    /**
     * Автосохранение прогресса (данные + текущий шаг).
     */
    public function update(Request $request, Application $application): RedirectResponse
    {
        $this->authorizeOwner($request, $application);
        abort_unless($application->status === 'draft', 403);

        $validated = $request->validate([
            'data' => ['nullable', 'array'],
            'current_step' => ['nullable', 'integer', 'min:0'],
        ]);

        $application->update([
            'data' => $validated['data'] ?? $application->data,
            'current_step' => $validated['current_step'] ?? $application->current_step,
        ]);

        return back();
    }

    /**
     * Отправка заявки: серверная валидация по схеме, пересчёт расчётных полей,
     * присвоение номера и стартового события.
     */
    public function submit(Request $request, Application $application): RedirectResponse
    {
        $this->authorizeOwner($request, $application);
        abort_unless($application->status === 'draft', 403);

        $validated = $request->validate([
            'data' => ['required', 'array'],
        ]);

        $service = $application->service;
        $schema = ServiceSchema::make($service->schema);

        // Пересчитываем computed-поля на сервере — не доверяем клиенту.
        $data = $schema->withComputed($validated['data']);

        $errors = $schema->validate($data);
        if (! empty($errors)) {
            throw ValidationException::withMessages(
                collect($errors)->mapWithKeys(fn ($msg, $field) => ["data.{$field}" => $msg])->all(),
            );
        }

        $number = $this->applicationNumber($application);

        $application->update([
            'data' => $data,
            'number' => $number,
            'status' => 'submitted',
            'submitted_at' => Carbon::now(),
            'meta' => [
                'schema_snapshot' => $service->schema,
                'service_title' => $service->title,
            ],
        ]);

        $this->recordSubmissionTimeline($application, $service);

        // Внешняя система приняла заявку на рассмотрение (имитация статуса).
        $application->update(['status' => 'in_review']);

        return redirect()->route('applications.submitted', $application);
    }

    /**
     * Экран подтверждения после отправки.
     */
    public function submitted(Request $request, Application $application): Response
    {
        $this->authorizeOwner($request, $application);
        abort_if($application->status === 'draft', 404);

        $application->load('service:id,slug,title,is_complex');

        return Inertia::render('applications/submitted', [
            'application' => [
                'number' => $application->number,
                'status' => $application->status,
                'submitted_at' => $application->submitted_at?->toIso8601String(),
                'service' => [
                    'slug' => $application->service->slug,
                    'title' => $application->service->title,
                ],
                'next_step' => $application->service->is_complex
                    ? 'После предварительного рассмотрения вам будет предложено предоставить расширенный пакет документов (II этап).'
                    : 'Отслеживайте статус заявки в личном кабинете.',
            ],
        ]);
    }

    /**
     * Имитация интеграционного обмена при отправке заявки (п. 6.12):
     * подписание ЭЦП, передача во внешнюю BPM-систему дочерней организации,
     * присвоение статуса и уведомление. Отражается в таймлайне личного кабинета.
     */
    private function recordSubmissionTimeline(Application $application, Service $service): void
    {
        $org = $service->organization?->short_name
            ?? $service->organization?->name
            ?? 'дочерней организации';

        $application->events()->createMany([
            [
                'type' => 'status_changed',
                'title' => 'Заявка отправлена',
                'body' => 'Заявка сформирована и принята порталом.',
                'status' => 'submitted',
            ],
            [
                'type' => 'notification',
                'title' => 'Документы подписаны ЭЦП',
                'body' => 'Пакет документов подписан электронной цифровой подписью (демо-сервис ЭЦП).',
            ],
            [
                'type' => 'notification',
                'title' => "Заявка передана в BPM-систему · {$org}",
                'body' => 'Заявка направлена во внешнюю систему рассмотрения через Единую интеграционную шину Холдинга.',
            ],
            [
                'type' => 'status_changed',
                'title' => 'Принято на рассмотрение',
                'body' => 'Заявка зарегистрирована во внешней системе и находится на предварительном рассмотрении.',
                'status' => 'in_review',
            ],
        ]);
    }

    private function authorizeOwner(Request $request, Application $application): void
    {
        abort_unless($application->user_id === $request->user()->id, 403);
    }

    private function draftNumber(): string
    {
        return 'DRAFT-'.strtoupper(bin2hex(random_bytes(4)));
    }

    private function applicationNumber(Application $application): string
    {
        return sprintf('ЕППБ-%d-%06d', now()->year, $application->id);
    }
}
