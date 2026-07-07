import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Head, Link, router } from '@inertiajs/react';
import { Layers, Pencil, Plus, Trash2, Wrench } from 'lucide-react';

type AdminService = {
    id: number;
    slug: string;
    title: string;
    status: string;
    is_complex: boolean;
    steps_count: number;
    applications_count: number;
    category: string | null;
    organization: string | null;
    updated_at: string | null;
};

type AdminServicesIndexProps = {
    services: AdminService[];
    stats: { total: number; published: number; draft: number };
};

export default function AdminServicesIndex({ services, stats }: AdminServicesIndexProps) {
    const remove = (service: AdminService) => {
        if (confirm(`Удалить услугу «${service.title}»? Это действие необратимо.`)) {
            router.delete(`/admin/services/${service.slug}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Конструктор услуг" />
            <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-primary">
                            <Wrench className="size-5" />
                            <span className="text-sm font-medium">Административный конструктор</span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Услуги портала</h1>
                        <p className="mt-1 text-muted-foreground">
                            Создавайте и изменяйте услуги без разработки — {stats.published} опубликовано, {stats.draft} в черновиках.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/services/create">
                            <Plus className="size-4" />
                            Создать услугу
                        </Link>
                    </Button>
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                <th className="px-5 py-3 font-medium">Услуга</th>
                                <th className="px-5 py-3 font-medium">Организация</th>
                                <th className="px-5 py-3 font-medium">Этапы</th>
                                <th className="px-5 py-3 font-medium">Заявки</th>
                                <th className="px-5 py-3 font-medium">Статус</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70">
                            {services.map((service) => (
                                <tr key={service.id} className="transition-colors hover:bg-muted/40">
                                    <td className="px-5 py-3">
                                        <Link href={`/admin/services/${service.slug}/edit`} className="font-medium text-foreground hover:text-primary">
                                            {service.title}
                                        </Link>
                                        {service.category && (
                                            <div className="text-xs text-muted-foreground">{service.category}</div>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground">{service.organization ?? '—'}</td>
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                                            <Layers className="size-3.5" />
                                            {service.steps_count}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-muted-foreground">{service.applications_count}</td>
                                    <td className="px-5 py-3">
                                        <StatusBadge status={service.status} />
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button asChild variant="ghost" size="icon">
                                                <Link href={`/admin/services/${service.slug}/edit`} aria-label="Редактировать">
                                                    <Pencil className="size-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(service)}
                                                aria-label="Удалить"
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
