<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Услуга (мера поддержки), собранная в конструкторе.
 *
 * Вся структура многоэтапной формы — этапы, поля, условия показа (ветвление),
 * расчётные поля, документы — хранится в колонке `schema` (JSON). Именно это
 * даёт масштабирование на 70+ услуг без разработки кода под каждую услугу:
 * новая услуга = новая запись со своей схемой.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('summary')->nullable();          // короткое описание для карточки
            $table->text('description')->nullable();         // полное описание
            $table->foreignId('service_category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();

            $table->json('schema')->nullable();              // структура формы (этапы/поля/условия/расчёты)
            $table->json('meta')->nullable();                // срок, стоимость, теги, целевая аудитория

            $table->boolean('is_popular')->default(false);
            $table->boolean('is_complex')->default(false);   // сложная многоэтапная услуга
            $table->string('status')->default('draft');      // draft | published | archived
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
