import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';
import { useLocale, useT } from '@/lib/i18n';
import type { ServiceCard } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Bot, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useState } from 'react';

type SuggestItem = ServiceCard & { reason: string };

type AssistantProps = {
    aiEnabled: boolean;
    situation: string;
    result: { mode: string; items: SuggestItem[] } | null;
};

const examplesByLocale = {
    ru: [
        'Хочу открыть ферму и купить поголовье КРС, нужен льготный кредит',
        'Мы экспортируем продукцию и хотим застраховать контракт от рисков',
        'Нужны деньги на запуск небольшого бизнеса с нуля',
        'Транспортная компания хочет приобрести вагоны в лизинг',
    ],
    kk: [
        'Ферма ашып, ІҚМ басын сатып алғым келеді, жеңілдікті несие керек',
        'Біз өнім экспорттаймыз және келісімшартты тәуекелдерден сақтандырғымыз келеді',
        'Шағын бизнесті нөлден бастауға қаражат керек',
        'Көлік компаниясы вагондарды лизингке алғысы келеді',
    ],
};

export default function Assistant({ aiEnabled, situation: initial, result }: AssistantProps) {
    const [situation, setSituation] = useState(initial ?? '');
    const [loading, setLoading] = useState(false);
    const t = useT();
    const { locale } = useLocale();
    const examples = examplesByLocale[locale];

    const submit = (text?: string) => {
        const value = text ?? situation;
        if (value.trim().length < 5) return;
        setSituation(value);
        setLoading(true);
        router.post(
            '/assistant',
            { situation: value },
            { preserveScroll: true, onFinish: () => setLoading(false) },
        );
    };

    return (
        <PublicLayout>
            <Head title={t('AI-помощник по подбору услуги')} />

            <section className="border-b border-border/70 bg-gradient-to-b from-accent/50 to-background">
                <div className="mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <Bot className="size-7" />
                    </div>
                    <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('AI-помощник')}</h1>
                    <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                        {t('Опишите свою ситуацию простыми словами — подберём подходящие меры поддержки Холдинга «Байтерек».')}
                    </p>

                    <div className="mx-auto mt-8 max-w-xl">
                        <textarea
                            value={situation}
                            onChange={(e) => setSituation(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
                            }}
                            rows={3}
                            placeholder={t('Например: у меня крестьянское хозяйство, хочу расширить поголовье и купить корма…')}
                            className="w-full resize-none rounded-2xl border border-input bg-background p-4 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                        />
                        <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-xs text-muted-foreground">
                                {aiEnabled ? (
                                    <span className="inline-flex items-center gap-1 text-primary">
                                        <Sparkles className="size-3.5" /> {t('AI активен')}
                                    </span>
                                ) : (
                                    t('Демо-режим подбора')
                                )}
                            </span>
                            <Button onClick={() => submit()} disabled={loading || situation.trim().length < 5}>
                                {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                                {t('Подобрать')}
                            </Button>
                        </div>
                    </div>

                    {!result && (
                        <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">
                            {examples.map((ex) => (
                                <button
                                    key={ex}
                                    onClick={() => submit(ex)}
                                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {result && (
                <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">{t('Рекомендованные меры поддержки')}</h2>
                        <Badge variant="secondary" className="gap-1">
                            {result.mode === 'ai' ? <Sparkles className="size-3" /> : null}
                            {result.mode === 'ai' ? t('Подбор AI') : t('Подбор по совпадениям')}
                        </Badge>
                    </div>

                    {result.items.length > 0 ? (
                        <div className="space-y-4">
                            {result.items.map((item, i) => (
                                <Link
                                    key={item.slug}
                                    href={`/services/${item.slug}`}
                                    className="group flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
                                >
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                        {i + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.organization?.short_name && (
                                                <span
                                                    className="rounded-md px-2 py-0.5 text-xs font-medium"
                                                    style={{
                                                        backgroundColor: `${item.organization.color ?? '#0d9488'}1a`,
                                                        color: item.organization.color ?? '#0d9488',
                                                    }}
                                                >
                                                    {item.organization.short_name}
                                                </span>
                                            )}
                                            {item.category && (
                                                <span className="text-xs text-muted-foreground">{item.category.name}</span>
                                            )}
                                        </div>
                                        <h3 className="mt-1.5 font-semibold text-foreground">{item.title}</h3>
                                        {item.reason && (
                                            <p className="mt-1 text-sm text-primary/90">{item.reason}</p>
                                        )}
                                        {item.summary && (
                                            <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                                        )}
                                    </div>
                                    <ArrowRight className="size-5 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            Не удалось подобрать услугу. Попробуйте описать ситуацию иначе или откройте{' '}
                            <Link href="/catalog" className="text-primary hover:underline">
                                полный каталог
                            </Link>
                            .
                        </p>
                    )}
                </section>
            )}
        </PublicLayout>
    );
}
