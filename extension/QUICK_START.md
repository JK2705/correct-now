# CorrectNow Chrome Extension - Quick Start Guide

## 📦 Files Created

```
extension/
├── manifest.json      (Extension configuration - MV3 format)
├── content.js         (DOM injection & UI layer)
├── background.js      (Service worker for API calls)
└── README.md          (Full documentation)
```

---

## ⚡ Quick Start (5 minutes)

### **Step 1: Update API URL**
Edit `content.js` (line 10):
```javascript
const CONFIG = {
  API_BASE_URL: 'http://localhost:8787',  // ← Change to your backend URL
};
```

### **Step 2: Load Extension in Chrome**
1. Open `chrome://extensions/`
2. Toggle "Developer mode" (top-right)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. ✅ Extension loaded!

### **Step 3: Test It**
1. Go to any website (Gmail, Twitter, etc.)
2. Click on a text field (textarea or `<input type="text">`)
3. Click the blue "Check with CorrectNow" button
4. See errors highlighted with yellow background

---

## 🎯 How It Works

### **User Flow**
```
User focuses on text field
         ↓
Blue button appears
         ↓
User clicks button
         ↓
Text sent to API (/api/check)
         ↓
Errors highlighted in yellow
         ↓
Message shows: "Found X issues" or "No issues found"
```

### **Architecture**
```
WEBPAGE
  └─→ Content Script (content.js)
        └─→ Service Worker (background.js)
              └─→ Your Backend API (/api/check)
                    └─→ Returns error positions & messages
```

---

## 📡 API Requirements

Your backend must have an endpoint:
```
POST /api/check
Content-Type: application/json

Request:
{
  "text": "user's text here"
}

Response:
{
  "errors": [
    {
      "start": 5,
      "end": 10,
      "message": "Spelling error",
      "suggestion": "corrected word"
    }
  ]
}
```

---

## 🔧 File Breakdown

### **manifest.json**
- Tells Chrome about the extension
- Defines permissions
- Specifies content script and service worker
- **Manifest V3** (latest standard)

### **content.js** (Main Logic)
- Injects into every webpage
- Detects focus on input/textarea
- Shows floating button on focus
- Handles button clicks
- Highlights errors

### **background.js** (Service Worker)
- Receives messages from content script
- Makes API calls
- Validates responses
- Returns results to content script

---

## 🎨 Customization

### **Change Button Text**
In `content.js`:
```javascript
const CONFIG = {
  BUTTON_TEXT: 'Grammar Check',  // ← Change this
};
```

### **Change Highlight Color**
In `content.js`, find `highlightErrors()`:
```javascript
element.style.borderColor = '#fbbf24';  // ← Yellow
// Change to any color: '#ff0000' (red), '#00ff00' (green), etc.
```

### **Change API Timeout**
In `background.js`:
```javascript
const response = await fetch(apiUrl, {
  timeout: 30000,  // ← 30 seconds, change as needed
});
```

---

## ✅ Testing

### **Verify Extension Loaded**
- Go to `chrome://extensions/`
- Look for "CorrectNow - Grammar Checker"
- Should show "Enabled"

### **Test on Websites**
- Gmail (compose email)
- Twitter (tweet field)
- LinkedIn (post field)
- Medium (article field)
- Reddit (comment field)

### **Check Logs**
Press F12 → Console, then:
```javascript
console.log('Extension working');
```

---

## 🐛 Troubleshooting

### **Extension doesn't show button**
- ✅ Reload extension (toggle enable/disable)
- ✅ Check if you're in a text field
- ✅ Open DevTools (F12) → Console for errors

### **Button click does nothing**
- ✅ Verify API URL is correct
- ✅ Check if backend is running
- ✅ Look at Network tab (DevTools → Network)

### **"Error connecting to API"**
- ✅ Ensure backend API is running
- ✅ Verify correct API URL in `content.js`
- ✅ Check CORS settings on backend
- ✅ Look at console for detailed errors

### **Button in wrong position**
- The button should appear at top-right of the text field
- If not, check browser console for positioning errors

---

## 🚀 Production Setup

### **1. Update API URL**
```javascript
// For production
const CONFIG = {
  API_BASE_URL: 'https://api.yourdomain.com',
};
```

### **2. Restrict Permissions** (Optional)
In `manifest.json`, instead of `*://*/*`:
```json
"host_permissions": [
  "https://gmail.com/*",
  "https://twitter.com/*",
  "https://docs.google.com/*"
]
```

### **3. Publish to Chrome Web Store**
1. Create Google Play Developer account ($5)
2. Upload extension
3. Wait 24-48 hours for review
4. Published!

---

## 📋 Checklist

- [ ] Extension folder has all 3 files
- [ ] `API_BASE_URL` updated to your backend
- [ ] Extension loaded in Chrome
- [ ] Tested on multiple websites
- [ ] Floating button appears on focus
- [ ] API calls work (check Network tab)
- [ ] Errors highlighted correctly
- [ ] "No issues found" message works
- [ ] Errors don't auto-run (manual only)
- [ ] Original text is preserved

---

## 📞 Common Questions

**Q: Does it modify the page?**  
A: No. Uses `position: fixed` floating button. Layout unchanged.

**Q: Is text sent automatically?**  
A: No. Only when user clicks the button.

**Q: What text is sent to API?**  
A: Only the text in the focused field. No passwords, history, etc.

**Q: Does it work on all websites?**  
A: Yes, except where JS is restricted (some corporate networks).

**Q: Can I use custom API?**  
A: Yes, just update `API_BASE_URL` in `content.js`.

**Q: Can I customize the button?**  
A: Yes, edit styling in `createFloatingButton()` function.

---

## 🎓 Learning Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
- [Runtime Messaging](https://developer.chrome.com/docs/extensions/mv3/messaging/)

---

**Created**: January 26, 2026  
**Format**: Manifest V3 (Latest)  
**Compatibility**: Chrome 88+, Edge, Brave, Opera  
**Code**: Vanilla JavaScript (No frameworks)
