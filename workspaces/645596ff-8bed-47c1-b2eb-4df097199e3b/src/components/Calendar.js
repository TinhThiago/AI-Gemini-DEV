import { formatDateForInput } from '../components/Calendar'; // Giả định đường dẫn

describe('formatDateForInput', () => {
  test('should format a date object correctly', () => {
    const date = new Date('2023-10-27T14:30:00Z'); // Sử dụng múi giờ UTC để đảm bảo tính nhất quán
    expect(formatDateForInput(date)).toBe('2023-10-27T14:30');
  });

  test('should format date with single digit month and day correctly', () => {
    const date = new Date('2024-01-05T09:05:00Z');
    expect(formatDateForInput(date)).toBe('2024-01-05T09:05');
  });

  test('should handle midnight correctly', () => {
    const date = new Date('2023-11-10T00:00:00Z');
    expect(formatDateForInput(date)).toBe('2023-11-10T00:00');
  });

   test('should handle date change to next day correctly', () => {
    const date = new Date('2023-10-27T23:59:00Z');
    expect(formatDateForInput(date)).toBe('2023-10-27T23:59');
  });
});
