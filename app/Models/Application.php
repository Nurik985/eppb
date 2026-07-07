<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Application extends Model
{
    protected $fillable = [
        'number', 'service_id', 'user_id', 'data',
        'current_step', 'status', 'submitted_at', 'meta',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'meta' => 'array',
            'submitted_at' => 'datetime',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ApplicationEvent::class)->latest();
    }
}
