/**
 * VISUAL REFERENCE GUIDE
 * CorrectNow Chrome Extension (MV3)
 * 
 * Diagrams and visual explanations of how everything works
 */

// ============================================================
// ARCHITECTURE FLOWCHART
// ============================================================

/*

                      USER INTERACTION FLOW

                           WEBPAGE
                             │
                      User focuses on
                      textarea/input
                             │
                             ▼
                    ┌──────────────────┐
                    │ FLOATING BUTTON  │
                    │ "Check with      │
                    │ CorrectNow"      │
                    └──────────────────┘
                             │
                      User clicks button
                             │
                             ▼
          ┌──────────────────────────────────┐
          │    CONTENT SCRIPT (content.js)   │
          │                                  │
          │ • Gets text from textarea/input  │
          │ • Sends to service worker        │
          │ • Waits for response             │
          │ • Highlights errors              │
          │ • Shows messages                 │
          └──────────────────────────────────┘
                             │
                    sendMessage() to
                      service worker
                             │
                             ▼
         ┌────────────────────────────────────┐
         │ SERVICE WORKER (background.js)     │
         │                                    │
         │ • Receives message from content    │
         │ • Makes fetch() call to API        │
         │ • Validates response               │
         │ • Sends result back                │
         └────────────────────────────────────┘
                             │
                    fetch() to POST
                             │
                             ▼
              ┌──────────────────────────┐
              │   YOUR BACKEND API       │
              │                          │
              │  POST /api/check         │
              │  Body: { text: "..." }   │
              │                          │
              │  Returns:                │
              │  { errors: [...] }       │
              └──────────────────────────┘
                             │
                    Response with errors
                             │
                             ▼
         ┌────────────────────────────────────┐
         │ SERVICE WORKER (background.js)     │
         │                                    │
         │ • Validates error format           │
         │ • Sends back to content script     │
         └────────────────────────────────────┘
                             │
                    sendResponse() with
                        errors array
                             │
                             ▼
          ┌──────────────────────────────────┐
          │    CONTENT SCRIPT (content.js)   │
          │                                  │
          │ • Receives error array           │
          │ • Applies yellow border          │
          │ • Shows error message            │
          │ • Auto-hides message after 4s    │
          └──────────────────────────────────┘
                             │
                             ▼
                        USER SEES
                       HIGHLIGHTED
                          ERRORS

*/

// ============================================================
// MESSAGE FLOW - DETAILED SEQUENCE
// ============================================================

/*

Timeline of Events:

T=0ms   User focuses on textarea
        ↓
        content.js detects focus event
        ↓
T=50ms  Floating button created and positioned
        ↓
        Button appears: "Check with CorrectNow"
        ↓

T=500ms User clicks button
        ↓
        content.js extracts text from field
        ↓
T=550ms Sends chrome.runtime.sendMessage()
        │
        ├─ action: "checkGrammar"
        ├─ text: "user's text..."
        └─ apiBase: "http://localhost:8787"
        ↓
        Button shows "Checking..." state
        ↓

T=600ms background.js receives message
        ↓
        Constructs API URL
        ↓
T=650ms Makes fetch() POST request
        │
        ├─ URL: http://localhost:8787/api/check
        ├─ Headers: Content-Type: application/json
        └─ Body: { text: "user's text..." }
        ↓

T=1000ms YOUR BACKEND RECEIVES REQUEST
        ↓
        Calls Gemini API
        ↓
        Gemini analyzes text
        ↓
T=2000ms YOUR BACKEND RESPONDS
        ↓
        Returns: { errors: [ ... ] }
        ↓

T=2050ms background.js receives response
        ↓
        Validates error format
        ↓
T=2100ms Sends back to content.js
        │
        ├─ errors: [array of errors]
        └─ success: true
        ↓

T=2150ms content.js receives response
        ↓
        If errors found:
        ├─ Applies yellow border to field
        ├─ Shows: "Found X issues"
        └─ Shows error details
        
        If no errors:
        ├─ No highlighting
        └─ Shows: "No issues found"
        ↓
T=2200ms Button returns to "Check with CorrectNow"
        ↓
T=6200ms Message auto-disappears
        ↓
        User sees highlighted field
        (stays highlighted until blur or next check)

*/

// ============================================================
// DIRECTORY STRUCTURE
// ============================================================

/*

your-project-root/
│
├── extension/                    ← Extension folder
│   ├── manifest.json            ← Chrome config
│   ├── content.js               ← DOM script
│   ├── background.js            ← Service worker
│   ├── README.md                ← Full docs
│   ├── QUICK_START.md           ← Setup guide
│   ├── TESTING.js               ← Test cases
│   ├── DELIVERY.md              ← What you got
│   ├── BACKEND_INTEGRATION.js   ← How to add API
│   └── VISUAL_REFERENCE.md      ← This file
│
├── src/
│   ├── components/
│   │   └── ProofreadingEditor.tsx
│   ├── pages/
│   ├── lib/
│   │   └── firebase.ts
│   └── ...
│
├── server/
│   └── index.js                 ← Add /api/check here
│
└── package.json

*/

// ============================================================
// MESSAGE FORMAT - CONTENT SCRIPT TO SERVICE WORKER
// ============================================================

/*

┌─ chrome.runtime.sendMessage(message, callback) ─────────┐
│                                                          │
│  SEND (Content Script → Service Worker):                │
│  {                                                       │
│    action: "checkGrammar",                               │
│    text: "I havve a sppeling error",                    │
│    apiBase: "http://localhost:8787"                     │
│  }                                                       │
│                                                          │
│  RECEIVE (Service Worker → Content Script):             │
│  {                                                       │
│    errors: [                                             │
│      {                                                   │
│        start: 4,                                         │
│        end: 9,                                           │
│        message: "Spelling error",                        │
│        suggestion: "have"                                │
│      },                                                  │
│      {                                                   │
│        start: 13,                                        │
│        end: 21,                                          │
│        message: "Spelling error",                        │
│        suggestion: "spelling"                            │
│      }                                                   │
│    ]                                                     │
│  }                                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘

Character Position Example:
  Text: "I havve a sppeling error"
         0123456789...

  Error 1:
  start: 4  (points to 'h')
  end: 9    (points to ' ')
  Substring: text.substring(4, 9) = "havve"

  Error 2:
  start: 13 (points to 's')
  end: 21   (points to ' ')
  Substring: text.substring(13, 21) = "sppeling"

*/

// ============================================================
// BUTTON POSITIONING
// ============================================================

/*

Input element on page:
┌───────────────────────────────────┐
│ Text field                        │
│ rect.top = 100px                  │
│ rect.left = 50px                  │
│ rect.right = 400px                │
│ rect.bottom = 130px               │
└───────────────────────────────────┘

Button position calculation:

const rect = element.getBoundingClientRect();
const top = rect.top + window.scrollY - 5;
const left = rect.right + window.scrollX + 5;

Result:
button.style.top = 95px;     ← Slightly above field
button.style.left = 405px;   ← To the right of field

Visual:
                              ┌─────────────┐
                              │ Button      │ ← button.style.left = 405px
                              │ fixed pos   │
                              └─────────────┘
                                    ↑
                                    │ offset = 5px
                                    │
        ┌──────────────────────────┘
        │
┌───────┴──────────────────────────┐
│ Text field (input/textarea)       │
│ rect.right = 400px                │
└───────────────────────────────────┘

*/

// ============================================================
// ERROR HIGHLIGHTING VISUALIZATION
// ============================================================

/*

BEFORE:
┌─────────────────────────────────────┐
│ I havve a sppeling error            │  Normal border
└─────────────────────────────────────┘

AFTER (Yellow highlight):
┌╭─────────────────────────────────────╮┐
├│ I havve a sppeling error            │┤
│╰─────────────────────────────────────╯│
└─────────────────────────────────────┘

CSS Applied:
element.style.borderColor = '#fbbf24';           ← Yellow
element.style.borderWidth = '2px';               ← Thicker
element.style.boxShadow = '0 0 0 3px rgba(...)'  ← Glow

Result:
- Glow visible around field (3px)
- Yellow border stands out
- No layout shift (fixed width)
- User can still read text
- Easy to see there are errors

*/

// ============================================================
// MESSAGE SEQUENCE DIAGRAM
// ============================================================

/*

CONTENT SCRIPT                      SERVICE WORKER                  API SERVER
        │                                   │                            │
        │  focus event detected             │                            │
        │  create button                    │                            │
        │  position button                  │                            │
        │                                   │                            │
        │  user clicks button               │                            │
        ├──── sendMessage() ────────────────>│                            │
        │   { action, text, apiBase }       │                            │
        │                                   │ fetch(POST /api/check)     │
        │                                   ├─────────────────────────────>│
        │                                   │   body: { text }            │
        │                                   │                            │
        │  show "Checking..."               │   [Gemini API call]        │
        │                                   │   [Text analysis]          │
        │                                   │                            │
        │                                   │  <────────────────────────┤
        │                                   │  { errors: [...] }        │
        │                                   │                            │
        │  <──── sendResponse() ────────────┤                            │
        │  { errors: [...] }                │                            │
        │                                   │                            │
        ├─ highlight errors                │                            │
        ├─ show message                    │                            │
        ├─ restore button                  │                            │
        │                                   │                            │
        │  [after 4 seconds]                │                            │
        └─ dismiss message                 │                            │

Total time: ~1500ms (1.5 seconds)

*/

// ============================================================
// STATE MACHINE - BUTTON STATES
// ============================================================

/*

┌──────────────────────────────────┐
│                                  │
│     BUTTON STATE MACHINE         │
│                                  │
└──────────────────────────────────┘

         ┌─────────────────┐
         │    HIDDEN       │
         │ display: none   │
         └────────┬────────┘
                  │
                  │ on focus
                  ▼
         ┌─────────────────┐
         │    VISIBLE      │
         │ display: block  │ ◄──────┐
         │ text: "Check..." │        │
         │ clickable       │        │
         └────────┬────────┘        │
                  │                 │
         ┌────────┴────────┐        │
         │                 │        │
      click            blur │        │
         │                 │        │
         ▼                 │        │
    ┌─────────────┐    ┌────┴──────┐│
    │  LOADING    │    │  HIDDEN   ││
    │ "Checking.."│    │display:none││
    │ disabled    │    └──────────────┘
    └────┬────────┘
         │
    [API response]
    [1000-2000ms]
         │
         ▼
    ┌─────────────┐
    │   VISIBLE   │
    │ "Check..."  │─────────────┘
    │ clickable   │ (re-enabled)
    └─────────────┘

*/

// ============================================================
// API RESPONSE VALIDATION FLOWCHART
// ============================================================

/*

┌─ API Response Received ──────────┐
│                                  │
└────────────┬─────────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ Is response valid   │
    │ JSON?               │
    └────┬────────────────┘
         │
    ┌────┴──────┐
   YES          NO
    │            │
    ▼            ▼
Check     Show error:
types     "Invalid response"
    │
    ▼
Is errors
array?
    │
 ┌──┴──┐
YES   NO
 │     │
 ▼     ▼
Check Show error:
items "Not an array"
 │
 ▼
All items valid?
(has start, end, message)
 │
 ┌──┴──┐
YES   NO
 │     │
 ▼     ▼
Filter Ignore
valid  invalid
items  items
 │     │
 ├─────┘
 │
 ▼
┌─────────────────┐
│ Return errors   │
│ to content.js   │
└─────────────────┘

*/

// ============================================================
// FILE COMMUNICATION MAP
// ============================================================

/*

manifest.json
    ↓ defines
    └─ content.js (injected into webpages)
    └─ background.js (service worker)

content.js
    ├─ injects into DOM
    ├─ listens for focus/blur
    ├─ creates floating button
    ├─ sends messages via chrome.runtime.sendMessage()
    └─ receives responses

background.js
    ├─ receives messages via chrome.runtime.onMessage()
    ├─ makes fetch() calls to /api/check
    ├─ validates responses
    └─ sends results back to content.js

/api/check endpoint (your backend)
    ├─ receives POST requests
    ├─ calls Gemini API
    ├─ returns error array
    └─ service worker receives this

*/

// ============================================================
// PERMISSION FLOW
// ============================================================

/*

┌─ User installs extension ──┐
│                            │
└────────────┬───────────────┘
             │
             ▼
    manifest.json specifies:
    ├─ "activeTab" permission
    │  └─> Can interact with current tab
    │
    ├─ "scripting" permission
    │  └─> Can inject content scripts
    │
    └─ "host_permissions": "*://*/*"
       └─> Can access any website
       
    These permissions enable:
    ├─ Detecting focus in any webpage
    ├─ Creating floating button
    ├─ Reading textarea/input text
    ├─ Communicating with service worker
    └─ Making fetch() calls
    
    What extension CAN'T do:
    ├─ Read browser history
    ├─ Access passwords
    ├─ Monitor all network traffic
    ├─ Modify payment information
    └─ Access other extensions' data

*/

// ============================================================
// PERFORMANCE IMPACT
// ============================================================

/*

Extension overhead on a webpage:

1. Load time impact:
   - manifest.json: <1ms
   - content.js injection: ~10ms
   - Total delay: ~11ms (imperceptible)

2. Memory usage:
   - content.js in memory: ~200KB
   - Service worker (when idle): ~50KB
   - Floating button DOM: <1KB
   - Total: ~250KB (very light)

3. Performance during check:
   - Text extraction: <1ms
   - Message sending: <5ms
   - Waiting for API: 1000-2000ms (network bound)
   - Highlighting: <10ms
   - Total time to highlight: ~1500ms

4. Performance at idle:
   - Zero CPU usage
   - Service worker sleeps
   - Only content.js consumes memory
   - No background polling

Performance is NOT impacted by:
✓ Number of input fields on page
✓ Amount of text entered (until check)
✓ Time spent typing
✓ Page scrolling
✓ Other page interactions

Performance IS impacted by:
✗ API response time (network latency)
✗ Gemini API processing time
✗ Your server speed

*/

// ============================================================
// SECURITY MODEL
// ============================================================

/*

┌─ Extension Architecture ─────────────┐
│                                      │
│  Isolated Contexts:                  │
│  ┌──────────────┐                    │
│  │  Webpage     │  (sandboxed)       │
│  │  JavaScript  │  (can't access     │
│  │              │   extension code)  │
│  └──────────────┘                    │
│         │                            │
│         │ (via content.js)           │
│         ▼                            │
│  ┌──────────────┐                    │
│  │ Content.js   │  (extension context)
│  │ (Isolated)   │  (can access       │
│  │              │   limited APIs)    │
│  └──────────────┘                    │
│         │                            │
│         │ (via chrome.runtime        │
│         │  messaging)                │
│         ▼                            │
│  ┌──────────────┐                    │
│  │background.js │  (service worker)  │
│  │ (Protected)  │  (most privileges) │
│  └──────────────┘                    │
│         │                            │
│         │ (fetch with CORS)          │
│         ▼                            │
│  ┌──────────────┐                    │
│  │ Your Backend │  (separate domain) │
│  └──────────────┘                    │
│                                      │
│  Data Flow Security:                 │
│  - No passwords sent                 │
│  - Only checked text sent            │
│  - No cookies in request             │
│  - No authentication tokens exposed  │
│  - HTTPS in production               │
│  - API validates input               │
│                                      │
└──────────────────────────────────────┘

*/

// ============================================================
// TESTING CHECKLIST WITH TIMING
// ============================================================

/*

┌─ Manual Test Plan ──────────────┐
│ (Approximate timing)             │
│                                  │
│ ⏱ 0:00  Install extension        │
│ ⏱ 0:05  Open Gmail               │
│ ⏱ 0:10  Click compose             │
│ ⏱ 0:15  See button appear        │
│ ⏱ 0:20  Type some text           │
│ ⏱ 0:30  Click button             │
│ ⏱ 0:32  See "Checking..."       │
│ ⏱ 1:30  API response             │
│ ⏱ 1:31  Errors highlighted       │
│ ⏱ 1:35  See message              │
│ ⏱ 5:35  Message auto-dismiss     │
│ ⏱ 5:40  Check different site     │
│ ⏱ 5:50  Repeat on Twitter        │
│ ⏱ 6:00  Test complete ✓          │
│                                  │
│ Total time: ~6 minutes            │
│                                  │
└──────────────────────────────────┘

*/

// ============================================================
// DEPLOYMENT PIPELINE
// ============================================================

/*

Development
    │
    ├─ content.js
    ├─ background.js
    └─ manifest.json
    │
    ▼
Load in Chrome (extension://...)
    │
    ├─ Test locally
    ├─ Check console
    ├─ Monitor API calls
    └─ Verify highlighting
    │
    ▼
Update API_BASE_URL
    │
    └─ From localhost:8787
       To production API URL
    │
    ▼
Pack Extension
    │
    └─ Create .crx file (signed)
    │
    ▼
Publish to Chrome Web Store
    │
    ├─ Create account ($5)
    ├─ Upload extension
    ├─ Add description
    ├─ Add screenshots
    └─ Submit for review
    │
    ▼
Wait for Approval
    │
    └─ Typically 24-48 hours
    │
    ▼
Published & Live
    │
    └─ Users can install from
       Chrome Web Store

*/

// ============================================================
// END OF VISUAL REFERENCE
// ============================================================

console.log("Visual Reference Guide loaded");
console.log("Contains flowcharts, diagrams, and architectural explanations");
console.log("See this file for visual understanding of how the extension works");
