import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';
import { useT } from '@/lib/i18n';
import type { ServiceFull } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Building2, CheckCircle2, Clock, Coins, Layers, Percent, Users } from 'lucide-react';

type ServiceShowProps = {
    service: ServiceFull;
};

export default function ServiceShow({ service }: ServiceShowProps) {
    const { auth } = usePage().props;
    const t = useT();
    const steps = service.schema?.steps ?? [];

    // Роут /apply под auth-middleware: для гостя Laravel сам сохранит intended URL
    // и вернёт на подачу после входа.
    const applyHref = `/services/${service.slug}/apply`;

    const metaItems = [
        { icon: Coins, label: 'Сумма', value: service.meta?.amount },
        { icon: Clock, label: 'Срок', value: service.meta?.term },
        { icon: Percent, label: 'Ставка', value: service.meta?.rate },
        { icon: Users, label: 'Для кого', value: service.meta?.audience },
    ].filter((m) => m.value);

    return (
        <PublicLayout>
            <Head title={service.title} />

            <div className="border-b border-border/70 bg-muted/30">
                <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground">
                            {t('Главная')}
                        </Link>
                        <span>/</span>
                        <Link href="/catalog" className="hover:text-foreground">
                            {t('Каталог')}
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">{service.title}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {service.category && (
                            <Badge variant="secondary" style={{ color: service.category.color ?? undefined }}>
                                {service.category.name}
                            </Badge>
                        )}
                        {service.is_complex && (
                            <Badge variant="outline" className="gap-1">
                                <Layers className="size-3" />
                                {t('Многоэтапная')} · {steps.length} {t('шагов')}
                            </Badge>
                        )}
                        {service.is_popular && <Badge className="bg-primary/10 text-primary">{t('Популярное')}</Badge>}
                    </div>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{service.title}</h1>
                    {service.summary && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{service.summary}</p>}

                    {service.organization && (
                        <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="size-4" />
                            {service.organization.name}
                        </div>
                    )}
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
                <div className="space-y-8">
                    {service.description && (
                        <section>
                            <h2 className="text-xl font-semibold text-foreground">{t('Об услуге')}</h2>
                            <p className="mt-3 leading-relaxed text-muted-foreground">{service.description}</p>
                        </section>
                    )}

                    {steps.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-foreground">{t('Как проходит подача')}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('Услуга разбита на понятные шаги — с подсказками, автозаполнением и проверкой ошибок.')}
                            </p>
                            <ol className="mt-5 space-y-3">
                                {steps.map((step, i) => (
                                    <li key={step.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <h3 className="font-medium text-foreground">{step.title}</h3>
                                            {step.description && (
                                                <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                                            )}
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {step.fields.length} {t('полей')}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )}
                </div>

                {/* Боковая панель с CTA */}
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        {metaItems.length > 0 && (
                            <dl className="space-y-3">
                                {metaItems.map((m) => (
                                    <div key={m.label} className="flex items-start gap-3">
                                        <m.icon className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <dt className="text-xs text-muted-foreground">{t(m.label)}</dt>
                                            <dd className="text-sm font-medium text-foreground">{m.value}</dd>
                                        </div>
                                    </div>
                                ))}
                            </dl>
                        )}

                        <Button asChild size="lg" className="mt-6 w-full gap-1.5">
                            <Link href={applyHref}>
                                {t('Подать заявку')}
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>

                        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                            {['Пошаговый сценарий', 'Автоматические расчёты', 'Сохранение черновика'].map((feat) => (
                                <li key={feat} className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-primary" />
                                    {t(feat)}
                                </li>
                            ))}
                        </ul>

                        {!auth.user && (
                            <p className="mt-4 text-xs text-muted-foreground">
                                {t('Для подачи потребуется вход в личный кабинет.')}
                            </p>
                        )}
                    </div>
                </aside>
            </div>
        </PublicLayout>
    );
}
