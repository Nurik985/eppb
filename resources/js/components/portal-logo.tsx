import { Sprout } from 'lucide-react';

type PortalLogoProps = {
    withText?: boolean;
    subtitle?: boolean;
};

/**
 * Логотип портала ЕППБ. Росток — отсылка к тополю «Байтерек».
 */
export default function PortalLogo({ withText = true, subtitle = true }: PortalLogoProps) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Sprout className="size-5" />
            </div>
            {withText && (
                <div className="grid leading-tight">
                    <span className="text-[15px] font-bold tracking-tight text-foreground">ЕППБ</span>
                    {subtitle && (
                        <span className="text-[11px] text-muted-foreground">Единый портал поддержки бизнеса</span>
                    )}
                </div>
            )}
        </div>
    );
}
