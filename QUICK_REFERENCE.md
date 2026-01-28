# 🎯 Quick Reference: How Everything Works

## 📊 Credit System at a Glance

### The Formula
```
Available Credits = (Plan Credits + Addon Credits) - Credits Used
```

---

## 👥 User Types & Behavior

### 1. **FREE USER** 👤
```
┌─────────────────────────┐
│ Plan: Free              │
│ Credits: 0              │
│ Available: 0            │
│ Word Limit: 200/check   │
│                         │
│ Must upgrade to Pro     │
└─────────────────────────┘
```

### 2. **PRO USER** ⭐
```
┌─────────────────────────┐
│ Plan: Pro ($20/month)   │
│ Plan Credits: 50,000    │
│ Addon: 0                │
│ Used: 0                 │
│ Available: 50,000       │
│                         │
│ ✅ Resets every 30 days │
└─────────────────────────┘

After checking 15,000 words:
┌─────────────────────────┐
│ Plan Credits: 50,000    │ (unchanged)
│ Used: 15,000            │ (tracked)
│ Available: 35,000       │ (50k - 15k)
└─────────────────────────┘

After 30 days:
┌─────────────────────────┐
│ Plan Credits: 50,000    │ (same)
│ Used: 0                 │ ✅ RESET!
│ Available: 50,000       │ (full again)
└─────────────────────────┘
```

### 3. **PRO + ADDON** ⭐🎁
```
┌─────────────────────────┐
│ Plan: Pro               │
│ Plan Credits: 50,000    │
│ Addon: +10,000          │ (bonus)
│ Used: 0                 │
│ Available: 60,000       │ (50k + 10k)
│                         │
│ Addon expires: Mar 1    │
└─────────────────────────┘

After checking 25,000 words:
┌─────────────────────────┐
│ Plan Credits: 50,000    │ (unchanged)
│ Addon: 10,000           │ (not consumed)
│ Used: 25,000            │ (tracked)
│ Available: 35,000       │ (60k - 25k)
└─────────────────────────┘

After monthly reset (addon still valid):
┌─────────────────────────┐
│ Plan Credits: 50,000    │
│ Addon: 10,000           │ (still here!)
│ Used: 0                 │ ✅ RESET!
│ Available: 60,000       │ (reset + addon)
└─────────────────────────┘

After addon expires:
┌─────────────────────────┐
│ Plan Credits: 50,000    │
│ Addon: 0                │ ❌ EXPIRED
│ Used: 5,000             │
│ Available: 45,000       │ (50k - 5k)
└─────────────────────────┘
```

### 4. **ENTERPRISE** 🏢
```
┌─────────────────────────┐
│ Plan: Free (custom)     │
│ Plan Credits: 100,000   │ (admin set)
│ Addon: 50,000           │ (Q1 bonus)
│ Used: 30,000            │
│ Available: 120,000      │
│                         │
│ ❌ NO monthly reset     │
│ Admin adds more manually│
└─────────────────────────┘
```

---

## 🔄 Monthly Reset Logic

### Who Gets Monthly Reset?
```
✅ Pro subscription users with active status
❌ Free users
❌ Enterprise users (custom credits)
❌ Cancelled Pro users
```

### When Does Reset Happen?
```
Every 30 days from last reset date

Timeline:
Day 0:  creditsResetDate = "2026-01-01"
Day 29: No reset yet
Day 30: ✅ RESET TRIGGERS
        creditsUsed → 0
        creditsResetDate → "2026-01-31"
```

### What Gets Reset?
```
✅ creditsUsed → 0
✅ creditsResetDate → updated
❌ credits → stays same (it's the monthly limit)
❌ addonCredits → not affected (separate system)
```

---

## 🎁 Addon Credits Explained

### What Are Addon Credits?
```
Bonus credits with an expiry date
- Added by admin OR purchased by user
- Have a specific expiry datetime
- Add to total available credits
- Independent of monthly resets
- Don't get consumed (just expire by date)
```

### How Do They Work?
```
Admin adds 10,000 credits expiring March 1:

Day 1:
  addonCredits: 10,000
  addonCreditsExpiryAt: "2026-03-01"
  Status: VALID ✅
  Added to total: YES

Day 60 (March 1):
  addonCredits: 10,000 (still in database)
  addonCreditsExpiryAt: "2026-03-01" (past date)
  Status: EXPIRED ❌
  Added to total: NO
```

### Adding More Addon Credits
```
Scenario 1: User has VALID addon credits
  Current: 10,000 (expires Mar 1)
  Adding: 5,000 (expires Apr 1)
  Result: 15,000 (expires Apr 1) ✅ ADDED

Scenario 2: User has EXPIRED addon credits
  Current: 10,000 (expired Feb 1)
  Adding: 5,000 (expires Apr 1)
  Result: 5,000 (expires Apr 1) ✅ REPLACED
```

---

## 💻 Admin Panel Actions

### 1. **Add Addon Credits** 🪙
```
Steps:
1. Click Coins icon (🪙) next to user
2. Enter credits amount (e.g., 10000)
3. Set expiry date (default: 30 days from now)
4. Click "Add Credits"

What happens:
- If user has valid addons → ADDS to existing
- If user has expired addons → REPLACES old ones
- Updates Firestore immediately
- User sees new total instantly
```

### 2. **Manage User Limits** ✏️
```
Options:

Limited (Normal):
  wordLimit: Custom (e.g., 2000)
  credits: Custom (e.g., 50000)
  → Regular user with limits

Unlimited (VIP):
  wordLimit: 999999
  credits: 999999
  plan: "pro"
  → No restrictions

Disabled (Banned):
  wordLimit: 0
  credits: 0
  → Cannot use service
```

### 3. **View User Credits**
```
Table shows:
- Plan Credits (base allowance)
- Addon Credits (bonus + expiry date)
- Credits Used (current cycle)
- Word Limit (per check)
```

---

## 🔍 Example Scenarios

### Scenario A: New Pro User
```
Day 0: Subscribe to Pro
  → credits: 50000
  → creditsUsed: 0
  → creditsResetDate: "2026-01-01"

Day 5: Check 10,000 words
  → creditsUsed: 10000
  → Available: 40,000

Day 15: Check another 15,000 words
  → creditsUsed: 25000
  → Available: 25,000

Day 30: Monthly reset
  → creditsUsed: 0 (RESET)
  → Available: 50,000 (full again)
```

### Scenario B: Admin Adds Bonus
```
Day 0: Pro user with 50k credits
  → Available: 50,000

Day 5: Admin adds 10k bonus (expires Day 60)
  → addonCredits: 10000
  → Available: 60,000

Day 10: User checks 20k words
  → creditsUsed: 20000
  → Available: 40,000 (60k - 20k)

Day 30: Monthly reset
  → creditsUsed: 0 (RESET)
  → addonCredits: 10000 (still valid)
  → Available: 60,000 (reset + addon)

Day 60: Addon expires
  → addonCredits: ignored (expired)
  → Available: 50,000 (plan only)
```

### Scenario C: Enterprise Account
```
Day 0: Admin creates enterprise account
  → plan: "free"
  → credits: 100000 (custom)
  → creditsUsed: 0

Day 10: Check 30k words
  → creditsUsed: 30000
  → Available: 70,000

Day 30: No reset (not Pro subscription)
  → creditsUsed: still 30000
  → Available: still 70,000

Day 60: Admin adds 50k more
  → credits: 150000 (updated)
  → Available: 120,000 (150k - 30k)
```

---

## 📱 User Dashboard Display

### Credit Breakdown
```
╔════════════════════════════════╗
║ YOUR CREDITS                   ║
╠════════════════════════════════╣
║ Monthly Allowance:   50,000    ║
║ Bonus Credits:      +10,000    ║
║   Expires: March 1, 2026       ║
║ ────────────────────────────   ║
║ Total Available:     60,000    ║
║                                ║
║ Used This Month:     15,000    ║
║ Remaining:           45,000    ║
║                                ║
║ Next Reset: January 31, 2026   ║
╚════════════════════════════════╝
```

---

## 🐛 Troubleshooting

### "Credits not resetting?"
```
Check:
1. Is user Pro with active subscription?
2. Has it been 30+ days since last reset?
3. Is creditsResetDate field present?
4. Check browser console for errors
```

### "Addon credits not showing?"
```
Check:
1. Is addonCreditsExpiryAt in the future?
2. Is addonCredits value > 0?
3. Check Firestore document directly
4. Refresh browser (state sync issue)
```

### "Monthly reset not persisting?"
```
Check:
1. Firestore rules allow user writes
2. updateDoc function imported correctly
3. No console errors during reset
4. creditsResetDate field updated in Firestore
```

---

## ✅ Quick Validation

### For Developers:
```bash
# Check TypeScript errors
npm run build

# Should see: "✓ built in Xs" with no errors
```

### For Admins:
```
1. Login to /admin
2. Go to Users tab
3. See "Addon Credits" column
4. Click 🪙 icon
5. Add credits with expiry
6. Check user's Available Credits increases
```

### For Users:
```
1. Login to dashboard
2. See credit breakdown
3. Check some text
4. See "Used This Month" increase
5. See "Remaining" decrease
6. After 30 days, see reset
```

---

## 📊 Database Fields Reference

```javascript
users/{userId} {
  // Plan & Limits
  plan: "pro" | "free"
  wordLimit: 5000                    // Max words per check
  credits: 50000                     // Monthly allowance
  subscriptionStatus: "active"       // Payment status
  subscriptionUpdatedAt: "ISO date"  // Subscription start
  
  // Usage Tracking
  creditsUsed: 15000                 // Consumed this cycle
  creditsResetDate: "ISO date"       // Last reset timestamp
  creditsUpdatedAt: "ISO date"       // Last activity
  
  // Addon Credits
  addonCredits: 10000                // Bonus amount
  addonCreditsExpiryAt: "ISO date"   // When addon expires
  
  // Metadata
  status: "active" | "deactivated"
  createdAt: "ISO date"
  updatedAt: "ISO date"
}
```

---

## 🎯 Summary

### Core Principles:
1. **Plan credits = Monthly allowance** (doesn't change)
2. **Usage counter = Consumption tracker** (resets monthly for Pro)
3. **Addon credits = Temporary bonus** (expires by date)
4. **Available = (Plan + Addon) - Used**

### Key Benefits:
- ✅ Simple and clear
- ✅ Easy to understand
- ✅ Flexible for all user types
- ✅ Admin has full control
- ✅ Automatic for Pro users
- ✅ Manual for Enterprise

**Status: PRODUCTION READY** 🚀
