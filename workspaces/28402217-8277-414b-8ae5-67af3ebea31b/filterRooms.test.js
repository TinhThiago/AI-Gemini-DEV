import { JSDOM } from 'jsdom';

// Mock the HTML structure and necessary elements
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Meeting Room Booking</title>
    <style>
        .room-card { display: block; }
        .no-results { display: none; }
    </style>
</head>
<body>
    <div class="left-panel">
        <div class="filter-section">
            <input type="date" id="booking-date" value="2023-10-27">
            <input type="time" id="booking-time" value="10:00">
        </div>
        <div class="room-list-container">
            </div>
    </div>
    <div class="right-panel">
        <div id="selected-room-info">Please select a room...</div>
        <form id="booking-form">
            <input type="text" id="booking-room-name" readonly>
            <input type="text" id="booking-guest-name" required>
            <input type="datetime-local" id="booking-start-time" required>
            <input type="datetime-local" id="booking-end-time" required>
            <button type="button" onclick="submitBooking()">Book Now</button>
        </form>
    </div>
    <script>
        // Mock room data
        const rooms = [
            { id: '101', name: 'Room 101', location: 'Floor 1', capacity: 8, features: ['Projector'] },
            { id: '102', name: 'Room 102', location: 'Floor 1', capacity: 12, features: ['Whiteboard'] }
        ];
        
        // Mock selectRoom function to avoid errors during filter test
        function selectRoom(roomId) { 
            document.getElementById('booking-room-name').value = `Room ${roomId}`;
            document.getElementById('selected-room-info').innerText = `Selected Room: ${roomId}`;
            document.querySelectorAll('.room-card').forEach(card => card.classList.remove('active'));
            const element = document.querySelector(`.room-card[data-room-id='${roomId}']`);
            if(element) element.classList.add('active');
        }
        
        // Mock submitBooking function
        function submitBooking() { /* no-op */ }

        function filterRooms() {
            const selectedDate = document.getElementById('booking-date').value;
            const selectedTime = document.getElementById('booking-time').value;
            const roomListContainer = document.querySelector('.room-list-container');
            roomListContainer.innerHTML = ''; // Clear current list
            
            let foundRooms = false;
            if (selectedDate && selectedTime) {
                // Dummy filtering logic for test: assume rooms are available if date/time is set
                rooms.forEach(room => {
                    const roomElement = document.createElement('div');
                    roomElement.classList.add('room-card');
                    roomElement.setAttribute('data-room-id', room.id);
                    roomElement.onclick = () => selectRoom(room.id);
                    roomElement.innerHTML = `
                        <div class="room-info">
                            <h3>${room.name}</h3>
                            <div class="room-meta">
                                <span>Capacity: ${room.capacity}</span>
                                <span>${room.features.join(', ')}</span>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right"></i>
                    `;
                    roomListContainer.appendChild(roomElement);
                    foundRooms = true;
                });
            }

            if (!foundRooms) {
                roomListContainer.innerHTML = '<p class="no-results">No rooms available for the selected criteria.</p>';
            }
            
            document.getElementById('booking-room-name').value = '';
            document.getElementById('selected-room-info').innerHTML = 'Please select a room from the list.';
            document.querySelectorAll('.room-card').forEach(card => card.classList.remove('active'));
        }
        
        // Mock DOMContentLoaded event for initial setup
        document.addEventListener('DOMContentLoaded', () => {
             document.querySelectorAll('.room-card').forEach(card => {
                card.addEventListener('click', (event) => {
                    const roomId = event.currentTarget.getAttribute('data-room-id');
                    selectRoom(roomId);
                });
            });
            filterRooms(); 
        });
    </script>
</body>
</html>
"; 

    const dom = new JSDOM(html);
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.Date = dom.window.Date; // Use the mocked Date
    
    // Inject the filterRooms and selectRoom functions into the global scope for testing
    const scriptContent = dom.window.document.querySelector('script').textContent;
    const scriptEvaluated = new Function('rooms', 'selectRoom', 'submitBooking', scriptContent);
    scriptEvaluated(rooms, selectRoom, submitBooking);

    describe('Filter Rooms Functionality', () => {
        
        it('should display available rooms when date and time are selected', () => {
            const filterButton = document.querySelector('.filter-section button');
            
            // Simulate clicking the filter button
            filterButton.click();

            const roomListContainer = document.querySelector('.room-list-container');
            expect(roomListContainer.querySelectorAll('.room-card').length).toBe(rooms.length);
            expect(roomListContainer.querySelector('.no-results')).toBeNull();
        });

        it('should display "No rooms available" message when no date/time is selected (or if filtering logic returned no rooms)', () => {
            // Set date/time to be empty or simulate a condition where no rooms are found
            document.getElementById('booking-date').value = '';
            document.getElementById('booking-time').value = '';
            const filterButton = document.querySelector('.filter-section button');
            filterButton.click();

            const roomListContainer = document.querySelector('.room-list-container');
            expect(roomListContainer.querySelector('.no-results')).not.toBeNull();
            expect(roomListContainer.querySelectorAll('.room-card').length).toBe(0);
        });

        it('should update room selection when a room card is clicked after filtering', () => {
            // Ensure rooms are displayed first
            document.getElementById('booking-date').value = '2023-10-27';
            document.getElementById('booking-time').value = '10:00';
            const filterButton = document.querySelector('.filter-section button');
            filterButton.click();

            // Click the first room card
            const firstRoomCard = document.querySelector('.room-card');
            firstRoomCard.click();
            
            expect(document.getElementById('booking-room-name').value).toBe('Room 101 (Floor 1)'); // Assuming selectRoom sets this
            expect(document.getElementById('selected-room-info').innerText).toBe('Selected Room: 101'); // Assuming selectRoom sets this
            expect(firstRoomCard.classList.contains('active')).toBe(true);
        });
    });
