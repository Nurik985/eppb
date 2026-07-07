<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationEvent extends Model
{
    protected $fillable = [
        'application_id', 'type', 'title', 'body',
        'status', 'is_read', 'meta',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
