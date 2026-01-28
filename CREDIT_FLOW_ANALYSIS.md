# 🔍 Credit Flow Analysis & Issues

## Current Implementation Status

### ✅ What's Working:
1. **Credit Display** - Shows total credits correctly
   ```typescript
   const creditValue = planCredits + (addonValid ? addonCredits : 0);
   const creditsRemaining = Math.max(0, credits - creditsUsed);
   ```

2. **Addon Credits Validation** - Checks expiry correctly
   ```typescript
   const addonValid = addonExpiry ? addonExpiry.getTime() > Date.now() : false;
   ```

3. **Credit Limit Checking** - Prevents usage when out of credits
   ```typescript
   if (creditsLimitEnabled && overrideWordCount > (creditsRemaining ?? 0)) {
     toast.error("Not enough credits. Please buy add-on credits to continue.");
   }
   ```

---

## ❌ CRITICAL ISSUES FOUND

### Issue #1: **Addon Credits Never Get Consumed**

**Problem:**
- Admin adds `addonCredits: 10000` to a user
- User checks text, only `creditsUsed` increases
- `addonCredits` field stays at 10000 forever (until expiry date)
- User can use addon credits infinitely until expiry!

**Current Code (ProofreadingEditor.tsx:869-879):**
```typescript
const usedNext = creditsUsed + overrideWordCount;
setCreditsUsed(usedNext);
await setDoc(ref, {
  creditsUsed: usedNext,  // ❌ Only updates usage counter
  creditsTotal: credits || PRO_CREDITS,
  creditsUpdatedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}, { merge: true });
// ❌ NEVER updates addonCredits or credits fields!
```

---

### Issue #2: **Plan Credits (`credits` field) Never Decrease**

**Problem:**
- Admin sets user credits to 50000 via "Manage Limits"
- User checks text many times
- `creditsUsed` increases: 0 → 5000 → 10000 → ...
- But `credits` field stays 50000 forever!
- System only tracks usage, not consumption

**Example Scenario:**
```
Initial State:
  credits: 50000
  addonCredits: 10000
  creditsUsed: 0
  Total Available: 60000

After checking 15000 words:
  credits: 50000        ❌ Never decreased!
  addonCredits: 10000   ❌ Never decreased!
  creditsUsed: 15000    ✅ Increased correctly
  Total Available: 45000 (60000 - 15000) ✅ Display is correct

Problem: The SOURCE of credits never depletes!
```

---

### Issue #3: **Monthly Reset Logic is Incomplete**

**Current Code (ProofreadingEditor.tsx:501-512):**
```typescript
const shouldReset =
  plan === "Pro" &&
  isActive &&
  Boolean(lastResetDate) &&
  now.getTime() - lastResetDate.getTime() > 30 * 24 * 60 * 60 * 1000;

const usedValue = shouldReset ? 0 : Number(data?.creditsUsed || 0);
```

**Problem:**
- Only resets `creditsUsed` in UI state
- NEVER writes reset to Firestore
- If user refreshes browser, reset is lost!
- Monthly reset doesn't actually persist

---

### Issue #4: **Unclear Credit Priority**

**Questions:**
1. Should addon credits be consumed first or plan credits?
2. Should addon credits deduct from the addon pool or from usage tracker?
3. Should plan credits refill monthly for Pro users?
4. Should addon credits be separate from monthly refills?

---

## 🎯 Recommended Solutions

### **Option A: Usage-Based System (Simpler - RECOMMENDED)**

**Concept:** Track usage counter, never deduct from source pools

**Pros:**
- ✅ Simpler logic
- ✅ Easy monthly resets for Pro users
- ✅ Addon credits work like "bonus allowance"
- ✅ Admin can see total vs used easily

**Implementation:**
```typescript
// 1. Calculate total available
const planCredits = data?.credits || (plan === "Pro" ? 50000 : 0);
const addonCredits = addonValid ? Number(data?.addonCredits || 0) : 0;
const totalAvailable = planCredits + addonCredits;

// 2. Track usage
const creditsUsed = data?.creditsUsed || 0;
const remaining = Math.max(0, totalAvailable - creditsUsed);

// 3. On check: increment usage
await updateDoc(ref, {
  creditsUsed: creditsUsed + wordCount
});

// 4. Monthly reset (Pro plan only)
if (shouldReset) {
  await updateDoc(ref, {
    creditsUsed: 0,
    creditsResetDate: new Date().toISOString()
  });
}

// 5. Addon credits stay separate, expire on date
// (Never reset monthly, admin adds manually)
```

**User Experience:**
- Pro User: Gets 50K credits/month (resets monthly)
- Addon: Admin adds 10K bonus (expires in X days)
- Display: "60,000 credits available (45,000 remaining)"
- After 1 month: Pro credits reset, addon credits still there (if not expired)

---

### **Option B: Consumption-Based System (More Complex)**

**Concept:** Actually deduct from source pools, consume addon first

**Pros:**
- ✅ More "real" - credits actually disappear
- ✅ Clear separation of credit types
- ✅ No usage counter needed

**Cons:**
- ❌ Monthly reset requires refilling `credits` field
- ❌ More complex logic
- ❌ Harder to audit/track

**Implementation:**
```typescript
// 1. On check: consume addon first, then plan credits
const wordCount = 5000;
let remaining = wordCount;

// Consume addon credits first
if (addonValid && addonCredits > 0) {
  const fromAddon = Math.min(remaining, addonCredits);
  await updateDoc(ref, {
    addonCredits: addonCredits - fromAddon
  });
  remaining -= fromAddon;
}

// Consume plan credits if addon exhausted
if (remaining > 0 && planCredits > 0) {
  await updateDoc(ref, {
    credits: planCredits - remaining
  });
}

// 2. Monthly reset: refill plan credits
if (shouldReset && plan === "Pro") {
  await updateDoc(ref, {
    credits: 50000,  // Refill to original amount
    creditsResetDate: new Date().toISOString()
  });
}
```

---

## 📋 Required Fixes (For Option A - Recommended)

### Fix #1: Persist Monthly Reset
```typescript
// In ProofreadingEditor.tsx, inside the snapshot listener:
if (shouldReset) {
  const ref = firestoreDoc(db, `users/${user.uid}`);
  await updateDoc(ref, {
    creditsUsed: 0,
    creditsResetDate: now.toISOString(),
  });
  setCreditsUsed(0);
}
```

### Fix #2: Clarify Addon Credit Behavior
- **Decision:** Addon credits DON'T get consumed (they're part of the limit)
- **Behavior:** Addon credits expire on date (not usage-based)
- **Display:** Show breakdown: "Plan: 50K | Addon: 10K | Used: 15K | Remaining: 45K"

### Fix #3: Update Admin Panel Credit Management
```typescript
// Admin sets base plan credits (monthly refill amount for Pro)
// Admin sets addon credits separately (one-time bonus with expiry)
// Admin can see: Plan Credits, Addon Credits, Credits Used, Last Reset Date
```

### Fix #4: Add Credit Type Indicators
```typescript
// In Dashboard/Editor:
<div>
  <p>Plan Credits: {planCredits.toLocaleString()}</p>
  {addonCredits > 0 && (
    <p>Addon Credits: {addonCredits.toLocaleString()} 
       (expires {expiryDate})</p>
  )}
  <p>Used This Month: {creditsUsed.toLocaleString()}</p>
  <p className="font-bold">
    Remaining: {(planCredits + addonCredits - creditsUsed).toLocaleString()}
  </p>
</div>
```

---

## 🔄 Complete Credit Flow (Option A - Fixed)

### Scenario 1: Pro User with Addon Credits

**Initial State:**
```
Plan: Pro ($20/month)
Plan Credits: 50,000 (monthly allowance)
Addon Credits: 10,000 (admin gave bonus, expires in 30 days)
Credits Used: 0
Total Available: 60,000
```

**After Checking 15,000 Words:**
```
Plan Credits: 50,000 (unchanged - it's the monthly limit)
Addon Credits: 10,000 (unchanged - it's bonus allowance)
Credits Used: 15,000 (tracked usage)
Total Available: 45,000 (60k - 15k)
```

**After 30 Days (Monthly Reset):**
```
Plan Credits: 50,000 (same - monthly limit doesn't change)
Addon Credits: 10,000 (still valid if not expired)
Credits Used: 0 (RESET to 0 - new billing cycle)
Total Available: 60,000 (reset!)
```

**After Addon Expires:**
```
Plan Credits: 50,000
Addon Credits: 0 (expired - ignored in calculation)
Credits Used: 5,000
Total Available: 45,000 (50k - 5k)
```

---

### Scenario 2: Enterprise User (Admin-Managed)

**Initial State:**
```
Plan: Free (but admin upgraded)
Plan Credits: 100,000 (admin set custom amount)
Addon Credits: 50,000 (admin bonus for Q1, expires March 31)
Credits Used: 0
Total Available: 150,000
```

**Monthly Behavior:**
```
❓ Question: Should enterprise credits reset monthly?

Option 1 (Recommended): NO monthly reset
  - Admin manually manages enterprise credits
  - No automatic refills
  - Admin adds more when needed

Option 2: YES monthly reset
  - Treat like Pro plan with higher limits
  - Reset creditsUsed every 30 days
```

---

## 🚨 URGENT ACTION ITEMS

1. **Decide on Credit System:**
   - [ ] Choose Option A (Usage-Based) or Option B (Consumption-Based)
   - [ ] Define monthly reset behavior for each plan type
   - [ ] Define addon credit consumption rules

2. **Fix Monthly Reset:**
   - [ ] Persist reset to Firestore (currently only in UI state)
   - [ ] Add `creditsResetDate` field to track last reset
   - [ ] Test reset trigger timing

3. **Update Admin Panel:**
   - [ ] Show credit breakdown (Plan | Addon | Used)
   - [ ] Add last reset date display
   - [ ] Clarify what happens on monthly reset

4. **Update User Dashboard:**
   - [ ] Show credit type breakdown
   - [ ] Show next reset date (for Pro users)
   - [ ] Show addon expiry date
   - [ ] Add "Add More Credits" button → Payment page

5. **Add Tests:**
   - [ ] Test monthly reset persistence
   - [ ] Test addon expiry behavior
   - [ ] Test credit limit enforcement
   - [ ] Test enterprise custom credits

---

## 💬 Questions for You

1. **Which credit system do you prefer?**
   - Option A: Usage tracker (simpler, like most SaaS)
   - Option B: Actual consumption (more "real" but complex)

2. **Monthly resets - who gets them?**
   - Only Pro subscription users?
   - Enterprise users too?
   - Addon credits never reset (only expire)?

3. **Addon credit priority:**
   - Should addon credits be consumed from usage equally with plan credits?
   - Or should they be a separate "pool" that gets consumed first/last?

4. **Enterprise users:**
   - Should they get monthly resets?
   - Or purely admin-managed (no auto-refills)?

5. **Credit purchases:**
   - Can users buy addon credits themselves?
   - Or only admin can add them?
   - Should purchased credits expire?

---

## ✅ What to Do Next

**I recommend:**
1. **Stick with Usage-Based System (Option A)** - It's what you already have, just needs fixes
2. **Fix monthly reset persistence** - Critical bug
3. **Keep addon credits as "bonus allowance"** - They add to limit but don't get consumed separately
4. **Clarify in UI** - Show credit breakdown to users

**Let me know your decisions and I'll implement the fixes immediately!**
