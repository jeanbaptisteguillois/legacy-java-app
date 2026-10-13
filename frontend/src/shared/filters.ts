/**
 * Ports of the two AngularJS filters the templates used, so the rendered text
 * is byte-identical to the legacy app.
 *
 *   {{ value | currency }}        -> en-US `$1,234.50`
 *   {{ value | date:'short' }}    -> en-US `M/d/yy h:mm a`, e.g. `3/5/24 1:45 PM`
 */

/** AngularJS `currency` filter with the default en-US symbol and 2 fraction digits. */
export function currency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numeric)) return '';
  const formatted = Math.abs(numeric).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return numeric < 0 ? `-$${formatted}` : `$${formatted}`;
}

function twoDigitYear(year: number): string {
  return String(year % 100).padStart(2, '0');
}

/** AngularJS `date:'short'` filter (en-US medium-short pattern `M/d/yy h:mm a`). */
export function dateShort(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';

  const hours24 = date.getHours();
  const meridiem = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return (
    `${date.getMonth() + 1}/${date.getDate()}/${twoDigitYear(date.getFullYear())} ` +
    `${hours12}:${minutes} ${meridiem}`
  );
}
