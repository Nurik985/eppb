import ServiceCard from '@/components/service-card';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';
import { plural } from '@/lib/format';
import type { Category, ServiceCard as ServiceCardType } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

type CatalogProps = {
    services: ServiceCardType[];
    categories: Category[];
    filters: {
        q: string;
        category: string | null;
    };
};

export default function Catalog({ services, categories, filters }: CatalogProps) {
    const [query, setQuery] = useState(filters.q ?? '');

    const applyFilters = (next: { q?: string; category?: string | null }) => {
        const params: Record<string, string> = {};
        const q = next.q ?? query;
        const category = next.category === undefined ? filters.category : next.category;
        if (q) params.q = q;
        if (category) params.category = category;
        router.get('/catalog', params, { preserveScroll: true, preserveState: true });
    };

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ q: query });
    };

    const hasFilters = Boolean(filters.q || filters.category);

    return (
        <PublicLayout>
            <Head title="Каталог услуг" />

            <div className="border-b border-border/70 bg-muted/30">
                <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground">
                            Главная
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Каталог услуг</span>
                    </div>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Каталог мер поддержки</h1>
                    <p className="mt-2 text-muted-foreground">
                        {services.length} {plural(services.length, 'услуга', 'услуги', 'услуг')} от организаций группы «Байтерек».
                    </p>

                    <form onSubmit={submitSearch} className="mt-6 flex max-w-2xl items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Поиск по услугам"
                                className="h-11 w-full rounded-xl border border-input bg-background pr-4 pl-11 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                            />
                        </div>
                        <Button type="submit" className="h-11">
                            Найти
                        </Button>
                    </form>
                </div>
            </div>

            <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Фильтр по направлениям */}
                <div className="mb-8 flex flex-wrap items-center gap-2">
                    <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <SlidersHorizontal className="size-4" />
                        Направление:
                    </span>
                    <button
                        onClick={() => applyFilters({ category: null })}
                        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                            !filters.category
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                        Все
                    </button>
                    {categories
                        .filter((c) => c.services_count > 0)
                        .map((cat) => (
                            <button
                                key={cat.slug}
                                onClick={() => applyFilters({ category: cat.slug })}
                                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                    filters.category === cat.slug
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    {hasFilters && (
                        <button
                            onClick={() => {
                                setQuery('');
                                router.get('/catalog', {}, { preserveScroll: true });
                            }}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-3.5" />
                            Сбросить
                        </button>
                    )}
                </div>

                {services.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => (
                            <ServiceCard key={service.slug} service={service} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border py-20 text-center">
                        <p className="text-muted-foreground">По вашему запросу услуги не найдены.</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => {
                                setQuery('');
                                router.get('/catalog');
                            }}
                        >
                            Сбросить фильтры
                        </Button>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
