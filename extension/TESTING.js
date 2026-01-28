/**
 * EXTENSION TESTING GUIDE
 * CorrectNow Chrome Extension (MV3)
 * 
 * This file contains testing scenarios and expected API responses
 */

// ============================================================
// TEST SCENARIO 1: Simple Spelling Error
// ============================================================

// User input in field:
// "I havve a sppeling error"

// API Response:
/*
{
  "errors": [
    {
      "start": 4,
      "end": 9,
      "message": "Spelling error: 'havve'",
      "suggestion": "have"
    },
    {
      "start": 13,
      "end": 21,
      "message": "Spelling error: 'sppeling'",
      "suggestion": "spelling"
    }
  ]
}
*/

// Extension behavior:
// 1. Field gets yellow border highlight
// 2. Message: "Found 2 issues"
// 3. Details shown:
//    Position 4: Spelling error: 'havve'
//    Context: "...I havve a sp..."
//    Position 13: Spelling error: 'sppeling'
//    Context: "...g a sppeling ..."


// ============================================================
// TEST SCENARIO 2: No Errors Found
// ============================================================

// User input in field:
// "This is a correctly written sentence."

// API Response:
/*
{
  "errors": []
}
*/

// Extension behavior:
// 1. No highlighting applied
// 2. Message: "No issues found" (green success message)
// 3. Disappears after 4 seconds


// ============================================================
// TEST SCENARIO 3: Grammar Issues
// ============================================================

// User input in field:
// "She go to the store yesterday. He dont like apples."

// API Response:
/*
{
  "errors": [
    {
      "start": 5,
      "end": 7,
      "message": "Grammar: Subject-verb agreement",
      "suggestion": "goes"
    },
    {
      "start": 45,
      "end": 49,
      "message": "Grammar: Missing 'not' contraction",
      "suggestion": "doesn't"
    }
  ]
}
*/

// Extension behavior:
// 1. Field highlighted with yellow border
// 2. Message: "Found 2 issues"
// 3. Shows error details with character positions


// ============================================================
// TEST SCENARIO 4: Empty Field
// ============================================================

// User clicks button with empty field

// Extension behavior:
// 1. Shows warning: "Please enter some text to check"
// 2. Button remains enabled
// 3. No API call is made


// ============================================================
// TEST SCENARIO 5: API Connection Error
// ============================================================

// Backend API is down/unreachable

// Extension behavior:
// 1. Button shows "Checking..." while waiting
// 2. After 30 seconds timeout: "Error connecting to API"
// 3. Button re-enabled for retry
// 4. Error logged to console


// ============================================================
// MANUAL TEST CHECKLIST
// ============================================================

/*
✅ TEST 1: Button Appearance
  - Navigate to gmail.com
  - Click in compose field (textarea)
  - Verify blue "Check with CorrectNow" button appears
  - Move to another field, button should move too
  - Click outside field, button should hide
  
✅ TEST 2: Different Field Types
  - Test on <input type="text"> (Twitter, LinkedIn)
  - Test on <textarea> (Gmail, Reddit)
  - Test on contentEditable divs (medium.com)
  - Button should appear for all

✅ TEST 3: Multiple Fields
  - Focus on field A → button shows
  - Focus on field B → button moves to field B
  - Focus back on field A → button moves back
  - Button position should always be near current field

✅ TEST 4: API Integration
  - Open DevTools (F12) → Network tab
  - Click "Check with CorrectNow" button
  - Verify POST request to /api/check appears
  - Check request body contains your text
  - Check response has 'errors' array

✅ TEST 5: Error Highlighting
  - Type: "I havve a speling eror"
  - Click button
  - Verify yellow border appears around field
  - Message shows count of errors
  - Message disappears after 4 seconds

✅ TEST 6: No Errors Case
  - Type: "This is perfect English."
  - Click button
  - Should show "No issues found"
  - No highlighting applied

✅ TEST 7: Button States
  - Normal state: blue background, clickable
  - Hover state: darker blue, shadow increases
  - Clicking state: text changes to "Checking..."
  - After response: text back to "Check with CorrectNow"

✅ TEST 8: Message Display
  - Verify messages appear below button
  - Check color coding:
    - Green for success ("No issues found")
    - Blue for info ("Found X issues")
    - Red for errors
  - Messages auto-dismiss after 4 seconds

✅ TEST 9: Console Logs
  - Open DevTools → Console
  - Should see "CorrectNow extension loaded" on page load
  - API calls logged with endpoint URL
  - Any errors are logged with details

✅ TEST 10: Performance
  - Extension shouldn't slow down page
  - Button creation should be fast
  - No memory leaks (check memory usage)
  - Extension shouldn't consume CPU at idle
*/


// ============================================================
// LIVE TESTING ON REAL WEBSITES
// ============================================================

/*
RECOMMENDED WEBSITES TO TEST:

1. GMAIL (gmail.com)
   - Compose field (textarea)
   - Reply field
   - Search field

2. TWITTER (twitter.com)
   - Tweet composition field
   - DM field
   - Reply field

3. LINKEDIN (linkedin.com)
   - Post composition
   - Comment field
   - Message field

4. MEDIUM (medium.com)
   - Article composition
   - Comment section
   - Note fields

5. REDDIT (reddit.com)
   - Post composition
   - Comment field
   - DM field

6. FACEBOOK (facebook.com)
   - Post field
   - Comment field
   - Messenger

7. SLACK (slack.com)
   - Message field
   - Channel messages

8. GITHUB (github.com)
   - Issue description
   - Comment field
   - PR review comments
*/


// ============================================================
// SIMULATING API RESPONSES (FOR TESTING)
// ============================================================

// Add this to background.js temporarily for local testing:

/*
// MOCK MODE - Comment out for production
const MOCK_MODE = false;

async function handleGrammarCheck(request, sender, sendResponse) {
  if (MOCK_MODE) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock errors
    sendResponse({
      errors: [
        { start: 2, end: 7, message: "Error 1", suggestion: "fix1" },
        { start: 15, end: 20, message: "Error 2", suggestion: "fix2" }
      ]
    });
    return;
  }
  
  // Normal API call here...
}
*/


// ============================================================
// DEBUGGING TIPS
// ============================================================

/*
1. CHECK EXTENSION LOADED
   - Go to chrome://extensions/
   - Look for "CorrectNow - Grammar Checker"
   - Should show "Enabled"

2. VIEW SERVICE WORKER LOGS
   - Go to chrome://extensions/
   - Click "Service Worker" link under extension
   - Console opens with background.js logs

3. TEST MESSAGING
   - Open DevTools on any webpage (F12)
   - In console, run:
     chrome.runtime.sendMessage({
       action: 'checkGrammar',
       text: 'test text',
       apiBase: 'http://localhost:8787'
     }, console.log);

4. MONITOR NETWORK CALLS
   - DevTools → Network tab
   - Perform check
   - Look for POST /api/check request
   - Click it to see:
     - Request headers
     - Request body (your text)
     - Response (errors)

5. CHECK ELEMENT HIGHLIGHTING
   - DevTools → Elements tab
   - Inspect the textarea/input field
   - Should see borderColor and boxShadow styles applied

6. RELOAD EXTENSION
   - Go to chrome://extensions/
   - Toggle extension OFF then ON
   - This reloads the content script

7. VIEW FULL ERROR LOGS
   - chrome://extensions/ → Details → Service Worker
   - This shows all logged errors from background.js
*/


// ============================================================
// EXPECTED BEHAVIOR SUMMARY
// ============================================================

/*
WHEN USER FOCUSES ON INPUT/TEXTAREA:
  ✓ Button appears near the field
  ✓ Button is positioned with `position: fixed`
  ✓ Button doesn't move with scroll
  ✓ Button is blue (#2563eb)
  ✓ Button is always visible (z-index: 999999)

WHEN USER CLICKS BUTTON:
  ✓ Button text changes to "Checking..."
  ✓ Button becomes disabled (can't click twice)
  ✓ Text from field is read
  ✓ POST request sent to /api/check
  ✓ Request contains { text: "user text" }

WHEN API RESPONDS WITH ERRORS:
  ✓ Field gets yellow border (#fbbf24)
  ✓ Field gets yellow glow (box-shadow)
  ✓ Message appears below button
  ✓ Message shows error count
  ✓ Message shows error details
  ✓ Button text reverts to "Check with CorrectNow"
  ✓ Button becomes enabled again

WHEN API RESPONDS WITH NO ERRORS:
  ✓ No highlighting applied
  ✓ Green success message: "No issues found"
  ✓ Message auto-dismisses after 4 seconds
  ✓ Button text reverts

WHEN USER LEAVES FIELD:
  ✓ Button hides (display: none)
  ✓ Highlighting persists (user can see errors)
  ✓ If user clicks on field again, button reappears
  ✓ Highlighting remains

WHEN USER CLICKS NEW FIELD:
  ✓ Previous highlighting clears
  ✓ Button moves to new field
  ✓ New field is now active
*/


// ============================================================
// COMMON TEST CASES FOR GRAMMAR ERRORS
// ============================================================

const testCases = [
  {
    name: "Spelling Errors",
    input: "I havve a speling problem",
    expectedErrors: 2,
    description: "'havve' and 'speling' should be flagged"
  },
  {
    name: "Grammar - Subject-Verb Agreement",
    input: "He go to the store",
    expectedErrors: 1,
    description: "'go' should be 'goes'"
  },
  {
    name: "Grammar - Tense Mismatch",
    input: "She went to the store and buy groceries",
    expectedErrors: 1,
    description: "'buy' should be 'bought'"
  },
  {
    name: "Punctuation",
    input: "Where is my pen",
    expectedErrors: 1,
    description: "Missing period at end"
  },
  {
    name: "Article Usage",
    input: "I need to go to a university",
    expectedErrors: 1,
    description: "Should be 'a university' or 'to university'"
  },
  {
    name: "Capitalization",
    input: "john went to london yesterday",
    expectedErrors: 2,
    description: "'john' and 'london' should be capitalized"
  },
  {
    name: "Multiple Errors",
    input: "She dont go to the store yesterday becuse she was bussy",
    expectedErrors: 3,
    description: "Multiple spelling and grammar errors"
  },
  {
    name: "Perfect Text",
    input: "This is a perfectly written sentence.",
    expectedErrors: 0,
    description: "No errors should be found"
  },
  {
    name: "Complex Sentence",
    input: "The quick brown fox jump over the lazy dog",
    expectedErrors: 1,
    description: "'jump' should be 'jumps'"
  },
  {
    name: "Formal Writing",
    input: "We would of gone if we could of",
    expectedErrors: 2,
    description: "'would of' should be 'would have'"
  }
];

// Test each case with your extension
console.log("Test Cases Ready:", testCases);
console.log("Copy input text, paste in webpage, click button, verify expectedErrors");
