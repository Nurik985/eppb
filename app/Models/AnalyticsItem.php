<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticsItem extends Model
{
    protected $fillable = [
        'title', 'description', 'organization_id', 'type',
        'period', 'source', 'link_url', 'embed_url', 'sort',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
