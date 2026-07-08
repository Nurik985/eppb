import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, FileStack, FolderPen, Inbox, PencilLine } from 'lucide-react';

type CabinetApplication = {
    id: number;
    number: string;
    status: string;
    current_step: number;
    submitted_at: string | null;
    updated_at: string | null;
    unread_count: number;
    service: { slug: string; title: string };
};

type CabinetIndexProps = {
    applications: CabinetApplication[];
    stats: { total: number; active: number; drafts: number };
};

export default function CabinetIndex({ applications, stats }: CabinetIndexProps) {
    const t = useT();
    return (
        <>
            <Head title={t('Личный кабинет')} />
            <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Мои заявки')}</h1>
                        <p className="mt-1 text-muted-foreground">{t('Заявки, статусы, документы и уведомления.')}</p>
                    </div>
                    <Button asChild>
                        <Link href="/catalog">
                            {t('Подать новую заявку')}
                            <ArrowRight className="size-4" />
                        </Link>
                    </Button>
                </div>

                {/* Статистика */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                    {[
                        { icon: FileStack, label: 'Всего заявок', value: stats.total },
                        { icon: Inbox, label: 'В работе', value: stats.active },
                        { icon: FolderPen, label: 'Черновики', value: stats.drafts },
                    ].map((s) => (
                        <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                            <s.icon className="size-5 text-muted-foreground" />
                            <div className="mt-3 text-2xl font-bold text-foreground">{s.value}</div>
                            <div className="text-sm text-muted-foreground">{t(s.label)}</div>
                        </div>
                    ))}
                </div>

                {/* Список заявок */}
                <div className="mt-8">
                    {applications.length > 0 ? (
                        <ul className="space-y-3">
                            {applications.map((app) => {
                                const isDraft = app.status === 'draft';
                                const href = isDraft ? `/applications/${app.id}` : `/cabinet/applications/${app.id}`;
                                return (
                                    <li key={app.id}>
                                        <Link
                                            href={href}
                                            className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status={app.status} />
                                                    <span className="text-xs text-muted-foreground">№{app.number}</span>
                                                </div>
                                                <h3 className="mt-1.5 font-semibold text-foreground">{app.service.title}</h3>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {t('Обновлено')}: {app.updated_at ?? '—'}
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                                                {isDraft ? (
                                                    <>
                                                        <PencilLine className="size-4" />
                                                        {t('Продолжить')}
                                                    </>
                                                ) : (
                                                    <>
                                                        {t('Открыть')}
                                                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                                                    </>
                                                )}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                            <Inbox className="mx-auto size-8 text-muted-foreground" />
                            <p className="mt-3 text-muted-foreground">{t('У вас пока нет заявок.')}</p>
                            <Button asChild variant="outline" className="mt-4">
                                <Link href="/catalog">{t('Выбрать услугу')}</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
