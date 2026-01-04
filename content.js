// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "autofill") {
        const data = request.data;
        const result = autofillForm(data);

        // Send back distinct status
        let status = 'no_fields';
        if (result.filledCount > 0) {
            status = 'success';
        } else if (result.matchedCount > 0) {
            status = 'already_filled';
        }

        sendResponse({
            status: status,
            count: result.filledCount,
            matched: result.matchedCount,
            frame: window.self === window.top ? 'top' : 'iframe'
        });
    }
    return true;
});

function autofillForm(profile) {
    let filledCount = 0;
    let matchedCount = 0;
    // Expand selection to include more potential input types
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        if (isFileField(input) || isHidden(input)) return;

        const result = fillField(input, profile);
        if (result.matched) matchedCount++;
        if (result.filled) filledCount++;
    });

    return { filledCount, matchedCount };
}

function isFileField(input) {
    return input.type === 'file';
}

function isHidden(input) {
    return input.type === 'hidden' || input.style.display === 'none' || input.style.visibility === 'hidden' || input.ariaHidden === 'true';
}

function fillField(input, profile) {
    // Create a comprehensive string of attributes to check against
    const attrStr = (
        (input.name || '') + ' ' +
        (input.id || '') + ' ' +
        (input.placeholder || '') + ' ' +
        (input.autocomplete || '') + ' ' +
        (input.className || '') + ' ' +
        (input.getAttribute('aria-label') || '') + ' ' +
        (input.getAttribute('data-testid') || '') // Common in testing/React apps
    ).toLowerCase();

    let valueToFill = null;

    // -- 1. Email --
    if (attrStr.match(/email|e-mail/)) {
        valueToFill = profile.email;
    }
    // -- 2. Phone --
    else if (attrStr.match(/phone|tel|mobile|contact number/)) {
        valueToFill = profile.phone;
    }
    // -- 3. Full Name / First Name / Last Name --
    else if (attrStr.match(/full\s*name|fullname/)) {
        valueToFill = profile.fullName;
    }
    else if (attrStr.match(/first\s*name|fname/)) {
        valueToFill = profile.fullName.split(' ')[0];
    }
    else if (attrStr.match(/last\s*name|lname|surname/)) {
        const parts = profile.fullName.split(' ');
        valueToFill = parts.length > 1 ? parts[parts.length - 1] : '';
    }
    // Fallback for generic "name" (risky, puts at end to prioritize specific matches)
    else if (attrStr.includes('name') && !attrStr.match(/user|file|task|project|company/)) {
        valueToFill = profile.fullName;
    }
    // -- 4. Skills --
    else if (attrStr.match(/skill|technolog|stack/)) {
        valueToFill = profile.skills;
    }
    // -- 5. Experience / Bio --
    else if (attrStr.match(/experience|history|cover|bio|about/)) {
        valueToFill = profile.experience;
    }

    // Apply value if found
    if (valueToFill !== null) {
        // We found a match for this field logic
        const alreadyHasValue = input.value === valueToFill;

        if (!alreadyHasValue) {
            setNativeValue(input, valueToFill);
            return { matched: true, filled: true };
        } else {
            return { matched: true, filled: false };
        }
    }
    return { matched: false, filled: false };
}

/**
 * Sets the value of an input element in a way that is compatible with 
 * React, Angular, Vue, and other frameworks that override the value setter.
 */
function setNativeValue(element, value) {
    const lastValue = element.value;
    element.value = value;

    // React 15/16+ tracking hack
    // React detects changes by overriding the native value property. 
    // We need to call the native setter from the prototype to trigger React's internal tracking.
    const tracker = element._valueTracker;
    if (tracker) {
        tracker.setValue(lastValue);
    }

    // For React 16+, we might need to look up the prototype chain
    // depending on the element type (Input vs TextArea)
    let proto;
    if (element.tagName === 'INPUT') {
        proto = window.HTMLInputElement.prototype;
    } else if (element.tagName === 'TEXTAREA') {
        proto = window.HTMLTextAreaElement.prototype;
    } else if (element.tagName === 'SELECT') {
        proto = window.HTMLSelectElement.prototype;
    }

    if (proto) {
        const nativeValueSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        if (nativeValueSetter) {
            nativeValueSetter.call(element, value);
        }
    }

    // Dispatch events to ensure all frameworks (React, Vue, Alpine, jQuery, etc.) detect the change
    const eventTypes = ['input', 'change', 'blur'];
    eventTypes.forEach(type => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
    });
}
