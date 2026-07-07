import type { ConditionRule, FormValues, SchemaField, ServiceSchema } from '@/types/schema';

/**
 * Клиентский движок схемы услуги — зеркалит серверную логику
 * (app/Support/*.php) для live-режима визарда: ветвление, автоматические
 * расчёты и определение видимости полей. Сервер пересчитывает всё заново
 * при отправке, поэтому клиент отвечает только за UX.
 */

// --- Формулы: безопасный вычислитель (shunting-yard, без eval) ---

type Token = { type: 'number' | 'ident' | 'op' | 'paren'; value: string };

function tokenize(formula: string): Token[] | null {
    const tokens: Token[] = [];
    let i = 0;

    while (i < formula.length) {
        const ch = formula[i];

        if (/\s/.test(ch)) {
            i++;
            continue;
        }
        if ('+-*/'.includes(ch)) {
            tokens.push({ type: 'op', value: ch });
            i++;
            continue;
        }
        if ('()'.includes(ch)) {
            tokens.push({ type: 'paren', value: ch });
            i++;
            continue;
        }
        if (/[0-9.]/.test(ch)) {
            let num = '';
            while (i < formula.length && /[0-9.]/.test(formula[i])) num += formula[i++];
            tokens.push({ type: 'number', value: num });
            continue;
        }
        if (/[a-zA-Z_]/.test(ch)) {
            let ident = '';
            while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) ident += formula[i++];
            tokens.push({ type: 'ident', value: ident });
            continue;
        }
        return null;
    }

    return tokens;
}

function toRpn(tokens: Token[]): Token[] | null {
    const output: Token[] = [];
    const stack: Token[] = [];
    const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

    for (const token of tokens) {
        if (token.type === 'number' || token.type === 'ident') {
            output.push(token);
        } else if (token.type === 'op') {
            while (
                stack.length > 0 &&
                stack[stack.length - 1].type === 'op' &&
                prec[stack[stack.length - 1].value] >= prec[token.value]
            ) {
                output.push(stack.pop()!);
            }
            stack.push(token);
        } else if (token.value === '(') {
            stack.push(token);
        } else if (token.value === ')') {
            while (stack.length > 0 && stack[stack.length - 1].value !== '(') {
                output.push(stack.pop()!);
            }
            if (stack.length === 0) return null;
            stack.pop();
        }
    }

    while (stack.length > 0) {
        const top = stack.pop()!;
        if (top.value === '(' || top.value === ')') return null;
        output.push(top);
    }

    return output;
}

function toNumber(value: unknown): number {
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) return Number(value);
    return 0;
}

export function evaluateFormula(formula: string, values: FormValues): number | null {
    const tokens = tokenize(formula);
    if (!tokens) return null;
    const rpn = toRpn(tokens);
    if (!rpn) return null;

    const stack: number[] = [];
    for (const token of rpn) {
        if (token.type === 'number') {
            stack.push(parseFloat(token.value));
        } else if (token.type === 'ident') {
            stack.push(toNumber(values[token.value]));
        } else {
            if (stack.length < 2) return null;
            const b = stack.pop()!;
            const a = stack.pop()!;
            switch (token.value) {
                case '+':
                    stack.push(a + b);
                    break;
                case '-':
                    stack.push(a - b);
                    break;
                case '*':
                    stack.push(a * b);
                    break;
                case '/':
                    stack.push(b === 0 ? 0 : a / b);
                    break;
            }
        }
    }

    return stack.length === 1 ? stack[0] : null;
}

// --- Условия (visibleWhen) ---

function looseEquals(a: unknown, b: unknown): boolean {
    if (typeof a === 'boolean' || typeof b === 'boolean') {
        return Boolean(a) === Boolean(b);
    }
    return String(a ?? '') === String(b ?? '');
}

function isEmpty(value: unknown): boolean {
    if (typeof value === 'boolean') return value === false;
    if (Array.isArray(value)) return value.length === 0;
    return value === null || value === undefined || value === '';
}

export function evaluateCondition(condition: ConditionRule | undefined | null, values: FormValues): boolean {
    if (!condition) return true;

    if (Array.isArray(condition.rules)) {
        const op = condition.op ?? 'and';
        const results = condition.rules.map((rule) => evaluateCondition(rule, values));
        return op === 'or' ? results.some(Boolean) : results.every(Boolean);
    }

    if (!condition.field) return true;

    const actual = values[condition.field];
    const expected = condition.value;

    switch (condition.op ?? 'eq') {
        case 'eq':
            return looseEquals(actual, expected);
        case 'ne':
            return !looseEquals(actual, expected);
        case 'gt':
            return toNumber(actual) > toNumber(expected);
        case 'gte':
            return toNumber(actual) >= toNumber(expected);
        case 'lt':
            return toNumber(actual) < toNumber(expected);
        case 'lte':
            return toNumber(actual) <= toNumber(expected);
        case 'in':
            return Array.isArray(expected) && expected.some((v) => looseEquals(actual, v));
        case 'contains':
            return Array.isArray(actual) && actual.some((v) => looseEquals(v, expected));
        case 'notEmpty':
            return !isEmpty(actual);
        case 'empty':
            return isEmpty(actual);
        default:
            return true;
    }
}

export function isFieldVisible(field: SchemaField, values: FormValues): boolean {
    return evaluateCondition(field.visibleWhen, values);
}

/** Пересчитывает все computed-поля (несколько проходов для цепочек зависимостей). */
export function computeValues(schema: ServiceSchema, values: FormValues): FormValues {
    const computed = schema.steps
        .flatMap((step) => step.fields)
        .filter((f) => f.type === 'computed' && f.computed?.formula);

    const next = { ...values };

    for (let pass = 0; pass < Math.max(1, computed.length); pass++) {
        let changed = false;
        for (const field of computed) {
            let result = evaluateFormula(field.computed!.formula, next);
            if (result !== null) {
                const decimals = field.computed!.decimals ?? 0;
                const factor = Math.pow(10, decimals);
                result = Math.round(result * factor) / factor;
            }
            if (next[field.id] !== result) {
                next[field.id] = result ?? undefined;
                changed = true;
            }
        }
        if (!changed) break;
    }

    return next;
}
