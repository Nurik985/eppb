<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Полезные материалы и цифровые инструменты для предпринимателей (п. 6.9):
 * база знаний, инструкции, шаблоны документов, чек-листы, калькуляторы, обзоры.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('type')->nullable();              // статья | шаблон | чек-лист | калькулятор | видео
            $table->string('category')->nullable();          // тематическая группа
            $table->text('excerpt')->nullable();             // краткое описание
            $table->longText('body')->nullable();            // контент (для статей/инструкций)
            $table->string('link_url')->nullable();          // внешняя ссылка / файл
            $table->string('icon')->nullable();
            $table->unsignedInteger('reading_minutes')->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
