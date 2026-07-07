import PublicLayout from '@/layouts/public-layout';
import { formatMoney, plural } from '@/lib/format';
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
        industries: { code: string; label: string }[];
        statuses: string[];
    };
    stats: { total: number; regions: number; financed: number };
};

export default function ProjectsMap({ projects, byRegion, filters, stats }: MapProps) {
    const [org, setOrg] = useState<string | null>(null);
    const [industry, setIndustry] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersLayer = useRef<L.LayerGroup | null>(null);

    const filtered = useMemo(
        () =>
            projects.filter(
                (p) =>
                    (!org || p.organization?.short_name === org) &&
                    (!industry || p.industry === industry) &&
                    (!status || p.status === status),
            ),
        [projects, org, industry, status],
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
                </div>`,
            );
            layer.addLayer(marker);
        });
    }, [filtered]);

    const maxRegion = Math.max(...byRegion.map((r) => r.count), 1);
    const hasFilter = org || industry || status;

    return (
        <PublicLayout>
            <Head title="Карта проектов" />

            <div className="border-b border-border/70 bg-muted/30">
                <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Карта проектов</h1>
                    <p className="mt-2 text-muted-foreground">
                        {stats.total} {plural(stats.total, 'проект', 'проекта', 'проектов')} в {stats.regions}{' '}
                        {plural(stats.regions, 'регионе', 'регионах', 'регионах')} · профинансировано {formatMoney(stats.financed)}.
                    </p>
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
                {/* Фильтры + распределение */}
                <aside className="space-y-5">
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <SlidersHorizontal className="size-4" />
                            Фильтры
                        </div>
                        <FilterSelect label="Организация" value={org} onChange={setOrg} options={filters.organizations.map((o) => ({ value: o, label: o }))} />
                        <FilterSelect label="Отрасль" value={industry} onChange={setIndustry} options={filters.industries.map((i) => ({ value: i.code, label: i.label }))} />
                        <FilterSelect label="Статус" value={status} onChange={setStatus} options={filters.statuses.map((s) => ({ value: s, label: s }))} />
                        {hasFilter && (
                            <button
                                onClick={() => {
                                    setOrg(null);
                                    setIndustry(null);
                                    setStatus(null);
                                }}
                                className="mt-1 text-xs text-primary hover:underline"
                            >
                                Сбросить фильтры
                            </button>
                        )}
                        <p className="mt-3 text-xs text-muted-foreground">Показано: {filtered.length} из {stats.total}</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                        <h3 className="mb-3 text-sm font-semibold text-foreground">Проекты по регионам</h3>
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
