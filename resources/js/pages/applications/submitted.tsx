import PortalLogo from '@/components/portal-logo';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Copy, FileText, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

type SubmittedProps = {
    application: {
        number: string;
        status: string;
        submitted_at: string | null;
        service: { slug: string; title: string };
        next_step: string;
    };
};

export default function Submitted({ application }: SubmittedProps) {
    const [copied, setCopied] = useState(false);

    const copyNumber = () => {
        navigator.clipboard?.writeText(application.number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex min-h-screen flex-col bg-muted/30">
            <Head title="Заявка отправлена" />

            <header className="border-b border-border/70 bg-background">
                <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-4 sm:px-6">
                    <Link href="/">
                        <PortalLogo subtitle={false} />
                    </Link>
                </div>
            </header>

            <main className="flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="size-9 text-primary" />
                    </div>
                    <h1 className="mt-6 text-2xl font-bold text-foreground">Заявка отправлена</h1>
                    <p className="mt-2 text-muted-foreground">
                        Заявка на услугу «{application.service.title}» принята порталом.
                    </p>

                    <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Номер заявки</p>
                                <p className="mt-0.5 text-lg font-bold text-foreground">{application.number}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={copyNumber}>
                                <Copy className="size-4" />
                                {copied ? 'Скопировано' : 'Копировать'}
                            </Button>
                        </div>

                        <div className="mt-4 border-t border-border/70 pt-4">
                            <p className="text-xs text-muted-foreground">Что дальше</p>
                            <p className="mt-1 text-sm text-foreground">{application.next_step}</p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button asChild size="lg">
                            <Link href={dashboard()}>
                                <LayoutDashboard className="size-4" />
                                В личный кабинет
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href="/catalog">
                                <FileText className="size-4" />
                                В каталог услуг
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
