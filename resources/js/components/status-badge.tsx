import { useT } from '@/lib/i18n';

type Tone = 'muted' | 'blue' | 'amber' | 'green' | 'red';

const statuses: Record<string, { label: string; tone: Tone }> = {
    draft: { label: 'Черновик', tone: 'muted' },
    submitted: { label: 'Отправлена', tone: 'blue' },
    in_review: { label: 'На рассмотрении', tone: 'amber' },
    need_info: { label: 'Требуются данные', tone: 'amber' },
    approved: { label: 'Одобрена', tone: 'green' },
    rejected: { label: 'Отклонена', tone: 'red' },
};

const toneClasses: Record<Tone, string> = {
    muted: 'bg-muted text-muted-foreground',
    blue: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    green: 'bg-primary/12 text-primary',
    red: 'bg-destructive/12 text-destructive',
};

export function statusLabel(status: string): string {
    return statuses[status]?.label ?? status;
}

export default function StatusBadge({ status }: { status: string }) {
    const t = useT();
    const meta = statuses[status] ?? { label: status, tone: 'muted' as Tone };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[meta.tone]}`}>
            {t(meta.label)}
        </span>
    );
}
