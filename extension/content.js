/**
 * CorrectNow Content Script
 * Injects grammar checking functionality into webpages
 * - Detects input/textarea focus
 * - Shows floating "Check with CorrectNow" button
 * - Communicates with background.js for API calls
 * - Highlights grammar errors with yellow background
 */

// Configuration
const CONFIG = {
  API_BASE_URL: 'http://localhost:8787', // Change to your API URL
  BUTTON_TEXT: 'Check with CorrectNow',
  BUTTON_CLASS: 'correctnow-check-button',
  HIGHLIGHT_CLASS: 'correctnow-error-highlight',
  MESSAGE_CLASS: 'correctnow-message',
};

let currentFocusedElement = null;
let floatingButton = null;
let applyAllButton = null; // Apply All button
let highlightedRanges = [];
let originalContent = null; // Store original content for restoration
let isCheckingInProgress = false; // Prevent concurrent checks
let hoverTooltip = null; // Hover correction tooltip
let currentErrors = []; // Store errors for correction
let lastCheckedText = ''; // Store last checked text to align offsets
let lastCorrectedText = ''; // Store last corrected text to prevent re-checking

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Create and position the floating button
 */
function createFloatingButton() {
  const button = document.createElement('button');
  button.className = CONFIG.BUTTON_CLASS;
  button.textContent = CONFIG.BUTTON_TEXT;
  button.type = 'button';
  button.title = 'Click to check grammar with CorrectNow';

  // Style the button
  button.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    padding: 8px 12px;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    pointer-events: auto;
    user-select: none;
  `;
  
  console.log('🔷 Button created');

  // Hover effect
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#1d4ed8';
    button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#2563eb';
    button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  });

  // Click handler with immediate logging
  button.addEventListener('click', (e) => {
    console.log('🟢 BUTTON CLICKED - Event captured!', e);
    e.preventDefault();
    e.stopPropagation();
    handleCheckClick();
  }, true);

  return button;
}

/**
 * Position the button near the focused element
 */
function positionButton(element, button) {
  const rect = element.getBoundingClientRect();
  const offset = 5;

  // Position: top-right corner of the input
  const top = rect.top + window.scrollY - 5;
  const left = rect.right + window.scrollX + offset;

  button.style.top = top + 'px';
  button.style.left = left + 'px';
}

/**
 * Show floating button on input/textarea focus
 */
function handleFocus(event) {
  const element = event.target;

  // Only attach to textarea and text inputs
  if (!isEditableField(element)) return;

  // Clear previous highlights
  clearHighlights();

  // For Gmail and similar editors, find the main compose container
  let targetElement = element;
  if (element.isContentEditable) {
    // Walk up the tree to find the root contentEditable container
    let parent = element.parentElement;
    while (parent && parent.isContentEditable) {
      targetElement = parent;
      parent = parent.parentElement;
    }
    console.log('🎯 Found compose container:', targetElement.className || targetElement.tagName);
  }

  // Store focused element
  currentFocusedElement = targetElement;

  // Create button if it doesn't exist
  if (!floatingButton || !document.body.contains(floatingButton)) {
    console.log('🔷 Creating new button');
    floatingButton = createFloatingButton();
    document.body.appendChild(floatingButton);
  } else {
    console.log('🔷 Reusing existing button');
  }

  // Position and show button
  positionButton(targetElement, floatingButton);
  floatingButton.style.display = 'block';
  floatingButton.style.opacity = '1';
  console.log('🔷 Button shown at position:', floatingButton.style.left, floatingButton.style.top);
}

/**
 * Hide floating button on blur
 */
function handleBlur(event) {
  // Don't hide if user is clicking the button
  if (event && event.relatedTarget === floatingButton) {
    console.log('🔷 Button blur - button clicked, keeping state');
    return;
  }
  
  if (floatingButton) {
    // Keep button visible but make it slightly transparent
    floatingButton.style.opacity = '0.7';
    console.log('🔷 Button blur - keeping visible');
  }
  // Don't clear currentFocusedElement - keep it for button clicks
}

/**
 * Check if element is an editable field
 */
function isEditableField(element) {
  if (element.tagName === 'TEXTAREA') return true;
  if (element.tagName === 'INPUT' && element.type === 'text') return true;
  if (element.isContentEditable) return true;
  return false;
}

/**
 * Handle "Check with CorrectNow" button click
 */
function handleCheckClick() {
  console.log('🔵 Button clicked');
  
  // Prevent concurrent checks
  if (isCheckingInProgress) {
    console.log('⏳ Check already in progress, skipping');
    return;
  }
  
  if (!currentFocusedElement) {
    console.log('❌ No focused element');
    return;
  }

  // Extract text based on element type
  let text;
  if (currentFocusedElement.value !== undefined) {
    // textarea or input
    text = currentFocusedElement.value;
  } else if (currentFocusedElement.textContent !== undefined) {
    // contentEditable div (Gmail, etc.)
    text = currentFocusedElement.textContent;
  } else if (currentFocusedElement.innerText !== undefined) {
    // fallback
    text = currentFocusedElement.innerText;
  } else {
    text = '';
  }
  
  console.log('📝 Text extracted:', text ? text.substring(0, 50) + '...' : '(empty)');
  console.log('📝 Text length:', text ? text.length : 0);

  if (!text || text.trim() === '') {
    showMessage('Please enter some text to check', 'warning');
    console.log('⚠️ Text is empty');
    return;
  }

  // Check if this is the same text we just corrected - skip checking
  if (lastCorrectedText && text === lastCorrectedText) {
    console.log('✅ Text was just corrected, skipping check');
    showMessage('No issues found', 'success');
    return;
  }

  // Store the exact text sent to the API for accurate highlighting
  lastCheckedText = text;

  // Clear any previous highlights before starting new check
  clearHighlights();

  // Show loading state
  isCheckingInProgress = true;
  floatingButton.disabled = true;
  floatingButton.textContent = 'Checking...';
  console.log('⏳ Sending message to service worker...');
  console.log('📤 API Base URL:', CONFIG.API_BASE_URL);

  // Timeout to reset button if no response (10 seconds)
  let checkTimeout;
  const resetButton = () => {
    isCheckingInProgress = false;
    if (floatingButton) {
      floatingButton.disabled = false;
      floatingButton.textContent = CONFIG.BUTTON_TEXT;
    }
  };

  checkTimeout = setTimeout(() => {
    console.error('❌ Check timeout - no response after 60 seconds');
    showMessage('Request timed out. API might be slow or rate-limited. Wait a few minutes and try again.', 'error');
    resetButton();
  }, 60000);

  // Send message to background.js
  chrome.runtime.sendMessage(
    {
      action: 'checkGrammar',
      text: text,
      apiBase: CONFIG.API_BASE_URL,
    },
    (response) => {
      clearTimeout(checkTimeout);
      console.log('📥 Response received:', response);
      
      resetButton();

      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError;
        console.error('❌ Runtime error:', error);
        showMessage('Error: ' + error.message, 'error');
        return;
      }

      if (!response) {
        console.log('❌ No response');
        showMessage('No response from API', 'error');
        return;
      }

      if (response.error) {
        console.error('❌ API error:', response.error);
        showMessage(`Error: ${response.error}`, 'error');
        return;
      }

      if (response.errors && response.errors.length > 0) {
        console.log('📨 Raw API response errors:', response.errors);
        
        // Use API positions directly (clamped) and realign using `original` when provided
        const fullText = lastCheckedText || (currentFocusedElement.value !== undefined
          ? currentFocusedElement.value
          : (currentFocusedElement.textContent || currentFocusedElement.innerText || ''));
        const fixedErrors = [];
        const usedPositions = new Set();

        const findOccurrences = (text, target) => {
          const indices = [];
          if (!target) return indices;
          let startIndex = 0;
          while (startIndex < text.length) {
            const idx = text.indexOf(target, startIndex);
            if (idx === -1) break;
            indices.push(idx);
            startIndex = idx + Math.max(1, target.length);
          }
          return indices;
        };

        const pickClosest = (occurrences, preferredStart, length) => {
          if (occurrences.includes(preferredStart)) return preferredStart;
          let best = null;
          let bestDist = Infinity;
          occurrences.forEach((idx) => {
            const posKey = `${idx}-${idx + length}`;
            if (usedPositions.has(posKey)) return;
            const dist = Math.abs(idx - preferredStart);
            if (dist < bestDist) {
              best = idx;
              bestDist = dist;
            }
          });
          return best;
        };
        
        response.errors.forEach(err => {
          if (!err.suggestion || err.start === undefined || err.end === undefined) return;

          const clampedStart = Math.max(0, Math.min(err.start, fullText.length));
          const clampedEnd = Math.max(clampedStart, Math.min(err.end, fullText.length));

          if (clampedEnd <= clampedStart) {
            console.log('⚠️ Skipping error with invalid range:', err);
            return;
          }

          let start = clampedStart;
          let end = clampedEnd;

          // Extract what's at the API position
          const textAtPosition = fullText.substring(clampedStart, clampedEnd).trim();
          const original = typeof err.original === 'string' ? err.original.trim() : '';

          console.log(`📍 API position [${clampedStart}-${clampedEnd}]: "${textAtPosition}", original: "${original}", suggestion: "${err.suggestion}"`);

          // Strategy 1: If original field provided and it's in the text, use it
          if (original && original.length > 0) {
            let occurrences = findOccurrences(fullText, original);

            // Case-insensitive fallback
            if (occurrences.length === 0) {
              const lowerText = fullText.toLowerCase();
              const lowerOrig = original.toLowerCase();
              const tempOccurrences = findOccurrences(lowerText, lowerOrig);
              occurrences = tempOccurrences.map(idx => idx); // Map back to original indices
            }

            if (occurrences.length > 0) {
              const chosen = pickClosest(occurrences, clampedStart, original.length);
              if (chosen !== null && chosen !== undefined) {
                start = chosen;
                end = Math.min(fullText.length, chosen + original.length);
                console.log(`✅ Found original "${original}" at [${start}-${end}]`);
              }
            }
          }

          // Strategy 2: If original wasn't found or not provided, try to find error word at position
          if (start === clampedStart && end === clampedEnd) {
            // Look for word boundaries around the API position
            // Find start of word
            let wordStart = clampedStart;
            while (wordStart > 0 && /[a-zA-Z]/.test(fullText[wordStart - 1])) {
              wordStart--;
            }

            // Find end of word
            let wordEnd = clampedEnd;
            while (wordEnd < fullText.length && /[a-zA-Z]/.test(fullText[wordEnd])) {
              wordEnd++;
            }

            const wordAtPosition = fullText.substring(wordStart, wordEnd);

            // If we found a valid word and it's different from what API suggested
            if (wordAtPosition && wordAtPosition.length > 0 &&
                wordAtPosition.toLowerCase() !== err.suggestion.toLowerCase()) {
              start = wordStart;
              end = wordEnd;
              console.log(`✅ Expanded to word boundaries: "${wordAtPosition}" at [${start}-${end}]`);
            } else {
              // If word boundary expansion gave us the same as suggestion, skip this error
              console.log(`⚠️ Word boundary expansion matched suggestion, skipping`);
              return;
            }
          }

          // Get the actual text that will be underlined
          const actualText = fullText.substring(start, end).trim();
          const suggestionTrimmed = err.suggestion.trim();

          // Skip if the actual text and suggestion are the same (case-insensitive)
          if (actualText.toLowerCase() === suggestionTrimmed.toLowerCase()) {
            console.log(`⚠️ Skipping error: actual text "${actualText}" matches suggestion "${suggestionTrimmed}"`);
            return;
          }

          // Skip if actualText is a substring of suggestion or vice versa (likely position error)
          if (suggestionTrimmed.toLowerCase().includes(actualText.toLowerCase()) ||
              actualText.toLowerCase().includes(suggestionTrimmed.toLowerCase())) {
            // Only skip if they're not exactly the same (already handled above)
            if (actualText.length < suggestionTrimmed.length / 2 ||
                suggestionTrimmed.length < actualText.length / 2) {
              console.log(`⚠️ Skipping error: actualText "${actualText}" and suggestion "${suggestionTrimmed}" have suspicious overlap`);
              return;
            }
          }

          // Skip if suggestion doesn't make sense (is a substring of a longer suggestion for different range)
          if (suggestionTrimmed.length > 100) {
            console.log(`⚠️ Skipping error: suggestion too long (${suggestionTrimmed.length} chars)`);
            return;
          }

          // Skip very short matches (1-2 chars) unless it's a clear typo
          if (actualText.length <= 2 && suggestionTrimmed.length > 3) {
            console.log(`⚠️ Skipping error: actualText too short ("${actualText}") for suggestion "${suggestionTrimmed}"`);
            return;
          }

          const posKey = `${start}-${end}`;
          if (usedPositions.has(posKey)) return;

          fixedErrors.push({
            ...err,
            start,
            end,
            type: err.type || 'spelling',
            message: err.message || 'Spelling error',
            suggestion: err.suggestion,
          });
          usedPositions.add(posKey);
        });
        
        console.log('✅ Errors with corrected positions:', fixedErrors);
        
        if (fixedErrors.length > 0) {
          highlightErrors(currentFocusedElement, fixedErrors);
          showMessage(`Found ${fixedErrors.length} issue(s)`, 'info');
          
          // Show Apply All button if multiple errors
          if (fixedErrors.length >= 2) {
            showApplyAllButton();
          }
        } else {
          clearHighlights();
          showMessage('No issues found', 'success');
        }
      } else {
        console.log('✅ No errors found');
        clearHighlights(); // Clear any previous highlights
        showMessage('No issues found', 'success');
      }
    }
  );
}

/**
 * Highlight grammar errors in the input/textarea
 * For contentEditable: underline errors in red
 * For input/textarea: show yellow border + message
 */
function highlightErrors(element, errors) {
  // Clear previous highlights
  clearHighlights();
  
  // Store errors for correction
  currentErrors = errors;

  const isTextInput = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT';
  
  console.log('📍 Highlighting', errors.length, 'errors');
  console.log('Errors to highlight:', errors.map(e => `${e.start}-${e.end}`).join(', '));

  // For contentEditable elements (like Gmail compose), wrap error text in red underlines
  if (!isTextInput && element.isContentEditable) {
    // Store original HTML for restoration
    originalContent = element.innerHTML;

    // Get the full text content
    const fullText = element.textContent || element.innerText || '';
    console.log('📄 Full text length:', fullText.length);

    if (errors.length > 0) {
      // Get the full text to verify positions match
      const fullText = element.textContent || element.innerText || '';
      console.log('📄 Full text:', `"${fullText}"`);
      
      // Verify error positions
      errors.forEach(err => {
        const errorText = fullText.substring(err.start, err.end);
        console.log(`  Error [${err.start}-${err.end}]: "${errorText}" (should be corrected to "${err.suggestion}")`);
      });
      
      // Walk through DOM and apply spans to text nodes
      let charIndex = 0;
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const nodesToProcess = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent.trim().length === 0) {
          charIndex += node.textContent.length;
          continue;
        }
        
        const nodeStart = charIndex;
        const nodeEnd = charIndex + node.textContent.length;
        
        console.log(`📦 Text node [${nodeStart}-${nodeEnd}]: "${node.textContent.substring(0, 30)}"`);
        
        // Find errors that overlap this node
        const overlappingErrors = errors.filter(err => 
          err.start < nodeEnd && err.end > nodeStart
        );

        if (overlappingErrors.length > 0) {
          nodesToProcess.push({ node, nodeStart, errors: overlappingErrors });
        }

        charIndex = nodeEnd;
      }

      // Apply highlighting to text nodes (in reverse to maintain indices)
      nodesToProcess.reverse().forEach(({ node, nodeStart, errors: nodeErrors }) => {
        const fragment = document.createDocumentFragment();
        const text = node.textContent;
        let lastEnd = 0;

        // Sort errors by start position
        const sortedErrors = nodeErrors.sort((a, b) => a.start - b.start);

        sortedErrors.forEach(err => {
          const errStartInNode = Math.max(0, err.start - nodeStart);
          const errEndInNode = Math.min(text.length, err.end - nodeStart);

          console.log(`🎯 Span [${errStartInNode}-${errEndInNode}] in node for error at [${err.start}-${err.end}]`);

          // Add text before error
          if (errStartInNode > lastEnd) {
            fragment.appendChild(
              document.createTextNode(text.substring(lastEnd, errStartInNode))
            );
          }

          // Add error span
          const span = document.createElement('span');
          span.textContent = text.substring(errStartInNode, errEndInNode);
          span.style.cssText = `
            display: inline;
            text-decoration: underline #ef4444;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
            cursor: pointer;
            background-color: rgba(239, 68, 68, 0.1);
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
            white-space: normal;
            word-wrap: break-word;
          `;
          span.title = err.message || 'Spelling error';
          span.dataset.suggestion = err.suggestion || '';

          // Add hover tooltip with proper cleanup
          span.addEventListener('mouseenter', (e) => {
            showCorrectionTooltip(e, err);
          });

          span.addEventListener('mouseleave', () => {
            // Delay hiding to allow moving to tooltip
            if (tooltipHideTimeout) {
              clearTimeout(tooltipHideTimeout);
            }
            tooltipHideTimeout = setTimeout(hideCorrectionTooltip, 300);
          });

          fragment.appendChild(span);
          lastEnd = errEndInNode;
        });

        // Add remaining text
        if (lastEnd < text.length) {
          fragment.appendChild(
            document.createTextNode(text.substring(lastEnd))
          );
        }

        node.parentNode.replaceChild(fragment, node);
      });
    }

    highlightedRanges.push(element);
  } else if (isTextInput) {
    // For regular inputs/textareas, show yellow border (can't directly highlight text)
    element.style.borderColor = '#fbbf24';
    element.style.borderWidth = '2px';
    element.style.outline = '2px solid rgba(251, 191, 36, 0.8)';
    element.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.1)';
    highlightedRanges.push(element);
  }

  // Build detailed message with line breaks preserved
  const errorMessages = errors
    .map((err, idx) => {
      const start = err.start || 0;
      const end = err.end || start + 1;
      const elementText = isTextInput ? element.value : (element.textContent || '');
      const context = elementText.substring(
        Math.max(0, start - 10),
        Math.min(elementText.length, end + 10)
      );
      return `${idx + 1}. ${err.message || 'Grammar error'}\n   Context: "...${context}..."`;
    })
    .join('\n');

  showMessage(
    errors.length ? `Issues found:\n${errorMessages}` : 'No issues found',
    errors.length ? 'info' : 'success',
    true
  );
}

/**
 * Clear all highlights
 */
function clearHighlights() {
  highlightedRanges.forEach((element) => {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      // Clear input styles
      element.style.borderColor = '';
      element.style.borderWidth = '';
      element.style.outline = '';
      element.style.boxShadow = '';
    } else if (element.isContentEditable && originalContent) {
      // Restore original content (without spans)
      element.innerHTML = originalContent;
      originalContent = null;
    }
  });
  highlightedRanges = [];
  currentErrors = [];
  hideCorrectionTooltip();
  hideApplyAllButton();

  // Clear the last corrected text when highlights are cleared
  lastCorrectedText = '';
}

/**
 * Create and show Apply All button
 */
function showApplyAllButton() {
  if (!applyAllButton) {
    applyAllButton = document.createElement('button');
    applyAllButton.textContent = '✓ Apply All Corrections';
    applyAllButton.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      padding: 10px 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      white-space: nowrap;
      visibility: hidden;
    `;

    applyAllButton.addEventListener('mouseenter', () => {
      applyAllButton.style.transform = 'translateY(-2px)';
      applyAllButton.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.5)';
    });
    
    applyAllButton.addEventListener('mouseleave', () => {
      applyAllButton.style.transform = 'translateY(0)';
      applyAllButton.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
    });
    
    applyAllButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      applyAllCorrections();
    });
    
    document.body.appendChild(applyAllButton);
    console.log('✅ Apply All button created and shown');
  }

  applyAllButton.style.display = 'block';

  // Measure after in DOM so we can clamp without cutting off text
  const buttonRect = applyAllButton.getBoundingClientRect();
  const minPad = 10;
  const margin = 12;
  const btnWidth = buttonRect.width || 0;
  const btnHeight = buttonRect.height || 0;

  if (floatingButton) {
    const rect = floatingButton.getBoundingClientRect();
    let top = rect.top - btnHeight - margin;
    let left = rect.left;

    if (top < minPad) {
      top = rect.bottom + margin; // if above viewport, place below button
    }

    // Clamp horizontally so the button stays fully visible
    if (left + btnWidth + minPad > window.innerWidth) {
      left = Math.max(minPad, window.innerWidth - btnWidth - minPad);
    }
    if (left < minPad) {
      left = minPad;
    }

    applyAllButton.style.top = `${Math.round(top)}px`;
    applyAllButton.style.left = `${Math.round(left)}px`;
    applyAllButton.style.right = 'auto';
    applyAllButton.style.bottom = 'auto';
    applyAllButton.style.minWidth = `${Math.max(rect.width, btnWidth)}px`;
  } else {
    // Fallback position if button not available
    applyAllButton.style.top = 'auto';
    applyAllButton.style.right = 'auto';
    applyAllButton.style.left = `${minPad}px`;
    applyAllButton.style.bottom = '80px';
    applyAllButton.style.minWidth = '180px';
  }

  applyAllButton.style.visibility = 'visible';
}

/**
 * Hide Apply All button
 */
function hideApplyAllButton() {
  if (applyAllButton) {
    applyAllButton.remove();
    applyAllButton = null;
  }
}

/**
 * Apply all corrections at once
 */
function applyAllCorrections() {
  console.log('✅ Applying all corrections. Current errors:', currentErrors.length);
  
  if (!currentFocusedElement) {
    console.log('❌ No focused element');
    return;
  }
  
  if (currentErrors.length === 0) {
    console.log('❌ No errors in currentErrors array');
    return;
  }
  
  // Get all error spans (only those with our specific underline styling)
  const errorSpans = Array.from(currentFocusedElement.querySelectorAll('span[data-suggestion][style*="text-decoration"]'));
  console.log('Found', errorSpans.length, 'error spans in DOM');
  
  if (errorSpans.length === 0) {
    console.log('❌ No error spans found in DOM');
    return;
  }
  
  // Replace each span with its suggestion
  let appliedCount = 0;
  errorSpans.forEach((span, idx) => {
    const suggestion = span.dataset.suggestion;
    const currentText = span.textContent;
    
    console.log(`Span ${idx}: text="${currentText}" suggestion="${suggestion}"`);
    
    if (suggestion && suggestion.trim() && span.parentNode) {
      const textNode = document.createTextNode(suggestion);
      span.parentNode.replaceChild(textNode, span);
      appliedCount++;
      console.log(`✅ Replaced "${currentText}" → "${suggestion}"`);
    } else {
      console.log(`⚠️ Skipped span ${idx}: no suggestion or parent`);
    }
  });
  
  console.log('Applied', appliedCount, 'of', errorSpans.length, 'corrections');
  
  // Normalize to merge text nodes
  if (currentFocusedElement) {
    currentFocusedElement.normalize();
    originalContent = currentFocusedElement.innerHTML;

    // Store the corrected text to prevent re-checking
    const correctedText = currentFocusedElement.value !== undefined
      ? currentFocusedElement.value
      : (currentFocusedElement.textContent || currentFocusedElement.innerText || '');
    lastCorrectedText = correctedText;
    console.log('📝 Updated originalContent and stored corrected text');
  }

  // Clear state
  currentErrors = [];
  highlightedRanges = [];
  hideCorrectionTooltip();
  hideApplyAllButton();
  
  if (appliedCount > 0) {
    showMessage(`Applied ${appliedCount} correction(s)!`, 'success');
  } else {
    showMessage('No corrections applied', 'error');
  }
}

/**
 * Show correction tooltip on hover
 */
let tooltipHideTimeout = null;

function showCorrectionTooltip(event, error) {
  // Clear any pending hide timeout
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }

  // If tooltip already exists, remove it first to show the new one
  if (hoverTooltip) {
    hoverTooltip.remove();
    hoverTooltip = null;
  }

  const span = event.target;
  const rect = span.getBoundingClientRect();

  const tooltip = document.createElement('div');
  tooltip.className = 'correctnow-tooltip';
  tooltip.style.cssText = `
    position: fixed;
    z-index: 2147483646;
    background: white;
    border: 2px solid #ef4444;
    border-radius: 8px;
    padding: 10px 14px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    min-width: 150px;
    max-width: 300px;
    pointer-events: auto;
    transition: opacity 0.2s ease;
  `;

  const hasSuggestion = error.suggestion && error.suggestion.trim() && error.suggestion !== 'No suggestion';

  console.log('🎯 Showing tooltip for:', error.message, 'Suggestion:', error.suggestion, 'Has valid suggestion:', hasSuggestion);

  tooltip.innerHTML = `
    <div style="color: #666; font-size: 11px; margin-bottom: 6px; line-height: 1.4;">${escapeHtml(error.message || 'Spelling error')}</div>
    <div style="font-weight: 600; color: ${hasSuggestion ? '#10b981' : '#999'}; margin-bottom: ${hasSuggestion ? '8px' : '0'}; line-height: 1.4;">${escapeHtml(error.suggestion || 'No suggestion available')}</div>
    ${hasSuggestion ? `<button style="
      background: #10b981;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 14px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 500;
      width: 100%;
      transition: background 0.2s ease;
    " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">Apply correction</button>` : ''}
  `;

  document.body.appendChild(tooltip);

  // Position tooltip with better centering
  const tooltipRect = tooltip.getBoundingClientRect();
  let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
  let top = rect.bottom + window.scrollY + 8;

  // Keep within viewport horizontally
  if (left + tooltipRect.width > window.innerWidth - 10) {
    left = window.innerWidth - tooltipRect.width - 10;
  }
  if (left < 10) left = 10;

  // Keep within viewport vertically - show above if no space below
  if (top + tooltipRect.height > window.innerHeight + window.scrollY - 10) {
    top = rect.top + window.scrollY - tooltipRect.height - 8;
  }

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';

  // Keep tooltip visible when hovering over it
  tooltip.addEventListener('mouseenter', () => {
    if (tooltipHideTimeout) {
      clearTimeout(tooltipHideTimeout);
      tooltipHideTimeout = null;
    }
  });

  tooltip.addEventListener('mouseleave', () => {
    // Hide after a short delay when leaving tooltip
    tooltipHideTimeout = setTimeout(hideCorrectionTooltip, 300);
  });

  // Apply button click handler (only if suggestion exists)
  if (hasSuggestion) {
    const applyBtn = tooltip.querySelector('button');
    if (applyBtn) {
      applyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tooltipHideTimeout) {
          clearTimeout(tooltipHideTimeout);
          tooltipHideTimeout = null;
        }
        applyCorrection(span, error);
        hideCorrectionTooltip();
      });
    }
  }

  hoverTooltip = tooltip;
}

/**
 * Hide correction tooltip
 */
function hideCorrectionTooltip() {
  // Clear any pending timeout
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }

  // Remove tooltip if it exists
  if (hoverTooltip) {
    hoverTooltip.remove();
    hoverTooltip = null;
  }
}

/**
 * Apply correction to the text
 */
function applyCorrection(span, error) {
  if (!error.suggestion || !currentFocusedElement) {
    console.log('❌ Cannot apply correction - missing suggestion or element');
    return;
  }
  
  console.log('✏️ Applying correction from:', span.textContent, 'to:', error.suggestion);
  
  try {
    // Replace the span with corrected text
    const textNode = document.createTextNode(error.suggestion);
    if (span.parentNode) {
      span.parentNode.replaceChild(textNode, span);
      console.log('✅ Replaced span with text node');
      
      // Force normalize to merge adjacent text nodes
      if (span.parentNode) {
        span.parentNode.normalize();
      }
    } else {
      console.log('❌ Span has no parent node');
    }
    
    // Remove from errors list
    currentErrors = currentErrors.filter(e => e !== error);
    console.log('📋 Remaining errors:', currentErrors.length);
    
    // Update originalContent to preserve the current state
    if (currentFocusedElement) {
      originalContent = currentFocusedElement.innerHTML;
    }
    
    // If no errors remain, clean up and show success
    if (currentErrors.length === 0) {
      console.log('🎉 All errors corrected!');
      setTimeout(() => {
        // Remove any remaining error span styling
        if (currentFocusedElement) {
          const errorSpans = currentFocusedElement.querySelectorAll('span[data-suggestion][style*="text-decoration"]');
          console.log('Cleaning up', errorSpans.length, 'remaining spans');
          errorSpans.forEach(s => {
            const text = document.createTextNode(s.textContent);
            if (s.parentNode) {
              s.parentNode.replaceChild(text, s);
            }
          });
          originalContent = currentFocusedElement.innerHTML;

          // Store the corrected text to prevent re-checking
          const correctedText = currentFocusedElement.value !== undefined
            ? currentFocusedElement.value
            : (currentFocusedElement.textContent || currentFocusedElement.innerText || '');
          lastCorrectedText = correctedText;
          console.log('📝 Stored corrected text after all individual corrections applied');
        }
        highlightedRanges = [];
        hideCorrectionTooltip();
        showMessage('All corrections applied!', 'success');
      }, 100);
    }
  } catch (err) {
    console.error('❌ Error applying correction:', err);
  }
}

/**
 * Show temporary message near button
 */
function showMessage(text, type = 'info', isDetailed = false) {
  // Remove existing message
  const existing = document.querySelector(`.${CONFIG.MESSAGE_CLASS}`);
  if (existing) {
    existing.remove();
  }

  const message = document.createElement('div');
  message.className = CONFIG.MESSAGE_CLASS;

  // Color based on type
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const bgColors = {
    success: '#ecfdf5',
    error: '#fef2f2',
    warning: '#fffbeb',
    info: '#eff6ff',
  };

  // Temporary positioning to measure size
  message.style.cssText = `
    position: fixed;
    z-index: 999998;
    padding: 12px 16px;
    background-color: ${bgColors[type]};
    color: ${colors[type]};
    border: 1px solid ${colors[type]};
    border-radius: 4px;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 350px;
    white-space: ${isDetailed ? 'pre-wrap' : 'nowrap'};
    word-wrap: break-word;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    visibility: hidden;
  `;

  message.textContent = text;
  document.body.appendChild(message);

  // Calculate position to keep within viewport
  const rect = message.getBoundingClientRect();
  const padding = 10;
  let left = floatingButton ? floatingButton.offsetLeft : 20;
  let top = floatingButton ? floatingButton.offsetTop + 40 : 20;

  // Get focused element bounds to avoid overlap
  const focusedRect = currentFocusedElement ? currentFocusedElement.getBoundingClientRect() : null;

  // Adjust if goes off right edge - move to left side
  if (left + rect.width + padding > window.innerWidth) {
    left = Math.max(padding, window.innerWidth - rect.width - padding);
  }

  // Adjust if goes off bottom edge - show above instead
  if (top + rect.height + padding > window.innerHeight) {
    top = Math.max(padding, window.innerHeight - rect.height - padding);
  }

  // If message overlaps focused element, position above it
  if (focusedRect && top < focusedRect.bottom && top + rect.height > focusedRect.top) {
    top = Math.max(padding, focusedRect.top - rect.height - 10);
    // If still no space above, move to left side
    if (top < padding) {
      left = Math.max(padding, Math.min(left - rect.width - 20, window.innerWidth - rect.width - padding));
    }
  }

  // Apply final positioning
  message.style.visibility = 'visible';
  message.style.left = left + 'px';
  message.style.top = top + 'px';

  // Auto-remove after 4 seconds
  setTimeout(() => {
    message.style.opacity = '0';
    message.style.transition = 'opacity 0.3s ease';
    setTimeout(() => message.remove(), 300);
  }, 4000);
}

/**
 * Check if click target is inside our extension UI elements
 */
function isClickInsideExtension(target) {
  // Check if clicking on floating button
  if (floatingButton && floatingButton.contains(target)) {
    return true;
  }

  // Check if clicking on Apply All button
  if (applyAllButton && applyAllButton.contains(target)) {
    return true;
  }

  // Check if clicking on hover tooltip
  if (hoverTooltip && hoverTooltip.contains(target)) {
    return true;
  }

  // Check if clicking on an error span (underlined text)
  if (target.closest && target.closest('span[data-suggestion][style*="text-decoration"]')) {
    return true;
  }

  // Check if clicking on the focused element itself
  if (currentFocusedElement && currentFocusedElement.contains(target)) {
    return true;
  }

  return false;
}

/**
 * Handle clicks outside extension UI to clear highlights
 */
function handleDocumentClick(event) {
  // If there are no highlights, nothing to do
  if (highlightedRanges.length === 0) {
    return;
  }

  // Check if click is inside our extension UI
  if (isClickInsideExtension(event.target)) {
    console.log('🎯 Click inside extension UI, keeping highlights');
    return;
  }

  // Click is outside - clear highlights
  console.log('👆 Click outside extension UI, clearing highlights');
  clearHighlights();
}

/**
 * Handle input events to clear corrected text tracking
 */
function handleInput(event) {
  // Clear the last corrected text when user types
  if (lastCorrectedText) {
    console.log('🔄 User is typing, clearing lastCorrectedText');
    lastCorrectedText = '';
  }
}

/**
 * Initialize content script
 * Attach event listeners to all input/textarea elements
 */
function initializeContentScript() {
  // Attach to existing elements (capture phase)
  document.addEventListener('focus', handleFocus, true);
  document.addEventListener('blur', handleBlur, true);
  document.addEventListener('input', handleInput, true);

  // Handle clicks outside extension UI to clear highlights
  document.addEventListener('click', handleDocumentClick, true);

  // Also listen for click events (helps with some websites)
  document.addEventListener('click', function(e) {
    if (isEditableField(e.target)) {
      setTimeout(() => handleFocus({target: e.target}), 100);
    }
  }, true);

  // NOTE: Auto-recheck on input disabled to prevent race conditions
  // Users should click the button to check, or wait for next major typing event

  console.log('CorrectNow extension loaded - Ready to check grammar');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

// Handle dynamic elements (only after body exists)
const observer = new MutationObserver(() => {
  // Re-attach listeners if needed
});

// Only observe if document.body exists
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
} else {
  // Wait for body to be available
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  });
}
