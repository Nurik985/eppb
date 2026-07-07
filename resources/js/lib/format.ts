/** Формат суммы в тенге с сокращением до млрд/млн для крупных значений. */
export function formatMoney(value: number): string {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млрд ₸`;
    }
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₸`;
    }
    return `${value.toLocaleString('ru-RU')} ₸`;
}

/** Полный формат суммы в тенге (для точных значений в формах/заявках). */
export function formatTenge(value: number): string {
    return `${Math.round(value).toLocaleString('ru-RU')} ₸`;
}

/** Склонение существительного по числу: plural(3, 'услуга','услуги','услуг'). */
export function plural(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}
