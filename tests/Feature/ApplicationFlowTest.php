<?php

use App\Models\Application;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\OrganizationSeeder;
use Database\Seeders\ReferenceSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([OrganizationSeeder::class, ReferenceSeeder::class, CatalogSeeder::class]);
    $this->user = User::factory()->create();
});

it('гость перенаправляется на вход при попытке подать заявку', function () {
    $service = Service::where('slug', 'wagons-leasing')->first();

    $this->get("/services/{$service->slug}/apply")->assertRedirect('/login');
});

it('создаёт черновик заявки при старте подачи', function () {
    $service = Service::where('slug', 'wagons-leasing')->first();

    $this->actingAs($this->user)
        ->get("/services/{$service->slug}/apply")
        ->assertRedirect();

    $this->assertDatabaseHas('applications', [
        'user_id' => $this->user->id,
        'service_id' => $service->id,
        'status' => 'draft',
    ]);
});

it('переиспользует существующий черновик, не создавая дубликат', function () {
    $service = Service::where('slug', 'agro-animal')->first();

    $this->actingAs($this->user)->get("/services/{$service->slug}/apply");
    $this->actingAs($this->user)->get("/services/{$service->slug}/apply");

    expect(Application::where('user_id', $this->user->id)->where('service_id', $service->id)->count())->toBe(1);
});

it('отправляет заявку, пересчитывает расчётные поля и создаёт событие', function () {
    $service = Service::where('slug', 'wagons-leasing')->first();
    $app = Application::create([
        'number' => 'DRAFT-TEST',
        'user_id' => $this->user->id,
        'service_id' => $service->id,
        'status' => 'draft',
        'data' => [],
        'current_step' => 0,
    ]);

    $data = [
        'applicant_type' => 'too',
        'bin' => '123456789012',
        'company_name' => 'ТОО Вагоны',
        'region' => 'astana',
        'wagon_type' => 'gondola',
        'wagon_count' => 10,
        'wagon_price' => 5000000,
        'advance_percent' => 15,
        'term_months' => 60,
        'is_used' => false,
        'doc_application' => 'app.pdf',
        'doc_financials' => 'fin.pdf',
        'consent' => true,
    ];

    $this->actingAs($this->user)
        ->post("/applications/{$app->id}/submit", ['data' => $data])
        ->assertRedirect("/applications/{$app->id}/submitted");

    $app->refresh();
    // Заявка отправлена и переведена внешней системой на рассмотрение (имитация интеграции).
    expect($app->status)->toBe('in_review');
    expect($app->number)->toStartWith('ЕППБ-');
    // Расчётные поля пересчитаны на сервере (клиенту не доверяем).
    expect((float) $app->data['total_price'])->toBe(50000000.0);
    expect((float) $app->data['monthly_payment'])->toBe(708333.0);
    // Таймлайн содержит имитацию интеграционного обмена (ЭЦП, BPM, статус).
    expect($app->events()->count())->toBe(4);

    // Экран подтверждения для сложной услуги сообщает про II этап.
    $this->actingAs($this->user)
        ->get("/applications/{$app->id}/submitted")
        ->assertInertia(fn (Assert $page) => $page
            ->component('applications/submitted')
            ->where('application.next_step', fn ($v) => str_contains($v, 'II этап')));
});

it('отклоняет отправку при незаполненных обязательных полях', function () {
    $service = Service::where('slug', 'wagons-leasing')->first();
    $app = Application::create([
        'number' => 'DRAFT-TEST2',
        'user_id' => $this->user->id,
        'service_id' => $service->id,
        'status' => 'draft',
        'data' => [],
        'current_step' => 0,
    ]);

    $this->actingAs($this->user)
        ->post("/applications/{$app->id}/submit", ['data' => ['wagon_count' => 10]])
        ->assertSessionHasErrors('data.bin');

    expect($app->fresh()->status)->toBe('draft');
});

it('запрещает доступ к чужой заявке', function () {
    $service = Service::where('slug', 'agro-animal')->first();
    $other = User::factory()->create();
    $app = Application::create([
        'number' => 'DRAFT-OTHER',
        'user_id' => $other->id,
        'service_id' => $service->id,
        'status' => 'draft',
        'data' => [],
    ]);

    $this->actingAs($this->user)->get("/applications/{$app->id}")->assertForbidden();
});
