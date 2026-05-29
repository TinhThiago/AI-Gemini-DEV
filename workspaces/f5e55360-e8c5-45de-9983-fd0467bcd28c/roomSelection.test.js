import { JSDOM } from 'jsdom';

describe('Room Selection Logic', () => {
    let dom;
    let document;
    let roomCards;
    let selectedRoomId;
    let updateRoomDetails;

    beforeEach(() => {
        // Set up a basic HTML structure for testing
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div class="room-card" data-room-id="ny001">
                    <div class="room-info"><h3>Room A</h3><div class="room-meta"><span>10 Capacity</span></div></div>
                </div>
                <div class="room-card" data-room-id="ny002">
                    <div class="room-info"><h3>Room B</h3><div class="room-meta"><span>8 Capacity</span></div></div>
                </div>
                <input id="roomName" value="">
                <input id="roomCapacity" value="">
            </body>
            </html>
        `);
        document = dom.window.document;
        global.document = document; // Make document available globally for the script

        // Mock the updateRoomDetails function and selectedRoomId variable from the original script
        selectedRoomId = null;
        updateRoomDetails = (roomCardElement) => {
            const roomInfo = roomCardElement.querySelector('.room-info');
            const roomName = roomInfo.querySelector('h3').textContent;
            const capacityText = roomInfo.querySelector('.room-meta span').textContent;
            const capacity = capacityText.match(/(\d+)/)[0]; 

            document.getElementById('roomName').value = roomName;
            document.getElementById('roomCapacity').value = capacity;
            selectedRoomId = roomCardElement.getAttribute('data-room-id');

            // Add active class to selected room and remove from others
            const allRoomCards = document.querySelectorAll('.room-card');
            allRoomCards.forEach(card => {
                card.classList.remove('active');
            });
            roomCardElement.classList.add('active');
        };

        // Get room cards after the DOM is set up
        roomCards = document.querySelectorAll('.room-card');
    });

    afterEach(() => {
        delete global.document; // Clean up global document
    });

    test('should select a room and add active class', () => {
        const firstRoomCard = roomCards[0];
        updateRoomDetails(firstRoomCard);

        expect(firstRoomCard.classList.contains('active')).toBe(true);
        expect(document.getElementById('roomName').value).toBe('Room A');
        expect(document.getElementById('roomCapacity').value).toBe('10');
        expect(selectedRoomId).toBe('ny001');
    });

    test('should only have one room active at a time', () => {
        const firstRoomCard = roomCards[0];
        const secondRoomCard = roomCards[1];

        updateRoomDetails(firstRoomCard);
        expect(firstRoomCard.classList.contains('active')).toBe(true);

        updateRoomDetails(secondRoomCard);
        expect(firstRoomCard.classList.contains('active')).toBe(false);
        expect(secondRoomCard.classList.contains('active')).toBe(true);
        expect(document.getElementById('roomName').value).toBe('Room B');
        expect(document.getElementById('roomCapacity').value).toBe('8');
        expect(selectedRoomId).toBe('ny002');
    });
});

// Mock necessary browser APIs if not running in a full browser environment
if (typeof window === 'undefined') {
    global.window = {
        document: {
            querySelectorAll: () => [],
            getElementById: () => ({ value: '', classList: { remove: () => {}, add: () => {} } }),
            addEventListener: () => {},
            querySelector: () => ({ value: '', classList: { remove: () => {}, add: () => {} } }),
            removeEventListener: () => {}
        },
        Image: function() {},
        location: { href: '' },
        navigator: { userAgent: '' },
        addEventListener: () => {},
        removeEventListener: () => {}
    };
    // Mock Element.prototype.closest if needed, though JSDOM usually handles this
    if (typeof Element !== 'undefined' && !Element.prototype.closest) {
        Element.prototype.closest = function(selector) {
            let element = this;
            do {
                if (element.matches(selector)) return element;
                element = element.parentElement;
            } while (element && element.nodeType === 1);
            return null;
        };
    }
    // Mock Element.prototype.matches if needed
     if (typeof Element !== 'undefined' && !Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }
}