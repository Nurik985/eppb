import PortalLogo from '@/components/portal-logo';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, login } from '@/routes';
import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, LogIn, Moon, Sun } from 'lucide-react';
import type { PropsWithChildren } from 'react';

const navItems = [
    { label: 'Каталог услуг', href: '/catalog' },
    { label: 'Карта проектов', href: '/map' },
    { label: 'Аналитика', href: '/analytics' },
    { label: 'Материалы', href: '/resources' },
];

function ThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <button
            type="button"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Переключить тему"
        >
            {isDark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </button>
    );
}

export default function PublicLayout({ children }: PropsWithChildren) {
    const { auth } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="shrink-0">
                        <PortalLogo />
                    </Link>

                    <nav className="hidden items-center gap-1 lg:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {auth.user ? (
                            <Button asChild size="sm">
                                <Link href={dashboard()}>
                                    <LayoutDashboard className="size-4" />
                                    Личный кабинет
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild size="sm">
                                <Link href={login()}>
                                    <LogIn className="size-4" />
                                    Войти
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-border/70 bg-muted/30">
                <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
                    <div className="max-w-sm">
                        <PortalLogo />
                        <p className="mt-4 text-sm text-muted-foreground">
                            Единая цифровая точка входа к мерам поддержки бизнеса Холдинга «Байтерек» и его дочерних
                            организаций.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Разделы</h4>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            {navItems.map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="transition-colors hover:text-foreground">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Холдинг</h4>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            <li>АО «НУХ «Байтерек»</li>
                            <li>
                                <a href="https://bgov.kz" className="transition-colors hover:text-foreground">
                                    bgov.kz
                                </a>
                            </li>
                            <li>Демо-версия MVP</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-border/70">
                    <div className="mx-auto w-full max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
                        © {new Date().getFullYear()} ЕППБ · Прототип для конкурса Astana Hub
                    </div>
                </div>
            </footer>
        </div>
    );
}
