<?php

use App\Models\Service;
use App\Models\User;
use Database\Seeders\OrganizationSeeder;
use Database\Seeders\ReferenceSeeder;

beforeEach(function () {
    $this->seed([OrganizationSeeder::class, ReferenceSeeder::class]);
    $this->admin = User::factory()->create(['is_admin' => true]);
    $this->member = User::factory()->create(['is_admin' => false]);
});

it('запрещает не-администратору доступ к конструктору', function () {
    $this->actingAs($this->member)->get('/admin/services')->assertForbidden();
});

it('перенаправляет гостя на вход', function () {
    $this->get('/admin/services')->assertRedirect('/login');
});

it('открывает список услуг администратору', function () {
    $this->actingAs($this->admin)->get('/admin/services')->assertOk();
});

it('создаёт услугу через конструктор', function () {
    $payload = [
        'title' => 'Тестовая мера поддержки',
        'summary' => 'Краткое описание',
        'description' => null,
        'service_category_id' => null,
        'organization_id' => null,
        'is_popular' => false,
        'is_complex' => false,
        'status' => 'published',
        'meta' => ['amount' => 'до 10 млн ₸'],
        'schema' => [
            'steps' => [
                [
                    'id' => 'step1',
                    'title' => 'Шаг 1',
                    'fields' => [
                        ['id' => 'count', 'type' => 'number', 'label' => 'Кол-во'],
                        ['id' => 'price', 'type' => 'money', 'label' => 'Цена'],
                        ['id' => 'total', 'type' => 'computed', 'label' => 'Итого', 'computed' => ['formula' => 'count * price', 'decimals' => 0]],
                    ],
                ],
            ],
            'settings' => ['submitLabel' => 'Подать'],
        ],
    ];

    $this->actingAs($this->admin)->post('/admin/services', $payload)->assertRedirect();

    $service = Service::where('title', 'Тестовая мера поддержки')->first();
    expect($service)->not->toBeNull();
    expect($service->status)->toBe('published');
    expect($service->slug)->not->toBe('');
    expect($service->schema['steps'][0]['fields'])->toHaveCount(3);
});

it('генерирует непустой slug для кириллического названия', function () {
    $this->actingAs($this->admin)->post('/admin/services', [
        'title' => 'Услуга на русском',
        'status' => 'draft',
        'schema' => ['steps' => []],
    ])->assertRedirect();

    $service = Service::where('title', 'Услуга на русском')->first();
    expect($service->slug)->not->toBe('');
});

it('сохраняет изменённую схему существующей услуги', function () {
    $service = Service::create([
        'slug' => 'test-service',
        'title' => 'Старое название',
        'status' => 'draft',
        'schema' => ['steps' => []],
    ]);

    $this->actingAs($this->admin)->put("/admin/services/{$service->slug}", [
        'title' => 'Новое название',
        'status' => 'published',
        'schema' => ['steps' => [['id' => 's1', 'title' => 'Этап', 'fields' => []]]],
    ])->assertRedirect();

    $service->refresh();
    expect($service->title)->toBe('Новое название');
    expect($service->status)->toBe('published');
    expect($service->published_at)->not->toBeNull();
});

it('помечает услугу сложной при более чем одном этапе', function () {
    $this->actingAs($this->admin)->post('/admin/services', [
        'title' => 'Многоэтапная',
        'status' => 'draft',
        'schema' => ['steps' => [
            ['id' => 's1', 'title' => 'Э1', 'fields' => []],
            ['id' => 's2', 'title' => 'Э2', 'fields' => []],
        ]],
    ]);

    expect(Service::where('title', 'Многоэтапная')->value('is_complex'))->toBeTrue();
});
