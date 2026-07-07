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

it('показывает список заявок пользователя в кабинете', function () {
    $service = Service::where('slug', 'agro-animal')->first();
    Application::create([
        'number' => 'ЕППБ-2026-000010',
        'user_id' => $this->user->id,
        'service_id' => $service->id,
        'status' => 'submitted',
        'data' => ['company_name' => 'ТОО Тест'],
        'submitted_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('cabinet/index')->has('applications', 1));
});

it('показывает карточку заявки с обзором ответов', function () {
    $service = Service::where('slug', 'agro-animal')->first();
    $app = Application::create([
        'number' => 'ЕППБ-2026-000011',
        'user_id' => $this->user->id,
        'service_id' => $service->id,
        'status' => 'submitted',
        'data' => ['applicant_type' => 'too', 'company_name' => 'ТОО Ферма', 'region' => 'astana'],
        'submitted_at' => now(),
    ]);
    $app->events()->create(['type' => 'status_changed', 'title' => 'Заявка отправлена', 'status' => 'submitted']);

    $this->actingAs($this->user)
        ->get("/cabinet/applications/{$app->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('cabinet/show')
            ->where('application.number', 'ЕППБ-2026-000011')
            ->has('application.answers'));
});

it('запрещает открывать чужую заявку в кабинете', function () {
    $service = Service::where('slug', 'agro-animal')->first();
    $other = User::factory()->create();
    $app = Application::create([
        'number' => 'ЕППБ-2026-000012',
        'user_id' => $other->id,
        'service_id' => $service->id,
        'status' => 'submitted',
        'data' => [],
        'submitted_at' => now(),
    ]);

    $this->actingAs($this->user)->get("/cabinet/applications/{$app->id}")->assertForbidden();
});
