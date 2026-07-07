<?php

namespace App\Support;

/**
 * Оценка условий отображения полей/шагов (ветвление, персонализация).
 *
 * Поддерживает как одиночное правило {field, op, value}, так и составное
 * {op: and|or, rules: [...]} с любой вложенностью.
 *
 * Операторы: eq, ne, gt, gte, lt, lte, in, notEmpty, empty, contains.
 */
class ConditionEvaluator
{
    /**
     * @param  array<string, mixed>|null  $condition
     * @param  array<string, mixed>  $values
     */
    public function passes(?array $condition, array $values): bool
    {
        // Нет условия — поле видно всегда.
        if (empty($condition)) {
            return true;
        }

        // Составное условие (and / or).
        if (isset($condition['rules']) && is_array($condition['rules'])) {
            $op = $condition['op'] ?? 'and';
            $results = array_map(fn ($rule) => $this->passes($rule, $values), $condition['rules']);

            return $op === 'or' ? in_array(true, $results, true) : ! in_array(false, $results, true);
        }

        // Одиночное правило.
        $field = $condition['field'] ?? null;
        if ($field === null) {
            return true;
        }

        $actual = $values[$field] ?? null;
        $expected = $condition['value'] ?? null;
        $op = $condition['op'] ?? 'eq';

        return match ($op) {
            'eq' => $this->looseEquals($actual, $expected),
            'ne' => ! $this->looseEquals($actual, $expected),
            'gt' => $this->toNumber($actual) > $this->toNumber($expected),
            'gte' => $this->toNumber($actual) >= $this->toNumber($expected),
            'lt' => $this->toNumber($actual) < $this->toNumber($expected),
            'lte' => $this->toNumber($actual) <= $this->toNumber($expected),
            'in' => is_array($expected) && in_array($actual, $expected, false),
            'contains' => is_array($actual) && in_array($expected, $actual, false),
            'notEmpty' => ! $this->isEmpty($actual),
            'empty' => $this->isEmpty($actual),
            default => true,
        };
    }

    private function looseEquals(mixed $a, mixed $b): bool
    {
        if (is_bool($a) || is_bool($b)) {
            return (bool) $a === (bool) $b;
        }

        return (string) $a === (string) $b;
    }

    private function isEmpty(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value === false;
        }
        if (is_array($value)) {
            return count($value) === 0;
        }

        return $value === null || $value === '';
    }

    private function toNumber(mixed $value): float
    {
        if (is_bool($value)) {
            return $value ? 1.0 : 0.0;
        }

        return is_numeric($value) ? (float) $value : 0.0;
    }
}
