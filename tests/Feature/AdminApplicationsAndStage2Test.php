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
    $this->user = User::factory()->create(['is_admin' => false]);
    $this->admin = User::factory()->create(['is_admin' => true]);
});

function submittedApp(User $user, string $slug = 'wagons-leasing'): Application
{
    $service = Service::where('slug', $slug)->first();

    return Application::create([
        'number' => 'ЕППБ-2026-000777',
        'user_id' => $user->id,
        'service_id' => $service->id,
        'status' => 'in_review',
        'data' => ['company_name' => 'ТОО Тест'],
        'submitted_at' => now(),
    ]);
}

it('встраиваемый дашборд аналитики отдаётся', function () {
    $this->get('/analytics/embed/msb')->assertOk()->assertSee('Поддержка МСБ', false);
    $this->get('/analytics/embed/export')->assertOk()->assertSee('Экспортная', false);
});

it('не-администратор не видит админ-заявки', function () {
    $this->actingAs($this->user)->get('/admin/applications')->assertForbidden();
});

it('администратор видит список заявок', function () {
    submittedApp($this->user);

    $this->actingAs($this->admin)->get('/admin/applications')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/applications/index')->has('applications', 1));
});

it('администратор меняет статус заявки и создаётся событие', function () {
    $app = submittedApp($this->user);

    $this->actingAs($this->admin)
        ->patch("/admin/applications/{$app->id}/status", ['status' => 'approved', 'comment' => 'Одобрено комитетом'])
        ->assertRedirect();

    $app->refresh();
    expect($app->status)->toBe('approved');
    expect($app->events()->where('status', 'approved')->count())->toBe(1);
});

it('владелец открывает форму II этапа сложной услуги', function () {
    $app = submittedApp($this->user);

    $this->actingAs($this->user)->get("/applications/{$app->id}/stage2")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('applications/stage2'));
});

it('II этап недоступен для услуги без stage2', function () {
    $app = submittedApp($this->user, 'agro-animal');

    $this->actingAs($this->user)->get("/applications/{$app->id}/stage2")->assertNotFound();
});

it('владелец отправляет данные II этапа', function () {
    $app = submittedApp($this->user);

    $this->actingAs($this->user)->post("/applications/{$app->id}/stage2", [
        'data' => [
            'collateral_type' => 'wagons',
            'collateral_value' => 60000000,
            'doc_financials_full' => 'fin.pdf',
            'doc_contract' => 'contract.pdf',
            'doc_collateral' => 'collateral.pdf',
        ],
    ])->assertRedirect("/cabinet/applications/{$app->id}");

    $app->refresh();
    expect($app->meta['stage2_data']['collateral_type'])->toBe('wagons');
    expect($app->events()->where('title', 'like', 'II этап%')->count())->toBe(1);
});

it('II этап отклоняет неполные данные', function () {
    $app = submittedApp($this->user);

    $this->actingAs($this->user)->post("/applications/{$app->id}/stage2", ['data' => ['collateral_type' => 'wagons']])
        ->assertSessionHasErrors('data.collateral_value');
});

it('чужой II этап запрещён', function () {
    $other = User::factory()->create();
    $app = submittedApp($other);

    $this->actingAs($this->user)->get("/applications/{$app->id}/stage2")->assertForbidden();
});
