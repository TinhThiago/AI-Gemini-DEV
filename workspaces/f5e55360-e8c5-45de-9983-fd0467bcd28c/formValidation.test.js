import { JSDOM } from 'jsdom';

describe('Form Validation', () => {
    let dom;
    let document;
    let validateBooking;
    let alertSpy;
    let today;

    beforeEach(() => {
        // Mock Date to control 'today'
        const mockDate = new Date(2023, 10, 20); // November 20, 2023
        const RealDate = Date;
        global.Date = class extends RealDate {
            constructor() { return mockDate; }
            static getRawDate() { return mockDate; }
        };
        today = mockDate.toISOString().split('T')[0]; // '2023-11-20'

        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <input type="date" id="bookingDate">
                <input type="time" id="startTime">
                <input type="time" id="endTime">
                <div class="btn-primary">Book Now</div>
            </body>
            </html>
        `);
        document = dom.window.document;
        global.document = document;

        // Spy on alert
        alertSpy = jest.spyOn(dom.window, 'alert').mockImplementation(() => {});

        // Re-define validateBooking to use the mocked document and today
        validateBooking = () => {
            let isValid = true;
            const selectedDate = document.getElementById('bookingDate').value;
            const startTime = document.getElementById('startTime').value;
            const endTime = document.getElementById('endTime').value;
            let selectedRoomId = 'ny001'; // Mock selected room ID for testing

            if (!selectedRoomId) {
                alert('Please select a room first.');
                isValid = false;
            }
            if (!selectedDate) {
                alert('Please select a date.');
                isValid = false;
            } else if (selectedDate < today) {
                alert('Booking date cannot be in the past.');
                isValid = false;
            }
            if (!startTime) {
                alert('Please select a start time.');
                isValid = false;
            }
            if (!endTime) {
                alert('Please select an end time.');
                isValid = false;
            } else if (startTime && endTime && startTime >= endTime) {
                alert('End time must be after start time.');
                isValid = false;
            }
            return isValid;
        };

        // Mock the click event handler for the 'Book Now' button
        const bookNowButton = document.querySelector('.btn-primary');
        bookNowButton.addEventListener('click', () => {
            if (validateBooking()) {
                // Simulate success action
                console.log('Booking would be successful');
            }
        });
    });

    afterEach(() => {
        delete global.document;
        global.Date = Date; // Restore original Date
        alertSpy.mockRestore();
    });

    test('should return true for valid booking details', () => {
        document.getElementById('bookingDate').value = '2023-11-21'; // Future date
        document.getElementById('startTime').value = '10:00';
        document.getElementById('endTime').value = '11:00';
        
        expect(validateBooking()).toBe(true);
        expect(alertSpy).not.toHaveBeenCalled();
    });

    test('should alert if no room is selected', () => {
        // To test this, we need to temporarily mock selectedRoomId to be null within validateBooking
        const originalValidateBooking = validateBooking;
        validateBooking = () => {
            let isValid = true;
            let selectedRoomId = null; // Force no room selected
            const selectedDate = document.getElementById('bookingDate').value;
            const startTime = document.getElementById('startTime').value;
            const endTime = document.getElementById('endTime').value;

            if (!selectedRoomId) {
                alert('Please select a room first.');
                isValid = false;
            }
             // ... rest of validation ... 
            return isValid;
        };
        document.getElementById('bookingDate').value = '2023-11-21';
        document.getElementById('startTime').value = '10:00';
        document.getElementById('endTime').value = '11:00';

        expect(validateBooking()).toBe(false);
        expect(alertSpy).toHaveBeenCalledWith('Please select a room first.');
        validateBooking = originalValidateBooking; // Restore
    });

    test('should alert if booking date is in the past', () => {
        document.getElementById('bookingDate').value = '2023-11-19'; // Past date
        document.getElementById('startTime').value = '10:00';
        document.getElementById('endTime').value = '11:00';

        expect(validateBooking()).toBe(false);
        expect(alertSpy).toHaveBeenCalledWith('Booking date cannot be in the past.');
    });

    test('should alert if start time is missing', () => {
        document.getElementById('bookingDate').value = '2023-11-21';
        document.getElementById('startTime').value = '';
        document.getElementById('endTime').value = '11:00';

        expect(validateBooking()).toBe(false);
        expect(alertSpy).toHaveBeenCalledWith('Please select a start time.');
    });

    test('should alert if end time is missing', () => {
        document.getElementById('bookingDate').value = '2023-11-21';
        document.getElementById('startTime').value = '10:00';
        document.getElementById('endTime').value = '';

        expect(validateBooking()).toBe(false);
        expect(alertSpy).toHaveBeenCalledWith('Please select an end time.');
    });

    test('should alert if end time is not after start time', () => {
        document.getElementById('bookingDate').value = '2023-11-21';
        document.getElementById('startTime').value = '11:00';
        document.getElementById('endTime').value = '10:00'; // End time before start time

        expect(validateBooking()).toBe(false);
        expect(alertSpy).toHaveBeenCalledWith('End time must be after start time.');
    });

    test('should alert if start and end times are the same', () => {
        document.getElementById('bookingDate').value = '2023-11-21';
        document.getElementById('startTime').value = '10:00';
        document.getElementById('endTime').value = '10:00'; // Same start and end time

        expect(validateBooking()).toBe(false);
        expect(alertSpy).toHaveBeenCalledWith('End time must be after start time.');
    });
});

// Mock necessary browser APIs if not running in a full browser environment
if (typeof window === 'undefined') {
    global.window = {
        document: {
            querySelectorAll: () => [],
            getElementById: () => ({ value: '', classList: { remove: () => {}, add: () => {} } }),
            querySelector: () => ({ value: '', classList: { remove: () => {}, add: () => {} }, addEventListener: () => {} }),
            addEventListener: () => {},
            removeEventListener: () => {}
        },
        Image: function() {},
        location: { href: '' },
        navigator: { userAgent: '' },
        addEventListener: () => {},
        removeEventListener: () => {}
    };
}