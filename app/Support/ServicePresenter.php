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

    /**
     * Человекочитаемый обзор ответов заявки, сгруппированный по этапам.
     * Коды из справочников/списков разворачиваются в метки; расчётные и
     * денежные поля форматируются; скрытые ветвлением поля пропускаются.
     *
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $data
     * @return array<int, array{title: string, rows: array<int, array{label: string, value: string}>}>
     */
    public static function answers(?array $schema, array $data): array
    {
        $schema ??= ['steps' => []];
        $conditions = new ConditionEvaluator;
        $references = self::references($schema);
        $data = ServiceSchema::make($schema)->withComputed($data);

        $result = [];
        foreach ($schema['steps'] ?? [] as $step) {
            $rows = [];
            foreach ($step['fields'] ?? [] as $field) {
                if (! $conditions->passes($field['visibleWhen'] ?? null, $data)) {
                    continue;
                }
                $value = $data[$field['id']] ?? null;
                if ($value === null || $value === '' || $value === false) {
                    continue;
                }
                $rows[] = [
                    'label' => $field['label'] ?? $field['id'],
                    'value' => self::formatValue($field, $value, $references),
                ];
            }
            if (! empty($rows)) {
                $result[] = ['title' => $step['title'] ?? '', 'rows' => $rows];
            }
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $field
     * @param  array<string, array<int, array{value: string, label: string}>>  $references
     */
    private static function formatValue(array $field, mixed $value, array $references): string
    {
        $type = $field['type'] ?? 'text';

        if ($type === 'checkbox') {
            return $value ? 'Да' : 'Нет';
        }

        if ($type === 'money' || $type === 'computed') {
            return number_format((float) $value, 0, '.', ' ').' ₸';
        }

        if (in_array($type, ['select', 'radio', 'region'], true)) {
            $options = $field['options'] ?? null;
            if ($type === 'region') {
                $options = $references['regions'] ?? [];
            } elseif (! empty($field['reference'])) {
                $options = $references[$field['reference']] ?? [];
            }
            foreach ($options ?? [] as $opt) {
                if ((string) ($opt['value'] ?? '') === (string) $value) {
                    return (string) ($opt['label'] ?? $value);
                }
            }
        }

        return (string) $value;
    }
}
