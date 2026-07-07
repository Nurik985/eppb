<?php

namespace App\Support;

/**
 * Безопасный вычислитель арифметических формул для расчётных полей конструктора.
 *
 * НЕ использует eval. Поддерживает + - * / ( ), числовые литералы и ссылки на
 * поля формы (идентификаторы). Значения полей подставляются из массива values.
 * Алгоритм: shunting-yard (в обратную польскую запись) + вычисление стека.
 *
 * Примеры формул: "wagon_count * wagon_price",
 * "(a - a * p / 100) / months".
 */
class FormulaEvaluator
{
    /**
     * @param  array<string, mixed>  $values  значения полей (field_id => value)
     */
    public function evaluate(string $formula, array $values): ?float
    {
        $tokens = $this->tokenize($formula);
        if ($tokens === null) {
            return null;
        }

        $rpn = $this->toRpn($tokens);
        if ($rpn === null) {
            return null;
        }

        return $this->evalRpn($rpn, $values);
    }

    /**
     * @return array<int, array{type: string, value: string}>|null
     */
    private function tokenize(string $formula): ?array
    {
        $tokens = [];
        $length = strlen($formula);
        $i = 0;

        while ($i < $length) {
            $char = $formula[$i];

            if (ctype_space($char)) {
                $i++;

                continue;
            }

            if (str_contains('+-*/()', $char)) {
                $tokens[] = ['type' => str_contains('()', $char) ? 'paren' : 'op', 'value' => $char];
                $i++;

                continue;
            }

            // Число (в т.ч. с десятичной точкой).
            if (ctype_digit($char) || $char === '.') {
                $num = '';
                while ($i < $length && (ctype_digit($formula[$i]) || $formula[$i] === '.')) {
                    $num .= $formula[$i];
                    $i++;
                }
                $tokens[] = ['type' => 'number', 'value' => $num];

                continue;
            }

            // Идентификатор поля: буква/подчёркивание, далее буквы/цифры/подчёркивания.
            if (ctype_alpha($char) || $char === '_') {
                $ident = '';
                while ($i < $length && (ctype_alnum($formula[$i]) || $formula[$i] === '_')) {
                    $ident .= $formula[$i];
                    $i++;
                }
                $tokens[] = ['type' => 'ident', 'value' => $ident];

                continue;
            }

            // Недопустимый символ — формула отбраковывается.
            return null;
        }

        return $tokens;
    }

    /**
     * @param  array<int, array{type: string, value: string}>  $tokens
     * @return array<int, array{type: string, value: string}>|null
     */
    private function toRpn(array $tokens): ?array
    {
        $output = [];
        $stack = [];
        $precedence = ['+' => 1, '-' => 1, '*' => 2, '/' => 2];

        foreach ($tokens as $token) {
            if ($token['type'] === 'number' || $token['type'] === 'ident') {
                $output[] = $token;
            } elseif ($token['type'] === 'op') {
                while (
                    ! empty($stack)
                    && end($stack)['type'] === 'op'
                    && $precedence[end($stack)['value']] >= $precedence[$token['value']]
                ) {
                    $output[] = array_pop($stack);
                }
                $stack[] = $token;
            } elseif ($token['value'] === '(') {
                $stack[] = $token;
            } elseif ($token['value'] === ')') {
                while (! empty($stack) && end($stack)['value'] !== '(') {
                    $output[] = array_pop($stack);
                }
                if (empty($stack)) {
                    return null; // несбалансированные скобки
                }
                array_pop($stack); // убираем '('
            }
        }

        while (! empty($stack)) {
            $top = array_pop($stack);
            if ($top['value'] === '(' || $top['value'] === ')') {
                return null;
            }
            $output[] = $top;
        }

        return $output;
    }

    /**
     * @param  array<int, array{type: string, value: string}>  $rpn
     * @param  array<string, mixed>  $values
     */
    private function evalRpn(array $rpn, array $values): ?float
    {
        $stack = [];

        foreach ($rpn as $token) {
            if ($token['type'] === 'number') {
                $stack[] = (float) $token['value'];
            } elseif ($token['type'] === 'ident') {
                $stack[] = $this->toNumber($values[$token['value']] ?? 0);
            } else {
                if (count($stack) < 2) {
                    return null;
                }
                $b = array_pop($stack);
                $a = array_pop($stack);
                $stack[] = match ($token['value']) {
                    '+' => $a + $b,
                    '-' => $a - $b,
                    '*' => $a * $b,
                    '/' => $b == 0.0 ? 0.0 : $a / $b,
                    default => 0.0,
                };
            }
        }

        return count($stack) === 1 ? $stack[0] : null;
    }

    private function toNumber(mixed $value): float
    {
        if (is_bool($value)) {
            return $value ? 1.0 : 0.0;
        }
        if (is_numeric($value)) {
            return (float) $value;
        }

        return 0.0;
    }
}
