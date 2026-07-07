<?php

namespace App\Support;

/**
 * Обёртка над JSON-схемой услуги. Инкапсулирует бизнес-логику формы:
 * ветвление (видимость полей), автоматические расчёты и серверную валидацию.
 *
 * Расчётные и условные значения на сервере вычисляются заново и не доверяют
 * данным клиента — клиентский live-режим только для удобства пользователя.
 */
class ServiceSchema
{
    private ConditionEvaluator $conditions;

    private FormulaEvaluator $formulas;

    /**
     * @param  array<string, mixed>  $schema
     */
    public function __construct(private array $schema)
    {
        $this->conditions = new ConditionEvaluator;
        $this->formulas = new FormulaEvaluator;
    }

    /**
     * @param  array<string, mixed>|null  $schema
     */
    public static function make(?array $schema): self
    {
        return new self($schema ?? ['steps' => []]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function steps(): array
    {
        return $this->schema['steps'] ?? [];
    }

    /**
     * Все поля всех шагов (плоский список).
     *
     * @return array<int, array<string, mixed>>
     */
    public function fields(): array
    {
        $fields = [];
        foreach ($this->steps() as $step) {
            foreach ($step['fields'] ?? [] as $field) {
                $fields[] = $field;
            }
        }

        return $fields;
    }

    /**
     * Пересчитывает все computed-поля на основе введённых значений.
     * Делает несколько проходов, т.к. расчётное поле может зависеть от другого.
     *
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public function withComputed(array $values): array
    {
        $computed = array_values(array_filter(
            $this->fields(),
            fn ($f) => ($f['type'] ?? null) === 'computed' && isset($f['computed']['formula']),
        ));

        // Достаточно проходов по числу расчётных полей, чтобы разрешить цепочки зависимостей.
        for ($pass = 0; $pass < max(1, count($computed)); $pass++) {
            $changed = false;
            foreach ($computed as $field) {
                $result = $this->formulas->evaluate($field['computed']['formula'], $values);
                if ($result !== null) {
                    $decimals = (int) ($field['computed']['decimals'] ?? 0);
                    $result = round($result, $decimals);
                }
                if (($values[$field['id']] ?? null) !== $result) {
                    $values[$field['id']] = $result;
                    $changed = true;
                }
            }
            if (! $changed) {
                break;
            }
        }

        return $values;
    }

    /**
     * Видимо ли поле при текущих значениях (с учётом visibleWhen).
     *
     * @param  array<string, mixed>  $field
     * @param  array<string, mixed>  $values
     */
    public function isFieldVisible(array $field, array $values): bool
    {
        return $this->conditions->passes($field['visibleWhen'] ?? null, $values);
    }

    /**
     * Серверная валидация ответов заявки против схемы. Проверяются только
     * видимые (с учётом ветвления) поля.
     *
     * @param  array<string, mixed>  $values
     * @return array<string, string>  ошибки: field_id => сообщение
     */
    public function validate(array $values): array
    {
        $values = $this->withComputed($values);
        $errors = [];

        foreach ($this->fields() as $field) {
            $type = $field['type'] ?? 'text';

            // Расчётные поля пользователь не заполняет.
            if ($type === 'computed') {
                continue;
            }

            if (! $this->isFieldVisible($field, $values)) {
                continue;
            }

            $id = $field['id'];
            $value = $values[$id] ?? null;
            $label = $field['label'] ?? $id;

            $isEmpty = $value === null || $value === '' || $value === false
                || (is_array($value) && count($value) === 0);

            if (($field['required'] ?? false) && $isEmpty) {
                $errors[$id] = "Поле «{$label}» обязательно для заполнения.";

                continue;
            }

            if ($isEmpty) {
                continue;
            }

            if ($type === 'bin' && ! preg_match('/^\d{12}$/', (string) $value)) {
                $errors[$id] = 'БИН/ИИН должен содержать ровно 12 цифр.';
            }

            if ($type === 'number' || $type === 'money') {
                if (! is_numeric($value)) {
                    $errors[$id] = "Поле «{$label}» должно быть числом.";

                    continue;
                }
                $num = (float) $value;
                $min = $field['validation']['min'] ?? null;
                $max = $field['validation']['max'] ?? null;
                if ($min !== null && $num < $min) {
                    $errors[$id] = "Значение «{$label}» не может быть меньше {$min}.";
                }
                if ($max !== null && $num > $max) {
                    $errors[$id] = "Значение «{$label}» не может быть больше {$max}.";
                }
            }
        }

        return $errors;
    }
}
