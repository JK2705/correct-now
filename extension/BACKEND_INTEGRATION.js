/**
 * BACKEND API INTEGRATION GUIDE
 * CorrectNow Chrome Extension
 * 
 * How to add the /api/check endpoint to your Express backend
 * Located at: server/index.js
 */

// ============================================================
// REQUIRED: Add this endpoint to your Express server
// ============================================================

// Add to server/index.js (around line 500-600):

app.post('/api/check', async (req, res) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!text) {
      return res.status(400).json({
        error: 'No text provided',
        errors: []
      });
    }

    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text must be a string',
        errors: []
      });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({
        error: 'Text cannot be empty',
        errors: []
      });
    }

    // Limit text length to prevent abuse
    const MAX_TEXT_LENGTH = 5000;
    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`,
        errors: []
      });
    }

    // Call your grammar checking service
    // This assumes you're using Google Gemini API (from your current setup)
    const errors = await checkGrammarWithGemini(text);

    // Return structured response
    res.json({
      errors: errors,           // Array of error objects
      corrections: [],          // Optional: corrected text segments
      summary: `Found ${errors.length} issue${errors.length === 1 ? '' : 's'}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Grammar check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errors: []
    });
  }
});

// ============================================================
// HELPER FUNCTION: Call Gemini API for Grammar Checking
// ============================================================

async function checkGrammarWithGemini(text) {
  const genai = require("@google/generative-ai");
  const client = new genai.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ 
    model: process.env.GEMINI_MODEL || "gemini-2.5-pro" 
  });

  const prompt = `You are a grammar and spelling checker. Analyze this text for errors.

Text: "${text}"

Return ONLY a JSON array with this exact structure. No markdown, no explanation:
[
  {
    "start": 0,
    "end": 5,
    "message": "Spelling error",
    "suggestion": "corrected_word"
  }
]

Rules:
- "start" is the character position where the error begins (0-indexed)
- "end" is the character position where the error ends (exclusive)
- "message" describes the error (max 50 chars)
- "suggestion" is the correction (max 30 chars)
- Return empty array [] if no errors found
- Be conservative - only flag clear mistakes
- Count characters accurately including spaces`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON response
    let errors = [];
    try {
      errors = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (jsonMatch) {
        errors = JSON.parse(jsonMatch[0]);
      }
    }

    // Validate and sanitize errors
    if (!Array.isArray(errors)) {
      return [];
    }

    // Ensure all errors have required fields
    return errors.filter(err => 
      typeof err.start === 'number' &&
      typeof err.end === 'number' &&
      typeof err.message === 'string' &&
      err.start >= 0 &&
      err.end > err.start &&
      err.end <= text.length
    ).map(err => ({
      start: err.start,
      end: err.end,
      message: err.message.substring(0, 50),
      suggestion: err.suggestion ? err.suggestion.substring(0, 30) : ''
    }));

  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to check grammar');
  }
}

// ============================================================
// ALTERNATIVE: Using Existing Proofreading Logic
// ============================================================

// If you already have a proofreading function in ProofreadingEditor.tsx,
// you can reuse it. Call it from the backend like this:

async function checkGrammarWithExisting(text) {
  // Reuse your existing grammar checking logic
  // from src/lib/suggestions.ts or similar
  
  try {
    // Call your existing API that ProofreadingEditor uses
    const response = await fetch('http://localhost:8787/api/proofread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    
    // Transform to extension format
    return data.suggestions.map(suggestion => ({
      start: suggestion.start,
      end: suggestion.end,
      message: suggestion.type,
      suggestion: suggestion.correction
    }));

  } catch (error) {
    console.error('Error calling existing API:', error);
    return [];
  }
}

// ============================================================
// CORS CONFIGURATION (if needed)
// ============================================================

// Add this if you get CORS errors from the extension:

// Make sure CORS is enabled in server/index.js:

const cors = require('cors');

app.use(cors({
  origin: '*',  // Allow all origins (or specify: ['chrome-extension://...'])
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

// Or for more specific CORS with extension:

const extensionCors = cors({
  origin: function(origin, callback) {
    // Allow any chrome extension
    if (!origin || origin.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
});

app.post('/api/check', extensionCors, async (req, res) => {
  // ... your handler code
});

// ============================================================
// TESTING THE ENDPOINT
// ============================================================

// Test with curl:
/*
curl -X POST http://localhost:8787/api/check \
  -H "Content-Type: application/json" \
  -d '{"text": "I havve a speling error"}'

Expected response:
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
      "message": "Spelling error: 'speling'",
      "suggestion": "spelling"
    }
  ],
  "summary": "Found 2 issues",
  "timestamp": "2026-01-26T12:00:00.000Z"
}
*/

// Test with Node.js:
/*
const testData = { text: "This is a test" };
fetch('http://localhost:8787/api/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => console.log(data));
*/

// ============================================================
// RATE LIMITING (Optional but Recommended)
// ============================================================

// Add rate limiting to prevent abuse:

const rateLimit = require('express-rate-limit');

const checkLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 30,                   // 30 requests per minute per IP
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/check', checkLimiter, async (req, res) => {
  // ... handler code
});

// In package.json, add:
// "express-rate-limit": "^6.0.0"

// ============================================================
// AUTHENTICATION (Optional but Recommended)
// ============================================================

// If you want to tie API calls to users, add auth:

app.post('/api/check', checkLimiter, async (req, res) => {
  try {
    // Verify Firebase token if needed
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;
      console.log('Check request from user:', userId);
      
      // Can track credits, usage, etc.
      // Update user credits in Firestore
    }

    const { text } = req.body;
    const errors = await checkGrammarWithGemini(text);

    res.json({
      errors,
      summary: `Found ${errors.length} issues`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error', errors: [] });
  }
});

// In content.js, add auth header:
/*
chrome.runtime.sendMessage({
  action: 'checkGrammar',
  text: text,
  apiBase: CONFIG.API_BASE_URL,
  token: userToken  // Add this
});
*/

// In background.js:
/*
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${request.token}`  // Add this
  },
  body: JSON.stringify({ text: request.text })
});
*/

// ============================================================
// PRODUCTION DEPLOYMENT
// ============================================================

// 1. Update API URL in extension
//    In content.js: API_BASE_URL = 'https://your-api-domain.com'

// 2. Add environment variables to .env
//    GEMINI_API_KEY=...
//    GEMINI_MODEL=gemini-2.5-pro

// 3. Test on production server
//    curl -X POST https://your-api-domain.com/api/check \
//      -H "Content-Type: application/json" \
//      -d '{"text": "test"}'

// 4. Monitor logs
//    Check server logs for /api/check requests

// 5. Track metrics
//    - Request count
//    - Average response time
//    - Error rate
//    - User feedback

// ============================================================
// TROUBLESHOOTING
// ============================================================

/*
ERROR: "Cannot POST /api/check"
- Verify route is added to server/index.js
- Check server is running on correct port
- Verify API_BASE_URL in content.js matches server URL

ERROR: "CORS policy: blocked"
- Add cors() middleware (see above)
- Allow 'chrome-extension://' origin

ERROR: "Unexpected token < in JSON"
- API is returning HTML (error page) instead of JSON
- Check server error logs
- Verify endpoint exists

ERROR: "Request timeout"
- Gemini API taking too long
- Increase timeout in background.js
- Check Gemini API rate limits

ERROR: "Invalid response format"
- Gemini response not valid JSON
- Add response validation (see above)
- Log raw response for debugging
*/

// ============================================================
// MONITORING & DEBUGGING
// ============================================================

// Add logging to track extension usage:

app.post('/api/check', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { text } = req.body;
    const textLength = text.length;
    
    const errors = await checkGrammarWithGemini(text);
    const duration = Date.now() - startTime;
    
    // Log metrics
    console.log(`[/api/check] Text length: ${textLength}, Errors: ${errors.length}, Duration: ${duration}ms`);
    
    res.json({
      errors,
      summary: `Found ${errors.length} issues`,
      timestamp: new Date().toISOString(),
      processingTime: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[/api/check] Error after ${duration}ms:`, error.message);
    res.status(500).json({
      error: error.message,
      errors: [],
      processingTime: duration
    });
  }
});

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================

// Verify API is working:

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CorrectNow Grammar Checker',
    endpoints: ['/api/check'],
    timestamp: new Date().toISOString()
  });
});

// Test: curl http://localhost:8787/api/health

// ============================================================
// SUMMARY
// ============================================================

/*
✅ Added:
  1. POST /api/check endpoint
  2. Grammar checking with Gemini API
  3. Input validation
  4. Error handling
  5. CORS support
  6. Response formatting
  
✅ Ready for:
  - Local testing
  - Production deployment
  - Extension integration
  - User feedback
  
✅ Optional additions:
  - Rate limiting
  - Authentication
  - Monitoring
  - Caching
  
Test endpoint with curl or browser, then update extension's API_BASE_URL.
*/
