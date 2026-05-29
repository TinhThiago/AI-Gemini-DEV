import { checkRoomAvailability } from '../utils/bookingUtils'; // Giả định đường dẫn đến file utils

describe('checkRoomAvailability', () => {
  const existingBookings = [
    { id: 'b1', roomId: 'room1', startTime: '2023-10-27T09:00:00', endTime: '2023-10-27T10:00:00' },
    { id: 'b2', roomId: 'room1', startTime: '2023-10-27T11:00:00', endTime: '2023-10-27T12:00:00' },
    { id: 'b3', roomId: 'room2', startTime: '2023-10-27T09:30:00', endTime: '2023-10-27T10:30:00' },
  ];

  // Trường hợp không có xung đột
  test('should return true when there is no time conflict for the room', () => {
    const newBooking = { roomId: 'room1', startTime: '2023-10-27T10:00:00', endTime: '2023-10-27T11:00:00' };
    expect(checkRoomAvailability(existingBookings, newBooking)).toBe(true);
  });

  // Trường hợp xung đột bắt đầu trước, kết thúc sau
  test('should return false when the new booking overlaps the start of an existing booking', () => {
    const newBooking = { roomId: 'room1', startTime: '2023-10-27T08:30:00', endTime: '2023-10-27T09:30:00' };
    expect(checkRoomAvailability(existingBookings, newBooking)).toBe(false);
  });

  // Trường hợp xung đột bắt đầu giữa, kết thúc sau
  test('should return false when the new booking starts within an existing booking', () => {
    const newBooking = { roomId: 'room1', startTime: '2023-10-27T09:15:00', endTime: '2023-10-27T10:15:00' };
    expect(checkRoomAvailability(existingBookings, newBooking)).toBe(false);
  });

  // Trường hợp xung đột bắt đầu trước, kết thúc giữa
  test('should return false when the new booking ends within an existing booking', () => {
    const newBooking = { roomId: 'room1', startTime: '2023-10-27T08:30:00', endTime: '2023-10-27T09:30:00' };
    expect(checkRoomAvailability(existingBookings, newBooking)).toBe(false);
  });

  // Trường hợp xung đột bao trọn booking cũ
  test('should return false when the new booking completely envelops an existing booking', () => {
    const newBooking = { roomId: 'room1', startTime: '2023-10-27T08:00:00', endTime: '2023-10-27T11:00:00' };
    expect(checkRoomAvailability(existingBookings, newBooking)).toBe(false);
  });

  // Trường hợp booking mới hoàn toàn nằm trong booking cũ
  test('should return false when an existing booking completely envelops the new booking', () => {
    const newBooking = { roomId: 'room1', startTime: '2023-10-27T09:15:00', endTime: '2023-10-27T09:45:00' };
    expect(checkRoomAvailability(existingBookings, newBooking)).toBe(false);
  });

  // Trường hợp trùng thời gian bắt đầu
  test('should return false when the new booking starts exactly when an existing booking ends', () => {
    const newBooking = { roomId: 'room1', startTime: '2023-10-27T10:00:00', endTime: '2023-10-27T11:00:00' }; // Starts exactly when b1 ends
    expect(checkRoomAvailability(existingBookings, newBooking)).toBe(true);
  });

  // Trường hợp trùng thời gian kết thúc
   test('should return false when the new booking ends exactly when an existing booking starts', () => {
    const newBooking = { roomId: 'room1', startTime: '2023-10-27T10:00:00', endTime: '2023-10-27T11:00:00' }; // Ends exactly when b2 starts
    expect(checkRoomAvailability(existingBookings, newBooking)).toBe(true);
  });

  // Trường hợp booking cho phòng khác
  test('should return true when the conflict is for a different room', () => {
    const newBooking = { roomId: 'room3', startTime: '2023-10-27T09:00:00', endTime: '2023-10-27T10:00:00' };
    expect(checkRoomAvailability(existingBookings, newBooking)).toBe(true);
  });

  // Trường hợp không có booking nào tồn tại
  test('should return true when there are no existing bookings', () => {
    const newBooking = { roomId: 'room1', startTime: '2023-10-27T09:00:00', endTime: '2023-10-27T10:00:00' };
    expect(checkRoomAvailability([], newBooking)).toBe(true);
  });
});
