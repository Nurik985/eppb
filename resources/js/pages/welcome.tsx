import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';
import { formatMoney, plural } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { iconByName } from '@/lib/icon-map';
import type { Category, PortalStats, ServiceCard } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    Bot,
    ClipboardCheck,
    Layers,
    Map as MapIcon,
    Search,
    Send,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';

type WelcomeProps = {
    categories: Category[];
    popularServices: ServiceCard[];
    featuredServices: ServiceCard[];
    stats: PortalStats;
};

const journeySteps = [
    { icon: Search, title: 'Найдите услугу', text: 'Каталог по направлениям, поиск или AI-подбор по вашей ситуации.' },
    { icon: Layers, title: 'Заполните пошагово', text: 'Сложная форма разбита на понятные шаги с подсказками и автозаполнением.' },
    { icon: Send, title: 'Отправьте заявку', text: 'Получите номер заявки и следующий шаг сразу после отправки.' },
    { icon: ClipboardCheck, title: 'Отслеживайте статус', text: 'Заявки, документы, уведомления и история — в личном кабинете.' },
];

const modules = [
    { icon: MapIcon, title: 'Карта проектов', text: 'Профинансированные проекты группы Холдинга на интерактивной карте.', href: '/map' },
    { icon: BarChart3, title: 'Аналитическая отчётность', text: 'Отчёты, дашборды и исследования дочерних организаций.', href: '/analytics' },
    { icon: BookOpen, title: 'Материалы и инструменты', text: 'База знаний, шаблоны, чек-листы и калькуляторы для бизнеса.', href: '/resources' },
];

export default function Welcome({ categories, popularServices, featuredServices, stats }: WelcomeProps) {
    const [query, setQuery] = useState('');
    const t = useT();

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.visit(`/catalog${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    };

    return (
        <PublicLayout>
            <Head title={t('Единый портал поддержки бизнеса')} />

            {/* Hero */}
            <section className="relative overflow-hidden border-b border-border/70">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/60 via-background to-background" />
                <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                    <div className="mx-auto max-w-3xl text-center">
                        <Badge variant="secondary" className="mb-5 gap-1.5 px-3 py-1 text-xs">
                            <Sparkles className="size-3.5" />
                            {t('Платформа-конструктор мер поддержки')}
                        </Badge>
                        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                            {t('Все меры поддержки бизнеса — ')}<span className="text-primary">{t('в одном окне')}</span>
                        </h1>
                        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
                            {t('Найдите подходящую меру поддержки Холдинга «Байтерек», подайте заявку пошагово и отслеживайте статус — без хождения по разным сайтам и объёмных анкет.')}
                        </p>

                        <form onSubmit={submitSearch} className="mx-auto mt-8 flex max-w-xl items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t('Например: кредит на животноводство или лизинг')}
                                    className="h-12 w-full rounded-xl border border-input bg-background pr-4 pl-11 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                                />
                            </div>
                            <Button type="submit" size="lg" className="h-12 shrink-0">
                                {t('Найти')}
                            </Button>
                        </form>

                        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                            <Button asChild variant="outline" size="sm" className="gap-1.5">
                                <Link href="/catalog">
                                    <Layers className="size-4" />
                                    {t('Весь каталог')}
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-primary">
                                <Link href="/assistant">
                                    <Bot className="size-4" />
                                    {t('Подобрать с AI-помощником')}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 shadow-sm sm:grid-cols-4">
                        {[
                            { value: stats.services, label: t(plural(stats.services, 'услуга', 'услуги', 'услуг')) },
                            { value: stats.organizations, label: t('организаций') },
                            { value: formatMoney(stats.financed), label: t('профинансировано') },
                            { value: stats.projects, label: t(plural(stats.projects, 'проект', 'проекта', 'проектов')) },
                        ].map((s, i) => (
                            <div key={i} className="bg-card px-5 py-6 text-center">
                                <div className="text-2xl font-bold text-foreground sm:text-3xl">{s.value}</div>
                                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Направления поддержки */}
            <section id="catalog" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            {t('Направления поддержки')}
                        </h2>
                        <p className="mt-2 text-muted-foreground">{t('Выберите направление, чтобы подобрать меру поддержки.')}</p>
                    </div>
                    <Button asChild variant="ghost" className="hidden gap-1.5 sm:flex">
                        <Link href="/catalog">
                            {t('Все услуги')} <ArrowRight className="size-4" />
                        </Link>
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {categories.map((cat) => {
                        const Icon = iconByName(cat.icon);
                        return (
                            <Link
                                key={cat.slug}
                                href={`/catalog?category=${cat.slug}`}
                                className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                            >
                                <div
                                    className="flex size-11 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: `${cat.color ?? '#0d9488'}1a`, color: cat.color ?? '#0d9488' }}
                                >
                                    <Icon className="size-5.5" />
                                </div>
                                <h3 className="mt-4 font-semibold text-foreground">{cat.name}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {cat.services_count} {t(plural(cat.services_count, 'услуга', 'услуги', 'услуг'))}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* Контрольные услуги */}
            {featuredServices.length > 0 && (
                <section className="border-y border-border/70 bg-muted/30">
                    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            {t('Популярные и сложные услуги')}
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            {t('Даже многоэтапная услуга проходится как понятный пошаговый сценарий.')}
                        </p>
                        <div className="mt-8 grid gap-5 lg:grid-cols-2">
                            {featuredServices.map((service) => (
                                <FeaturedCard key={service.slug} service={service} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Популярные услуги */}
            {popularServices.length > 0 && (
                <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-end justify-between gap-4">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('Частые запросы')}</h2>
                        <Button asChild variant="ghost" className="hidden gap-1.5 sm:flex">
                            <Link href="/catalog">
                                {t('Смотреть все')} <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {popularServices.map((service) => (
                            <ServiceMini key={service.slug} service={service} />
                        ))}
                    </div>
                </section>
            )}

            {/* Как это работает */}
            <section id="how" className="border-t border-border/70 bg-muted/30">
                <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('Как это работает')}</h2>
                        <p className="mt-2 text-muted-foreground">{t('Путь предпринимателя от выбора услуги до результата.')}</p>
                    </div>
                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {journeySteps.map((step, i) => (
                            <div key={i} className="relative rounded-2xl border border-border bg-card p-6">
                                <span className="absolute top-5 right-5 text-3xl font-bold text-muted/60">{i + 1}</span>
                                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <step.icon className="size-5.5" />
                                </div>
                                <h3 className="mt-4 font-semibold text-foreground">{t(step.title)}</h3>
                                <p className="mt-1.5 text-sm text-muted-foreground">{t(step.text)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Модули портала */}
            <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid gap-5 lg:grid-cols-3">
                    {modules.map((m) => (
                        <Link
                            key={m.href}
                            href={m.href}
                            className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                        >
                            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <m.icon className="size-5.5" />
                            </div>
                            <h3 className="mt-4 font-semibold text-foreground">{t(m.title)}</h3>
                            <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{t(m.text)}</p>
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                                {t('Открыть')} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
                    <div className="pointer-events-none absolute -top-16 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                    <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">
                        {t('Готовы найти меру поддержки для вашего бизнеса?')}
                    </h2>
                    <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/80">
                        {t('Начните с каталога или доверьтесь AI-помощнику — он подберёт услугу по вашей ситуации.')}
                    </p>
                    <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
                        <Button asChild size="lg" variant="secondary">
                            <Link href="/catalog">{t('Перейти в каталог')}</Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                        >
                            <Link href="/assistant">
                                <Bot className="size-4" />
                                {t('AI-помощник')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

function FeaturedCard({ service }: { service: ServiceCard }) {
    const t = useT();
    return (
        <Link
            href={`/services/${service.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
        >
            <div className="flex items-center gap-2">
                {service.category && (
                    <Badge variant="secondary" style={{ color: service.category.color ?? undefined }}>
                        {service.category.name}
                    </Badge>
                )}
                {service.is_complex && <Badge variant="outline">{service.steps_count} {t('шагов')}</Badge>}
                {service.is_popular && <Badge className="bg-primary/10 text-primary">{t('Популярное')}</Badge>}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">{service.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{service.summary}</p>

            {service.meta && (
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {service.meta.amount && (
                        <div>
                            <span className="text-muted-foreground">{t('Сумма: ')}</span>
                            <span className="font-medium text-foreground">{service.meta.amount}</span>
                        </div>
                    )}
                    {service.meta.term && (
                        <div>
                            <span className="text-muted-foreground">{t('Срок: ')}</span>
                            <span className="font-medium text-foreground">{service.meta.term}</span>
                        </div>
                    )}
                    {service.meta.rate && (
                        <div>
                            <span className="text-muted-foreground">{t('Ставка: ')}</span>
                            <span className="font-medium text-foreground">{service.meta.rate}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4">
                <span className="text-xs text-muted-foreground">{service.organization?.name}</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {t('Подать заявку')} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
            </div>
        </Link>
    );
}

function ServiceMini({ service }: { service: ServiceCard }) {
    const t = useT();
    return (
        <Link
            href={`/services/${service.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
            <div className="flex items-center gap-2">
                {service.organization?.short_name && (
                    <span
                        className="rounded-md px-2 py-0.5 text-xs font-medium"
                        style={{
                            backgroundColor: `${service.organization.color ?? '#0d9488'}1a`,
                            color: service.organization.color ?? '#0d9488',
                        }}
                    >
                        {service.organization.short_name}
                    </span>
                )}
                {service.is_complex && <Badge variant="outline">{service.steps_count} {t('шагов')}</Badge>}
            </div>
            <h3 className="mt-3 font-semibold text-foreground">{service.title}</h3>
            <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">{service.summary}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t('Подробнее')} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
        </Link>
    );
}
