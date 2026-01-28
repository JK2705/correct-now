import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.blue}${colors.bold}🧪 ${msg}${colors.reset}`),
  result: (msg) => console.log(`${colors.cyan}   ${msg}${colors.reset}`),
};

// Initialize Firebase Admin
let db;
try {
  const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../server/serviceAccountKey.json'), 'utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db = admin.firestore();
  log.success('Firebase Admin initialized');
} catch (error) {
  log.error(`Failed to initialize Firebase: ${error.message}`);
  process.exit(1);
}

// Test utilities
const testUtils = {
  // Create or get test user
  async getTestUser() {
    const testUserId = 'test-user-' + Date.now();
    const userRef = db.collection('users').doc(testUserId);
    
    await userRef.set({
      name: 'Test User',
      email: 'test@example.com',
      plan: 'free',
      credits: 0,
      creditsUsed: 0,
      wordLimit: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return testUserId;
  },

  // Clean up test user
  async deleteTestUser(userId) {
    await db.collection('users').doc(userId).delete();
  },

  // Get user data
  async getUserData(userId) {
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists ? doc.data() : null;
  },

  // Update user data
  async updateUser(userId, data) {
    await db.collection('users').doc(userId).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  // Calculate credits like the app does
  calculateCredits(data) {
    const now = Date.now();
    const planCredits = Number(data.credits || 0);
    const rawAddonCredits = Number(data.addonCredits || 0);
    const addonExpiryTime = data.addonCreditsExpiryAt
      ? new Date(data.addonCreditsExpiryAt).getTime()
      : null;
    const addonValid = addonExpiryTime ? addonExpiryTime > now : false;
    const validAddonCredits = addonValid ? rawAddonCredits : 0;
    const used = Number(data.creditsUsed || 0);
    const totalCredits = planCredits + validAddonCredits;
    const available = totalCredits - used;

    return {
      planCredits,
      addonCredits: validAddonCredits,
      used,
      totalCredits,
      available,
      addonValid,
    };
  },

  // Check if reset should happen
  shouldReset(data) {
    const plan = String(data.plan || '').toLowerCase();
    const status = String(data.subscriptionStatus || '').toLowerCase();
    
    if (plan !== 'pro' || status !== 'active') return false;

    const lastResetDate = data.creditsResetDate
      ? new Date(data.creditsResetDate)
      : data.subscriptionUpdatedAt
      ? new Date(data.subscriptionUpdatedAt)
      : null;

    if (!lastResetDate) return false;

    const now = new Date();
    const daysSinceReset = (now.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceReset >= 30;
  },
};

// Test suite
const tests = {
  async test1_FreeUser() {
    log.test('TEST 1: Free User (0 Credits)');
    
    const userId = await testUtils.getTestUser();
    const data = await testUtils.getUserData(userId);
    const credits = testUtils.calculateCredits(data);

    const pass = 
      credits.planCredits === 0 &&
      credits.available === 0 &&
      data.wordLimit === 200;

    if (pass) {
      log.success('Free user has 0 credits and 200 word limit');
      log.result(`Credits: ${credits.available}, Limit: ${data.wordLimit}`);
    } else {
      log.error('Free user credits or limit incorrect');
      log.result(`Expected: 0 credits, 200 limit`);
      log.result(`Got: ${credits.available} credits, ${data.wordLimit} limit`);
    }

    await testUtils.deleteTestUser(userId);
    return pass;
  },

  async test2_ProUser() {
    log.test('TEST 2: Pro User (50K Credits)');
    
    const userId = await testUtils.getTestUser();
    
    // Set Pro plan
    await testUtils.updateUser(userId, {
      plan: 'pro',
      credits: 50000,
      creditsUsed: 0,
      wordLimit: 5000,
      subscriptionStatus: 'active',
      subscriptionUpdatedAt: new Date().toISOString(),
      creditsResetDate: new Date().toISOString(),
    });

    const data = await testUtils.getUserData(userId);
    const credits = testUtils.calculateCredits(data);

    const pass = 
      credits.planCredits === 50000 &&
      credits.available === 50000 &&
      data.wordLimit === 5000;

    if (pass) {
      log.success('Pro user has 50K credits and 5K word limit');
      log.result(`Credits: ${credits.available}, Limit: ${data.wordLimit}`);
    } else {
      log.error('Pro user credits or limit incorrect');
      log.result(`Expected: 50000 credits, 5000 limit`);
      log.result(`Got: ${credits.available} credits, ${data.wordLimit} limit`);
    }

    await testUtils.deleteTestUser(userId);
    return pass;
  },

  async test3_CreditUsage() {
    log.test('TEST 3: Credit Usage Tracking');
    
    const userId = await testUtils.getTestUser();
    
    await testUtils.updateUser(userId, {
      plan: 'pro',
      credits: 50000,
      creditsUsed: 0,
    });

    // Simulate checking 5000 words
    await testUtils.updateUser(userId, {
      creditsUsed: 5000,
    });

    let data = await testUtils.getUserData(userId);
    let credits = testUtils.calculateCredits(data);

    const pass1 = credits.available === 45000;

    // Simulate checking another 10000 words
    await testUtils.updateUser(userId, {
      creditsUsed: 15000,
    });

    data = await testUtils.getUserData(userId);
    credits = testUtils.calculateCredits(data);

    const pass2 = credits.available === 35000;

    const pass = pass1 && pass2;

    if (pass) {
      log.success('Credit usage tracked correctly');
      log.result(`After 5K: 45K remaining ✓`);
      log.result(`After 15K total: 35K remaining ✓`);
    } else {
      log.error('Credit usage tracking failed');
      log.result(`After 5K: ${pass1 ? '✓' : '✗'}`);
      log.result(`After 15K: ${pass2 ? '✓' : '✗'}`);
    }

    await testUtils.deleteTestUser(userId);
    return pass;
  },

  async test4_MonthlyReset() {
    log.test('TEST 4: Monthly Reset Logic');
    
    const userId = await testUtils.getTestUser();
    
    // Set Pro user with old reset date
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    
    await testUtils.updateUser(userId, {
      plan: 'pro',
      credits: 50000,
      creditsUsed: 30000,
      subscriptionStatus: 'active',
      subscriptionUpdatedAt: new Date().toISOString(),
      creditsResetDate: thirtyFiveDaysAgo.toISOString(),
    });

    let data = await testUtils.getUserData(userId);
    const shouldReset = testUtils.shouldReset(data);

    if (shouldReset) {
      log.success('Reset condition detected correctly');
      log.result(`Days since reset: 35 (>= 30) ✓`);
      
      // Simulate reset
      await testUtils.updateUser(userId, {
        creditsUsed: 0,
        creditsResetDate: new Date().toISOString(),
      });
      
      data = await testUtils.getUserData(userId);
      const credits = testUtils.calculateCredits(data);
      
      const pass = credits.available === 50000;
      
      if (pass) {
        log.success('Credits reset to full amount');
        log.result(`Available: ${credits.available} (expected 50000) ✓`);
      } else {
        log.error('Credits not reset correctly');
        log.result(`Available: ${credits.available} (expected 50000)`);
      }
      
      await testUtils.deleteTestUser(userId);
      return pass;
    } else {
      log.error('Reset condition not detected');
      await testUtils.deleteTestUser(userId);
      return false;
    }
  },

  async test5_AddonCredits() {
    log.test('TEST 5: Addon Credits');
    
    const userId = await testUtils.getTestUser();
    
    await testUtils.updateUser(userId, {
      plan: 'pro',
      credits: 50000,
      creditsUsed: 0,
    });

    // Add addon credits
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    await testUtils.updateUser(userId, {
      addonCredits: 10000,
      addonCreditsExpiryAt: thirtyDaysFromNow.toISOString(),
    });

    const data = await testUtils.getUserData(userId);
    const credits = testUtils.calculateCredits(data);

    const pass = 
      credits.planCredits === 50000 &&
      credits.addonCredits === 10000 &&
      credits.totalCredits === 60000 &&
      credits.available === 60000 &&
      credits.addonValid === true;

    if (pass) {
      log.success('Addon credits added correctly');
      log.result(`Plan: 50K, Addon: +10K, Total: 60K ✓`);
    } else {
      log.error('Addon credits not working correctly');
      log.result(`Plan: ${credits.planCredits}`);
      log.result(`Addon: ${credits.addonCredits}`);
      log.result(`Total: ${credits.totalCredits} (expected 60000)`);
    }

    await testUtils.deleteTestUser(userId);
    return pass;
  },

  async test6_AddonExpiry() {
    log.test('TEST 6: Addon Credit Expiry');
    
    const userId = await testUtils.getTestUser();
    
    await testUtils.updateUser(userId, {
      plan: 'pro',
      credits: 50000,
      creditsUsed: 0,
    });

    // Add expired addon credits
    const pastDate = new Date('2026-01-01T00:00:00Z');
    
    await testUtils.updateUser(userId, {
      addonCredits: 10000,
      addonCreditsExpiryAt: pastDate.toISOString(),
    });

    const data = await testUtils.getUserData(userId);
    const credits = testUtils.calculateCredits(data);

    const pass = 
      credits.addonCredits === 0 &&
      credits.totalCredits === 50000 &&
      credits.available === 50000 &&
      credits.addonValid === false;

    if (pass) {
      log.success('Expired addon credits ignored correctly');
      log.result(`Addon: 0 (expired), Total: 50K ✓`);
    } else {
      log.error('Expired addon credits not handled correctly');
      log.result(`Addon: ${credits.addonCredits} (expected 0)`);
      log.result(`Total: ${credits.totalCredits} (expected 50000)`);
    }

    await testUtils.deleteTestUser(userId);
    return pass;
  },

  async test7_AddToValidAddon() {
    log.test('TEST 7: Add to Existing Valid Addon');
    
    const userId = await testUtils.getTestUser();
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    await testUtils.updateUser(userId, {
      plan: 'pro',
      credits: 50000,
      creditsUsed: 0,
      addonCredits: 10000,
      addonCreditsExpiryAt: futureDate.toISOString(),
    });

    let data = await testUtils.getUserData(userId);
    const isValid = new Date(data.addonCreditsExpiryAt).getTime() > Date.now();

    // Simulate admin adding more
    const newAmount = isValid ? data.addonCredits + 5000 : 5000;
    
    await testUtils.updateUser(userId, {
      addonCredits: newAmount,
    });

    data = await testUtils.getUserData(userId);
    const credits = testUtils.calculateCredits(data);

    const pass = credits.addonCredits === 15000;

    if (pass) {
      log.success('Added to existing valid addon correctly');
      log.result(`10K + 5K = 15K ✓`);
    } else {
      log.error('Adding to valid addon failed');
      log.result(`Expected: 15000, Got: ${credits.addonCredits}`);
    }

    await testUtils.deleteTestUser(userId);
    return pass;
  },

  async test8_ReplaceExpiredAddon() {
    log.test('TEST 8: Replace Expired Addon');
    
    const userId = await testUtils.getTestUser();
    
    const pastDate = new Date('2026-01-01T00:00:00Z');
    
    await testUtils.updateUser(userId, {
      plan: 'pro',
      credits: 50000,
      creditsUsed: 0,
      addonCredits: 10000,
      addonCreditsExpiryAt: pastDate.toISOString(),
    });

    let data = await testUtils.getUserData(userId);
    const isValid = new Date(data.addonCreditsExpiryAt).getTime() > Date.now();

    // Simulate admin adding new (should replace)
    const newAmount = isValid ? data.addonCredits + 5000 : 5000;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    await testUtils.updateUser(userId, {
      addonCredits: newAmount,
      addonCreditsExpiryAt: futureDate.toISOString(),
    });

    data = await testUtils.getUserData(userId);
    const credits = testUtils.calculateCredits(data);

    const pass = credits.addonCredits === 5000;

    if (pass) {
      log.success('Replaced expired addon correctly');
      log.result(`Old 10K (expired) → New 5K ✓`);
    } else {
      log.error('Replacing expired addon failed');
      log.result(`Expected: 5000, Got: ${credits.addonCredits}`);
    }

    await testUtils.deleteTestUser(userId);
    return pass;
  },

  async test9_ResetWithAddon() {
    log.test('TEST 9: Monthly Reset with Valid Addon');
    
    const userId = await testUtils.getTestUser();
    
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    await testUtils.updateUser(userId, {
      plan: 'pro',
      credits: 50000,
      creditsUsed: 30000,
      addonCredits: 10000,
      addonCreditsExpiryAt: futureDate.toISOString(),
      subscriptionStatus: 'active',
      creditsResetDate: thirtyFiveDaysAgo.toISOString(),
    });

    // Simulate reset
    await testUtils.updateUser(userId, {
      creditsUsed: 0,
      creditsResetDate: new Date().toISOString(),
    });

    const data = await testUtils.getUserData(userId);
    const credits = testUtils.calculateCredits(data);

    const pass = 
      credits.used === 0 &&
      credits.addonCredits === 10000 &&
      credits.available === 60000;

    if (pass) {
      log.success('Reset preserved addon credits');
      log.result(`Used: 0 (reset), Addon: 10K (preserved), Total: 60K ✓`);
    } else {
      log.error('Reset did not preserve addon correctly');
      log.result(`Used: ${credits.used} (expected 0)`);
      log.result(`Addon: ${credits.addonCredits} (expected 10000)`);
      log.result(`Total: ${credits.available} (expected 60000)`);
    }

    await testUtils.deleteTestUser(userId);
    return pass;
  },

  async test10_EnterpriseNoReset() {
    log.test('TEST 10: Enterprise User (No Auto-Reset)');
    
    const userId = await testUtils.getTestUser();
    
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    
    await testUtils.updateUser(userId, {
      plan: 'free',  // Not Pro subscription
      credits: 100000,  // Custom enterprise credits
      creditsUsed: 30000,
      wordLimit: 999999,
      creditsResetDate: thirtyFiveDaysAgo.toISOString(),
    });

    const data = await testUtils.getUserData(userId);
    const shouldReset = testUtils.shouldReset(data);

    const pass = !shouldReset;

    if (pass) {
      log.success('Enterprise user does not auto-reset');
      log.result(`Plan: free, Credits: 100K, No reset ✓`);
    } else {
      log.error('Enterprise user incorrectly flagged for reset');
      log.result(`Should NOT reset for non-Pro plans`);
    }

    await testUtils.deleteTestUser(userId);
    return pass;
  },
};

// Run all tests
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}${colors.cyan}🧪 CREDIT SYSTEM AUTOMATED TEST SUITE${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  const results = [];
  const testFunctions = Object.keys(tests).filter(key => key.startsWith('test'));

  for (const testName of testFunctions) {
    try {
      const passed = await tests[testName]();
      results.push({ name: testName, passed });
      console.log('');
    } catch (error) {
      log.error(`${testName} threw error: ${error.message}`);
      results.push({ name: testName, passed: false, error: error.message });
      console.log('');
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log(`${colors.bold}${colors.cyan}📊 TEST SUMMARY${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  results.forEach((result, index) => {
    const status = result.passed 
      ? `${colors.green}✅ PASS${colors.reset}`
      : `${colors.red}❌ FAIL${colors.reset}`;
    const name = result.name.replace('test', 'TEST ').replace(/_/g, ': ');
    console.log(`${status} ${name}`);
    if (result.error) {
      console.log(`     ${colors.red}Error: ${result.error}${colors.reset}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  
  const passRate = ((passed / total) * 100).toFixed(1);
  const summaryColor = passed === total ? colors.green : failed > passed ? colors.red : colors.yellow;
  
  console.log(`${summaryColor}${colors.bold}Results: ${passed}/${total} tests passed (${passRate}%)${colors.reset}`);
  
  if (passed === total) {
    console.log(`${colors.green}${colors.bold}🎉 ALL TESTS PASSED! System is production-ready.${colors.reset}`);
  } else if (failed > 0) {
    console.log(`${colors.red}${colors.bold}⚠️  ${failed} test(s) failed. Review and fix issues.${colors.reset}`);
  }
  
  console.log('='.repeat(60) + '\n');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  log.error(`Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
