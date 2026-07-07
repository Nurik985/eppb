<?php

namespace App\Support;

use App\Models\Reference;
use App\Models\Service;

/**
 * Единое представление услуги для фронтенда и сбор справочников,
 * используемых её схемой. Переиспользуется в контроллерах каталога,
 * карточки услуги и главной страницы.
 */
class ServicePresenter
{
    /**
     * Компактная карточка услуги для списков/каталога.
     *
     * @return array<string, mixed>
     */
    public static function card(Service $service): array
    {
        $steps = $service->schema['steps'] ?? null;

        return [
            'slug' => $service->slug,
            'title' => $service->title,
            'summary' => $service->summary,
            'is_popular' => $service->is_popular,
            'is_complex' => $service->is_complex,
            'meta' => $service->meta,
            'steps_count' => is_array($steps) ? count($steps) : 0,
            'category' => $service->relationLoaded('category') && $service->category ? [
                'slug' => $service->category->slug,
                'name' => $service->category->name,
                'color' => $service->category->color,
                'icon' => $service->category->icon,
            ] : null,
            'organization' => $service->relationLoaded('organization') && $service->organization ? [
                'name' => $service->organization->name,
                'short_name' => $service->organization->short_name,
                'color' => $service->organization->color,
            ] : null,
        ];
    }

    /**
     * Полное представление услуги (для карточки и визарда).
     *
     * @return array<string, mixed>
     */
    public static function full(Service $service): array
    {
        return array_merge(self::card($service), [
            'description' => $service->description,
            'schema' => $service->schema,
        ]);
    }

    /**
     * Собирает справочники (references), на которые ссылается схема услуги.
     * Возвращает карту: тип справочника => список опций {value, label}.
     *
     * @return array<string, array<int, array{value: string, label: string}>>
     */
    public static function references(?array $schema): array
    {
        $types = [];
        foreach ($schema['steps'] ?? [] as $step) {
            foreach ($step['fields'] ?? [] as $field) {
                // Поля типа region всегда используют справочник регионов.
                if (($field['type'] ?? null) === 'region') {
                    $types[] = 'regions';
                }
                if (! empty($field['reference'])) {
                    $types[] = $field['reference'];
                }
            }
        }

        $types = array_values(array_unique($types));
        if (empty($types)) {
            return [];
        }

        return Reference::whereIn('type', $types)
            ->orderBy('sort')
            ->get()
            ->groupBy('type')
            ->map(fn ($items) => $items->map(fn (Reference $r) => [
                'value' => $r->code,
                'label' => $r->label,
            ])->values()->all())
            ->all();
    }
}
