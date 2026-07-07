<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reference extends Model
{
    protected $fillable = [
        'type', 'code', 'label', 'parent_id', 'meta', 'sort',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Reference::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Reference::class, 'parent_id');
    }
}
