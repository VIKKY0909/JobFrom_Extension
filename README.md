# JobFill - Chrome Extension

JobFill is a smart, automated job application filler designed to save you time. With a single click, it detects common fields like Name, Email, Phone, Skills, and Experience on web forms and autofills them using your stored profile.

## Features

-   **One-Click Autofill**: Automatically populates form fields.
-   **Smart Detection**: Uses heuristics to identify fields by checking names, IDs, placeholders, classes, and ARIA attributes.
-   **Framework Support**: Optimized for **React, Next.js, Vue, Angular, and Python** based web apps by simulating native user events and handling Virtual DOM state updates.
-   **Universal Compatibility**: Works on standard HTML forms and complex Single Page Applications (SPAs).
-   **Iframe Support**: Capable of filling forms embedded within iframes (common in ATS systems).
-   **Privacy Focused**: Runs entirely locally in your browser.

## Tech Stack

-   **JavaScript (ES6+)**
-   **Chrome Extensions Manifest V3**
-   **HTML5 / CSS3** (Custom Premium UI)
-   No external frameworks or libraries.

## Installation

1.  **Clone or Download** this repository to your local machine.
2.  Open **Google Chrome**.
3.  Navigate to `chrome://extensions/`.
4.  Toggle **Developer mode** (top right corner).
5.  Click **Load unpacked**.
6.  Select the directory containing this project (`task2` folder).
7.  The **JobFill** icon should appear in your toolbar.

## Usage

1.  Navigate to any job application page (e.g., a "Contact Us" or "Apply" form).
2.  Click the **JobFill extension icon**.
3.  Click the **"Autofill Form"** button.
4.  Watch the fields populate automatically!

## Configuration

**Manage Your Profile:**
1. Click the **JobFill icon** to open the popup.
2. Click the **Edit Icon** (pencil/gear) in the top right corner.
3. Update your **Name, Email, Phone, Skills,** and **Experience**.
4. Click **Save Changes**.

Your data is saved securely in your browser's local storage and will be used for all future autofills.

## Development

-   `manifest.json`: Extension configuration.
-   `popup.html` & `style.css`: The extension interface.
-   `popup.js`: Logic for sending autofill commands.

-   `content.js`: Script injected into pages to interact with the DOM.

---
*Built for the Chrome Extension Challenge.*
