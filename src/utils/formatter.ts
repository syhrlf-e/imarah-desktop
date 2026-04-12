/**
 * Format number to Indonesian Rupiah currency string.
 * Example: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number): string {
    if (isNaN(amount) || amount < 0) return "Rp 0";

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })
        .format(amount)
        .replace(/\u00A0/g, " ");
}

/**
 * Parsed numeric string valid for database.
 * Removes non-numeric characters.
 */
export function parseRupiah(value: string): number {
    return parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
}
