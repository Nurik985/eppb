<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Универсальные справочники (регионы, отрасли/ОКЭД, типы заявителя и пр.).
 * Один плоский самоссылающийся справочник, который подключается в поля форм
 * конструктора по коду набора (type). Позволяет добавлять новые справочники
 * без изменения схемы БД.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('references', function (Blueprint $table) {
            $table->id();
            $table->string('type')->index();          // набор: regions, industries, applicant_types...
            $table->string('code');                    // значение
            $table->string('label');                   // отображаемое имя
            $table->foreignId('parent_id')->nullable()->constrained('references')->nullOnDelete();
            $table->json('meta')->nullable();          // доп. атрибуты (координаты региона и т.п.)
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->unique(['type', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('references');
    }
};
