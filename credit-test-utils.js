// Credit System Test Utilities
// Run these in browser console to test credit flows

// ============================================
// TEST UTILITIES
// ============================================

const testUtils = {
  // Get current user's Firestore data
  async getUserData(userId) {
    const db = window.firebase?.firestore();
    if (!db) return console.error('Firestore not available');
    const doc = await db.collection('users').doc(userId).get();
    return doc.data();
  },

  // Simulate 30+ days ago for reset testing
  async triggerResetCondition(userId) {
    const db = window.firebase?.firestore();
    if (!db) return console.error('Firestore not available');
    
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    
    await db.collection('users').doc(userId).update({
      creditsResetDate: thirtyFiveDaysAgo.toISOString(),
      creditsUsed: 30000,
    });
    
    console.log('✅ Reset condition set. Refresh page to trigger reset.');
  },

  // Set addon credits with future expiry
  async addAddonCredits(userId, amount = 10000, daysUntilExpiry = 30) {
    const db = window.firebase?.firestore();
    if (!db) return console.error('Firestore not available');
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);
    
    await db.collection('users').doc(userId).update({
      addonCredits: amount,
      addonCreditsExpiryAt: expiryDate.toISOString(),
      creditsUpdatedAt: new Date().toISOString(),
    });
    
    console.log(`✅ Added ${amount} addon credits expiring in ${daysUntilExpiry} days`);
  },

  // Set expired addon credits
  async setExpiredAddon(userId, amount = 10000) {
    const db = window.firebase?.firestore();
    if (!db) return console.error('Firestore not available');
    
    const pastDate = new Date('2026-01-01T00:00:00Z');
    
    await db.collection('users').doc(userId).update({
      addonCredits: amount,
      addonCreditsExpiryAt: pastDate.toISOString(),
    });
    
    console.log(`✅ Set ${amount} expired addon credits`);
  },

  // Set Pro user with active subscription
  async makeProUser(userId) {
    const db = window.firebase?.firestore();
    if (!db) return console.error('Firestore not available');
    
    await db.collection('users').doc(userId).update({
      plan: 'pro',
      credits: 50000,
      creditsUsed: 0,
      wordLimit: 5000,
      subscriptionStatus: 'active',
      subscriptionUpdatedAt: new Date().toISOString(),
      creditsResetDate: new Date().toISOString(),
    });
    
    console.log('✅ User set to Pro plan with 50K credits');
  },

  // Set Enterprise user
  async makeEnterpriseUser(userId, customCredits = 100000) {
    const db = window.firebase?.firestore();
    if (!db) return console.error('Firestore not available');
    
    await db.collection('users').doc(userId).update({
      plan: 'free',
      credits: customCredits,
      creditsUsed: 0,
      wordLimit: 999999,
    });
    
    console.log(`✅ User set to Enterprise with ${customCredits} credits`);
  },

  // Check current credit state
  async checkCredits(userId) {
    const data = await this.getUserData(userId);
    const now = new Date().getTime();
    const addonExpiry = data.addonCreditsExpiryAt 
      ? new Date(data.addonCreditsExpiryAt).getTime()
      : null;
    const addonValid = addonExpiry ? addonExpiry > now : false;
    
    const planCredits = data.credits || 0;
    const addonCredits = addonValid ? (data.addonCredits || 0) : 0;
    const used = data.creditsUsed || 0;
    const available = planCredits + addonCredits - used;
    
    console.log('=== CREDIT STATUS ===');
    console.log(`Plan Credits: ${planCredits.toLocaleString()}`);
    console.log(`Addon Credits: ${addonCredits.toLocaleString()} ${addonValid ? '✅' : '❌ EXPIRED'}`);
    console.log(`Credits Used: ${used.toLocaleString()}`);
    console.log(`Available: ${available.toLocaleString()}`);
    console.log('====================');
    
    return { planCredits, addonCredits, used, available, addonValid };
  },

  // Simulate credit usage
  async useCredits(userId, amount) {
    const db = window.firebase?.firestore();
    if (!db) return console.error('Firestore not available');
    
    const data = await this.getUserData(userId);
    const newUsed = (data.creditsUsed || 0) + amount;
    
    await db.collection('users').doc(userId).update({
      creditsUsed: newUsed,
      creditsUpdatedAt: new Date().toISOString(),
    });
    
    console.log(`✅ Used ${amount} credits. Total used: ${newUsed.toLocaleString()}`);
  },

  // Reset credits manually
  async resetCredits(userId) {
    const db = window.firebase?.firestore();
    if (!db) return console.error('Firestore not available');
    
    await db.collection('users').doc(userId).update({
      creditsUsed: 0,
      creditsResetDate: new Date().toISOString(),
    });
    
    console.log('✅ Credits reset to 0');
  },
};

// ============================================
// QUICK TEST SCENARIOS
// ============================================

// Get current user ID first
const getCurrentUserId = () => {
  const auth = window.firebase?.auth();
  return auth?.currentUser?.uid;
};

// Run all tests
async function runAllTests() {
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('❌ No user logged in');
    return;
  }

  console.log('🧪 Starting Credit System Tests...');
  console.log(`User ID: ${userId}\n`);

  // TEST 1: Check initial state
  console.log('TEST 1: Initial State');
  await testUtils.checkCredits(userId);
  await new Promise(r => setTimeout(r, 1000));

  // TEST 2: Make Pro user
  console.log('\nTEST 2: Setting Pro User');
  await testUtils.makeProUser(userId);
  await new Promise(r => setTimeout(r, 1000));
  await testUtils.checkCredits(userId);

  // TEST 3: Use some credits
  console.log('\nTEST 3: Using 5000 Credits');
  await testUtils.useCredits(userId, 5000);
  await new Promise(r => setTimeout(r, 1000));
  await testUtils.checkCredits(userId);

  // TEST 4: Add addon credits
  console.log('\nTEST 4: Adding 10K Addon Credits');
  await testUtils.addAddonCredits(userId, 10000, 30);
  await new Promise(r => setTimeout(r, 1000));
  await testUtils.checkCredits(userId);

  // TEST 5: Use more credits
  console.log('\nTEST 5: Using 15K More Credits');
  await testUtils.useCredits(userId, 15000);
  await new Promise(r => setTimeout(r, 1000));
  await testUtils.checkCredits(userId);

  console.log('\n✅ All tests complete!');
  console.log('📋 Refresh the page to see updates in UI');
}

// ============================================
// EXPORT FOR CONSOLE USE
// ============================================

console.log('🧪 Credit System Test Utils Loaded');
console.log('\nAvailable functions:');
console.log('- testUtils.checkCredits(userId)');
console.log('- testUtils.makeProUser(userId)');
console.log('- testUtils.makeEnterpriseUser(userId, amount)');
console.log('- testUtils.addAddonCredits(userId, amount, days)');
console.log('- testUtils.setExpiredAddon(userId, amount)');
console.log('- testUtils.useCredits(userId, amount)');
console.log('- testUtils.triggerResetCondition(userId)');
console.log('- testUtils.resetCredits(userId)');
console.log('- runAllTests() - Run complete test suite');
console.log('\nGet current user: getCurrentUserId()');

// Make available globally
window.testUtils = testUtils;
window.runAllTests = runAllTests;
window.getCurrentUserId = getCurrentUserId;
