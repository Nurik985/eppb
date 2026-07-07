import {
    Banknote,
    Calculator,
    Calendar,
    Compass,
    FileText,
    Globe,
    GraduationCap,
    Library,
    ListChecks,
    Percent,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Truck,
    Umbrella,
    type LucideIcon,
} from 'lucide-react';

/**
 * Сопоставление имён иконок из БД (categories.icon, resources.icon)
 * с компонентами lucide-react. Fallback — Sparkles.
 */
const map: Record<string, LucideIcon> = {
    banknote: Banknote,
    percent: Percent,
    'shield-check': ShieldCheck,
    truck: Truck,
    umbrella: Umbrella,
    'trending-up': TrendingUp,
    globe: Globe,
    'graduation-cap': GraduationCap,
    compass: Compass,
    'file-text': FileText,
    'list-checks': ListChecks,
    calculator: Calculator,
    library: Library,
    calendar: Calendar,
};

export function iconByName(name: string | null | undefined): LucideIcon {
    if (name && map[name]) {
        return map[name];
    }
    return Sparkles;
}
