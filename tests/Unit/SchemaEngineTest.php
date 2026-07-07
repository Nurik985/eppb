<?php

use App\Support\ConditionEvaluator;
use App\Support\FormulaEvaluator;
use App\Support\ServiceSchema;

describe('FormulaEvaluator', function () {
    $f = fn () => new FormulaEvaluator;

    it('вычисляет умножение', function () use ($f) {
        expect($f()->evaluate('a * b', ['a' => 10, 'b' => 5000000]))->toBe(50000000.0);
    });

    it('соблюдает приоритет операций и скобки', function () use ($f) {
        expect($f()->evaluate('(a - a * p / 100) / m', ['a' => 100, 'p' => 15, 'm' => 60]))
            ->toBeGreaterThan(1.416)->toBeLessThan(1.417);
    });

    it('защищает от деления на ноль', function () use ($f) {
        expect($f()->evaluate('a / b', ['a' => 5, 'b' => 0]))->toBe(0.0);
    });

    it('отбраковывает недопустимые символы', function () use ($f) {
        expect($f()->evaluate('a; drop table', []))->toBeNull();
    });

    it('трактует отсутствующие поля как ноль', function () use ($f) {
        expect($f()->evaluate('a + b', ['a' => 3]))->toBe(3.0);
    });
});

describe('ConditionEvaluator', function () {
    $c = fn () => new ConditionEvaluator;

    it('оценивает равенство булева поля', function () use ($c) {
        expect($c()->passes(['field' => 'is_used', 'op' => 'eq', 'value' => true], ['is_used' => true]))->toBeTrue();
        expect($c()->passes(['field' => 'is_used', 'op' => 'eq', 'value' => true], ['is_used' => false]))->toBeFalse();
    });

    it('поддерживает составное условие and/or', function () use ($c) {
        $cond = ['op' => 'or', 'rules' => [
            ['field' => 'type', 'op' => 'eq', 'value' => 'too'],
            ['field' => 'type', 'op' => 'eq', 'value' => 'ao'],
        ]];
        expect($c()->passes($cond, ['type' => 'ao']))->toBeTrue();
        expect($c()->passes($cond, ['type' => 'ip']))->toBeFalse();
    });

    it('без условия поле видно всегда', function () use ($c) {
        expect($c()->passes(null, []))->toBeTrue();
    });
});

describe('ServiceSchema', function () {
    $schema = [
        'steps' => [
            [
                'id' => 's1',
                'title' => 'Шаг 1',
                'fields' => [
                    ['id' => 'count', 'type' => 'number', 'label' => 'Кол-во', 'required' => true, 'validation' => ['min' => 1]],
                    ['id' => 'price', 'type' => 'money', 'label' => 'Цена', 'required' => true],
                    ['id' => 'total', 'type' => 'computed', 'label' => 'Итого', 'computed' => ['formula' => 'count * price', 'decimals' => 0]],
                    ['id' => 'is_used', 'type' => 'checkbox', 'label' => 'Б/у'],
                    ['id' => 'age', 'type' => 'number', 'label' => 'Возраст', 'required' => true, 'visibleWhen' => ['field' => 'is_used', 'op' => 'eq', 'value' => true]],
                ],
            ],
        ],
    ];

    it('пересчитывает computed-поля', function () use ($schema) {
        $result = ServiceSchema::make($schema)->withComputed(['count' => 10, 'price' => 5000000]);
        expect($result['total'])->toBe(50000000.0);
    });

    it('валидирует обязательные видимые поля', function () use ($schema) {
        $errors = ServiceSchema::make($schema)->validate(['count' => 10, 'price' => 5000000]);
        expect($errors)->toBeEmpty();
    });

    it('ловит нарушение минимального значения', function () use ($schema) {
        $errors = ServiceSchema::make($schema)->validate(['count' => 0, 'price' => 5000000]);
        expect($errors)->toHaveKey('count');
    });

    it('не требует скрытое ветвлением поле', function () use ($schema) {
        // is_used = false → поле age скрыто, значит не обязательно.
        $errors = ServiceSchema::make($schema)->validate(['count' => 1, 'price' => 100, 'is_used' => false]);
        expect($errors)->not->toHaveKey('age');
    });

    it('требует поле, ставшее видимым по условию', function () use ($schema) {
        $errors = ServiceSchema::make($schema)->validate(['count' => 1, 'price' => 100, 'is_used' => true]);
        expect($errors)->toHaveKey('age');
    });
});
