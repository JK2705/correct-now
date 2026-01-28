# 💳 Credit System - Complete Guide

## 🎯 Overview

The credit system uses a **Usage-Based Model** where credits function as monthly allowances that reset automatically for Pro users. This is the same model used by most SaaS platforms (like Grammarly, ChatGPT, etc.).

---

## 🏗️ Architecture

### Core Concept
```
Available Credits = (Plan Credits + Addon Credits) - Credits Used

Where:
- Plan Credits: Monthly allowance (resets for Pro users)
- Addon Credits: Bonus credits with expiry date
- Credits Used: Consumption counter (resets monthly for Pro)
```

### Database Schema (Firestore)
```typescript
users/{userId} {
  // Plan Configuration
  plan: string;                    // "free" or "pro"
  wordLimit: number;               // Max words per check
  credits: number;                 // Monthly credit allowance
  subscriptionStatus: string;      // "active", "cancelled", etc.
  subscriptionUpdatedAt: string;   // ISO date of subscription start
  
  // Usage Tracking
  creditsUsed: number;             // Credits consumed this cycle
  creditsResetDate: string;        // ISO date of last reset
  creditsUpdatedAt: string;        // Last credit activity
  
  // Addon Credits (Admin/Purchase)
  addonCredits: number;            // Bonus credits amount
  addonCreditsExpiryAt: string;    // ISO date when addon expires
  
  // Metadata
  updatedAt: string;
  createdAt: string;
}
```

---

## 🔄 Credit Flow Explained

### 1️⃣ Free User
```javascript
Initial State:
{
  plan: "free",
  credits: 0,
  addonCredits: 0,
  creditsUsed: 0,
  wordLimit: 200
}

Available: 0 credits (must sign up for Pro)
```

---

### 2️⃣ Pro User (Monthly Subscription)
```javascript
Initial State (After Subscription):
{
  plan: "pro",
  credits: 50000,              // Monthly allowance
  addonCredits: 0,
  creditsUsed: 0,
  subscriptionStatus: "active",
  subscriptionUpdatedAt: "2026-01-01T00:00:00Z",
  creditsResetDate: "2026-01-01T00:00:00Z",
  wordLimit: 5000
}

Available: 50,000 credits
```

**After Checking 15,000 Words:**
```javascript
{
  plan: "pro",
  credits: 50000,              // ✅ Unchanged (monthly limit)
  addonCredits: 0,
  creditsUsed: 15000,          // ✅ Increased
  creditsResetDate: "2026-01-01T00:00:00Z"
}

Available: 35,000 credits (50k - 15k)
```

**After 30 Days (Monthly Reset):**
```javascript
{
  plan: "pro",
  credits: 50000,              // ✅ Same (monthly limit)
  addonCredits: 0,
  creditsUsed: 0,              // ✅ RESET TO 0
  creditsResetDate: "2026-01-31T00:00:00Z"  // ✅ Updated
}

Available: 50,000 credits (full reset!)
```

---

### 3️⃣ Pro User + Addon Credits
```javascript
Initial State:
{
  plan: "pro",
  credits: 50000,
  addonCredits: 10000,         // Admin added bonus
  addonCreditsExpiryAt: "2026-03-01T00:00:00Z",
  creditsUsed: 0,
  creditsResetDate: "2026-01-01T00:00:00Z"
}

Available: 60,000 credits (50k plan + 10k addon)
```

**After Checking 25,000 Words:**
```javascript
{
  plan: "pro",
  credits: 50000,              // ✅ Unchanged
  addonCredits: 10000,         // ✅ Unchanged (not consumed)
  creditsUsed: 25000,          // ✅ Tracks total usage
  creditsResetDate: "2026-01-01T00:00:00Z"
}

Available: 35,000 credits (60k - 25k)
```

**After Monthly Reset (Addon Still Valid):**
```javascript
{
  plan: "pro",
  credits: 50000,
  addonCredits: 10000,         // ✅ Still there!
  creditsUsed: 0,              // ✅ Reset
  creditsResetDate: "2026-01-31T00:00:00Z"
}

Available: 60,000 credits (reset + addon still valid)
```

**After Addon Expires:**
```javascript
{
  plan: "pro",
  credits: 50000,
  addonCredits: 10000,         // ⚠️ Still in DB but expired
  addonCreditsExpiryAt: "2026-03-01T00:00:00Z",  // ⚠️ Past date
  creditsUsed: 5000
}

Available: 45,000 credits (50k - 5k)
// System ignores expired addon credits
```

---

### 4️⃣ Enterprise User (Admin-Managed)
```javascript
Initial State:
{
  plan: "free",                // Not Pro subscription
  credits: 100000,             // Admin set custom amount
  addonCredits: 0,
  creditsUsed: 0,
  wordLimit: 999999            // Admin set unlimited
}

Available: 100,000 credits

Behavior:
- ❌ NO monthly reset (not a Pro subscription)
- ✅ Admin manually manages credits
- ✅ Admin can add more credits anytime
- ✅ Admin can add addon credits with expiry
```

**Enterprise with Addon Credits:**
```javascript
{
  plan: "free",
  credits: 100000,             // Base enterprise credits
  addonCredits: 50000,         // Q1 bonus, expires March 31
  addonCreditsExpiryAt: "2026-03-31T23:59:59Z",
  creditsUsed: 30000
}

Available: 120,000 credits (100k + 50k - 30k)

Note: Enterprise base credits DON'T reset monthly
      Only addon credits expire by date
```

---

## 🔧 Implementation Details

### Monthly Reset Logic
```typescript
// In ProofreadingEditor.tsx (Auth State Listener)

const lastResetDate = data?.creditsResetDate || data?.subscriptionUpdatedAt;
const daysSinceReset = lastResetDate
  ? (now - new Date(lastResetDate)) / (1000 * 60 * 60 * 24)
  : null;

const shouldReset = 
  plan === "Pro" &&
  subscriptionStatus === "active" &&
  daysSinceReset >= 30;

if (shouldReset) {
  // PERSIST RESET TO DATABASE
  await updateDoc(userRef, {
    creditsUsed: 0,
    creditsResetDate: now.toISOString(),
    updatedAt: now.toISOString(),
  });
}
```

**Key Points:**
- ✅ Only Pro users with active subscriptions get monthly resets
- ✅ Reset persists to Firestore (not just UI state)
- ✅ Uses 30-day cycle from last reset
- ✅ Addon credits are NOT affected by monthly reset

---

### Addon Credit Expiry Logic
```typescript
const addonExpiryTime = data?.addonCreditsExpiryAt
  ? new Date(data.addonCreditsExpiryAt).getTime()
  : null;
const addonValid = addonExpiryTime > Date.now();
const validAddonCredits = addonValid ? addonCredits : 0;

// Total available
const totalCredits = planCredits + validAddonCredits;
const remaining = totalCredits - creditsUsed;
```

**Key Points:**
- ✅ Checks expiry on every snapshot
- ✅ Expired addons are ignored (not deleted from DB)
- ✅ Admin can see expired addons (for history)
- ✅ Users only see valid addon credits

---

### Credit Deduction on Check
```typescript
// After successful proofreading
if (auth?.currentUser && creditsLimitEnabled) {
  const usedNext = creditsUsed + wordCount;
  await updateDoc(userRef, {
    creditsUsed: usedNext,
    creditsUpdatedAt: now.toISOString(),
  });
}
```

**Key Points:**
- ✅ Only increments `creditsUsed`
- ✅ NEVER decrements `credits` or `addonCredits`
- ✅ Simple and clean
- ✅ Easy to audit and debug

---

## 🎨 User Interface Display

### Dashboard/Editor View
```jsx
{creditsLimitEnabled && (
  <div className="credit-breakdown">
    <div className="flex justify-between">
      <span>Plan Credits:</span>
      <span>{credits.toLocaleString()}</span>
    </div>
    
    {addonCredits > 0 && (
      <div className="flex justify-between text-green-600">
        <span>Addon Credits:</span>
        <span>
          +{addonCredits.toLocaleString()}
          {addonExpiry && (
            <span className="text-xs">
              (expires {new Date(addonExpiry).toLocaleDateString()})
            </span>
          )}
        </span>
      </div>
    )}
    
    <div className="flex justify-between text-muted-foreground">
      <span>Used This Month:</span>
      <span>{creditsUsed.toLocaleString()}</span>
    </div>
    
    <hr />
    
    <div className="flex justify-between font-bold text-lg">
      <span>Available:</span>
      <span>{creditsRemaining.toLocaleString()}</span>
    </div>
  </div>
)}
```

---

## 🔐 Admin Panel

### Add Addon Credits
```typescript
const handleSaveAddonCredits = async () => {
  const amount = parseInt(addonCreditsAmount);
  const userRef = doc(db, "users", userId);
  const userData = await getDoc(userRef);
  
  // Get current addon
  const currentAddon = userData.addonCredits || 0;
  const currentExpiry = userData.addonCreditsExpiryAt;
  
  // Check if current addon is still valid
  const isCurrentValid = currentExpiry
    ? new Date(currentExpiry) > new Date()
    : false;
  
  // Add to existing if valid, replace if expired
  const newAmount = isCurrentValid 
    ? currentAddon + amount  // ✅ ADD
    : amount;                // ✅ REPLACE
  
  await updateDoc(userRef, {
    addonCredits: newAmount,
    addonCreditsExpiryAt: selectedExpiry,
    creditsUpdatedAt: new Date().toISOString(),
  });
};
```

### Manage User Limits
```typescript
// Admin can set base credits (monthly allowance for Pro users)
// OR custom enterprise credits (no reset)

if (limitType === "unlimited") {
  await updateDoc(userRef, {
    wordLimit: 999999,
    credits: 999999,
    plan: "pro"
  });
} else if (limitType === "custom") {
  await updateDoc(userRef, {
    wordLimit: customWordLimit,
    credits: customCredits,
    plan: "free"  // Enterprise without Pro subscription
  });
}
```

---

## 📊 Credit Usage Scenarios

### Scenario 1: Monthly Pro User
| Event | Plan Credits | Addon | Used | Available |
|-------|-------------|-------|------|-----------|
| Subscribe | 50,000 | 0 | 0 | 50,000 |
| Check 10k words | 50,000 | 0 | 10,000 | 40,000 |
| Check 15k words | 50,000 | 0 | 25,000 | 25,000 |
| After 30 days | 50,000 | 0 | 0 | 50,000 ✅ |

---

### Scenario 2: Pro User + Addon
| Event | Plan Credits | Addon | Used | Available |
|-------|-------------|-------|------|-----------|
| Subscribe | 50,000 | 0 | 0 | 50,000 |
| Admin adds bonus | 50,000 | 10,000 | 0 | 60,000 |
| Check 30k words | 50,000 | 10,000 | 30,000 | 30,000 |
| After 30 days | 50,000 | 10,000 | 0 | 60,000 ✅ |
| After addon expires | 50,000 | 0 | 0 | 50,000 |

---

### Scenario 3: Enterprise Custom
| Event | Plan Credits | Addon | Used | Available |
|-------|-------------|-------|------|-----------|
| Admin sets | 100,000 | 0 | 0 | 100,000 |
| Check 50k words | 100,000 | 0 | 50,000 | 50,000 |
| After 30 days | 100,000 | 0 | 50,000 | 50,000 ❌ NO RESET |
| Admin adds more | 200,000 | 0 | 50,000 | 150,000 |

---

## ✅ Benefits of This System

### 1. **Simple & Clear**
- Users understand "50,000 credits per month"
- No complex consumption logic
- Easy to display and explain

### 2. **Flexible**
- Supports subscriptions (auto-reset)
- Supports enterprise (manual management)
- Supports bonus credits (time-limited)

### 3. **Scalable**
- Admins can override any value
- Can add temporary boosts
- Can track usage patterns

### 4. **Auditable**
- Every credit action is tracked
- Can see: granted, used, remaining
- Reset dates are logged

### 5. **Cost-Effective**
- Only subscription users get monthly refills
- Enterprise uses one-time allocations
- Addon credits can be sold separately

---

## 🔍 Key Differences from Consumption Model

### Usage-Based (Current) ✅
```
Plan Credits: 50,000 (fixed limit)
Usage: +5,000 (tracks consumption)
Display: 45,000 remaining

Monthly Reset:
  Usage → 0
  Credits → stays 50,000
```

### Consumption-Based (Alternative) ❌
```
Plan Credits: 50,000 (decreases)
After usage: 45,000 (deducted)

Monthly Reset:
  Credits → refill to 50,000
```

**Why Usage-Based is Better:**
- ✅ Simpler math
- ✅ No need to refill credits
- ✅ Easy to track "usage this month"
- ✅ No risk of double-refilling bugs
- ✅ Standard SaaS model

---

## 🎯 Summary

### For Pro Subscription Users:
1. Get X credits per month
2. Usage counter tracks consumption
3. Counter resets every 30 days
4. Credits limit stays constant
5. Can receive addon bonuses

### For Enterprise Users:
1. Admin sets custom credit amount
2. NO automatic monthly reset
3. Admin manually adds more when needed
4. Can receive addon bonuses with expiry
5. Fully customizable limits

### For Addon Credits:
1. Added by admin OR purchased by user
2. Have expiry date (not usage-based)
3. Add to total available credits
4. NOT affected by monthly reset
5. Expire and become invalid (not deleted)

---

## 🚀 Next Steps

### Recommended Enhancements:
1. **Credit Purchase Flow** - Let users buy addon credits
2. **Usage Analytics** - Show credit usage graphs
3. **Expiry Notifications** - Email before addon expires
4. **Credit History** - Log all credit transactions
5. **Team Plans** - Share credit pool across team members

### Admin Panel Improvements:
1. Show credit breakdown in user table
2. Add "Credit History" tab
3. Bulk credit operations
4. Credit usage reports
5. Automatic expiry cleanup (archive old addons)

---

## 📱 Contact

For questions or issues with the credit system, contact: **billing@correctnow.app**
