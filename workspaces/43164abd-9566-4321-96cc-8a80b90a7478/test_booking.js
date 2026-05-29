/**
 * @jest-environment jsdom
 */

// Mock the entire HTML document content before importing the script
const mockHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Room Booking Test</title>
    <style>
        .room-card { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e0e0e0; margin-bottom: 8px; cursor: pointer; }
        .room-card.active { background-color: #eaf6f9; border-color: #3492ab; }
        .room-info h3 { font-size: 1rem; margin-bottom: 4px; }
        .room-meta { font-size: 0.8rem; color: #666666; display: flex; gap: 10px; }
        .booking-form-card { padding: 15px 20px; }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        .form-group input[type="text"],
        .form-group input[type="datetime-local"],
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-family: inherit;
            font-size: 0.9rem;
        }
        .form-actions {
            text-align: right;
            margin-top: 20px;
        }
        .btn {
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 500;
        }
        .btn-primary {
            background-color: #3492ab;
            color: white;
        }
        .btn-secondary {
            background-color: #666666;
            color: white;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <header><h1>Meeting Room Booking</h1></header>
    <div class="container">
        <aside class="left-panel">
            <div class="panel-header">Locations</div>
            <div class="filter-section">
                <select id="locationFilter" class="filter-select">
                    <option value="all">All Locations</option>
                    <option value="newyork">New York</option>
                    <option value="london">London</option>
                </select>
            </div>
            <div class="room-list-container" id="roomListContainer">
            </div>
        </aside>
        <main class="right-panel">
            <div class="booking-form-card">
                <div class="panel-header">Book a Meeting Room</div>
                <form id="bookingForm">
                    <div class="form-group">
                        <label for="meetingRoomName">Meeting Room</label>
                        <input type="text" id="meetingRoomName" name="meetingRoomName" readonly>
                    </div>
                    <div class="form-group">
                        <label for="bookingDate">Date & Time</label>
                        <input type="datetime-local" id="bookingDate" name="bookingDate" required>
                    </div>
                    <div class="form-group">
                        <label for="duration">Duration (hours)</label>
                        <input type="number" id="duration" name="duration" value="1" min="1" max="8" required>
                    </div>
                    <div class="form-group">
                        <label for="organizerName">Your Name</label>
                        <input type="text" id="organizerName" name="organizerName" required>
                    </div>
                    <div class="form-group">
                        <label for="purpose">Purpose of Meeting</label>
                        <textarea id="purpose" name="purpose" required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Book Now</button>
                        <button type="button" class="btn btn-secondary" onclick="resetForm()">Cancel</button>
                    </div>
                </form>
            </div>
        </main>
    </div>
    <script>
        // Inject script content here or load from file.
        // For testing, we assume the script is available globally or imported.
    </script>
</body>
</html>
`;

document.body.innerHTML = mockHtml;

// --- Mock Data and Functions (as they would be in the HTML file) ---
const meetingRooms = [
    { id: 'room101', name: 'Conference Room A', location: 'New York', capacity: 10, amenities: ['Projector', 'Whiteboard'] },
    { id: 'room102', name: 'Huddle Room B', location: 'New York', capacity: 4, amenities: ['TV', 'Phone'] },
    { id: 'room201', name: 'Boardroom C', location: 'London', capacity: 20, amenities: ['Projector', 'Video Conferencing'] },
    { id: 'room202', name: 'Small Meeting Room D', location: 'London', capacity: 6, amenities: ['Whiteboard'] }
];

let selectedRoomId = null;

function renderRoomList(rooms) {
    const roomListContainer = document.getElementById('roomListContainer');
    if (!roomListContainer) return;
    roomListContainer.innerHTML = ''; // Clear existing list

    const roomsByLocation = rooms.reduce((acc, room) => {
        if (!acc[room.location]) {
            acc[room.location] = [];
        }
        acc[room.location].push(room);
        return acc;
    }, {});

    for (const location in roomsByLocation) {
        const locationGroupDiv = document.createElement('div');
        locationGroupDiv.className = 'location-group';

        const locationTitle = document.createElement('div');
        locationTitle.className = 'location-title';
        locationTitle.textContent = location;
        locationGroupDiv.appendChild(locationTitle);

        roomsByLocation[location].forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            roomCard.dataset.roomId = room.id;

            roomCard.innerHTML = `
                <div class="room-info">
                    <h3>${room.name}</h3>
                    <div class="room-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${room.location}</span>
                        <span><i class="fas fa-users"></i> ${room.capacity} people</span>
                        <span><i class="fas fa-chair"></i> ${room.amenities.join(', ')}</span>
                    </div>
                </div>
                <i class="fas fa-check-circle"></i>
            `;
            roomCard.addEventListener('click', () => handleRoomSelection(room.id, room.name));
            locationGroupDiv.appendChild(roomCard);
        });
        roomListContainer.appendChild(locationGroupDiv);
    }
}

function handleRoomSelection(roomId, roomName) {
    // Remove 'active' class from previously selected room, if any
    if (selectedRoomId !== null) {
        const previouslySelectedCard = document.querySelector(`.room-card[data-room-id='${selectedRoomId}']`);
        if (previouslySelectedCard) {
            previouslySelectedCard.classList.remove('active');
        }
    }

    // Set new selected room
    selectedRoomId = roomId;
    const bookingForm = document.getElementById('bookingForm');
    const meetingRoomNameInput = document.getElementById('meetingRoomName');

    if (bookingForm && meetingRoomNameInput) {
        meetingRoomNameInput.value = roomName;
        const selectedCard = document.querySelector(`.room-card[data-room-id='${roomId}']`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
    }
}

function resetForm() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.reset();
    }
    if (selectedRoomId !== null) {
        const previouslySelectedCard = document.querySelector(`.room-card[data-room-id='${selectedRoomId}']`);
        if (previouslySelectedCard) {
            previouslySelectedCard.classList.remove('active');
        }
        selectedRoomId = null;
    }
}

// Mock the submit event listener
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', function(event) {
        event.preventDefault();
        // Mock submission logic for test
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true; // Simulate disabling on submit
        console.log('Form submitted:', {
            roomId: selectedRoomId,
            roomName: document.getElementById('meetingRoomName')?.value,
            bookingDate: document.getElementById('bookingDate')?.value,
            duration: document.getElementById('duration')?.value,
            organizerName: document.getElementById('organizerName')?.value,
            purpose: document.getElementById('purpose')?.value
        });
        if (submitButton) submitButton.disabled = false;
    });
}

// Mock the change event listener for filter
const locationFilter = document.getElementById('locationFilter');
if (locationFilter) {
    locationFilter.addEventListener('change', function() {
        const selectedLocation = this.value;
        const filteredRooms = selectedLocation === 'all'
            ? meetingRooms
            : meetingRooms.filter(room => room.location === selectedLocation);
        renderRoomList(filteredRooms);
    });
}

// Initial render
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        renderRoomList(meetingRooms);
    });
} else {
    renderRoomList(meetingRooms);
}

// --- Tests ---

describe('Meeting Room Filtering', () => {
    beforeEach(() => {
        document.body.innerHTML = mockHtml;
        selectedRoomId = null;
        const locationFilter = document.getElementById('locationFilter');
        if (locationFilter) {
            locationFilter.addEventListener('change', function() {
                const selectedLocation = this.value;
                const filteredRooms = selectedLocation === 'all'
                    ? meetingRooms
                    : meetingRooms.filter(room => room.location === selectedLocation);
                renderRoomList(filteredRooms);
            });
        }
        renderRoomList(meetingRooms);
    });

    test('should filter rooms to show only New York when "New York" is selected', () => {
        const locationFilter = document.getElementById('locationFilter');
        locationFilter.value = 'newyork';
        locationFilter.dispatchEvent(new Event('change'));

        const roomCards = document.querySelectorAll('.room-card');
        expect(roomCards.length).toBe(2);
        expect(roomCards[0].querySelector('.room-info h3').textContent).toBe('Conference Room A');
        expect(roomCards[1].querySelector('.room-info h3').textContent).toBe('Huddle Room B');
    });

    test('should filter rooms to show only London when "London" is selected', () => {
        const locationFilter = document.getElementById('locationFilter');
        locationFilter.value = 'london';
        locationFilter.dispatchEvent(new Event('change'));

        const roomCards = document.querySelectorAll('.room-card');
        expect(roomCards.length).toBe(2);
        expect(roomCards[0].querySelector('.room-info h3').textContent).toBe('Boardroom C');
        expect(roomCards[1].querySelector('.room-info h3').textContent).toBe('Small Meeting Room D');
    });

    test('should show all rooms when "All Locations" is selected', () => {
        // First, filter to London to ensure the change event works
        const locationFilter = document.getElementById('locationFilter');
        locationFilter.value = 'london';
        locationFilter.dispatchEvent(new Event('change'));
        expect(document.querySelectorAll('.room-card').length).toBe(2);

        // Now, change back to all
        locationFilter.value = 'all';
        locationFilter.dispatchEvent(new Event('change'));

        const roomCards = document.querySelectorAll('.room-card');
        expect(roomCards.length).toBe(4);
    });

    test('should update the location title correctly after filtering', () => {
        const locationFilter = document.getElementById('locationFilter');
        locationFilter.value = 'london';
        locationFilter.dispatchEvent(new Event('change'));

        const locationTitle = document.querySelector('.location-title');
        expect(locationTitle.textContent).toBe('London');
    });
});
