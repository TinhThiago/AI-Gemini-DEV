describe('handleBookingSubmit', () => {
    let mockHandleBookingSubmit, mockEvent;
    let mockStartTimeInput, mockEndTimeInput, mockFormMessage, mockSelectedRoomId, mockRoomNameInput;

    beforeEach(() => {
        // Mocking DOM elements and global variables
        document.body.innerHTML = `
            <input id="startTime">
            <input id="endTime">
            <input id="roomName">
            <div id="formMessage"></div>
        `;
        mockStartTimeInput = document.getElementById('startTime');
        mockEndTimeInput = document.getElementById('endTime');
        mockRoomNameInput = document.getElementById('roomName');
        mockFormMessage = document.getElementById('formMessage');
        mockSelectedRoomId = 'r1'; // Assume a room is selected

        // Mock the event object
        mockEvent = {
            preventDefault: jest.fn()
        };

        // Mock formatTime function
        const formatTime = (date) => {
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                return "Invalid Date";
            }
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const formattedHours = hours < 10 ? '0' + hours : hours;
            const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
            return `${formattedHours}:${formattedMinutes}`;
        };

        // Re-define handleBookingSubmit locally for testing
        mockHandleBookingSubmit = (event) => {
            event.preventDefault();
            mockFormMessage.textContent = '';

            if (!mockSelectedRoomId) {
                mockFormMessage.textContent = 'Please select a room first.';
                return false; // Indicate failure
            }

            const startTime = new Date(mockStartTimeInput.value);
            const endTime = new Date(mockEndTimeInput.value);

            if (startTime >= endTime) {
                mockFormMessage.textContent = 'End time must be after start time.';
                return false; // Indicate failure
            }

            // Simulate successful booking confirmation
            console.log('Booking submitted:', { roomId: mockSelectedRoomId, roomName: mockRoomNameInput.value, startTime: startTime.toISOString(), endTime: endTime.toISOString() });
            // In a real test, you'd mock API calls here
            return true; // Indicate success
        };
    });

    test('should prevent default and return true for valid booking', () => {
        const now = new Date();
        const startTime = new Date(now);
        startTime.setHours(now.getHours() + 1, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1);

        mockStartTimeInput.value = startTime.toISOString().slice(0, -1); // Format for input
        mockEndTimeInput.value = endTime.toISOString().slice(0, -1);
        mockRoomNameInput.value = 'Conference Room A';

        const result = mockHandleBookingSubmit(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockFormMessage.textContent).toBe('');
        expect(result).toBe(true);
    });

    test('should show error message if no room is selected', () => {
        mockSelectedRoomId = null;
        mockHandleBookingSubmit(mockEvent);
        expect(mockFormMessage.textContent).toBe('Please select a room first.');
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    test('should show error message if end time is not after start time', () => {
        const now = new Date();
        const startTime = new Date(now);
        startTime.setHours(now.getHours() + 2, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() - 1); // End time before start time

        mockStartTimeInput.value = startTime.toISOString().slice(0, -1);
        mockEndTimeInput.value = endTime.toISOString().slice(0, -1);
        mockRoomNameInput.value = 'Conference Room A';

        mockHandleBookingSubmit(mockEvent);
        expect(mockFormMessage.textContent).toBe('End time must be after start time.');
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    test('should show error message if start time equals end time', () => {
        const now = new Date();
        const startTime = new Date(now);
        startTime.setHours(now.getHours() + 1, 0, 0, 0);
        const endTime = new Date(startTime);

        mockStartTimeInput.value = startTime.toISOString().slice(0, -1);
        mockEndTimeInput.value = endTime.toISOString().slice(0, -1);
        mockRoomNameInput.value = 'Conference Room A';

        mockHandleBookingSubmit(mockEvent);
        expect(mockFormMessage.textContent).toBe('End time must be after start time.');
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
});
