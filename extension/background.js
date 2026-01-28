/**
 * CorrectNow Background Service Worker (Manifest V3)
 * Handles API communication for grammar checking
 * - Receives messages from content.js
 * - Makes API calls to the grammar checking backend
 * - Returns structured error responses
 */

console.log('🔧 CorrectNow Service Worker loaded');

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request.action);
  console.log('📍 From:', sender.url);
  
  if (request.action === 'checkGrammar') {
    // Handle async with promise
    handleGrammarCheck(request, sender)
      .then(sendResponse)
      .catch(error => {
        console.error('❌ Unhandled error:', error);
        sendResponse({
          error: error.message || 'Unknown error occurred',
          details: error.toString(),
        });
      });
    // Return true to indicate async response
    return true;
  }
});

/**
 * Handle grammar check request
 * Calls the backend API and returns results
 */
async function handleGrammarCheck(request, sender) {
  try {
    const { text, apiBase } = request;

    console.log('📝 Text length:', text.length);
    console.log('🌐 API Base:', apiBase);

    if (!text || text.trim() === '') {
      console.log('❌ Empty text');
      return { error: 'Empty text provided' };
    }

    // Construct API URL
    const apiUrl = `${apiBase}/api/check`;

    console.log('🔗 Making request to:', apiUrl);

    // Make fetch request to backend API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('📨 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error:', response.status, errorText);
      return {
        error: `API error: ${response.status} ${response.statusText}`,
        details: errorText,
      };
    }

    // Parse API response
    const data = await response.json();
    console.log('📤 Response received:', data);

    // Validate response format
    if (!data.errors || !Array.isArray(data.errors)) {
      console.error('❌ Invalid response format');
      return {
        error: 'Invalid API response format',
        details: data,
      };
    }

    // Return parsed errors
    console.log('✅ Returning errors:', data.errors.length);
    return {
      errors: data.errors,
      corrections: data.corrections || [],
      summary: data.summary || null,
    };
  } catch (error) {
    console.error('❌ Grammar check error:', error);
    return {
      error: error.message || 'Unknown error occurred',
      details: error.toString(),
    };
  }
}

/**
 * Extension lifecycle hooks
 */

// On extension install or update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('CorrectNow extension installed');
    // Optionally open welcome page
    // chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('CorrectNow extension updated');
  }
});

// Optional: Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Show notification or perform action when extension icon is clicked
  console.log('Extension icon clicked on tab:', tab.id);
});
