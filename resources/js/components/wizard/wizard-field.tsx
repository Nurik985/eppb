import { formatTenge } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { FieldOption, SchemaField } from '@/types/schema';
import { BadgeCheck, Info, Loader2, Search } from 'lucide-react';
import { useState } from 'react';

export type CompanyLookup = {
    found: boolean;
    name?: string;
    address?: string;
    status?: string;
    oked?: string;
};

type WizardFieldProps = {
    field: SchemaField;
    value: unknown;
    onChange: (value: unknown) => void;
    error?: string;
    options: FieldOption[];
    onBinLookup?: (data: CompanyLookup) => void;
};

const inputClass =
    'h-11 w-full rounded-xl border bg-background px-3.5 text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40';

export default function WizardField({ field, value, onChange, error, options, onBinLookup }: WizardFieldProps) {
    const t = useT();
    const borderClass = error ? 'border-destructive focus-visible:border-destructive' : 'border-input focus-visible:border-ring';
    const [lookingUp, setLookingUp] = useState(false);
    const [company, setCompany] = useState<CompanyLookup | null>(null);

    const runBinLookup = async () => {
        const bin = String(value ?? '');
        if (!/^\d{12}$/.test(bin)) return;
        setLookingUp(true);
        try {
            const res = await fetch(`/integrations/company?bin=${bin}`, { headers: { Accept: 'application/json' } });
            const data: CompanyLookup = await res.json();
            if (data.found) {
                setCompany(data);
                onBinLookup?.(data);
            }
        } catch {
            /* mock-сервис недоступен — тихо игнорируем */
        } finally {
            setLookingUp(false);
        }
    };

    // Расчётное поле — только для чтения, форматируется как деньги при крупных значениях.
    if (field.type === 'computed') {
        const num = typeof value === 'number' ? value : Number(value);
        const display = Number.isFinite(num) && num !== 0 ? formatTenge(num) : '—';
        return (
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="text-base font-semibold text-foreground tabular-nums">{display}</span>
                </div>
                {field.hint && <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>}
            </div>
        );
    }

    const renderControl = () => {
        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className={cn(inputClass, 'h-auto py-2.5', borderClass)}
                    />
                );

            case 'select':
            case 'region':
                return (
                    <select
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={cn(inputClass, borderClass)}
                    >
                        <option value="">{t('Выберите…')}</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            case 'radio':
                return (
                    <div className="space-y-2">
                        {options.map((opt) => (
                            <label
                                key={opt.value}
                                className={cn(
                                    'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
                                    value === opt.value
                                        ? 'border-primary bg-primary/5 text-foreground'
                                        : 'border-input hover:bg-accent',
                                )}
                            >
                                <input
                                    type="radio"
                                    name={field.id}
                                    checked={value === opt.value}
                                    onChange={() => onChange(opt.value)}
                                    className="size-4 accent-[var(--primary)]"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                );

            case 'checkbox':
                return (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-input px-4 py-3 text-sm hover:bg-accent">
                        <input
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mt-0.5 size-4 accent-[var(--primary)]"
                        />
                        <span className="text-foreground">{field.label}</span>
                    </label>
                );

            case 'file':
                return (
                    <div>
                        <input
                            type="file"
                            onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')}
                            className={cn(
                                inputClass,
                                borderClass,
                                'file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm py-2',
                            )}
                        />
                        {typeof value === 'string' && value && (
                            <p className="mt-1 text-xs text-muted-foreground">{t('Прикреплено: ')}{value}</p>
                        )}
                    </div>
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={value === undefined || value === null ? '' : (value as number)}
                        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder={field.placeholder}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        className={cn(inputClass, borderClass, 'tabular-nums')}
                    />
                );

            case 'money':
                return (
                    <div className="relative">
                        <input
                            type="number"
                            value={value === undefined || value === null ? '' : (value as number)}
                            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            placeholder={field.placeholder}
                            className={cn(inputClass, borderClass, 'pr-8 tabular-nums')}
                        />
                        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">
                            ₸
                        </span>
                    </div>
                );

            case 'bin':
                return (
                    <div>
                        <div className="flex gap-2">
                            <input
                                inputMode="numeric"
                                value={(value as string) ?? ''}
                                onChange={(e) => {
                                    onChange(e.target.value.replace(/\D/g, '').slice(0, 12));
                                    setCompany(null);
                                }}
                                placeholder="12 цифр"
                                className={cn(inputClass, borderClass, 'tabular-nums tracking-wider')}
                            />
                            {onBinLookup && (
                                <button
                                    type="button"
                                    onClick={runBinLookup}
                                    disabled={lookingUp || !/^\d{12}$/.test(String(value ?? ''))}
                                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-input px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                                >
                                    {lookingUp ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                                    {t('Проверить')}
                                </button>
                            )}
                        </div>
                        {company?.found && (
                            <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                    <BadgeCheck className="size-4 text-primary" />
                                    {company.name}
                                </div>
                                {company.address && <p className="mt-1 text-xs text-muted-foreground">{company.address}</p>}
                                {company.oked && <p className="text-xs text-muted-foreground">{company.oked}</p>}
                                <p className="mt-1 text-xs text-primary">{t('Данные подтянуты из реестра юрлиц')}</p>
                            </div>
                        )}
                    </div>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={cn(inputClass, borderClass)}
                    />
                );

            default:
                return (
                    <input
                        type="text"
                        value={(value as string) ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className={cn(inputClass, borderClass)}
                    />
                );
        }
    };

    // Для checkbox лейбл встроен в контрол.
    if (field.type === 'checkbox') {
        return (
            <div>
                {renderControl()}
                {field.hint && <p className="mt-1.5 text-xs text-muted-foreground">{field.hint}</p>}
                {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
            </div>
        );
    }

    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
                {field.label}
                {field.required && <span className="ml-0.5 text-destructive">*</span>}
            </label>
            {renderControl()}
            {field.hint && (
                <p className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3 shrink-0" />
                    {field.hint}
                </p>
            )}
            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
        </div>
    );
}
