# 🧪 Credit System Testing Guide

## ✅ Implementation Verified

All code is in place and TypeScript compilation successful. Server running on: http://localhost:8081/

---

## 🔍 Pre-Test Verification

### Code Review Checklist:
- ✅ **ProofreadingEditor.tsx**: Credit calculation logic implemented
- ✅ **Admin.tsx**: Addon credits management UI complete
- ✅ **Firebase Integration**: updateDoc, onSnapshot properly configured
- ✅ **State Management**: Separate tracking for plan/addon/used credits
- ✅ **Monthly Reset**: Persists to Firestore with creditsResetDate
- ✅ **Expiry Validation**: Checks addon expiry on every load
- ✅ **TypeScript**: No compilation errors

---

## 🧪 Test Scenarios

### **TEST 1: Free User (No Credits)**

**Setup:**
1. Open browser at http://localhost:8081/
2. If logged in, logout first
3. Navigate to editor

**Expected Behavior:**
- ✅ Should see "0 credits available" or hidden credit display
- ✅ Word limit: 200 words per check
- ✅ Can check text up to 200 words
- ✅ Cannot exceed 200 word limit
- ✅ Should see upgrade prompt

**Test Steps:**
```
1. Type 150 words → Click "Check Text"
   Expected: Works fine
   
2. Type 250 words → Click "Check Text"
   Expected: Error "Text exceeds 200 word limit"
   
3. Check credit display
   Expected: No credits shown or "Upgrade to Pro"
```

---

### **TEST 2: Pro User (Monthly Credits)**

**Setup:**
1. Login with Pro account OR create test Pro user via admin
2. Set Firestore manually:
   ```javascript
   users/{userId} {
     plan: "pro",
     credits: 50000,
     creditsUsed: 0,
     subscriptionStatus: "active",
     subscriptionUpdatedAt: "2026-01-01T00:00:00Z",
     creditsResetDate: "2026-01-01T00:00:00Z"
   }
   ```

**Expected Behavior:**
- ✅ Available Credits: 50,000
- ✅ Word limit: 5,000 words per check
- ✅ Credits display visible
- ✅ Usage tracked correctly

**Test Steps:**
```
1. Check initial credits
   Expected: 50,000 available
   
2. Check 1,000 words of text
   Expected: 
   - Credits Used: 1,000
   - Available: 49,000
   - Firestore creditsUsed: 1000
   
3. Check another 5,000 words
   Expected:
   - Credits Used: 6,000
   - Available: 44,000
   - Firestore creditsUsed: 6000
   
4. Refresh browser
   Expected: Credits persist (44,000 available)
```

**Verify in Firestore:**
```javascript
// Check user document
{
  creditsUsed: 6000,  // Should match
  credits: 50000,     // Should NOT change
  creditsUpdatedAt: "2026-01-24T..."  // Recent timestamp
}
```

---

### **TEST 3: Monthly Reset**

**Setup:**
1. Use Pro user from TEST 2
2. Manually update Firestore to simulate 30+ days:
   ```javascript
   users/{userId} {
     creditsResetDate: "2025-12-20T00:00:00Z"  // 35 days ago
   }
   ```

**Expected Behavior:**
- ✅ On next page load, reset should trigger
- ✅ creditsUsed → 0
- ✅ creditsResetDate → updated to current date
- ✅ Available credits back to 50,000

**Test Steps:**
```
1. Set creditsResetDate to 35 days ago in Firestore
2. Set creditsUsed to 30000 in Firestore
3. Refresh browser or reload editor page
4. Check credits display
   Expected: 50,000 available (reset!)
   
5. Verify Firestore
   Expected:
   - creditsUsed: 0
   - creditsResetDate: "2026-01-24T..."
   - credits: 50000
```

---

### **TEST 4: Addon Credits (Admin Added)**

**Setup:**
1. Login to admin panel at http://localhost:8081/admin
2. Go to Users tab
3. Find a Pro user
4. Click Coins icon (🪙)

**Expected Behavior:**
- ✅ Modal opens with credit form
- ✅ Default expiry: 30 days from now
- ✅ Can set custom amount and expiry
- ✅ Saves to Firestore
- ✅ User sees increased total

**Test Steps:**
```
1. Open admin panel → Users tab
2. Click 🪙 icon for a user
3. Enter: 10,000 credits
4. Set expiry: 2026-03-01 23:59
5. Click "Add Credits"
   Expected: Success toast
   
6. Check user row in table
   Expected: Shows "10,000 (Mar 1)" in Addon Credits column
   
7. Login as that user → Check editor
   Expected:
   - Plan Credits: 50,000
   - Addon Credits: +10,000
   - Total Available: 60,000
   
8. Check 5,000 words
   Expected:
   - Credits Used: 5,000
   - Available: 55,000 (60k - 5k)
   
9. Verify Firestore
   Expected:
   {
     credits: 50000,
     addonCredits: 10000,
     addonCreditsExpiryAt: "2026-03-01T23:59:00Z",
     creditsUsed: 5000
   }
```

---

### **TEST 5: Addon Credits Expiry**

**Setup:**
1. Use user with addon credits from TEST 4
2. Manually set expiry to past date in Firestore:
   ```javascript
   addonCreditsExpiryAt: "2026-01-01T00:00:00Z"  // Past date
   ```

**Expected Behavior:**
- ✅ Expired addons ignored in calculation
- ✅ Only plan credits counted
- ✅ Addon amount stays in DB (for history)

**Test Steps:**
```
1. Set addon expiry to past date in Firestore
   addonCreditsExpiryAt: "2026-01-01T00:00:00Z"
   
2. Refresh browser
3. Check credits display
   Expected:
   - Plan Credits: 50,000
   - Addon Credits: NOT shown (expired)
   - Total: 50,000 (addons ignored)
   
4. Check 1,000 words
   Expected: Deducts from plan credits only
   - Available: 49,000
```

---

### **TEST 6: Adding to Existing Valid Addon Credits**

**Setup:**
1. User has valid addon credits (10,000 expiring March 1)
2. Admin adds more (5,000 expiring April 1)

**Expected Behavior:**
- ✅ New amount ADDS to existing
- ✅ Expiry updated to new date
- ✅ Total = 15,000

**Test Steps:**
```
1. User has: 10,000 addon credits (expires Mar 1)
2. Admin → Users → Click 🪙
3. Add: 5,000 credits (expires Apr 1)
4. Click "Add Credits"
   Expected:
   - Toast: "Added 5,000 credits successfully!"
   - Table shows: 15,000 (Apr 1)
   
5. Login as user → Check editor
   Expected:
   - Addon Credits: +15,000
   - Total Available: 65,000 (50k plan + 15k addon)
   
6. Verify Firestore
   {
     addonCredits: 15000,  // 10k + 5k
     addonCreditsExpiryAt: "2026-04-01T23:59:00Z"
   }
```

---

### **TEST 7: Replacing Expired Addon Credits**

**Setup:**
1. User has expired addon credits (10,000 expired Feb 1)
2. Admin adds new (5,000 expiring April 1)

**Expected Behavior:**
- ✅ New amount REPLACES expired
- ✅ Total = 5,000 (not 15,000)

**Test Steps:**
```
1. Set in Firestore:
   addonCredits: 10000
   addonCreditsExpiryAt: "2026-02-01T00:00:00Z"  // Expired
   
2. Admin → Add 5,000 (expires Apr 1)
3. Click "Add Credits"
   Expected:
   - addonCredits: 5000 (REPLACED, not 15000)
   - addonCreditsExpiryAt: "2026-04-01T..."
   
4. User sees: +5,000 addon credits (not +15,000)
```

---

### **TEST 8: Monthly Reset with Valid Addon Credits**

**Setup:**
1. Pro user with addon credits
2. Trigger monthly reset

**Expected Behavior:**
- ✅ creditsUsed → 0 (reset)
- ✅ addonCredits → unchanged
- ✅ Total back to full (plan + addon)

**Test Steps:**
```
1. Setup user:
   credits: 50000
   addonCredits: 10000 (expires Mar 1)
   creditsUsed: 30000
   creditsResetDate: "2025-12-20T..."  // 35 days ago
   
2. Refresh browser (trigger reset)
3. Expected state:
   credits: 50000
   addonCredits: 10000  // NOT reset!
   creditsUsed: 0       // RESET ✅
   creditsResetDate: "2026-01-24T..."
   
4. User sees:
   - Plan Credits: 50,000
   - Addon Credits: +10,000
   - Total: 60,000 (full reset + addon)
```

---

### **TEST 9: Enterprise User (No Monthly Reset)**

**Setup:**
1. Create enterprise user via admin
2. Set custom credits (100,000)

**Expected Behavior:**
- ✅ No monthly reset
- ✅ Admin manages manually
- ✅ Can have addon credits

**Test Steps:**
```
1. Admin → Users → Select user
2. Click "Manage Limits"
3. Select "Limited"
4. Set: credits: 100000, wordLimit: 999999
5. Save
   
6. Set creditsResetDate to 35 days ago
7. Login as user → Check 20,000 words
8. creditsUsed: 20000
9. Wait or manually trigger (set resetDate 35 days ago)
10. Refresh browser
    Expected: NO RESET (not Pro subscription)
    - creditsUsed: still 20000
    - Available: 80,000
```

---

### **TEST 10: Credit Limit Enforcement**

**Setup:**
1. Pro user with limited credits

**Expected Behavior:**
- ✅ Cannot check text exceeding available credits
- ✅ Shows error message

**Test Steps:**
```
1. User has: 5,000 credits available
2. Try to check 10,000 words of text
   Expected:
   - Error: "Not enough credits. Please buy add-on credits to continue."
   - No API call made
   - Credits unchanged
   
3. Check 3,000 words (under limit)
   Expected: Works fine
   - Available: 2,000 (5k - 3k)
```

---

### **TEST 11: Admin Panel - Manage User Limits**

**Test Steps:**
```
1. Admin → Users → Click "Manage Limits"

Test A: Unlimited
  - Select "Unlimited"
  - Save
  - Verify Firestore:
    wordLimit: 999999
    credits: 999999
    plan: "pro"

Test B: Limited
  - Select "Limited"
  - Set: 75000 credits, 3000 word limit
  - Save
  - Verify Firestore:
    wordLimit: 3000
    credits: 75000

Test C: Disabled
  - Select "Disabled"
  - Save
  - Verify Firestore:
    wordLimit: 0
    credits: 0
  - User cannot check any text
```

---

### **TEST 12: Browser Console Checks**

**During all tests, monitor console for:**
- ❌ No errors related to credits
- ❌ No updateDoc failures
- ❌ No undefined variable warnings
- ✅ Clean credit calculations
- ✅ Proper Firestore updates

---

## 🔍 Firestore Verification Queries

### Check User Credits:
```javascript
// Firebase Console → Firestore
users/{userId}

Look for:
- plan: "pro" or "free"
- credits: number
- creditsUsed: number
- addonCredits: number (if present)
- addonCreditsExpiryAt: ISO date string
- creditsResetDate: ISO date string
- subscriptionStatus: "active" or "cancelled"
```

### Verify Reset Happened:
```javascript
// Before reset
creditsResetDate: "2025-12-20T00:00:00Z"
creditsUsed: 30000

// After reset (should update)
creditsResetDate: "2026-01-24T..." (today)
creditsUsed: 0
```

---

## 📊 Expected Results Summary

| Test | Scenario | Expected Result |
|------|----------|----------------|
| 1 | Free User | 0 credits, 200 word limit |
| 2 | Pro User | 50K credits, tracks usage |
| 3 | Monthly Reset | Usage → 0, date updated |
| 4 | Add Addon | Total increases, expiry set |
| 5 | Addon Expires | Ignored in calculation |
| 6 | Add to Valid | Amounts ADD together |
| 7 | Replace Expired | New REPLACES old |
| 8 | Reset + Addon | Usage resets, addon stays |
| 9 | Enterprise | NO auto-reset |
| 10 | Limit Enforce | Error when exceeding |
| 11 | Admin Limits | Updates Firestore correctly |
| 12 | Console Clean | No errors |

---

## 🐛 Common Issues to Check

### Issue: Monthly reset not triggering
**Check:**
- Is user's plan "Pro" (exact match, case-sensitive)?
- Is subscriptionStatus "active"?
- Has it been 30+ days since creditsResetDate?
- Check browser console for errors

### Issue: Addon credits not showing
**Check:**
- Is addonCreditsExpiryAt in the future?
- Is addonCredits > 0?
- Check exact date format (ISO 8601)
- Refresh browser to force re-fetch

### Issue: Credits not deducting
**Check:**
- Is creditsLimitEnabled true?
- Check Firestore update permissions
- Look for updateDoc errors in console
- Verify user is authenticated

---

## ✅ Success Criteria

### All tests pass if:
1. ✅ Free users have 0 credits
2. ✅ Pro users get 50K credits/month
3. ✅ Monthly reset persists to Firestore
4. ✅ Addon credits add to total
5. ✅ Expired addons are ignored
6. ✅ Usage tracking accurate
7. ✅ Admin can add/manage credits
8. ✅ Enterprise doesn't auto-reset
9. ✅ No TypeScript errors
10. ✅ No runtime errors in console
11. ✅ Firestore updates correctly
12. ✅ UI displays credits accurately

---

## 🚀 Next Steps After Testing

### If all tests pass:
1. ✅ Mark system as production-ready
2. ✅ Deploy to production
3. ✅ Monitor Firestore for correct updates
4. ✅ Set up error tracking (Sentry, etc.)
5. ✅ Document for support team

### If issues found:
1. Note specific test that failed
2. Check Firestore document structure
3. Review browser console errors
4. Verify Firebase rules allow writes
5. Check authentication state

---

## 📝 Test Results Template

```
Date: _________________
Tester: _______________

[ ] TEST 1: Free User
[ ] TEST 2: Pro User  
[ ] TEST 3: Monthly Reset
[ ] TEST 4: Addon Credits
[ ] TEST 5: Addon Expiry
[ ] TEST 6: Add to Valid
[ ] TEST 7: Replace Expired
[ ] TEST 8: Reset + Addon
[ ] TEST 9: Enterprise
[ ] TEST 10: Limit Enforce
[ ] TEST 11: Admin Panel
[ ] TEST 12: Console Clean

Issues Found:
_______________________________
_______________________________

Overall Status: ☐ PASS  ☐ FAIL

Notes:
_______________________________
_______________________________
```

---

## 🎯 Quick Manual Test (5 minutes)

For quick verification:

```
1. Open http://localhost:8081/admin
   - Login with admin credentials
   - Go to Users tab
   - Click 🪙 on any user
   - Add 5000 credits, expires tomorrow
   - Verify shows in table

2. Login as that user
   - Go to editor
   - Check credit display shows addon
   - Check some text
   - Verify credits decrease

3. Check Firestore
   - Open Firebase Console
   - Check user document
   - Verify addonCredits, creditsUsed fields

If all 3 work: ✅ System is working!
```

---

## 📞 Support

If tests fail or issues arise:
- Review: [CREDIT_SYSTEM_DOCUMENTATION.md](./CREDIT_SYSTEM_DOCUMENTATION.md)
- Check: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- Debug: Check browser console and Firestore directly
