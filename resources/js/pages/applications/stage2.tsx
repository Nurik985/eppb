import PortalLogo from '@/components/portal-logo';
import { LanguageSwitcher, useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import WizardField from '@/components/wizard/wizard-field';
import { computeValues, isFieldVisible } from '@/lib/schema-engine';
import type { FieldOption, FormValues, ReferenceMap, SchemaField, ServiceSchema } from '@/types/schema';
import type { FormDataConvertible } from '@inertiajs/core';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, Layers, Loader2, Send } from 'lucide-react';
import { useState } from 'react';

type Stage2Props = {
    application: { id: number; number: string; submitted: boolean; data: FormValues };
    service: { slug: string; title: string };
    schema: ServiceSchema;
    references: ReferenceMap;
};

export default function Stage2({ application, service, schema, references }: Stage2Props) {
    const t = useT();
    const step = schema.steps[0];
    const [values, setValues] = useState<FormValues>(() => computeValues(schema, { ...application.data }));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

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

    const submit = () => {
        const errs: Record<string, string> = {};
        for (const f of visibleFields) {
            const v = values[f.id];
            const empty = v === undefined || v === null || v === '' || v === false;
            if (f.required && empty) errs[f.id] = `Поле «${f.label}» обязательно для заполнения.`;
        }
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }
        setSubmitting(true);
        router.post(
            `/applications/${application.id}/stage2`,
            { data: values as Record<string, FormDataConvertible> },
            {
                onError: (serverErrors) => {
                    const mapped: Record<string, string> = {};
                    for (const [key, msg] of Object.entries(serverErrors)) mapped[key.replace(/^data\./, '')] = msg as string;
                    setErrors(mapped);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <div className="min-h-screen bg-muted/30">
            <Head title={`II этап · ${service.title}`} />
            <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
                <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
                    <Link href="/">
                        <PortalLogo subtitle={false} />
                    </Link>
                    <div className="flex items-center gap-2"><LanguageSwitcher /><span className="text-sm text-muted-foreground">{t('Заявка')} №{application.number}</span></div>
                </div>
            </header>

            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
                <Link href={`/cabinet/applications/${application.id}`} className="text-sm text-muted-foreground hover:text-foreground">
                    ← {t('Назад к заявке')}
                </Link>

                {application.submitted && (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
                        <CheckCircle2 className="size-5 shrink-0 text-primary" />
                        <span className="text-foreground">{t('Документы II этапа уже отправлены. Вы можете обновить данные и отправить повторно.')}</span>
                    </div>
                )}

                <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Layers className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-primary">{t('II этап')}</p>
                            <h1 className="text-xl font-bold text-foreground">{step.title}</h1>
                        </div>
                    </div>
                    {step.description && <p className="-mt-3 mb-6 text-sm text-muted-foreground">{step.description}</p>}

                    <div className="space-y-5">
                        {visibleFields.map((field) => (
                            <WizardField
                                key={field.id}
                                field={field}
                                value={values[field.id]}
                                onChange={(v) => setValue(field.id, v)}
                                error={errors[field.id]}
                                options={resolveOptions(field)}
                            />
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end border-t border-border/70 pt-6">
                        <Button onClick={submit} disabled={submitting} size="lg">
                            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            {schema.settings?.submitLabel ? t(schema.settings.submitLabel) : t('Отправить документы II этапа')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
