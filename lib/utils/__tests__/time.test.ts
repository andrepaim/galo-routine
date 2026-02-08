import { formatTimeDisplay, formatTimeRange, compareTimeStrings } from '../time';

describe('time utilities', () => {
  describe('formatTimeDisplay', () => {
    it('should format midnight as 12:00 AM', () => {
      expect(formatTimeDisplay('00:00')).toBe('12:00 AM');
    });

    it('should format noon as 12:00 PM', () => {
      expect(formatTimeDisplay('12:00')).toBe('12:00 PM');
    });

    it('should format morning time correctly', () => {
      expect(formatTimeDisplay('07:30')).toBe('7:30 AM');
    });

    it('should format afternoon time correctly', () => {
      expect(formatTimeDisplay('15:45')).toBe('3:45 PM');
    });

    it('should format 1 AM correctly', () => {
      expect(formatTimeDisplay('01:00')).toBe('1:00 AM');
    });

    it('should format 11 AM correctly', () => {
      expect(formatTimeDisplay('11:59')).toBe('11:59 AM');
    });

    it('should format 1 PM correctly', () => {
      expect(formatTimeDisplay('13:00')).toBe('1:00 PM');
    });

    it('should format 11 PM correctly', () => {
      expect(formatTimeDisplay('23:59')).toBe('11:59 PM');
    });
  });

  describe('formatTimeRange', () => {
    it('should return undefined when no start time is provided', () => {
      expect(formatTimeRange()).toBeUndefined();
    });

    it('should return undefined when start time is undefined', () => {
      expect(formatTimeRange(undefined)).toBeUndefined();
    });

    it('should return only start time when no end time is provided', () => {
      expect(formatTimeRange('07:00')).toBe('7:00 AM');
    });

    it('should return full range when both times are provided', () => {
      expect(formatTimeRange('07:00', '07:30')).toBe('7:00 AM - 7:30 AM');
    });

    it('should handle PM range', () => {
      expect(formatTimeRange('14:00', '16:30')).toBe('2:00 PM - 4:30 PM');
    });

    it('should handle cross-meridiem range', () => {
      expect(formatTimeRange('11:00', '13:00')).toBe('11:00 AM - 1:00 PM');
    });
  });

  describe('compareTimeStrings', () => {
    it('should return 0 when both are undefined', () => {
      expect(compareTimeStrings(undefined, undefined)).toBe(0);
    });

    it('should sort undefined after defined values', () => {
      expect(compareTimeStrings(undefined, '07:00')).toBe(1);
    });

    it('should sort defined values before undefined', () => {
      expect(compareTimeStrings('07:00', undefined)).toBe(-1);
    });

    it('should compare equal times as 0', () => {
      expect(compareTimeStrings('07:00', '07:00')).toBe(0);
    });

    it('should compare earlier time as less than later time', () => {
      expect(compareTimeStrings('07:00', '15:00')).toBeLessThan(0);
    });

    it('should compare later time as greater than earlier time', () => {
      expect(compareTimeStrings('15:00', '07:00')).toBeGreaterThan(0);
    });

    it('should compare times within the same hour correctly', () => {
      expect(compareTimeStrings('07:15', '07:45')).toBeLessThan(0);
    });
  });
});
