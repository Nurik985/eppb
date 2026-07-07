import { Badge } from '@/components/ui/badge';
import PublicLayout from '@/layouts/public-layout';
import { Head } from '@inertiajs/react';
import { BarChart3, CalendarClock, ExternalLink } from 'lucide-react';
import { useState } from 'react';

type AnalyticsItem = {
    id: number;
    title: string;
    description: string | null;
    type: string | null;
    period: string | null;
    source: string | null;
    link_url: string | null;
    embed_url: string | null;
    organization: { name: string; short_name: string | null; color: string | null } | null;
};

type AnalyticsProps = {
    items: AnalyticsItem[];
    types: string[];
};

export default function Analytics({ items, types }: AnalyticsProps) {
    const [type, setType] = useState<string | null>(null);
    const filtered = type ? items.filter((i) => i.type === type) : items;

    return (
        <PublicLayout>
            <Head title="Аналитическая отчётность" />

            <div className="border-b border-border/70 bg-muted/30">
                <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 text-primary">
                        <BarChart3 className="size-5" />
                        <span className="text-sm font-medium">Модуль отчётности</span>
                    </div>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Аналитическая отчётность</h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        Отчёты, дашборды, исследования и финансовая отчётность Холдинга «Байтерек» и дочерних организаций.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                        <FilterChip active={!type} onClick={() => setType(null)}>
                            Все
                        </FilterChip>
                        {types.map((t) => (
                            <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
                                {t}
                            </FilterChip>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
                {filtered.map((item) => (
                    <a
                        key={item.id}
                        href={item.link_url ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                        <div className="flex items-center justify-between gap-2">
                            {item.type && <Badge variant="secondary">{item.type}</Badge>}
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
                        </div>
                        <h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{item.description}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
                            {item.period && (
                                <span className="inline-flex items-center gap-1">
                                    <CalendarClock className="size-3.5" />
                                    {item.period}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-primary">
                                Открыть <ExternalLink className="size-3.5" />
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </PublicLayout>
    );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
        >
            {children}
        </button>
    );
}
