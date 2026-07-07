<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    protected $fillable = [
        'title', 'type', 'category', 'excerpt', 'body',
        'link_url', 'icon', 'reading_minutes', 'sort',
    ];
}
