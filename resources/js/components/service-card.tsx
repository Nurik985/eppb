import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n';
import type { ServiceCard as ServiceCardType } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowRight, Layers } from 'lucide-react';

export default function ServiceCard({ service }: { service: ServiceCardType }) {
    const t = useT();
    return (
        <Link
            href={`/services/${service.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
            <div className="flex flex-wrap items-center gap-2">
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
                {service.category && (
                    <span className="text-xs text-muted-foreground">{service.category.name}</span>
                )}
            </div>

            <h3 className="mt-3 font-semibold text-foreground">{service.title}</h3>
            <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">{service.summary}</p>

            <div className="mt-4 flex items-center gap-2">
                {service.is_complex && (
                    <Badge variant="outline" className="gap-1">
                        <Layers className="size-3" />
                        {service.steps_count} {t('шагов')}
                    </Badge>
                )}
                {service.is_popular && <Badge className="bg-primary/10 text-primary">{t('Популярное')}</Badge>}
            </div>

            {service.meta?.amount && (
                <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">{t('Сумма: ')}</span>
                    <span className="font-medium text-foreground">{service.meta.amount}</span>
                </div>
            )}

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t('Подробнее')} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
        </Link>
    );
}
