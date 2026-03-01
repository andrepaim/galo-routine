import { describe, it, expect } from 'vitest';
import { formatTimeDisplay, formatTimeRange, compareTimeStrings } from '../../lib/utils/time';

describe('formatTimeDisplay', () => {
  it('formats morning time', () => {
    expect(formatTimeDisplay('07:30')).toBe('7:30 AM');
  });

  it('formats afternoon time', () => {
    expect(formatTimeDisplay('14:00')).toBe('2:00 PM');
  });

  it('formats noon', () => {
    expect(formatTimeDisplay('12:00')).toBe('12:00 PM');
  });

  it('formats midnight', () => {
    expect(formatTimeDisplay('00:00')).toBe('12:00 AM');
  });

  it('formats 1 PM', () => {
    expect(formatTimeDisplay('13:15')).toBe('1:15 PM');
  });

  it('formats 11 AM', () => {
    expect(formatTimeDisplay('11:59')).toBe('11:59 AM');
  });
});

describe('formatTimeRange', () => {
  it('returns undefined if no start time', () => {
    expect(formatTimeRange()).toBeUndefined();
    expect(formatTimeRange(undefined, '08:00')).toBeUndefined();
  });

  it('returns just start if no end time', () => {
    expect(formatTimeRange('07:00')).toBe('7:00 AM');
  });

  it('returns full range', () => {
    expect(formatTimeRange('07:00', '08:30')).toBe('7:00 AM - 8:30 AM');
  });

  it('handles cross AM/PM range', () => {
    expect(formatTimeRange('11:00', '13:00')).toBe('11:00 AM - 1:00 PM');
  });
});

describe('compareTimeStrings', () => {
  it('sorts earlier time first', () => {
    expect(compareTimeStrings('07:00', '08:00')).toBeLessThan(0);
  });

  it('sorts later time second', () => {
    expect(compareTimeStrings('14:00', '08:00')).toBeGreaterThan(0);
  });

  it('equal times return 0', () => {
    expect(compareTimeStrings('07:00', '07:00')).toBe(0);
  });

  it('undefined values sort last', () => {
    expect(compareTimeStrings(undefined, '08:00')).toBe(1);
    expect(compareTimeStrings('08:00', undefined)).toBe(-1);
  });

  it('both undefined returns 0', () => {
    expect(compareTimeStrings(undefined, undefined)).toBe(0);
  });
});
