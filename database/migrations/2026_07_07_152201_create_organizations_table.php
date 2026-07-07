<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Дочерние организации Холдинга «Байтерек» (ИФРК, БРК, Даму, KazakhExport и т.д.).
 * Владельцы услуг, проектов и аналитических материалов.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('short_name')->nullable();
            $table->text('description')->nullable();
            $table->string('website')->nullable();
            $table->string('color', 20)->nullable(); // цвет бейджа/маркера на карте
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
