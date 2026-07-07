<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Профинансированные проекты группы Холдинга — для интерактивной карты (п. 6.8).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->string('region')->nullable();            // код региона (references: regions)
            $table->string('locality')->nullable();          // населённый пункт
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->string('industry')->nullable();          // отрасль/направление
            $table->decimal('amount', 18, 2)->nullable();    // сумма финансирования, ₸
            $table->string('status')->nullable();            // реализуется/завершён/на паузе
            $table->year('year_from')->nullable();
            $table->year('year_to')->nullable();
            $table->text('description')->nullable();
            $table->string('external_url')->nullable();       // переход к расширенной информации
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['region', 'organization_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
