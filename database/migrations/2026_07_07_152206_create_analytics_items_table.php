<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Каталог аналитических материалов дочерних организаций (п. 6.7):
 * интерактивные отчёты, финансовая/годовая отчётность, дашборды, исследования.
 * В MVP — карточка с описанием, источником, периодом и ссылкой/embedding.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_items', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type')->nullable();              // отчёт | дашборд | исследование | обзор
            $table->string('period')->nullable();            // период актуальности
            $table->string('source')->nullable();            // источник данных
            $table->string('link_url')->nullable();          // переход
            $table->string('embed_url')->nullable();         // встраивание (iframe)
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_items');
    }
};
