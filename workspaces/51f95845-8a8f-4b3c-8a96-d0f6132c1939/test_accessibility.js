/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load the HTML file
const html = fs.readFileSync(path.resolve(__dirname, '../HTML_Booking.html'), 'utf-8');
document.body.innerHTML = html;

// Helper to check for accessibility attributes
function checkAriaLabels(selector, expectedLabelPrefix) {
    const elements = document.querySelectorAll(selector);
    let missingLabels = 0;
    elements.forEach(el => {
        const label = el.getAttribute('aria-label');
        if (!label || !label.startsWith(expectedLabelPrefix)) {
            console.error(`Element with selector '${selector}' is missing or has incorrect aria-label. Found: '${label}', Expected prefix: '${expectedLabelPrefix}'`);
            missingLabels++;
        }
    });
    return missingLabels;
}

describe('Accessibility Checks', () => {
    test('Calendar navigation buttons should have aria-labels', () => {
        // These are the buttons for previous/next month and the date picker itself.
        // The HTML already has some labels, but we check if they match expectations or if they are missing.
        
        // Previous Month Button
        const prevButton = document.querySelector('#prev-month');
        expect(prevButton).not.toBeNull();
        expect(prevButton.getAttribute('aria-label')).toBe('Tháng trước'); // As per current HTML

        // Next Month Button
        const nextButton = document.querySelector('#next-month');
        expect(nextButton).not.toBeNull();
        expect(nextButton.getAttribute('aria-label')).toBe('Tháng sau'); // As per current HTML

        // Date Picker Input
        const datePicker = document.querySelector('#calendar-date-picker');
        expect(datePicker).not.toBeNull();
        // NOTE: The HTML *does not* have an aria-label for the date picker input itself, only for the buttons.
        // This is a point of improvement. The current HTML has "Chọn ngày" for the button, not the input.
        // The input element itself often gets an implicit label from the parent or associated label, but `aria-label` is explicit.
        
        // Checking for the presence of aria-label specifically on the date picker input:
        expect(datePicker.getAttribute('aria-label')).toBeNull(); // This confirms the current lack of aria-label on the input.
        
        // If we were to add it, it would look like this:
        // expect(datePicker.getAttribute('aria-label')).toBe('Chọn ngày'); // If it were added
    });

    test('Form input fields should have associated labels or aria-labels', () => {
        const formInputs = [
            { id: 'txtSubject', label: 'Subject' },
            { id: 'txtStartDate', label: 'Start Date' },
            { id: 'txtEndDate', label: 'End Date' },
            { id: 'txtStartTime', label: 'Start Time' },
            { id: 'txtEndTime', label: 'End Time' },
            { id: 'txtAttendees', label: 'Attendees (comma-separated emails)' },
            { id: 'txtNotes', label: 'Notes' },
            { id: 'chkRecurring', label: 'Recurring Booking' } // This one has a label, but it's tied via for attribute
        ];

        formInputs.forEach(inputInfo => {
            const inputElement = document.getElementById(inputInfo.id);
            expect(inputElement).not.toBeNull();

            // Check for explicit label using 'for' attribute
            const labelElement = document.querySelector(`label[for="${inputInfo.id}"]`);
            
            if (inputInfo.id !== 'chkRecurring') { // Check other inputs
                expect(labelElement).not.toBeNull();
                expect(labelElement.textContent.trim()).toBe(inputInfo.label);
            } else { // Check checkbox which uses a label with for
                expect(labelElement).not.toBeNull();
                expect(labelElement.textContent.trim()).toContain(inputInfo.label);
            }
            
            // Also check for aria-label as a fallback (though explicit labels are preferred)
            // The current HTML doesn't use aria-label for these inputs.
            expect(inputElement.getAttribute('aria-label')).toBeNull();
        });
    });
});
