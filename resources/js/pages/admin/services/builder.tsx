import FieldEditor, { FIELD_TYPES } from '@/components/builder/field-editor';
import { Button } from '@/components/ui/button';
import WizardField from '@/components/wizard/wizard-field';
import { computeValues, isFieldVisible } from '@/lib/schema-engine';
import { cn } from '@/lib/utils';
import type { FieldOption, FieldType, FormValues, SchemaField, SchemaStep, ServiceSchema } from '@/types/schema';
import { Head, Link, router } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { ArrowLeft, Eye, Loader2, Plus, Save, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';

function readCookie(name: string): string {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
}

type Option = { id: number; name: string; short_name?: string };

type BuilderService = {
    id: number;
    slug: string;
    title: string;
    summary: string | null;
    description: string | null;
    service_category_id: number | null;
    organization_id: number | null;
    is_popular: boolean;
    is_complex: boolean;
    status: string;
    meta: Record<string, string> | null;
    schema: ServiceSchema;
};

type BuilderProps = {
    service: BuilderService | null;
    options: {
        categories: Option[];
        organizations: Option[];
        referenceTypes: { value: string; label: string }[];
    };
};

const emptyForm = (): BuilderService => ({
    id: 0,
    slug: '',
    title: '',
    summary: '',
    description: '',
    service_category_id: null,
    organization_id: null,
    is_popular: false,
    is_complex: false,
    status: 'draft',
    meta: { amount: '', term: '', rate: '', audience: '' },
    schema: {
        steps: [{ id: 'step1', title: 'Шаг 1', description: '', fields: [] }],
        settings: { submitLabel: 'Подать заявку', successMessage: 'Заявка принята.' },
    },
});

const inputCls = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

const uid = () => `field_${Math.random().toString(36).slice(2, 7)}`;

export default function Builder({ service, options }: BuilderProps) {
    const isEdit = Boolean(service);
    const [form, setForm] = useState<BuilderService>(service ?? emptyForm());
    const [previewStep, setPreviewStep] = useState(0);
    const [previewValues, setPreviewValues] = useState<FormValues>({});
    const [saving, setSaving] = useState(false);
    const [aiOpen, setAiOpen] = useState(!isEdit);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiMode, setAiMode] = useState<string | null>(null);

    const steps = form.schema.steps;

    const set = (patch: Partial<BuilderService>) => setForm((f) => ({ ...f, ...patch }));
    const setMeta = (key: string, value: string) => setForm((f) => ({ ...f, meta: { ...f.meta, [key]: value } }));

    const setSteps = (next: SchemaStep[]) => setForm((f) => ({ ...f, schema: { ...f.schema, steps: next } }));
    const updateStep = (i: number, patch: Partial<SchemaStep>) => setSteps(steps.map((s, j) => (j === i ? { ...s, ...patch } : s)));
    const addStep = () => setSteps([...steps, { id: `step${steps.length + 1}`, title: `Шаг ${steps.length + 1}`, description: '', fields: [] }]);
    const removeStep = (i: number) => setSteps(steps.filter((_, j) => j !== i));

    const addField = (stepIdx: number, type: FieldType = 'text') => {
        const field: SchemaField = { id: uid(), type, label: 'Новое поле' };
        if (type === 'select' || type === 'radio') field.options = [{ value: 'opt1', label: 'Вариант 1' }];
        if (type === 'computed') field.computed = { formula: '', decimals: 0 };
        updateStep(stepIdx, { fields: [...steps[stepIdx].fields, field] });
    };
    const updateField = (stepIdx: number, fieldIdx: number, patch: Partial<SchemaField>) =>
        updateStep(stepIdx, { fields: steps[stepIdx].fields.map((f, j) => (j === fieldIdx ? { ...f, ...patch } : f)) });
    const removeField = (stepIdx: number, fieldIdx: number) =>
        updateStep(stepIdx, { fields: steps[stepIdx].fields.filter((_, j) => j !== fieldIdx) });
    const moveField = (stepIdx: number, fieldIdx: number, dir: -1 | 1) => {
        const fields = [...steps[stepIdx].fields];
        const target = fieldIdx + dir;
        if (target < 0 || target >= fields.length) return;
        [fields[fieldIdx], fields[target]] = [fields[target], fields[fieldIdx]];
        updateStep(stepIdx, { fields });
    };

    const allFields = useMemo(() => steps.flatMap((s) => s.fields), [steps]);

    const save = () => {
        setSaving(true);
        const payload = {
            title: form.title,
            summary: form.summary,
            description: form.description,
            service_category_id: form.service_category_id,
            organization_id: form.organization_id,
            is_popular: form.is_popular,
            is_complex: steps.length > 1,
            status: form.status,
            meta: form.meta,
            schema: form.schema,
        } as unknown as Record<string, FormDataConvertible>;

        const opts = { preserveScroll: true, onFinish: () => setSaving(false) };
        if (isEdit) {
            router.put(`/admin/services/${form.slug}`, payload, opts);
        } else {
            router.post('/admin/services', payload, opts);
        }
    };

    const aiGenerate = async () => {
        if (aiPrompt.trim().length < 5) return;
        setAiLoading(true);
        try {
            const res = await fetch('/admin/services/ai-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': readCookie('XSRF-TOKEN'),
                    Accept: 'application/json',
                },
                body: JSON.stringify({ description: aiPrompt }),
            });
            if (!res.ok) throw new Error('AI request failed');
            const data = await res.json();
            setForm((f) => ({
                ...f,
                title: f.title || data.title || '',
                summary: f.summary || data.summary || '',
                schema: data.schema,
            }));
            setPreviewStep(0);
            setPreviewValues({});
            setAiMode(data.mode);
            setAiOpen(false);
        } catch {
            setAiMode('error');
        } finally {
            setAiLoading(false);
        }
    };

    // --- Предпросмотр ---
    const previewCurrent = steps[previewStep];
    const setPreviewValue = (id: string, value: unknown) =>
        setPreviewValues((prev) => computeValues(form.schema, { ...prev, [id]: value }));
    const resolvePreviewOptions = (field: SchemaField): FieldOption[] => {
        if (field.options?.length) return field.options;
        // В предпросмотре справочники заменяем плейсхолдерами.
        if (field.type === 'region' || field.reference) return [{ value: 'demo', label: 'Значение из справочника' }];
        return [];
    };

    return (
        <>
            <Head title={isEdit ? `Конструктор · ${form.title}` : 'Новая услуга'} />
            <div className="flex h-full flex-col">
                {/* Верхняя панель */}
                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/admin/services" aria-label="Назад">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <input
                            value={form.title}
                            onChange={(e) => set({ title: e.target.value })}
                            placeholder="Название услуги"
                            className="w-64 bg-transparent text-lg font-semibold text-foreground outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={form.status} onChange={(e) => set({ status: e.target.value })} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                            <option value="draft">Черновик</option>
                            <option value="published">Опубликовано</option>
                        </select>
                        <Button onClick={save} disabled={saving || !form.title}>
                            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            Сохранить
                        </Button>
                    </div>
                </div>

                <div className="grid flex-1 gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_400px]">
                    {/* Редактор */}
                    <div className="space-y-6">
                        {/* AI-генерация структуры услуги */}
                        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-5 text-primary" />
                                    <h2 className="font-semibold text-foreground">AI-помощник автора</h2>
                                </div>
                                <button onClick={() => setAiOpen((v) => !v)} className="text-sm text-primary hover:underline">
                                    {aiOpen ? 'Свернуть' : 'Сгенерировать из описания'}
                                </button>
                            </div>
                            {aiOpen && (
                                <div className="mt-4">
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        Опишите меру поддержки — AI соберёт черновик этапов и полей, который можно доработать.
                                    </p>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        rows={2}
                                        placeholder="Например: субсидирование ставки вознаграждения по кредитам МСБ до 7% на 3 года"
                                        className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                    />
                                    <div className="mt-2 flex items-center gap-3">
                                        <Button onClick={aiGenerate} disabled={aiLoading || aiPrompt.trim().length < 5} size="sm">
                                            {aiLoading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                                            Сгенерировать структуру
                                        </Button>
                                        {aiMode === 'error' && <span className="text-xs text-destructive">Не удалось сгенерировать. Попробуйте ещё раз.</span>}
                                    </div>
                                </div>
                            )}
                            {aiMode && aiMode !== 'error' && !aiOpen && (
                                <p className="mt-2 text-xs text-primary">
                                    Черновик сгенерирован ({aiMode === 'ai' ? 'AI' : 'демо-режим'}). Проверьте и доработайте поля ниже.
                                </p>
                            )}
                        </section>

                        {/* Основное */}
                        <section className="rounded-2xl border border-border bg-card p-5">
                            <h2 className="font-semibold text-foreground">Основное</h2>
                            <div className="mt-4 grid gap-3">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Краткое описание (для карточки)</span>
                                    <input value={form.summary ?? ''} onChange={(e) => set({ summary: e.target.value })} className={inputCls} />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Полное описание</span>
                                    <textarea value={form.description ?? ''} onChange={(e) => set({ description: e.target.value })} rows={3} className={cn(inputCls, 'h-auto py-2')} />
                                </label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-medium text-muted-foreground">Направление</span>
                                        <select
                                            value={form.service_category_id ?? ''}
                                            onChange={(e) => set({ service_category_id: e.target.value ? Number(e.target.value) : null })}
                                            className={inputCls}
                                        >
                                            <option value="">—</option>
                                            {options.categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-medium text-muted-foreground">Организация</span>
                                        <select
                                            value={form.organization_id ?? ''}
                                            onChange={(e) => set({ organization_id: e.target.value ? Number(e.target.value) : null })}
                                            className={inputCls}
                                        >
                                            <option value="">—</option>
                                            {options.organizations.map((o) => (
                                                <option key={o.id} value={o.id}>
                                                    {o.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {(['amount', 'term', 'rate', 'audience'] as const).map((key) => (
                                        <label key={key} className="block">
                                            <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                                {{ amount: 'Сумма', term: 'Срок', rate: 'Ставка', audience: 'Для кого' }[key]}
                                            </span>
                                            <input value={form.meta?.[key] ?? ''} onChange={(e) => setMeta(key, e.target.value)} className={inputCls} />
                                        </label>
                                    ))}
                                </div>
                                <label className="flex items-center gap-2 text-sm text-foreground">
                                    <input type="checkbox" checked={form.is_popular} onChange={(e) => set({ is_popular: e.target.checked })} className="size-4 accent-[var(--primary)]" />
                                    Отметить как популярную услугу
                                </label>
                            </div>
                        </section>

                        {/* Этапы */}
                        {steps.map((step, si) => (
                            <section key={si} className="rounded-2xl border border-border bg-card p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <span className="text-xs font-medium text-primary">Этап {si + 1}</span>
                                        <input
                                            value={step.title}
                                            onChange={(e) => updateStep(si, { title: e.target.value })}
                                            className="mt-1 w-full bg-transparent text-base font-semibold text-foreground outline-none"
                                        />
                                        <input
                                            value={step.description ?? ''}
                                            onChange={(e) => updateStep(si, { description: e.target.value })}
                                            placeholder="Описание этапа (необязательно)"
                                            className="mt-1 w-full bg-transparent text-sm text-muted-foreground outline-none"
                                        />
                                    </div>
                                    {steps.length > 1 && (
                                        <button onClick={() => removeStep(si)} className="text-muted-foreground hover:text-destructive" aria-label="Удалить этап">
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 space-y-2">
                                    {step.fields.map((field, fi) => (
                                        <FieldEditor
                                            key={fi}
                                            field={field}
                                            index={fi}
                                            total={step.fields.length}
                                            otherFields={allFields.filter((f) => f.id !== field.id).map((f) => ({ id: f.id, label: f.label }))}
                                            referenceTypes={options.referenceTypes}
                                            onChange={(patch) => updateField(si, fi, patch)}
                                            onRemove={() => removeField(si, fi)}
                                            onMove={(dir) => moveField(si, fi, dir)}
                                        />
                                    ))}
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addField(si, e.target.value as FieldType);
                                                e.target.value = '';
                                            }
                                        }}
                                        defaultValue=""
                                        className="h-9 rounded-lg border border-dashed border-input bg-background px-3 text-sm text-muted-foreground"
                                    >
                                        <option value="">+ Добавить поле…</option>
                                        {FIELD_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </section>
                        ))}

                        <Button variant="outline" onClick={addStep} className="w-full border-dashed">
                            <Plus className="size-4" />
                            Добавить этап
                        </Button>
                    </div>

                    {/* Живой предпросмотр */}
                    <aside className="lg:sticky lg:top-20 lg:self-start">
                        <div className="rounded-2xl border border-border bg-card">
                            <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
                                <Eye className="size-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">Предпросмотр формы</span>
                            </div>
                            <div className="p-4">
                                {steps.length > 1 && (
                                    <div className="mb-4 flex flex-wrap gap-1.5">
                                        {steps.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setPreviewStep(i)}
                                                className={cn(
                                                    'rounded-full px-2.5 py-1 text-xs',
                                                    i === previewStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                {s.title || `Шаг ${i + 1}`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {previewCurrent && (
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-foreground">{previewCurrent.title}</h3>
                                        {previewCurrent.fields.filter((f) => isFieldVisible(f, previewValues)).length === 0 && (
                                            <p className="text-sm text-muted-foreground">Добавьте поля, чтобы увидеть форму.</p>
                                        )}
                                        {previewCurrent.fields
                                            .filter((f) => isFieldVisible(f, previewValues))
                                            .map((field) => (
                                                <WizardField
                                                    key={field.id}
                                                    field={field}
                                                    value={previewValues[field.id]}
                                                    onChange={(v) => setPreviewValue(field.id, v)}
                                                    options={resolvePreviewOptions(field)}
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="mt-3 px-1 text-xs text-muted-foreground">
                            Так услугу увидит предприниматель. Ветвление и расчёты работают вживую.
                        </p>
                    </aside>
                </div>
            </div>
        </>
    );
}
