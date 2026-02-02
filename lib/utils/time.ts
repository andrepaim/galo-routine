/**
 * Format "HH:mm" string to "h:mm AM/PM" display format.
 */
export function formatTimeDisplay(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

/**
 * Format a start/end time range for display.
 * Returns "7:00 AM - 7:30 AM" or just "7:00 AM" if only start is provided.
 */
export function formatTimeRange(startTime?: string, endTime?: string): string | undefined {
  if (!startTime) return undefined;
  const start = formatTimeDisplay(startTime);
  if (!endTime) return start;
  return `${start} - ${formatTimeDisplay(endTime)}`;
}

/**
 * Compare two "HH:mm" time strings for sorting.
 * undefined values sort last.
 */
export function compareTimeStrings(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}
