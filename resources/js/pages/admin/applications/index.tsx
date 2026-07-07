import StatusBadge from '@/components/status-badge';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ClipboardList, Inbox } from 'lucide-react';

type AdminApplication = {
    id: number;
    number: string;
    status: string;
    service: string | null;
    applicant: string | null;
    email: string | null;
    submitted_at: string | null;
};

type Props = {
    applications: AdminApplication[];
    stats: { total: number; in_review: number; need_info: number };
};

export default function AdminApplicationsIndex({ applications, stats }: Props) {
    return (
        <>
            <Head title="Заявки" />
            <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-2 text-primary">
                    <ClipboardList className="size-5" />
                    <span className="text-sm font-medium">Административный контур</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Заявки предпринимателей</h1>
                <p className="mt-1 text-muted-foreground">
                    Всего {stats.total} · на рассмотрении {stats.in_review} · требуют данных {stats.need_info}
                </p>

                {applications.length > 0 ? (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                    <th className="px-5 py-3 font-medium">Номер</th>
                                    <th className="px-5 py-3 font-medium">Услуга</th>
                                    <th className="px-5 py-3 font-medium">Заявитель</th>
                                    <th className="px-5 py-3 font-medium">Подана</th>
                                    <th className="px-5 py-3 font-medium">Статус</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/70">
                                {applications.map((a) => (
                                    <tr key={a.id} className="transition-colors hover:bg-muted/40">
                                        <td className="px-5 py-3 font-medium text-foreground tabular-nums">{a.number}</td>
                                        <td className="px-5 py-3">{a.service}</td>
                                        <td className="px-5 py-3">
                                            <div className="text-foreground">{a.applicant}</div>
                                            <div className="text-xs text-muted-foreground">{a.email}</div>
                                        </td>
                                        <td className="px-5 py-3 text-muted-foreground">{a.submitted_at ?? '—'}</td>
                                        <td className="px-5 py-3">
                                            <StatusBadge status={a.status} />
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <Link
                                                href={`/admin/applications/${a.id}`}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                            >
                                                Открыть <ArrowRight className="size-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="mt-6 rounded-2xl border border-dashed border-border py-16 text-center">
                        <Inbox className="mx-auto size-8 text-muted-foreground" />
                        <p className="mt-3 text-muted-foreground">Пока нет отправленных заявок.</p>
                    </div>
                )}
            </div>
        </>
    );
}
