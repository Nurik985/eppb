import PublicLayout from '@/layouts/public-layout';
import { useT } from '@/lib/i18n';
import { iconByName } from '@/lib/icon-map';
import { Head, router } from '@inertiajs/react';
import { BookOpen, Clock } from 'lucide-react';

type ResourceItem = {
    id: number;
    title: string;
    type: string | null;
    category: string | null;
    excerpt: string | null;
    icon: string | null;
    reading_minutes: number | null;
    link_url: string | null;
};

type ResourcesProps = {
    resources: ResourceItem[];
    categories: string[];
    filters: { category: string | null };
};

export default function Resources({ resources, categories, filters }: ResourcesProps) {
    const t = useT();
    const setCategory = (category: string | null) => {
        router.get('/resources', category ? { category } : {}, { preserveScroll: true, preserveState: true });
    };

    return (
        <PublicLayout>
            <Head title={t('Материалы и инструменты')} />

            <div className="border-b border-border/70 bg-muted/30">
                <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 text-primary">
                        <BookOpen className="size-5" />
                        <span className="text-sm font-medium">{t('Развитие бизнеса')}</span>
                    </div>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{t('Материалы и инструменты')}</h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        {t('База знаний, инструкции, шаблоны документов, чек-листы и калькуляторы для запуска и развития бизнеса.')}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                        <FilterChip active={!filters.category} onClick={() => setCategory(null)}>
                            {t('Все')}
                        </FilterChip>
                        {categories.map((c) => (
                            <FilterChip key={c} active={filters.category === c} onClick={() => setCategory(c)}>
                                {c}
                            </FilterChip>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
                {resources.map((item) => {
                    const Icon = iconByName(item.icon);
                    return (
                        <a
                            key={item.id}
                            href={item.link_url ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="size-5" />
                                </div>
                                {item.type && (
                                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{item.type}</span>
                                )}
                            </div>
                            <h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>
                            <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{item.excerpt}</p>
                            {item.reading_minutes && (
                                <div className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="size-3.5" />
                                    {item.reading_minutes} {t('мин')}
                                </div>
                            )}
                        </a>
                    );
                })}
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
