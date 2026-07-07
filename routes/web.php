<?php

use App\Http\Controllers\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AssistantController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CabinetController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\MockIntegrationController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\ServiceController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

// Публичный каталог и карточки услуг.
Route::get('/catalog', [CatalogController::class, 'index'])->name('catalog');
Route::get('/services/{service}', [ServiceController::class, 'show'])->name('services.show');

// AI-помощник по подбору услуги.
Route::get('/assistant', [AssistantController::class, 'index'])->name('assistant');
Route::post('/assistant', [AssistantController::class, 'suggest'])
    ->middleware('throttle:20,1')->name('assistant.suggest');

// Модули портала: карта проектов, аналитика, полезные материалы.
Route::get('/map', [MapController::class, 'index'])->name('map');
Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics');
Route::get('/resources', [ResourceController::class, 'index'])->name('resources');

// Имитация интеграций: проверка ИИН/БИН в реестре юрлиц.
Route::get('/integrations/company', [MockIntegrationController::class, 'company'])
    ->middleware('throttle:60,1')->name('integrations.company');

Route::middleware(['auth', 'verified'])->group(function () {
    // Личный кабинет (главная авторизованного пользователя).
    Route::get('dashboard', [CabinetController::class, 'index'])->name('dashboard');
    Route::get('/cabinet/applications/{application}', [CabinetController::class, 'show'])->name('cabinet.show');

    // Подача и сопровождение заявки.
    Route::get('/services/{service}/apply', [ApplicationController::class, 'start'])->name('applications.start');
    Route::get('/applications/{application}', [ApplicationController::class, 'edit'])->name('applications.edit');
    Route::patch('/applications/{application}', [ApplicationController::class, 'update'])->name('applications.update');
    Route::post('/applications/{application}/submit', [ApplicationController::class, 'submit'])->name('applications.submit');
    Route::get('/applications/{application}/submitted', [ApplicationController::class, 'submitted'])->name('applications.submitted');
});

// Административный контур: конструктор услуг.
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::redirect('/', '/admin/services');
    Route::get('/services', [AdminServiceController::class, 'index'])->name('services.index');
    Route::get('/services/create', [AdminServiceController::class, 'create'])->name('services.create');
    Route::post('/services/ai-generate', [AdminServiceController::class, 'aiGenerate'])
        ->middleware('throttle:15,1')->name('services.ai-generate');
    Route::post('/services', [AdminServiceController::class, 'store'])->name('services.store');
    Route::get('/services/{service}/edit', [AdminServiceController::class, 'edit'])->name('services.edit');
    Route::put('/services/{service}', [AdminServiceController::class, 'update'])->name('services.update');
    Route::delete('/services/{service}', [AdminServiceController::class, 'destroy'])->name('services.destroy');
});

require __DIR__.'/settings.php';
