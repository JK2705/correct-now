# CorrectNow Chrome Extension (MV3)

## Overview

A minimal Chrome Extension that integrates with the CorrectNow grammar checking API. It detects focus on input/textarea fields, shows a floating button, and highlights grammatical errors without modifying page layout or auto-running checks.

---

## 📁 File Structure

```
extension/
├── manifest.json      # MV3 manifest configuration
├── content.js         # DOM injection & user interaction
├── background.js      # Service worker for API calls
└── README.md         # This file
```

---

## 🔧 File Explanations

### **manifest.json** (Chrome Extension Configuration)

**Purpose**: Defines extension metadata, permissions, and how it loads into Chrome.

**Key Components**:

```json
{
  "manifest_version": 3,           // MV3 format (latest)
  "permissions": [
    "activeTab",                   // Access focused tab
    "scripting"                    // Inject scripts
  ],
  "host_permissions": [
    "*://*/*"                      // Access all websites
  ],
  "background": {
    "service_worker": "background.js"  // Service worker (replaces persistent background page)
  },
  "content_scripts": [
    {
      "matches": ["*://*/*"],      // Inject into all URLs
      "js": ["content.js"],        // Content script file
      "run_at": "document_start"   // Load early
    }
  ]
}
```

**Permissions**:
- `activeTab`: Required to interact with the current tab
- `scripting`: Required for content script injection
- `host_permissions`: Allows access to all websites (or restrict to specific domains)

**Why MV3?**
- Google's latest extension standard
- Better security (no persistent background pages)
- Service Workers replace background pages
- Required for new Chrome extensions

---

### **content.js** (DOM Injection & UI Layer)

**Purpose**: Runs on every webpage, detects input focus, shows floating button, and highlights errors.

**How It Works**:

1. **Initialization** (`initializeContentScript`):
   ```javascript
   document.addEventListener('focus', handleFocus, true);  // Capture phase
   document.addEventListener('blur', handleBlur, true);
   ```
   - Listens for focus events on all elements (capture phase enables detecting through bubbling)
   - Initializes content script when DOM is ready

2. **Focus Detection** (`handleFocus`):
   ```javascript
   if (isEditableField(element)) {  // Check if textarea or text input
     floatingButton = createFloatingButton();
     positionButton(element, floatingButton);
   }
   ```
   - Detects when user focuses on `<textarea>` or `<input type="text">`
   - Creates floating button if doesn't exist
   - Positions button near the focused field

3. **Button Click Handler** (`handleCheckClick`):
   ```javascript
   chrome.runtime.sendMessage({
     action: 'checkGrammar',
     text: element.value,        // Extract text from field
     apiBase: CONFIG.API_BASE_URL
   }, callback);
   ```
   - Reads full text from focused input/textarea
   - Sends message to background.js (service worker)
   - Receives response and highlights errors

4. **Error Highlighting** (`highlightErrors`):
   ```javascript
   element.style.borderColor = '#fbbf24';        // Yellow border
   element.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.1)';
   ```
   - Highlights error ranges with yellow background
   - Preserves original text (no replacement)
   - Shows detailed error messages

5. **Blur Handling** (`handleBlur`):
   ```javascript
   floatingButton.style.display = 'none';
   currentFocusedElement = null;
   ```
   - Hides floating button when focus leaves field
   - Clears stored references

**Key Features**:
- ✅ Non-intrusive (only shows on focus)
- ✅ No layout changes (floating button is `position: fixed`)
- ✅ Preserves original text (no auto-replacement)
- ✅ Works on dynamically added elements (MutationObserver)
- ✅ Supports contentEditable elements

---

### **background.js** (Service Worker - API Gateway)

**Purpose**: Handles all API communication with the backend. Runs in a separate context from webpages.

**How It Works**:

1. **Message Listener** (`onMessage`):
   ```javascript
   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
     if (request.action === 'checkGrammar') {
       handleGrammarCheck(request, sender, sendResponse);
       return true;  // Async response
     }
   });
   ```
   - Listens for messages from content.js
   - Routes to appropriate handler
   - Returns `true` to indicate async response

2. **Grammar Check Handler** (`handleGrammarCheck`):
   ```javascript
   const response = await fetch(`${apiBase}/api/check`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ text: text })
   });
   ```
   - Makes POST request to backend API
   - Endpoint: `POST /api/check`
   - Request body: `{ "text": "user_text" }`
   - Timeout: 30 seconds

3. **Response Validation**:
   ```javascript
   if (!data.errors || !Array.isArray(data.errors)) {
     sendResponse({ error: 'Invalid response format' });
   }
   ```
   - Validates API response structure
   - Returns errors array or error message
   - Handles network failures gracefully

4. **Lifecycle Hooks**:
   ```javascript
   chrome.runtime.onInstalled.addListener((details) => {
     if (details.reason === 'install') {
       console.log('Extension installed');
     }
   });
   ```
   - Triggers on extension install/update
   - Optional: Open welcome page

**Why Service Worker?**
- More efficient than persistent background pages
- Better security model
- Automatically goes to sleep when idle
- Wakes up when needed (message received)

---

## 🚀 Installation & Setup

### **1. Add to extension folder**
```
your-project/
├── extension/
│   ├── manifest.json
│   ├── content.js
│   └── background.js
```

### **2. Update API URL**
In `content.js`, change:
```javascript
const CONFIG = {
  API_BASE_URL: 'https://your-api-domain.com', // ← Your API URL
  // ...
};
```

Or use environment-based configuration:
```javascript
const CONFIG = {
  API_BASE_URL: chrome.runtime.getURL('config.json'),
};
```

### **3. Load into Chrome**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right corner)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Extension appears in top-right corner

### **4. Test**
1. Go to any website (Gmail, Twitter, etc.)
2. Click in a text field
3. Click "Check with CorrectNow" button
4. See results highlighted

---

## 📡 API Integration

### **Expected Request Format**
```json
POST /api/check
{
  "text": "Your text here"
}
```

### **Expected Response Format**
```json
{
  "errors": [
    {
      "start": 5,
      "end": 10,
      "message": "Spelling error",
      "suggestion": "correction"
    },
    {
      "start": 20,
      "end": 25,
      "message": "Grammar issue",
      "suggestion": "fix"
    }
  ],
  "corrections": [...],
  "summary": "Found 2 issues"
}
```

**Error Array Structure**:
- `start` (number): Character position where error begins
- `end` (number): Character position where error ends
- `message` (string): Description of error
- `suggestion` (string, optional): Suggested correction

### **Example Backend Implementation**
```javascript
// Express route for CorrectNow API
app.post('/api/check', async (req, res) => {
  const { text } = req.body;
  
  // Call Gemini API or grammar checking service
  const errors = await checkGrammar(text);
  
  res.json({
    errors: errors,
    corrections: [],
    summary: `Found ${errors.length} issues`
  });
});
```

---

## 🎨 UI/UX Details

### **Floating Button**
- **Position**: Fixed to viewport (top-right of focused field)
- **Style**: Blue (#2563eb), hover effect, shadow
- **Label**: "Check with CorrectNow"
- **States**: 
  - Normal: Blue background
  - Hover: Darker blue
  - Loading: Text changes to "Checking..."
  - Disabled: During API call

### **Error Highlighting**
- **Visual**: Yellow border + glow (`#fbbf24`)
- **Non-intrusive**: Doesn't break the page
- **Message**: Shows error count and details
- **Auto-dismiss**: Message disappears after 4 seconds

### **Messages**
```javascript
// Success: "No issues found"
// Error: "Error connecting to API"
// Info: "Found 2 issues"
```

---

## 🔒 Security & Privacy

### **What the Extension Sees**
- Text from any input/textarea field
- User interactions (clicks, focus)
- Webpage URL

### **What the Extension Sends**
- Only the text user explicitly asks to check
- No cookies, tokens, or sensitive data
- No automatic tracking

### **API Communication**
- HTTPS only (in production)
- Timeout after 30 seconds
- Error messages don't expose backend details

### **Minimal Permissions**
- `activeTab`: Only interact with visible tab
- `scripting`: Only inject our script
- `host_permissions`: Access all URLs (can restrict to specific domains)

---

## ⚙️ Configuration

### **Change API Base URL**
```javascript
// content.js, line 10
const CONFIG = {
  API_BASE_URL: 'https://api.yourdomain.com',
};
```

### **Customize Button Text**
```javascript
const CONFIG = {
  BUTTON_TEXT: 'Grammar Check',
};
```

### **Customize Highlight Color**
```javascript
// In highlightErrors function
element.style.borderColor = '#ff0000';  // Red instead of yellow
```

### **Change Message Duration**
```javascript
setTimeout(() => { message.remove(); }, 4000);  // Change 4000 to desired ms
```

---

## 🧪 Testing Checklist

- [ ] Extension loads without errors
- [ ] Floating button appears on input/textarea focus
- [ ] Button disappears on blur
- [ ] Button click sends API request
- [ ] Errors are highlighted correctly
- [ ] "No issues found" message shows when no errors
- [ ] Works on multiple websites (Gmail, Twitter, Medium, etc.)
- [ ] Works on dynamically added fields
- [ ] Page layout is not modified
- [ ] Text content is never modified
- [ ] Multiple errors are handled correctly
- [ ] Error messages are readable and helpful
- [ ] Extension doesn't slow down page performance

---

## 🐛 Debugging

### **Check Console Logs**
```javascript
// In Chrome DevTools (F12)
chrome.runtime.getBackgroundPage().then(bg => {
  console.log(bg.console.getHistory());
});
```

### **Test Content Script**
```javascript
// In page console
chrome.runtime.sendMessage(
  { action: 'checkGrammar', text: 'test text', apiBase: 'http://localhost:8787' },
  console.log
);
```

### **Monitor Network Requests**
- Open DevTools → Network tab
- Look for API calls to `/api/check`
- Check request/response bodies

### **Check Extension Errors**
- Go to `chrome://extensions/`
- Find extension, click "Details"
- Check service worker logs

---

## 📦 Production Deployment

### **1. Update API Base URL**
```javascript
const CONFIG = {
  API_BASE_URL: 'https://api.correctnow.com',  // Production URL
};
```

### **2. Add Error Reporting**
```javascript
// In background.js
if (error) {
  // Send to analytics/logging service
  logError(error);
}
```

### **3. Publish to Chrome Web Store**
1. Create developer account ($5 one-time fee)
2. Upload extension folder
3. Add description, screenshots, permissions explanation
4. Submit for review (24-48 hours)

### **4. Update Manifest for Production**
```json
{
  "host_permissions": [
    "https://gmail.com/*",      // Specific domains only
    "https://docs.google.com/*",
    "https://twitter.com/*"
  ]
}
```

---

## 🎯 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              WEBPAGE (Gmail, Twitter, etc.)          │
│                                                      │
│  <textarea>                    [Check with CorrectNow]
│  ┌────────────────────────────┐       (Floating Button)
│  │ User types here...         │       
│  └────────────────────────────┘       
└─────────────────────────────────────────────────────┘
                    │
                    │ runtime.sendMessage()
                    ▼
┌─────────────────────────────────────────────────────┐
│           CONTENT SCRIPT (content.js)                │
│                                                      │
│  • Detects focus/blur                               │
│  • Shows/hides floating button                      │
│  • Handles button click                             │
│  • Highlights errors                                │
└─────────────────────────────────────────────────────┘
                    │
                    │ runtime.sendMessage()
                    ▼
┌─────────────────────────────────────────────────────┐
│      SERVICE WORKER (background.js)                 │
│                                                      │
│  • Receives messages from content script            │
│  • Makes API calls                                  │
│  • Validates responses                              │
│  • Sends results back                               │
└─────────────────────────────────────────────────────┘
                    │
                    │ fetch()
                    ▼
        ┌──────────────────────┐
        │   YOUR BACKEND API   │
        │  POST /api/check     │
        │  { text: "..." }     │
        │                      │
        │  Returns:            │
        │  { errors: [...] }   │
        └──────────────────────┘
```

---

## 🚀 Next Steps

1. **Test with local API**: Set `API_BASE_URL` to `http://localhost:8787`
2. **Load in Chrome**: Follow installation steps above
3. **Test on real websites**: Gmail, Twitter, Medium, etc.
4. **Deploy backend**: Push to production
5. **Update manifest**: Change API URL to production
6. **Publish**: Submit to Chrome Web Store

---

## 📝 Code Comments

All files include detailed comments explaining:
- Function purpose and parameters
- How communication works
- Why certain design decisions were made
- Configuration options

See inline comments in:
- `manifest.json`: Permission explanations
- `content.js`: Focus detection, button creation, highlighting logic
- `background.js`: Message handling, API integration

---

## ✅ Features Implemented

- ✅ **Manifest V3**: Latest extension standard
- ✅ **Content Script**: DOM injection into all webpages
- ✅ **Service Worker**: API gateway pattern
- ✅ **Runtime Messaging**: Secure communication between scripts
- ✅ **Floating Button**: Non-intrusive UI
- ✅ **Focus Detection**: Captures input/textarea focus
- ✅ **Error Highlighting**: Yellow background wrapping
- ✅ **No Auto-run**: Manual button click only
- ✅ **Text Preservation**: Original content never modified
- ✅ **Error Handling**: Graceful failures with user messages
- ✅ **Performance**: Minimal permissions, fast loading
- ✅ **Security**: No inline styles/scripts, content isolation

---

## ❌ NOT Implemented (By Design)

- ❌ React or frameworks (vanilla JavaScript)
- ❌ Auto-run checks (manual only)
- ❌ Inline tooltips/suggestions
- ❌ Google Docs support
- ❌ Popup UI (floating button only)
- ❌ Page layout modification
- ❌ Text replacement/rewriting

---

## 📞 Support

For issues:
1. Check console logs (DevTools → Console)
2. Verify API endpoint is accessible
3. Check network requests (DevTools → Network)
4. Enable service worker debugging in `chrome://extensions/`

---

**Extension created**: January 2026  
**Manifest Version**: 3 (MV3)  
**Compatibility**: Chrome 88+, Edge, Brave, Opera
