<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * История действий и статусов по заявке — лента для личного кабинета
 * (уведомления, смена статуса, запрос документов, ответ внешней BPM-системы).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('type');                          // status_changed | note | document_requested | notification
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('status')->nullable();            // статус, если событие его меняет
            $table->boolean('is_read')->default(false);      // для уведомлений в ЛК
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index('application_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_events');
    }
};
