import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CircleDot, FileText } from 'lucide-react';

type AnswerGroup = {
    title: string;
    rows: { label: string; value: string }[];
};

type ApplicationEvent = {
    type: string;
    title: string;
    body: string | null;
    status: string | null;
    created_at: string | null;
};

type CabinetShowProps = {
    application: {
        id: number;
        number: string;
        status: string;
        submitted_at: string | null;
        service: { slug: string; title: string };
        answers: AnswerGroup[];
        events: ApplicationEvent[];
    };
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CabinetShow({ application }: CabinetShowProps) {
    return (
        <>
            <Head title={`Заявка №${application.number}`} />
            <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    Все заявки
                </Link>

                <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={application.status} />
                            <span className="text-sm text-muted-foreground">№{application.number}</span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                            {application.service.title}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Подана: {formatDate(application.submitted_at)}
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={`/services/${application.service.slug}`}>
                            <FileText className="size-4" />
                            Об услуге
                        </Link>
                    </Button>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
                    {/* Обзор ответов */}
                    <div className="space-y-5">
                        <h2 className="text-lg font-semibold text-foreground">Данные заявки</h2>
                        {application.answers.map((group) => (
                            <div key={group.title} className="rounded-2xl border border-border bg-card p-5">
                                <h3 className="text-sm font-semibold text-primary">{group.title}</h3>
                                <dl className="mt-3 divide-y divide-border/70">
                                    {group.rows.map((row) => (
                                        <div key={row.label} className="flex justify-between gap-4 py-2 text-sm">
                                            <dt className="text-muted-foreground">{row.label}</dt>
                                            <dd className="text-right font-medium text-foreground">{row.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        ))}
                    </div>

                    {/* Таймлайн событий */}
                    <aside className="lg:sticky lg:top-6 lg:self-start">
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <h3 className="text-sm font-semibold text-foreground">История</h3>
                            <ol className="mt-4 space-y-4">
                                {application.events.map((event, i) => (
                                    <li key={i} className="relative flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <CircleDot className="size-4 text-primary" />
                                            {i < application.events.length - 1 && (
                                                <span className="mt-1 w-px flex-1 bg-border" />
                                            )}
                                        </div>
                                        <div className="-mt-0.5 pb-1">
                                            <p className="text-sm font-medium text-foreground">{event.title}</p>
                                            {event.body && (
                                                <p className="mt-0.5 text-xs text-muted-foreground">{event.body}</p>
                                            )}
                                            <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.created_at)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}
