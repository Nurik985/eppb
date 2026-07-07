import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FieldType, SchemaField } from '@/types/schema';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Текст' },
    { value: 'textarea', label: 'Многострочный текст' },
    { value: 'number', label: 'Число' },
    { value: 'money', label: 'Сумма (₸)' },
    { value: 'select', label: 'Выпадающий список' },
    { value: 'radio', label: 'Переключатель' },
    { value: 'checkbox', label: 'Флажок' },
    { value: 'date', label: 'Дата' },
    { value: 'file', label: 'Файл' },
    { value: 'bin', label: 'БИН / ИИН' },
    { value: 'region', label: 'Регион (справочник)' },
    { value: 'computed', label: 'Расчётное поле' },
];

const OPS = [
    { value: 'eq', label: 'равно' },
    { value: 'ne', label: 'не равно' },
    { value: 'gt', label: 'больше' },
    { value: 'lt', label: 'меньше' },
    { value: 'notEmpty', label: 'заполнено' },
    { value: 'empty', label: 'пусто' },
];

const inputCls = 'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
            {children}
        </label>
    );
}

type FieldEditorProps = {
    field: SchemaField;
    index: number;
    total: number;
    otherFields: { id: string; label: string }[];
    referenceTypes: { value: string; label: string }[];
    onChange: (patch: Partial<SchemaField>) => void;
    onRemove: () => void;
    onMove: (dir: -1 | 1) => void;
};

export default function FieldEditor({
    field,
    index,
    total,
    otherFields,
    referenceTypes,
    onChange,
    onRemove,
    onMove,
}: FieldEditorProps) {
    const [open, setOpen] = useState(false);
    const hasOptions = field.type === 'select' || field.type === 'radio';
    const isNumeric = field.type === 'number' || field.type === 'money';
    const usesReference = Boolean(field.reference);

    const updateOption = (i: number, patch: Partial<{ value: string; label: string }>) => {
        const options = [...(field.options ?? [])];
        options[i] = { ...options[i], ...patch };
        onChange({ options });
    };

    const setCondition = (patch: Record<string, unknown>) => {
        onChange({ visibleWhen: { ...(field.visibleWhen ?? {}), ...patch } });
    };

    return (
        <div className="rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 p-3">
                <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                <input
                    value={field.label}
                    onChange={(e) => onChange({ label: e.target.value })}
                    placeholder="Название поля"
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none"
                />
                <select
                    value={field.type}
                    onChange={(e) => onChange({ type: e.target.value as FieldType })}
                    className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-muted-foreground"
                >
                    {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
                <button onClick={() => onMove(-1)} disabled={index === 0} className="text-muted-foreground disabled:opacity-30" aria-label="Вверх">
                    <ChevronUp className="size-4" />
                </button>
                <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-muted-foreground disabled:opacity-30" aria-label="Вниз">
                    <ChevronDown className="size-4" />
                </button>
                <button onClick={() => setOpen((v) => !v)} className="rounded-md px-2 py-1 text-xs text-primary hover:bg-accent">
                    {open ? 'Свернуть' : 'Настроить'}
                </button>
                <button onClick={onRemove} className="text-muted-foreground hover:text-destructive" aria-label="Удалить поле">
                    <Trash2 className="size-4" />
                </button>
            </div>

            {open && (
                <div className="space-y-4 border-t border-border/70 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Row label="Идентификатор (для формул и условий)">
                            <input
                                value={field.id}
                                onChange={(e) => onChange({ id: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') })}
                                className={cn(inputCls, 'font-mono text-xs')}
                            />
                        </Row>
                        <Row label="Подсказка">
                            <input value={field.hint ?? ''} onChange={(e) => onChange({ hint: e.target.value })} className={inputCls} />
                        </Row>
                    </div>

                    {field.type !== 'computed' && field.type !== 'checkbox' && (
                        <label className="flex items-center gap-2 text-sm text-foreground">
                            <input
                                type="checkbox"
                                checked={Boolean(field.required)}
                                onChange={(e) => onChange({ required: e.target.checked })}
                                className="size-4 accent-[var(--primary)]"
                            />
                            Обязательное для заполнения
                        </label>
                    )}

                    {/* Числовые ограничения */}
                    {isNumeric && (
                        <div className="grid grid-cols-2 gap-3">
                            <Row label="Минимум">
                                <input
                                    type="number"
                                    value={field.validation?.min ?? ''}
                                    onChange={(e) => onChange({ validation: { ...field.validation, min: e.target.value === '' ? undefined : Number(e.target.value) } })}
                                    className={inputCls}
                                />
                            </Row>
                            <Row label="Максимум">
                                <input
                                    type="number"
                                    value={field.validation?.max ?? ''}
                                    onChange={(e) => onChange({ validation: { ...field.validation, max: e.target.value === '' ? undefined : Number(e.target.value) } })}
                                    className={inputCls}
                                />
                            </Row>
                        </div>
                    )}

                    {/* Источник вариантов для списков */}
                    {hasOptions && (
                        <div className="rounded-lg bg-muted/40 p-3">
                            <div className="mb-2 flex gap-2 text-xs">
                                <button
                                    onClick={() => onChange({ reference: undefined })}
                                    className={cn('rounded-md px-2 py-1', !usesReference ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                                >
                                    Свои варианты
                                </button>
                                <button
                                    onClick={() => onChange({ reference: referenceTypes[0]?.value, options: undefined })}
                                    className={cn('rounded-md px-2 py-1', usesReference ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                                >
                                    Из справочника
                                </button>
                            </div>

                            {usesReference ? (
                                <select value={field.reference} onChange={(e) => onChange({ reference: e.target.value })} className={inputCls}>
                                    {referenceTypes.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="space-y-2">
                                    {(field.options ?? []).map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input
                                                value={opt.value}
                                                onChange={(e) => updateOption(i, { value: e.target.value })}
                                                placeholder="код"
                                                className={cn(inputCls, 'w-28 font-mono text-xs')}
                                            />
                                            <input
                                                value={opt.label}
                                                onChange={(e) => updateOption(i, { label: e.target.value })}
                                                placeholder="Название варианта"
                                                className={inputCls}
                                            />
                                            <button
                                                onClick={() => onChange({ options: (field.options ?? []).filter((_, j) => j !== i) })}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onChange({ options: [...(field.options ?? []), { value: `opt${(field.options?.length ?? 0) + 1}`, label: '' }] })}
                                    >
                                        <Plus className="size-3.5" />
                                        Вариант
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Формула для расчётного поля */}
                    {field.type === 'computed' && (
                        <div className="rounded-lg bg-primary/5 p-3">
                            <Row label="Формула (используйте идентификаторы полей: + − * / и скобки)">
                                <input
                                    value={field.computed?.formula ?? ''}
                                    onChange={(e) => onChange({ computed: { ...field.computed, formula: e.target.value } })}
                                    placeholder="например: count * price"
                                    className={cn(inputCls, 'font-mono text-xs')}
                                />
                            </Row>
                            <div className="mt-2 flex items-center gap-3">
                                <label className="text-xs text-muted-foreground">
                                    Знаков после запятой:
                                    <input
                                        type="number"
                                        value={field.computed?.decimals ?? 0}
                                        onChange={(e) => onChange({ computed: { ...field.computed, formula: field.computed?.formula ?? '', decimals: Number(e.target.value) } })}
                                        className="ml-2 h-7 w-16 rounded border border-input bg-background px-2 text-xs"
                                    />
                                </label>
                            </div>
                            {otherFields.length > 0 && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Доступные поля: {otherFields.map((f) => f.id).join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Условие показа (ветвление) */}
                    <div className="rounded-lg border border-dashed border-border p-3">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                            <input
                                type="checkbox"
                                checked={Boolean(field.visibleWhen)}
                                onChange={(e) =>
                                    onChange({ visibleWhen: e.target.checked ? { field: otherFields[0]?.id, op: 'eq', value: '' } : undefined })
                                }
                                className="size-4 accent-[var(--primary)]"
                            />
                            Показывать при условии (ветвление)
                        </label>
                        {field.visibleWhen && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <select value={field.visibleWhen.field ?? ''} onChange={(e) => setCondition({ field: e.target.value })} className={cn(inputCls, 'w-auto')}>
                                    {otherFields.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.label || f.id}
                                        </option>
                                    ))}
                                </select>
                                <select value={field.visibleWhen.op ?? 'eq'} onChange={(e) => setCondition({ op: e.target.value })} className={cn(inputCls, 'w-auto')}>
                                    {OPS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                {!['notEmpty', 'empty'].includes(field.visibleWhen.op ?? 'eq') && (
                                    <input
                                        value={String(field.visibleWhen.value ?? '')}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            const val = raw === 'true' ? true : raw === 'false' ? false : raw;
                                            setCondition({ value: val });
                                        }}
                                        placeholder="значение (код)"
                                        className={cn(inputCls, 'w-40')}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
