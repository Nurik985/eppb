import PublicLayout from '@/layouts/public-layout';
import { formatMoney, plural } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { Head } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type MapProject = {
    id: number;
    name: string;
    lat: number;
    lng: number;
    locality: string | null;
    region: string;
    region_label: string;
    industry: string;
    industry_label: string;
    amount: number;
    status: string | null;
    year_from: number | null;
    year_to: number | null;
    period: string;
    description: string | null;
    external_url: string | null;
    organization: { name: string; short_name: string | null; color: string | null } | null;
};

type MapProps = {
    projects: MapProject[];
    byRegion: { code: string; label: string; count: number }[];
    filters: {
        organizations: string[];
        regions: { code: string; label: string }[];
        industries: { code: string; label: string }[];
        statuses: string[];
        years: number[];
    };
    stats: { total: number; regions: number; financed: number };
};

export default function ProjectsMap({ projects, byRegion, filters, stats }: MapProps) {
    const [org, setOrg] = useState<string | null>(null);
    const [region, setRegion] = useState<string | null>(null);
    const [industry, setIndustry] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [year, setYear] = useState<string | null>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersLayer = useRef<L.LayerGroup | null>(null);

    const filtered = useMemo(
        () =>
            projects.filter((p) => {
                const y = year ? Number(year) : null;
                const inPeriod = !y || ((p.year_from ?? y) <= y && (p.year_to ?? y) >= y);
                return (
                    (!org || p.organization?.short_name === org) &&
                    (!region || p.region === region) &&
                    (!industry || p.industry === industry) &&
                    (!status || p.status === status) &&
                    inPeriod
                );
            }),
        [projects, org, region, industry, status, year],
    );

    // Инициализация карты один раз.
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;
        const map = L.map(mapRef.current, { scrollWheelZoom: true }).setView([48.0, 67.5], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 18,
        }).addTo(map);
        markersLayer.current = L.layerGroup().addTo(map);
        mapInstance.current = map;
        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []);

    // Перерисовка маркеров при изменении фильтра.
    useEffect(() => {
        const layer = markersLayer.current;
        if (!layer) return;
        layer.clearLayers();

        filtered.forEach((p) => {
            const color = p.organization?.color ?? '#0d9488';
            const marker = L.circleMarker([p.lat, p.lng], {
                radius: 9,
                fillColor: color,
                color: '#ffffff',
                weight: 2,
                fillOpacity: 0.9,
            });
            marker.bindPopup(
                `<div style="min-width:200px">
                    <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
                    <div style="font-size:12px;color:#666">${p.organization?.name ?? ''}</div>
                    <div style="margin-top:6px;font-size:13px">
                        <div><b>${formatMoney(p.amount)}</b></div>
                        <div>${p.region_label}${p.locality ? ', ' + p.locality : ''}</div>
                        <div>${p.industry_label} · ${p.status ?? ''}</div>
                        ${p.period ? `<div>Период: ${p.period}</div>` : ''}
                    </div>
                    ${p.description ? `<div style="margin-top:6px;font-size:12px;color:#666">${p.description}</div>` : ''}
                    ${p.external_url ? `<a href="${p.external_url}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:${color}">Подробнее о проекте →</a>` : ''}
                </div>`,
            );
            layer.addLayer(marker);
        });
    }, [filtered]);

    const maxRegion = Math.max(...byRegion.map((r) => r.count), 1);
    const hasFilter = org || region || industry || status || year;
    const t = useT();

    return (
        <PublicLayout>
            <Head title={t('Карта проектов')} />

            <div className="border-b border-border/70 bg-muted/30">
                <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('Карта проектов')}</h1>
                    <p className="mt-2 text-muted-foreground">
                        {stats.total} {t(plural(stats.total, 'проект', 'проекта', 'проектов'))} · {stats.regions}{' '}
                        {t(plural(stats.regions, 'в регионе', 'в регионах', 'в регионах'))} · {formatMoney(stats.financed)}
                    </p>
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
                {/* Фильтры + распределение */}
                <aside className="space-y-5">
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <SlidersHorizontal className="size-4" />
                            {t('Фильтры')}
                        </div>
                        <FilterSelect label={t('Организация')} value={org} onChange={setOrg} options={filters.organizations.map((o) => ({ value: o, label: o }))} />
                        <FilterSelect label={t('Регион')} value={region} onChange={setRegion} options={filters.regions.map((r) => ({ value: r.code, label: r.label }))} />
                        <FilterSelect label={t('Отрасль')} value={industry} onChange={setIndustry} options={filters.industries.map((i) => ({ value: i.code, label: i.label }))} />
                        <FilterSelect label={t('Статус')} value={status} onChange={setStatus} options={filters.statuses.map((s) => ({ value: s, label: s }))} />
                        <FilterSelect label={t('Период финансирования')} value={year} onChange={setYear} options={filters.years.map((y) => ({ value: String(y), label: String(y) }))} />
                        {hasFilter && (
                            <button
                                onClick={() => {
                                    setOrg(null);
                                    setRegion(null);
                                    setIndustry(null);
                                    setStatus(null);
                                    setYear(null);
                                }}
                                className="mt-1 text-xs text-primary hover:underline"
                            >
                                {t('Сбросить фильтры')}
                            </button>
                        )}
                        <p className="mt-3 text-xs text-muted-foreground">{t('Показано: ')}{filtered.length} / {stats.total}</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                        <h3 className="mb-3 text-sm font-semibold text-foreground">{t('Проекты по регионам')}</h3>
                        <ul className="space-y-2">
                            {byRegion.slice(0, 8).map((r) => (
                                <li key={r.code}>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">{r.label}</span>
                                        <span className="font-medium text-foreground">{r.count}</span>
                                    </div>
                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / maxRegion) * 100}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Карта */}
                <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
                    <div ref={mapRef} className="h-[600px] w-full" style={{ background: '#e5e7eb' }} />
                </div>
            </div>
        </PublicLayout>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string | null;
    onChange: (v: string | null) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value || null)}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
                <option value="">Все</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
