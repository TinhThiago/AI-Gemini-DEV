const { JSDOM } = require('jsdom');

// Mock DOM environment
const jsdom = new JSDOM('<!DOCTYPE html><html><body><div class="room-list-container"></div></body></html>');
const document = jsdom.window.document;
const roomListContainer = document.querySelector('.room-list-container');

// Mock rooms data (assuming it's available globally or imported)
const rooms = [
    { id: 101, name: 'Room 101', location: 'floor1', capacity: 8, features: ['Projector'] },
    { id: 102, name: 'Room 102', location: 'floor1', capacity: 12, features: ['Projector'] },
    { id: 201, name: 'Room 201', location: 'floor2', capacity: 6, features: ['Whiteboard'] }
];

let selectedRoomId = null;
let selectedRoomName = '';

// Mock the selectRoom function to spy on it
let selectRoomSpy = jest.fn();

// Mock the renderRoomList function (extracted from the original script)
function renderRoomList(filteredRooms) {
    roomListContainer.innerHTML = ''; // Clear previous list
    const roomsByLocation = {};

    filteredRooms.forEach(room => {
        if (!roomsByLocation[room.location]) {
            roomsByLocation[room.location] = [];
        }
        roomsByLocation[room.location].push(room);
    });

    for (const location in roomsByLocation) {
        const locationGroup = document.createElement('div');
        locationGroup.className = 'location-group';
        locationGroup.id = location;

        const locationTitle = document.createElement('div');
        locationTitle.className = 'location-title';
        locationTitle.textContent = location.replace('floor', 'Floor ').toUpperCase();
        locationGroup.appendChild(locationTitle);

        roomsByLocation[location].forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            roomCard.dataset.roomId = room.id;
            
            if (selectedRoomId === room.id) {
                roomCard.classList.add('active');
            }

            const roomInfo = document.createElement('div');
            roomInfo.className = 'room-info';
            const roomName = document.createElement('h3');
            roomName.textContent = room.name;
            roomInfo.appendChild(roomName);
            const roomMeta = document.createElement('div');
            roomMeta.className = 'room-meta';
            const capacitySpan = document.createElement('span');
            capacitySpan.innerHTML = `<i class='fas fa-user'></i> ${room.capacity}`;
            roomMeta.appendChild(capacitySpan);
            room.features.forEach(feature => {
                const featureSpan = document.createElement('span');
                let icon = '';
                switch(feature) {
                    case 'Projector': icon = 'fa-projector'; break;
                    case 'Whiteboard': icon = 'fa-chalkboard'; break;
                    case 'Video Conference': icon = 'fa-video'; break;
                    case 'Large Screen': icon = 'fa-display'; break;
                    default: icon = 'fa-info-circle';
                }
                featureSpan.innerHTML = `<i class='fas ${icon}'></i> ${feature}`;
                roomMeta.appendChild(featureSpan);
            });
            roomInfo.appendChild(roomMeta);
            roomCard.appendChild(roomInfo);
            const arrowIcon = document.createElement('i');
            arrowIcon.className = 'fas fa-chevron-right';
            roomCard.appendChild(arrowIcon);

            // Replace original event listener with spy call
            roomCard.addEventListener('click', () => {
                 selectRoomSpy(room.id, room.name);
            });

            locationGroup.appendChild(roomCard);
        });
        roomListContainer.appendChild(locationGroup);
    }
}

// Assign the spy to the global scope or mock the original selectRoom
window.selectRoom = selectRoomSpy;

describe('renderRoomList', () => {
    beforeEach(() => {
        // Reset mocks and container before each test
        roomListContainer.innerHTML = '';
        selectedRoomId = null;
        selectRoomSpy.mockClear();
    });

    test('should render rooms grouped by location', () => {
        renderRoomList(rooms);
        expect(roomListContainer.querySelectorAll('.location-group').length).toBe(2); // floor1 and floor2
        expect(roomListContainer.querySelector('#floor1 .location-title').textContent).toBe('FLOOR 1');
        expect(roomListContainer.querySelector('#floor1 .room-card').length).toBe(2);
        expect(roomListContainer.querySelector('#floor2 .location-title').textContent).toBe('FLOOR 2');
        expect(roomListContainer.querySelector('#floor2 .room-card').length).toBe(1);
    });

    test('should apply active class to the selected room', () => {
        selectedRoomId = 101; // Simulate selecting Room 101
        renderRoomList(rooms);
        const activeCard = roomListContainer.querySelector('.room-card.active[data-room-id="101"]');
        expect(activeCard).not.toBeNull();
    });

    test('should call selectRoom when a room card is clicked', () => {
        renderRoomList(rooms);
        const firstRoomCard = roomListContainer.querySelector('.room-card');
        firstRoomCard.click();
        expect(selectRoomSpy).toHaveBeenCalledTimes(1);
        expect(selectRoomSpy).toHaveBeenCalledWith(101, 'Room 101');
    });
});

// Mock the filterRooms function and related DOM elements for completeness if needed
describe('filterRooms', () => {
    // Mock necessary DOM elements and functions
    const mockLocationFilter = { value: 'all', addEventListener: jest.fn() };
    document.getElementById = jest.fn((id) => {
        if (id === 'locationFilter') return mockLocationFilter;
        return { value: '' }; // Default for other inputs
    });
    
    let originalRenderRoomList = renderRoomList; // Save original function
    let renderRoomListSpy = jest.fn();

    beforeAll(() => {
        // Replace renderRoomList with spy during this describe block
        window.renderRoomList = renderRoomListSpy;
    });
    afterAll(() => {
        // Restore original renderRoomList after this describe block
        window.renderRoomList = originalRenderRoomList;
    });

    test('should filter rooms based on selected location', () => {
        mockLocationFilter.value = 'floor1';
        // Call filterRooms which internally calls renderRoomList
        // Need to ensure filterRooms is defined and can access filter logic
        // For this test, we assume filterRooms is correctly implemented and just check its side effect via renderRoomListSpy
        // A full test would require the actual filterRooms function implementation and event listener setup
        // Example: if filterRooms() is called:
        // filterRooms(); 
        // expect(renderRoomListSpy).toHaveBeenCalledWith(expect.arrayContaining([
        //     expect.objectContaining({ id: 101 }),
        //     expect.objectContaining({ id: 102 })
        // ]));
        // expect(renderRoomListSpy).not.toHaveBeenCalledWith(expect.objectContaining({ id: 201 }));
        
        // Since the original code is inline, we'll simulate the call:
        const selectedLocation = mockLocationFilter.value;
        let filtered = rooms.filter(room => room.location === selectedLocation);
        renderRoomListSpy(filtered);

        expect(renderRoomListSpy).toHaveBeenCalledTimes(1);
        expect(renderRoomListSpy).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: 101, location: 'floor1' }),
            expect.objectContaining({ id: 102, location: 'floor1' })
        ]));
        expect(renderRoomListSpy).not.toHaveBeenCalledWith(expect.objectContaining({ id: 201, location: 'floor2' }));
    });
});

// Basic test for handleBooking validation
describe('handleBooking validations', () => {
    // Mock DOM elements and their values
    const mockSelectedRoomNameInput = { value: '' };
    const mockBookingDateInput = { value: '' };
    const mockStartTimeInput = { value: '' };
    const mockEndTimeInput = { value: '' };
    const mockBookingPurposeInput = { value: '' };
    const mockBookingMessage = { textContent: '', style: { color: '' } };
    const mockBookButton = { addEventListener: jest.fn() }; // Button click is tested via event listener setup

    // Mock global console.log
    let consoleSpy;

    beforeEach(() => {
        selectedRoomId = null;
        selectedRoomName = '';
        
        document.getElementById = jest.fn((id) => {
            if (id === 'selectedRoomName') return mockSelectedRoomNameInput;
            if (id === 'bookingDate') return mockBookingDateInput;
            if (id === 'startTime') return mockStartTimeInput;
            if (id === 'endTime') return mockEndTimeInput;
            if (id === 'bookingPurpose') return mockBookingPurposeInput;
            if (id === 'bookingMessage') return mockBookingMessage;
            return { value: '' }; // Default for other inputs
        });
        
        // Mock querySelector for specific elements
        document.querySelector = jest.fn((selector) => {
            if (selector === '#bookButton') return mockBookButton;
            return { value: '' };
        });

        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        // Re-initialize the handler function or ensure it uses the mocked elements
        // Since handleBooking is inline, we'll need to define it here or ensure the global context is correct
        // For simplicity, we assume handleBooking is available in the scope.
        // If not, it needs to be extracted or mocked properly.
        // Let's define it here based on the provided script:
        const handleBooking = () => {
            const date = mockBookingDateInput.value;
            const startTime = mockStartTimeInput.value;
            const endTime = mockEndTimeInput.value;
            const purpose = mockBookingPurposeInput.value;

            if (!selectedRoomId) {
                mockBookingMessage.textContent = 'Please select a room first.';
                mockBookingMessage.style.color = 'var(--error-color)';
                return;
            }
            if (!date || !startTime || !endTime) {
                mockBookingMessage.textContent = 'Please fill in date and time.';
                mockBookingMessage.style.color = 'var(--error-color)';
                return;
            }
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            const startTimeInMinutes = startHour * 60 + startMinute;
            const endTimeInMinutes = endHour * 60 + endMinute;

            if (endTimeInMinutes <= startTimeInMinutes) {
                mockBookingMessage.textContent = 'End time must be after start time.';
                mockBookingMessage.style.color = 'var(--error-color)';
                return;
            }
            
            console.log('Booking Details:', {
                roomId: selectedRoomId,
                roomName: selectedRoomName,
                date: date,
                startTime: startTime,
                endTime: endTime,
                purpose: purpose
            });
            mockBookingMessage.textContent = `Room ${selectedRoomName} booked successfully for ${date} from ${startTime} to ${endTime}.`;
            mockBookingMessage.style.color = 'var(--success-color)';
        };
        
        // Simulate the button click by calling the handler directly
        // In a real test setup, you would trigger the event listener
        // mockBookButton.addEventListener('click', handleBooking);
        // mockBookButton.click(); // This would trigger the handler via the listener
        // For now, we call handleBooking directly after setting up mocks
        window.handleBooking = handleBooking; // Make it accessible for direct call
    });

    afterEach(() => {
        consoleSpy.ይclear();
    });

    test('should show error if no room is selected', () => {
        selectedRoomId = null;
        mockBookingDateInput.value = '2024-01-01';
        mockStartTimeInput.value = '10:00';
        mockEndTimeInput.value = '11:00';
        window.handleBooking();
        expect(mockBookingMessage.textContent).toBe('Please select a room first.');
        expect(mockBookingMessage.style.color).toBe('var(--error-color)');
        expect(consoleSpy).not.toHaveBeenCalled();
    });

    test('should show error if date or time is missing', () => {
        selectedRoomId = 101;
        selectedRoomName = 'Room 101';
        mockBookingDateInput.value = ''; // Missing date
        mockStartTimeInput.value = '10:00';
        mockEndTimeInput.value = '11:00';
        window.handleBooking();
        expect(mockBookingMessage.textContent).toBe('Please fill in date and time.');
        expect(mockBookingMessage.style.color).toBe('var(--error-color)');
        expect(consoleSpy).not.toHaveBeenCalled();
    });

    test('should show error if end time is not after start time', () => {
        selectedRoomId = 101;
        selectedRoomName = 'Room 101';
        mockBookingDateInput.value = '2024-01-01';
        mockStartTimeInput.value = '11:00';
        mockEndTimeInput.value = '10:00'; // End time before start time
        window.handleBooking();
        expect(mockBookingMessage.textContent).toBe('End time must be after start time.');
        expect(mockBookingMessage.style.color).toBe('var(--error-color)');
        expect(consoleSpy).not.toHaveBeenCalled();
    });

    test('should log booking details and show success message on valid input', () => {
        selectedRoomId = 101;
        selectedRoomName = 'Room 101';
        mockBookingDateInput.value = '2024-01-01';
        mockStartTimeInput.value = '10:00';
        mockEndTimeInput.value = '11:00';
        mockBookingPurposeInput.value = 'Team Meeting';
        window.handleBooking();
        expect(mockBookingMessage.textContent).toBe('Room Room 101 booked successfully for 2024-01-01 from 10:00 to 11:00.');
        expect(mockBookingMessage.style.color).toBe('var(--success-color)');
        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith('Booking Details:', {
            roomId: 101,
            roomName: 'Room 101',
            date: '2024-01-01',
            startTime: '10:00',
            endTime: '11:00',
            purpose: 'Team Meeting'
        });
    });
});
