/** Convert a 0–100 app score to an approximate IELTS band (4–9). */
export function toBand(score: number): string {
    if (score >= 90) return '9';
    if (score >= 83) return '8.5';
    if (score >= 76) return '8';
    if (score >= 69) return '7.5';
    if (score >= 62) return '7';
    if (score >= 55) return '6.5';
    if (score >= 48) return '6';
    if (score >= 41) return '5.5';
    if (score >= 34) return '5';
    if (score >= 27) return '4.5';
    return '4';
}
