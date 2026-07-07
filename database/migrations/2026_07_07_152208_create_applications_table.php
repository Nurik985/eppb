<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Заявка предпринимателя на услугу. Ответы по всем полям формы хранятся в `data`
 * (JSON, ключ = id поля из схемы услуги). Многоэтапность отслеживается через
 * current_step; ЕППБ ведёт пользовательский путь и статусы, но не заменяет BPM.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();              // человекочитаемый номер заявки
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->json('data')->nullable();                // ответы пользователя (field_id => value)
            $table->unsignedInteger('current_step')->default(0);
            $table->string('status')->default('draft');      // draft | submitted | in_review | need_info | approved | rejected
            $table->timestamp('submitted_at')->nullable();
            $table->json('meta')->nullable();                // снимок услуги, версия схемы, интеграционные id
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
