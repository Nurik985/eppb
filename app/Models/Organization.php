<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    protected $fillable = [
        'slug', 'name', 'short_name', 'description', 'website', 'color',
    ];

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function analyticsItems(): HasMany
    {
        return $this->hasMany(AnalyticsItem::class);
    }
}
