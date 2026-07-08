import PortalLogo from '@/components/portal-logo';
import { Button } from '@/components/ui/button';
import WizardField from '@/components/wizard/wizard-field';
import { formatTenge } from '@/lib/format';
import { LanguageSwitcher, useT } from '@/lib/i18n';
import { computeValues, isFieldVisible } from '@/lib/schema-engine';
import { cn } from '@/lib/utils';
import type { ServiceFull } from '@/types';
import type { FieldOption, FormValues, ReferenceMap, SchemaField } from '@/types/schema';
import type { FormDataConvertible } from '@inertiajs/core';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Loader2, Save, Send } from 'lucide-react';
import { useMemo, useState } from 'react';

type WizardProps = {
    application: {
        id: number;
        number: string;
        data: FormValues;
        current_step: number;
    };
    service: ServiceFull;
    references: ReferenceMap;
};

function validateFields(fields: SchemaField[], values: FormValues): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const f of fields) {
        if (f.type === 'computed' || !isFieldVisible(f, values)) continue;
        const v = values[f.id];
        const empty = v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0);
        if (f.required && empty) {
            errors[f.id] = `Поле «${f.label}» обязательно для заполнения.`;
            continue;
        }
        if (empty) continue;
        if (f.type === 'bin' && !/^\d{12}$/.test(String(v))) {
            errors[f.id] = 'БИН/ИИН должен содержать ровно 12 цифр.';
        }
        if (f.type === 'number' || f.type === 'money') {
            const n = Number(v);
            if (f.validation?.min != null && n < f.validation.min) errors[f.id] = `Значение не может быть меньше ${f.validation.min}.`;
            if (f.validation?.max != null && n > f.validation.max) errors[f.id] = `Значение не может быть больше ${f.validation.max}.`;
        }
    }
    return errors;
}

export default function Wizard({ application, service, references }: WizardProps) {
    const schema = service.schema!;
    const steps = schema.steps;

    // Инициализация значений: defaults + сохранённый черновик + пересчёт computed.
    const [values, setValues] = useState<FormValues>(() => {
        const init: FormValues = {};
        for (const step of steps) {
            for (const field of step.fields) {
                if (field.default !== undefined) init[field.id] = field.default;
            }
        }
        return computeValues(schema, { ...init, ...application.data });
    });

    const [stepIndex, setStepIndex] = useState(Math.min(application.current_step, steps.length - 1));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const t = useT();
    const [submitting, setSubmitting] = useState(false);

    const step = steps[stepIndex];
    const isLast = stepIndex === steps.length - 1;

    const resolveOptions = (field: SchemaField): FieldOption[] => {
        if (field.options?.length) return field.options;
        if (field.type === 'region') return references['regions'] ?? [];
        if (field.reference) return references[field.reference] ?? [];
        return [];
    };

    const setValue = (id: string, value: unknown) => {
        setValues((prev) => computeValues(schema, { ...prev, [id]: value }));
        setErrors((prev) => {
            if (!prev[id]) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const visibleFields = step.fields.filter((f) => isFieldVisible(f, values));

    // Живой расчёт: все computed-поля с ненулевым значением (для сводки сбоку).
    const liveComputed = useMemo(
        () =>
            steps
                .flatMap((s) => s.fields)
                .filter((f) => f.type === 'computed' && typeof values[f.id] === 'number' && values[f.id] !== 0),
        [steps, values],
    );

    const persist = (nextStep: number) => {
        setSaving(true);
        router.patch(
            `/applications/${application.id}`,
            { data: values as Record<string, FormDataConvertible>, current_step: nextStep },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setSaving(false),
            },
        );
    };

    const goNext = () => {
        const stepErrors = validateFields(step.fields, values);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            return;
        }
        const next = Math.min(stepIndex + 1, steps.length - 1);
        setStepIndex(next);
        persist(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goPrev = () => {
        const prev = Math.max(stepIndex - 1, 0);
        setStepIndex(prev);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = () => {
        // Валидируем все видимые поля всех шагов.
        const allFields = steps.flatMap((s) => s.fields);
        const allErrors = validateFields(allFields, values);
        if (Object.keys(allErrors).length > 0) {
            setErrors(allErrors);
            // Перейти к первому шагу с ошибкой.
            const firstBad = steps.findIndex((s) => s.fields.some((f) => allErrors[f.id]));
            if (firstBad >= 0) setStepIndex(firstBad);
            return;
        }

        setSubmitting(true);
        router.post(
            `/applications/${application.id}/submit`,
            { data: values as Record<string, FormDataConvertible> },
            {
                onError: (serverErrors) => {
                    // Ошибки приходят с префиксом data.field_id.
                    const mapped: Record<string, string> = {};
                    for (const [key, msg] of Object.entries(serverErrors)) {
                        mapped[key.replace(/^data\./, '')] = msg as string;
                    }
                    setErrors(mapped);
                    const firstBad = steps.findIndex((s) => s.fields.some((f) => mapped[f.id]));
                    if (firstBad >= 0) setStepIndex(firstBad);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <div className="min-h-screen bg-muted/30">
            <Head title={`Подача заявки · ${service.title}`} />

            {/* Слим-хедер */}
            <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                    <Link href="/">
                        <PortalLogo subtitle={false} />
                    </Link>
                    <div className="hidden text-sm text-muted-foreground sm:block">
                        {t('Заявка')} №{application.number}
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <Button variant="ghost" size="sm" onClick={() => persist(stepIndex)} disabled={saving}>
                            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            {t('Сохранить и выйти')}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
                <div className="mb-2">
                    <Link href={`/services/${service.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
                        ← {service.title}
                    </Link>
                </div>

                {/* Степпер */}
                <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
                    {steps.map((s, i) => {
                        const done = i < stepIndex;
                        const active = i === stepIndex;
                        return (
                            <div key={s.id} className="flex shrink-0 items-center gap-2">
                                <button
                                    onClick={() => i < stepIndex && setStepIndex(i)}
                                    disabled={i > stepIndex}
                                    className={cn(
                                        'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                                        active && 'bg-primary text-primary-foreground',
                                        done && 'bg-primary/10 text-primary hover:bg-primary/20',
                                        !active && !done && 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex size-5 items-center justify-center rounded-full text-xs',
                                            active && 'bg-primary-foreground/20',
                                            done && 'bg-primary text-primary-foreground',
                                            !active && !done && 'bg-background',
                                        )}
                                    >
                                        {done ? <Check className="size-3" /> : i + 1}
                                    </span>
                                    <span className="hidden sm:inline">{s.title}</span>
                                </button>
                                {i < steps.length - 1 && <div className="h-px w-4 bg-border" />}
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                    {/* Форма шага */}
                    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                        <div className="mb-6">
                            <p className="text-sm font-medium text-primary">
                                {t('Шаг')} {stepIndex + 1} / {steps.length}
                            </p>
                            <h1 className="mt-1 text-2xl font-bold text-foreground">{step.title}</h1>
                            {step.description && <p className="mt-1.5 text-muted-foreground">{step.description}</p>}
                        </div>

                        <div className="space-y-5">
                            {visibleFields.map((field) => (
                                <WizardField
                                    key={field.id}
                                    field={field}
                                    value={values[field.id]}
                                    onChange={(v) => setValue(field.id, v)}
                                    error={errors[field.id]}
                                    options={resolveOptions(field)}
                                    onBinLookup={
                                        field.type === 'bin'
                                            ? (data) => {
                                                  // Автозаполнение наименования из mock-реестра.
                                                  if (data.name && steps.some((s) => s.fields.some((f) => f.id === 'company_name'))) {
                                                      setValue('company_name', data.name);
                                                  }
                                              }
                                            : undefined
                                    }
                                />
                            ))}
                        </div>

                        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/70 pt-6">
                            <Button variant="outline" onClick={goPrev} disabled={stepIndex === 0}>
                                <ArrowLeft className="size-4" />
                                {t('Назад')}
                            </Button>
                            {isLast ? (
                                <Button onClick={submit} disabled={submitting} size="lg">
                                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    {schema.settings?.submitLabel ? t(schema.settings.submitLabel) : t('Отправить заявку')}
                                </Button>
                            ) : (
                                <Button onClick={goNext} size="lg">
                                    {t('Далее')}
                                    <ArrowRight className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Живой расчёт + подсказка */}
                    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                        {liveComputed.length > 0 && (
                            <div className="rounded-2xl border border-border bg-card p-5">
                                <h3 className="text-sm font-semibold text-foreground">{t('Предварительный расчёт')}</h3>
                                <dl className="mt-3 space-y-2.5">
                                    {liveComputed.map((f) => (
                                        <div key={f.id} className="flex items-baseline justify-between gap-3">
                                            <dt className="text-xs text-muted-foreground">{f.label}</dt>
                                            <dd className="text-sm font-semibold text-foreground tabular-nums">
                                                {formatTenge(values[f.id] as number)}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                                <p className="mt-3 text-xs text-muted-foreground">
                                    {t('Значения рассчитываются автоматически по мере заполнения.')}
                                </p>
                            </div>
                        )}

                        <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                            {t('Черновик сохраняется автоматически при переходе между шагами. Вы можете вернуться к заполнению в любой момент.')}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
