import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CircleDot, Loader2 } from 'lucide-react';
import { useState } from 'react';

type AnswerGroup = { title: string; rows: { label: string; value: string }[] };
type Event = { title: string; body: string | null; status: string | null; created_at: string | null };

type Props = {
    application: {
        id: number;
        number: string;
        status: string;
        submitted_at: string | null;
        service: string | null;
        applicant: { name: string | null; email: string | null };
        answers: AnswerGroup[];
        events: Event[];
    };
    statuses: { value: string; label: string }[];
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AdminApplicationShow({ application, statuses }: Props) {
    const [status, setStatus] = useState(application.status);
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = () => {
        setSaving(true);
        router.patch(
            `/admin/applications/${application.id}/status`,
            { status, comment },
            { preserveScroll: true, onFinish: () => setSaving(false), onSuccess: () => setComment('') },
        );
    };

    return (
        <>
            <Head title={`Заявка №${application.number}`} />
            <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
                <Link href="/admin/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    Все заявки
                </Link>

                <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={application.status} />
                            <span className="text-sm text-muted-foreground">№{application.number}</span>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{application.service}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {application.applicant.name} · {application.applicant.email} · подана {formatDate(application.submitted_at)}
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
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

                    <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                        {/* Управление статусом */}
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <h3 className="text-sm font-semibold text-foreground">Решение по заявке</h3>
                            <label className="mt-3 block">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Статус</span>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                >
                                    {statuses.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="mt-3 block">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">Комментарий (необязательно)</span>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={2}
                                    className="w-full resize-none rounded-lg border border-input bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                />
                            </label>
                            <Button onClick={submit} disabled={saving} className="mt-3 w-full">
                                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                                Обновить статус
                            </Button>
                        </div>

                        {/* История */}
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <h3 className="text-sm font-semibold text-foreground">История</h3>
                            <ol className="mt-4 space-y-4">
                                {application.events.map((event, i) => (
                                    <li key={i} className="relative flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <CircleDot className="size-4 text-primary" />
                                            {i < application.events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                                        </div>
                                        <div className="-mt-0.5 pb-1">
                                            <p className="text-sm font-medium text-foreground">{event.title}</p>
                                            {event.body && <p className="mt-0.5 text-xs text-muted-foreground">{event.body}</p>}
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
