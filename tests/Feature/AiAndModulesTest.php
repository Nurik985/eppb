<?php

use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\OrganizationSeeder;
use Database\Seeders\ProjectSeeder;
use Database\Seeders\ReferenceSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([
        OrganizationSeeder::class,
        ReferenceSeeder::class,
        CatalogSeeder::class,
        ProjectSeeder::class,
        ContentSeeder::class,
    ]);
});

it('AI-помощник подбирает релевантную услугу (fallback-режим)', function () {
    $this->post('/assistant', ['situation' => 'хочу купить коров и корма, нужен кредит на животноводство'])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('assistant')
            ->where('result.mode', 'heuristic')
            ->where('result.items', fn ($items) => collect($items)->contains('slug', 'agro-animal')));
});

it('валидирует слишком короткий запрос помощника', function () {
    $this->post('/assistant', ['situation' => 'ах'])->assertSessionHasErrors('situation');
});

it('mock-реестр возвращает компанию по валидному БИН', function () {
    $this->getJson('/integrations/company?bin=123456789012')
        ->assertOk()
        ->assertJson(['found' => true, 'name' => 'ТОО «Вагоны Казахстана»']);
});

it('mock-реестр отклоняет некорректный БИН', function () {
    $this->getJson('/integrations/company?bin=123')
        ->assertStatus(422)
        ->assertJson(['found' => false]);
});

it('страница карты проектов отдаёт проекты с координатами', function () {
    $this->get('/map')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('map')->has('projects', 18));
});

it('страница аналитики и материалов доступны', function () {
    $this->get('/analytics')->assertOk()->assertInertia(fn (Assert $page) => $page->component('analytics')->has('items'));
    $this->get('/resources')->assertOk()->assertInertia(fn (Assert $page) => $page->component('resources')->has('resources'));
});

it('AI-генерация схемы доступна только администратору', function () {
    $member = User::factory()->create(['is_admin' => false]);
    $admin = User::factory()->create(['is_admin' => true]);

    $this->actingAs($member)->post('/admin/services/ai-generate', ['description' => 'субсидирование ставки'])->assertForbidden();

    $this->actingAs($admin)->post('/admin/services/ai-generate', ['description' => 'субсидирование ставки МСБ'])
        ->assertOk()
        ->assertJson(['mode' => 'heuristic'])
        ->assertJsonStructure(['title', 'summary', 'schema' => ['steps', 'settings']]);
});
