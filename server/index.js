import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import Razorpay from "razorpay";
import Stripe from "stripe";
import crypto from "crypto";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "..", "dist");
const publicPath = path.join(__dirname, "..", "public");

const initAdminDb = () => {
  try {
    if (!admin.apps.length) {
      // Try to load from explicit env path first
      const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      const resolvedEnvPath = envPath
        ? path.isAbsolute(envPath)
          ? envPath
          : path.join(__dirname, "..", envPath)
        : null;
      const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

      if (resolvedEnvPath && existsSync(resolvedEnvPath)) {
        admin.initializeApp({
          credential: admin.credential.cert(resolvedEnvPath),
        });
      } else if (existsSync(serviceAccountPath)) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Fallback to env variable
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
        });
      } else {
        return null;
      }
    }
    return admin.firestore();
  } catch (err) {
    console.error("Firebase admin init error:", err);
    return null;
  }
};

const adminDb = initAdminDb();

// Simple in-memory cache to reduce latency and cost
const cacheStore = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const getCache = (key) => {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
};

const setCache = (key, value) => {
  cacheStore.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2024-11-20.acacia" });
};

const getBrevoTransporter = () => {
  const apiKey = process.env.BREVO_API_KEY;
  const smtpUser = process.env.BREVO_SMTP_USER || "apikey";
  const smtpPass = process.env.BREVO_SMTP_PASS || apiKey;
  if (!smtpPass) return null;
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.BREVO_SMTP_PORT || 587),
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const sendBrevoEmail = async ({ to, subject, html }) => {
  const transporter = getBrevoTransporter();
  if (!transporter) {
    throw new Error("Brevo SMTP is not configured");
  }
  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@yourdomain.com";
  const fromName = process.env.BREVO_FROM_NAME || "CorrectNow";
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });
};

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

const toStripeAmount = (amount, currency) => {
  const code = String(currency || "").toLowerCase();
  return ZERO_DECIMAL_CURRENCIES.has(code)
    ? Math.round(amount)
    : Math.round(amount * 100);
};

const updateUsersBySubscriptionId = async (subscriptionId, updates) => {
  if (!adminDb || !subscriptionId) return;
  const snapshot = await adminDb
    .collection("users")
    .where("subscriptionId", "==", subscriptionId)
    .get();
  if (snapshot.empty) return;

  const batch = adminDb.batch();
  snapshot.forEach((doc) => {
    batch.set(doc.ref, updates, { merge: true });
  });
  await batch.commit();
};

// IP tracking for rate limiting non-authenticated users
const ipCheckCount = new Map(); // { ip: { count: number, resetAt: timestamp } }
const IP_CHECK_LIMIT = 5;
const IP_RESET_HOURS = 24;

app.use(cors());

// CRITICAL: Process webhook routes BEFORE any body parsing middleware
// Stripe webhook - MUST use raw body
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("=== STRIPE WEBHOOK RECEIVED ===");
    console.log("Timestamp:", new Date().toISOString());
    
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    console.log("Has signature:", !!sig);
    console.log("Has webhook secret:", !!webhookSecret);
    console.log("Body type:", typeof req.body);
    console.log("Body is Buffer:", Buffer.isBuffer(req.body));
    
    if (!sig || !webhookSecret) {
      console.error("ERROR: Missing signature or webhook secret");
      return res.status(400).json({ error: "Missing signature or webhook secret" });
    }

    const stripe = getStripe();
    if (!stripe) {
      console.error("ERROR: Stripe not configured");
      return res.status(500).json({ error: "Stripe not configured" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log("✓ Webhook signature verified successfully");
    } catch (err) {
      console.error("ERROR: Stripe webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log("Event type:", event.type);
    console.log("Event ID:", event.id);

    try {
      const nowIso = new Date().toISOString();
      
      switch (event.type) {
        case "checkout.session.completed": {
          console.log("--- Processing checkout.session.completed ---");
          const session = event.data.object;
          const customerId = session.customer;
          const subscriptionId = session.subscription;
          const metadata = session.metadata || {};
          const userId = metadata.userId;
          
          console.log("Customer ID:", customerId);
          console.log("Subscription ID:", subscriptionId);
          console.log("User ID from metadata:", userId);
          console.log("Metadata type:", metadata.type);
          console.log("AdminDb available:", !!adminDb);
          
          if (!userId) {
            console.error("ERROR: No userId in metadata");
            break;
          }
          
          if (!adminDb) {
            console.error("ERROR: AdminDb not initialized");
            break;
          }
          
          const userRef = adminDb.collection("users").doc(userId);
          console.log("User reference path:", `users/${userId}`);
          
          if (metadata.type === "credits") {
            console.log("Processing CREDIT purchase");
            const credits = Number(metadata.credits || 0);
            console.log("Credits to add:", credits);
            
            const userSnap = await userRef.get();
            const data = userSnap.exists ? userSnap.data() : {};
            const currentAddon = Number(data?.addonCredits || 0) || 0;
            const currentExpiry = data?.addonCreditsExpiryAt;
            const now = new Date();
            const isCurrentValid = currentExpiry ? new Date(String(currentExpiry)).getTime() > now.getTime() : false;
            const nextAddon = (isCurrentValid ? currentAddon : 0) + credits;
            const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
            console.log("Current addon credits:", currentAddon);
            console.log("New addon credits:", nextAddon);
            
            await userRef.set({
              addonCredits: nextAddon,
              addonCreditsExpiryAt: expiry,
              creditsUpdatedAt: nowIso,
              updatedAt: nowIso,
            }, { merge: true });
            console.log("✓ Credits updated successfully");
          } else {
            console.log("Processing SUBSCRIPTION purchase");
            const updateData = {
              plan: "pro",
              wordLimit: 5000,
              credits: 50000,
              creditsUsed: 0,
              creditsResetDate: nowIso,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: "active",
              subscriptionUpdatedAt: nowIso,
              updatedAt: nowIso,
            };
            console.log("Update data:", JSON.stringify(updateData, null, 2));
            
            await userRef.set(updateData, { merge: true });
            console.log("✓ Subscription updated successfully");
            
            // Verify the update
            const verifySnap = await userRef.get();
            if (verifySnap.exists) {
              console.log("✓ Verification - User document exists");
              console.log("Updated user data:", JSON.stringify(verifySnap.data(), null, 2));
            } else {
              console.error("ERROR: User document not found after update");
            }
          }
          break;
        }
        
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          console.log("--- Processing subscription update/delete ---");
          const subscription = event.data.object;
          const subscriptionId = subscription.id;
          const status = subscription.status;
          
          console.log("Subscription ID:", subscriptionId);
          console.log("Subscription status:", status);
          
          if (!adminDb || !subscriptionId) {
            console.error("ERROR: No adminDb or subscriptionId");
            break;
          }
          
          const snapshot = await adminDb
            .collection("users")
            .where("stripeSubscriptionId", "==", subscriptionId)
            .get();
          
          console.log("Found users with this subscription:", snapshot.size);
            
          if (snapshot.empty) {
            console.error("ERROR: No users found with subscription ID:", subscriptionId);
            break;
          }
          
          const batch = adminDb.batch();
          const updates = {};
          
          if (status === "active") {
            updates.plan = "pro";
            updates.wordLimit = 5000;
            updates.credits = 50000;
            updates.creditsUsed = 0;
            updates.creditsResetDate = nowIso;
            updates.subscriptionStatus = "active";
          } else if (["canceled", "unpaid"].includes(status)) {
            updates.plan = "free";
            updates.wordLimit = 200;
            updates.credits = 0;
            updates.creditsUsed = 0;
            updates.subscriptionStatus = status;
          } else if (status === "past_due") {
            updates.subscriptionStatus = "past_due";
          }
          
          updates.subscriptionUpdatedAt = nowIso;
          updates.updatedAt = nowIso;
          
          console.log("Update data:", JSON.stringify(updates, null, 2));
          
          snapshot.forEach((doc) => {
            console.log("Updating user:", doc.id);
            batch.set(doc.ref, updates, { merge: true });
          });
          
          await batch.commit();
          console.log("✓ Batch update completed");
          break;
        }
        
        case "invoice.payment_succeeded": {
          console.log("--- Processing invoice.payment_succeeded ---");
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;
          
          console.log("Subscription ID:", subscriptionId);
          
          if (!adminDb || !subscriptionId) {
            console.error("ERROR: No adminDb or subscriptionId");
            break;
          }
          
          const snapshot = await adminDb
            .collection("users")
            .where("stripeSubscriptionId", "==", subscriptionId)
            .get();
          
          console.log("Found users:", snapshot.size);
            
          if (snapshot.empty) {
            console.error("ERROR: No users found with subscription ID:", subscriptionId);
            break;
          }
          
          const batch = adminDb.batch();
          snapshot.forEach((doc) => {
            console.log("Updating user:", doc.id);
            batch.set(doc.ref, {
              plan: "pro",
              wordLimit: 5000,
              credits: 50000,
              creditsUsed: 0,
              creditsResetDate: nowIso,
              subscriptionStatus: "active",
              subscriptionUpdatedAt: nowIso,
              updatedAt: nowIso,
            }, { merge: true });
          });
          
          await batch.commit();
          console.log("✓ Batch update completed");
          break;
        }
        
        case "invoice.payment_failed": {
          console.log("--- Processing invoice.payment_failed ---");
          const invoice = event.data.object;
          const subscriptionId = invoice.subscription;
          
          console.log("Subscription ID:", subscriptionId);
          
          if (!adminDb || !subscriptionId) {
            console.error("ERROR: No adminDb or subscriptionId");
            break;
          }
          
          const snapshot = await adminDb
            .collection("users")
            .where("stripeSubscriptionId", "==", subscriptionId)
            .get();
          
          console.log("Found users:", snapshot.size);
            
          if (snapshot.empty) {
            console.error("ERROR: No users found with subscription ID:", subscriptionId);
            break;
          }
          
          const batch = adminDb.batch();
          snapshot.forEach((doc) => {
            console.log("Updating user:", doc.id);
            batch.set(doc.ref, {
              subscriptionStatus: "past_due",
              subscriptionUpdatedAt: nowIso,
              updatedAt: nowIso,
            }, { merge: true });
          });
          
          await batch.commit();
          console.log("✓ Batch update completed");
          break;
        }
        
        default:
          console.log("Unhandled event type:", event.type);
      }
      
      console.log("=== WEBHOOK PROCESSING COMPLETED SUCCESSFULLY ===");
      res.json({ received: true });
    } catch (error) {
      console.error("=== WEBHOOK ERROR ===");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// Razorpay webhook - MUST use raw body
app.post("/api/razorpay/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  if (!secret || !signature) {
    return res.status(500).json({ message: "Webhook secret or signature missing" });
  }

  const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
  if (expected !== signature) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  try {
    const event = JSON.parse(req.body.toString("utf8"));
    const eventName = event?.event || "unknown";
    console.log("Razorpay webhook:", eventName);

    const subscriptionId =
      event?.payload?.subscription?.entity?.id ||
      event?.payload?.payment?.entity?.subscription_id ||
      event?.payload?.invoice?.entity?.subscription_id ||
      event?.payload?.subscription?.id ||
      "";

    if (adminDb && subscriptionId) {
      const nowIso = new Date().toISOString();
      if (eventName === "subscription.charged") {
        await updateUsersBySubscriptionId(subscriptionId, {
          plan: "pro",
          wordLimit: 5000,
          credits: 50000,
          creditsUsed: 0,
          creditsResetDate: nowIso,
          subscriptionStatus: "active",
          subscriptionUpdatedAt: nowIso,
          updatedAt: nowIso,
        });
      } else if (eventName === "payment.failed") {
        await updateUsersBySubscriptionId(subscriptionId, {
          plan: "free",
          wordLimit: 200,
          credits: 0,
          subscriptionStatus: "past_due",
          updatedAt: nowIso,
        });
      } else if (
        [
          "subscription.halted",
          "subscription.cancelled",
          "subscription.paused",
          "subscription.completed",
        ].includes(eventName)
      ) {
        await updateUsersBySubscriptionId(subscriptionId, {
          plan: "free",
          wordLimit: 200,
          credits: 0,
          subscriptionStatus: "inactive",
          updatedAt: nowIso,
        });
      }
    }
  } catch {
    return res.status(400).json({ message: "Invalid webhook payload" });
  }

  return res.status(200).json({ status: "ok" });
});

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  console.log("=== STRIPE WEBHOOK RECEIVED ===");
  console.log("Timestamp:", new Date().toISOString());
  
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log("Has signature:", !!sig);
  console.log("Has webhook secret:", !!webhookSecret);
  
  if (!sig || !webhookSecret) {
    console.error("ERROR: Missing signature or webhook secret");
    console.log("Signature present:", !!sig);
    console.log("Webhook secret present:", !!webhookSecret);
    return res.status(400).json({ error: "Missing signature or webhook secret" });
  }

  const stripe = getStripe();
  if (!stripe) {
    console.error("ERROR: Stripe not configured");
    return res.status(500).json({ error: "Stripe not configured" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log("✓ Webhook signature verified successfully");
  } catch (err) {
    console.error("ERROR: Stripe webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log("Event type:", event.type);
  console.log("Event ID:", event.id);

  try {
    const nowIso = new Date().toISOString();
    
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("--- Processing checkout.session.completed ---");
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const metadata = session.metadata || {};
        const userId = metadata.userId;
        
        console.log("Customer ID:", customerId);
        console.log("Subscription ID:", subscriptionId);
        console.log("User ID from metadata:", userId);
        console.log("Metadata type:", metadata.type);
        console.log("AdminDb available:", !!adminDb);
        
        if (!userId) {
          console.error("ERROR: No userId in metadata");
          break;
        }
        
        if (!adminDb) {
          console.error("ERROR: AdminDb not initialized");
          break;
        }
        
        const userRef = adminDb.collection("users").doc(userId);
        console.log("User reference path:", `users/${userId}`);
        
        if (metadata.type === "credits") {
          console.log("Processing CREDIT purchase");
          const credits = Number(metadata.credits || 0);
          console.log("Credits to add:", credits);
          
          const userSnap = await userRef.get();
          const currentCredits = userSnap.exists ? Number(userSnap.data()?.credits || 0) : 0;
          console.log("Current credits:", currentCredits);
          console.log("New total credits:", currentCredits + credits);
          
          await userRef.set({
            credits: currentCredits + credits,
            creditsUpdatedAt: nowIso,
            updatedAt: nowIso,
          }, { merge: true });
          console.log("✓ Credits updated successfully");
        } else {
          console.log("Processing SUBSCRIPTION purchase");
          const updateData = {
            plan: "pro",
            wordLimit: 5000,
            credits: 50000,
            creditsUsed: 0,
            creditsResetDate: nowIso,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "active",
            subscriptionUpdatedAt: nowIso,
            updatedAt: nowIso,
          };
          console.log("Update data:", JSON.stringify(updateData, null, 2));
          
          await userRef.set(updateData, { merge: true });
          console.log("✓ Subscription updated successfully");
          
          // Verify the update
          const verifySnap = await userRef.get();
          if (verifySnap.exists) {
            console.log("✓ Verification - User document exists");
            console.log("Updated user data:", JSON.stringify(verifySnap.data(), null, 2));
          } else {
            console.error("ERROR: User document not found after update");
          }
        }
        break;
      }
      
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        console.log("--- Processing subscription update/delete ---");
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        const status = subscription.status;
        
        console.log("Subscription ID:", subscriptionId);
        console.log("Subscription status:", status);
        
        if (!adminDb || !subscriptionId) {
          console.error("ERROR: No adminDb or subscriptionId");
          break;
        }
        
        const snapshot = await adminDb
          .collection("users")
          .where("stripeSubscriptionId", "==", subscriptionId)
          .get();
        
        console.log("Found users with this subscription:", snapshot.size);
          
        if (snapshot.empty) {
          console.error("ERROR: No users found with subscription ID:", subscriptionId);
          break;
        }
        
        const batch = adminDb.batch();
        const updates = {};
        
        if (status === "active") {
          updates.plan = "pro";
          updates.wordLimit = 5000;
          updates.credits = 50000;
          updates.creditsUsed = 0;
          updates.creditsResetDate = nowIso;
          updates.subscriptionStatus = "active";
        } else if (["canceled", "unpaid"].includes(status)) {
          updates.plan = "free";
          updates.wordLimit = 200;
          updates.credits = 0;
          updates.creditsUsed = 0;
          updates.subscriptionStatus = status;
        } else if (status === "past_due") {
          updates.subscriptionStatus = "past_due";
        }
        
        updates.subscriptionUpdatedAt = nowIso;
        updates.updatedAt = nowIso;
        
        console.log("Updates to apply:", JSON.stringify(updates, null, 2));
        
        snapshot.forEach((doc) => {
          console.log("Updating user:", doc.id);
          batch.set(doc.ref, updates, { merge: true });
        });
        
        await batch.commit();
        console.log("✓ Batch update completed");
        break;
      }
      
      case "invoice.payment_succeeded": {
        console.log("--- Processing invoice.payment_succeeded ---");
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        console.log("Subscription ID:", subscriptionId);
        
        if (!adminDb || !subscriptionId) {
          console.error("ERROR: No adminDb or subscriptionId");
          break;
        }
        
        const snapshot = await adminDb
          .collection("users")
          .where("stripeSubscriptionId", "==", subscriptionId)
          .get();
        
        console.log("Found users:", snapshot.size);
          
        if (snapshot.empty) {
          console.error("ERROR: No users found with subscription ID:", subscriptionId);
          break;
        }
        
        const batch = adminDb.batch();
        snapshot.forEach((doc) => {
          console.log("Updating user:", doc.id);
          batch.set(doc.ref, {
            plan: "pro",
            wordLimit: 5000,
            credits: 50000,
            creditsUsed: 0,
            creditsResetDate: nowIso,
            subscriptionStatus: "active",
            subscriptionUpdatedAt: nowIso,
            updatedAt: nowIso,
          }, { merge: true });
        });
        
        await batch.commit();
        console.log("✓ Batch update completed");
        break;
      }
      
      case "invoice.payment_failed": {
        console.log("--- Processing invoice.payment_failed ---");
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        console.log("Subscription ID:", subscriptionId);
        
        if (!adminDb || !subscriptionId) {
          console.error("ERROR: No adminDb or subscriptionId");
          break;
        }
        
        const snapshot = await adminDb
          .collection("users")
          .where("stripeSubscriptionId", "==", subscriptionId)
          .get();
        
        console.log("Found users:", snapshot.size);
          
        if (snapshot.empty) {
          console.error("ERROR: No users found with subscription ID:", subscriptionId);
          break;
        }
        
        const batch = adminDb.batch();
        snapshot.forEach((doc) => {
          console.log("Updating user:", doc.id);
          batch.set(doc.ref, {
            subscriptionStatus: "past_due",
            subscriptionUpdatedAt: nowIso,
            updatedAt: nowIso,
          }, { merge: true });
        });
        
        await batch.commit();
        console.log("✓ Batch update completed");
        break;
      }
      
      default:
        console.log("Unhandled event type:", event.type);
    }
    
    console.log("=== WEBHOOK PROCESSING COMPLETED SUCCESSFULLY ===");
    res.json({ received: true });
  } catch (error) {
    console.error("=== WEBHOOK ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

app.use(express.json({ limit: "1mb" }));

const WORD_LIMIT = 5000;

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Set admin claim and create user if needed (SECURE THIS IN PRODUCTION)
app.post("/api/set-admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    let user;
    try {
      // Try to get existing user
      user = await admin.auth().getUserByEmail(email);
    } catch (error) {
      // User doesn't exist, create it
      if (password) {
        user = await admin.auth().createUser({
          email,
          password,
          emailVerified: true,
        });
        console.log(`Created new user: ${email}`);
      } else {
        return res.status(400).json({ error: "Password required for new user" });
      }
    }

    // Set admin claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Admin claim set for ${email} (${user.uid})`);

    res.json({ 
      success: true, 
      message: `Admin claim set for ${email}`,
      uid: user.uid
    });
  } catch (error) {
    console.error("Set admin error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/razorpay/key", (_req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    return res.status(500).json({ message: "Missing RAZORPAY_KEY_ID" });
  }
  return res.json({ keyId });
});

app.post("/api/razorpay/order", async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({ message: "Razorpay is not configured" });
    }

    const percent = Number(req.body?.discountPercent || 0);
    const baseAmount = Number(req.body?.amount ?? 499);
    const amountInRupees = percent > 0
      ? Math.max(1, Number((baseAmount * (1 - percent / 100)).toFixed(2)))
      : baseAmount;

    if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
      return res.status(400).json({ message: "Invalid subscription amount" });
    }
    const credits = Number(req.body?.credits ?? 0);
    const amount = Math.round(amountInRupees * 100);
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { plan: "pro", credits: credits || undefined },
    });

    return res.json(order);
  } catch (err) {
    console.error("Razorpay order error:", err);
    return res.status(500).json({ message: "Failed to create order" });
  }
});

app.post("/api/razorpay/subscription", async (req, res) => {
  try {
    console.log("Razorpay subscription request received");
    console.log("Environment check:", {
      hasKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpay = getRazorpay();
    if (!razorpay) {
      console.error("Razorpay not configured - missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
      return res.status(500).json({ 
        message: "Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables." 
      });
    }

    const requestedPlanId = req.body?.planId;
    const requestedPeriod = String(req.body?.period || "monthly");
    const period = ["daily", "weekly", "monthly", "yearly"].includes(requestedPeriod)
      ? requestedPeriod
      : "monthly";
    const interval = Math.max(1, Number(req.body?.interval ?? 1));
    const percent = Number(req.body?.discountPercent || 0);
    const baseAmount = Number(req.body?.amount ?? 499);
    const amountInRupees = percent > 0
      ? Math.max(1, Number((baseAmount * (1 - percent / 100)).toFixed(2)))
      : baseAmount;
    let planId = requestedPlanId || process.env.RAZORPAY_PLAN_ID;

    if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
      return res.status(400).json({ message: "Invalid subscription amount" });
    }

    if (Number.isFinite(amountInRupees) && amountInRupees > 0 && percent > 0) {
      planId = undefined;
    }

    if (!planId) {
      console.log("Creating new Razorpay plan");
      const plan = await razorpay.plans.create({
        period,
        interval,
        item: {
          name: "CorrectNow Pro",
          amount: Math.round(amountInRupees * 100),
          currency: "INR",
          description: "Monthly Pro subscription - 2000 word limit, 50,000 credits",
        },
      });
      planId = plan.id;
      console.log("Plan created:", planId);
    }

    console.log("Creating subscription with plan:", planId);
    const totalCount = Number(req.body?.totalCount ?? 12);
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: totalCount,
      customer_notify: 1,
      notes: { plan: "pro" },
    });

    console.log("Subscription created successfully:", subscription.id);
    return res.json(subscription);
  } catch (err) {
    console.error("Razorpay subscription error:", err);
    console.error("Error details:", {
      message: err.message,
      statusCode: err.statusCode,
      error: err.error,
    });
    return res.status(500).json({ 
      message: "Failed to create subscription",
      error: err.message,
      details: err.error?.description || err.error?.reason || "Unknown error"
    });
  }
});

app.post("/api/auth/send-verification", async (req, res) => {
  try {
    const { email, continueUrl } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required" });

    if (!admin.apps.length) {
      return res.status(500).json({ message: "Firebase admin not initialized" });
    }

    const link = await admin.auth().generateEmailVerificationLink(String(email), {
      url: String(continueUrl || process.env.CLIENT_URL || "http://localhost:5173"),
      handleCodeInApp: false,
    });

    await sendBrevoEmail({
      to: String(email),
      subject: "Verify your email",
      html: `
        <h2>Welcome to CorrectNow</h2>
        <p>Please verify your email address to activate your account:</p>
        <p><a href="${link}">Verify Email</a></p>
        <p>If you did not create this account, you can ignore this email.</p>
      `,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Send verification error:", err);
    return res.status(500).json({ message: "Failed to send verification email" });
  }
});

app.post("/api/auth/send-password-reset", async (req, res) => {
  try {
    const { email, continueUrl } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required" });

    if (!admin.apps.length) {
      return res.status(500).json({ message: "Firebase admin not initialized" });
    }

    const link = await admin.auth().generatePasswordResetLink(String(email), {
      url: String(continueUrl || process.env.CLIENT_URL || "http://localhost:5173"),
      handleCodeInApp: false,
    });

    await sendBrevoEmail({
      to: String(email),
      subject: "Reset your password",
      html: `
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${link}">Reset Password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Send reset error:", err);
    return res.status(500).json({ message: "Failed to send reset email" });
  }
});

app.get("/api/stripe/config", (_req, res) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return res.status(500).json({ message: "Missing STRIPE_PUBLISHABLE_KEY" });
  }
  return res.json({ publishableKey });
});

app.get("/api/coupons/validate", async (req, res) => {
  try {
    const code = String(req.query?.code || "").trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ message: "Coupon code required" });
    }
    if (!adminDb) {
      return res.status(500).json({ message: "Admin DB not configured" });
    }
    const docSnap = await adminDb.collection("coupons").doc(code).get();
    if (!docSnap.exists) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }
    const data = docSnap.data() || {};
    if (data.active === false) {
      return res.status(400).json({ message: "Coupon is inactive" });
    }
    const percent = Number(data.percent || 0);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      return res.status(400).json({ message: "Invalid coupon percentage" });
    }
    return res.json({ code, percent });
  } catch (err) {
    console.error("Coupon validate error:", err);
    return res.status(500).json({ message: "Failed to validate coupon" });
  }
});

app.post("/api/stripe/create-checkout-session", async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    const { userId, userEmail, type, credits, amount, priceId, currency, couponCode, discountPercent } = req.body;
    
    if (!userId || !userEmail) {
      return res.status(400).json({ message: "User ID and email required" });
    }

    // Use the origin from the request or fallback to environment variable
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || process.env.CLIENT_URL || "http://localhost:5173";
    const clientUrl = origin.includes('localhost') ? origin : origin;

    let sessionConfig = {
      payment_method_types: ["card"],
      mode: type === "credits" ? "payment" : "subscription",
      customer_email: userEmail,
      success_url: `${clientUrl}/?payment=success`,
      cancel_url: `${clientUrl}/payment?payment=cancelled${type === "credits" ? "&mode=credits" : ""}`,
      metadata: {
        userId,
      },
    };

    if (type === "credits") {
      // One-time credit purchase
      const creditAmount = Number(amount);
      if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
        return res.status(400).json({ message: "Invalid credit amount" });
      }
      sessionConfig.line_items = [{
        price_data: {
          currency: String(currency || "inr").toLowerCase(),
          product_data: {
            name: `${credits || 10000} Credits Pack`,
            description: "Credits for extra checks",
          },
          unit_amount: toStripeAmount(creditAmount, currency),
        },
        quantity: 1,
      }];
      sessionConfig.metadata.type = "credits";
      sessionConfig.metadata.credits = String(credits || 10000);
    } else {
      // Subscription
      const percent = Number(discountPercent || 0);
      const baseAmount = Number(amount);
      if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
        return res.status(400).json({ message: "Invalid subscription amount" });
      }
      const discountedAmount = percent > 0
        ? Math.max(1, Number((baseAmount * (1 - percent / 100)).toFixed(2)))
        : baseAmount;

      let resolvedPriceId = percent > 0 ? undefined : (priceId || process.env.STRIPE_PRICE_ID);
      
      if (!resolvedPriceId) {
        // Create a price if not configured
        const product = await stripe.products.create({
          name: "CorrectNow Pro",
          description: "Monthly subscription",
        });
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: toStripeAmount(discountedAmount, currency),
          currency: String(currency || "inr").toLowerCase(),
          recurring: { interval: "month" },
        });
        
        resolvedPriceId = price.id;
      }
      
      sessionConfig.line_items = [{
        price: resolvedPriceId,
        quantity: 1,
      }];
      sessionConfig.metadata.type = "subscription";
      if (couponCode) sessionConfig.metadata.couponCode = String(couponCode);
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe checkout session error:", err);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});

app.get("/api/models", async (_req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Missing GEMINI_API_KEY" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ListModels error:", errorText);
      return res.status(500).json({ message: "ListModels error", details: errorText });
    }

    const data = await response.json();
    return res.json({
      models: Array.isArray(data?.models) ? data.models.map((m) => m.name) : [],
    });
  } catch (err) {
    console.error("ListModels server error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/detect-language", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "Text is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Missing GEMINI_API_KEY" });
    }

    const model = process.env.GEMINI_DETECT_MODEL || "gemini-2.5-flash-lite";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const allowed = ["en","hi","ta","te","bn","mr","gu","kn","ml","pa","ur","fa","es","fr","de","pt","it","nl","sv","no","da","fi","pl","ro","tr","el","he","id","ms","th","vi","tl","sw","ru","uk","ja","ko","zh","ar","af","cs","hu","auto"];
    const prompt = `Detect language and return ONLY JSON: {"code":"<code>"}.
Allowed codes: ${allowed.join(", ")}.
Return closest code; if unsure, "auto".
Text:\n"""${text}"""`;

    const detectKey = crypto.createHash("sha256").update(prompt).digest("hex");
    const cachedDetect = getCache(`detect:${detectKey}`);
    if (cachedDetect) {
      return res.json(cachedDetect);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Detect-language error:", errorText);
      return res.status(500).json({ message: "Detect-language error", details: errorText });
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return res.status(500).json({ message: "Invalid detect-language response" });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ message: "Failed to parse detect-language response" });
    }

    const code = typeof parsed?.code === "string" ? parsed.code : "auto";
    const result = { code: allowed.includes(code) ? code : "auto" };
    setCache(`detect:${detectKey}`, result);
    return res.json(result);
  } catch (err) {
    console.error("Detect-language server error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

const buildPrompt = (text, language) => {
  const languageInstruction =
    language && language !== "auto"
      ? `Language: ${language}.`
      : "Auto-detect language.";

  return `You are a strict grammar and spelling correction assistant.
${languageInstruction}
Task: Correct ONLY grammar, spelling, and punctuation errors.
Rules:
- Fix errors without rewriting or changing meaning.
- Preserve tone and wording; no extra facts.
- For each change, give a clear, user-friendly reason (8-14 words) in the same language as the input.
- Normalize repeated punctuation (e.g., "...", "!!", "??") when inappropriate.
- If no changes, return original text and empty changes.
Return ONLY valid JSON in this format:
{
  "corrected_text": "...",
  "changes": [
    { "original": "...", "corrected": "...", "explanation": "..." }
  ]
}
Text:
"""
${text}
"""`;
};

const parseGeminiJson = (raw) => {
  if (!raw || typeof raw !== "string") return null;

  const extractBalancedJson = (value) => {
    const text = value;
    const start = text.indexOf("{");
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    for (let i = start; i < text.length; i += 1) {
      const ch = text[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (ch === "\\") {
        if (inString) escapeNext = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
    return null;
  };

  const sanitize = (value) => {
    const noFence = value
      .replace(/^\uFEFF/, "")
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .trim();

    const noControlChars = noFence.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    const escapeNewlinesInStrings = (text) => {
      let out = "";
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        if (escapeNext) {
          out += ch;
          escapeNext = false;
          continue;
        }
        if (ch === "\\") {
          out += ch;
          if (inString) escapeNext = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          out += ch;
          continue;
        }
        if (inString && (ch === "\n" || ch === "\r")) {
          out += "\\n";
          continue;
        }
        out += ch;
      }
      return out;
    };
    const escaped = escapeNewlinesInStrings(noControlChars);
    const withoutTrailingCommas = escaped.replace(/,(\s*[}\]])/g, "$1");
    return withoutTrailingCommas;
  };

  const tryParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const cleaned = sanitize(raw);
  let parsed = tryParse(cleaned);
  if (parsed) return parsed;

  const balanced = extractBalancedJson(cleaned);
  if (balanced) {
    parsed = tryParse(balanced);
    if (parsed) return parsed;
  }

  return null;
};

app.post("/api/proofread", async (req, res) => {
  try {
    const { text, language, userId } = req.body || {};
    
    // Rate limiting for non-authenticated users
    if (!userId) {
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                       req.headers['x-real-ip'] || 
                       req.socket.remoteAddress;
      
      const now = Date.now();
      const ipData = ipCheckCount.get(clientIp);
      
      // Reset if past reset time
      if (ipData && now > ipData.resetAt) {
        ipCheckCount.delete(clientIp);
      }
      
      const currentData = ipCheckCount.get(clientIp);
      
      if (currentData && currentData.count >= IP_CHECK_LIMIT) {
        return res.status(429).json({ 
          message: "Free limit reached. Please sign in to continue checking.",
          requiresAuth: true,
          checksRemaining: 0
        });
      }
      
      // Update count
      const resetAt = now + (IP_RESET_HOURS * 60 * 60 * 1000);
      ipCheckCount.set(clientIp, {
        count: (currentData?.count || 0) + 1,
        resetAt: currentData?.resetAt || resetAt
      });
      
      const checksRemaining = IP_CHECK_LIMIT - (currentData?.count || 0) - 1;
      res.setHeader('X-Checks-Remaining', checksRemaining.toString());
    }
    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "Text is required" });
    }

    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length > WORD_LIMIT) {
      return res.status(400).json({ message: `Text exceeds ${WORD_LIMIT} words` });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Missing GEMINI_API_KEY" });
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const prompt = buildPrompt(text, language);
    const cacheKey = crypto
      .createHash("sha256")
      .update(`${model}|${language || "auto"}|${prompt}`)
      .digest("hex");

    const cached = getCache(`proofread:${cacheKey}`);
    if (cached) {
      return res.json(cached);
    }

    const callGemini = async (maxTokens) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0,
            topP: 0.6,
            responseMimeType: "application/json",
            maxOutputTokens: maxTokens,
          },
          systemInstruction: {
            parts: [{ text: "Return ONLY valid JSON. Do not add extra text." }],
          },
        }),
      });
      return response;
    };

    let response = await callGemini(2048);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return res.status(500).json({ message: "API error" });
    }

    let data = await response.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      console.error("Gemini response missing content:", JSON.stringify(data));
      return res.status(500).json({ message: "Invalid Gemini response" });
    }
    let parsed = parseGeminiJson(raw);
    if (!parsed) {
      // Retry once with a higher token limit in case the response was truncated
      response = await callGemini(4096);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error (retry):", errorText);
        return res.status(500).json({ message: "API error" });
      }
      data = await response.json();
      raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      parsed = parseGeminiJson(raw);
    }
    if (!parsed) {
      console.error("Failed to parse Gemini response:", raw);
      return res.status(500).json({ message: "Failed to parse Gemini response" });
    }

    const correctedText =
      typeof parsed.corrected_text === "string" && parsed.corrected_text.trim().length
        ? parsed.corrected_text
        : text;

    const changes = Array.isArray(parsed.changes)
      ? parsed.changes.filter((change) => {
          if (!change || typeof change !== "object") return false;
          if (typeof change.original !== "string" || change.original.length === 0) return false;
          if (typeof change.corrected !== "string") return false;
          return text.includes(change.original);
        })
      : [];

    const result = {
      corrected_text: correctedText,
      changes,
    };
    setCache(`proofread:${cacheKey}`, result);
    return res.json(result);
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Chrome Extension endpoint - simplified version of /api/proofread
app.post("/api/check", async (req, res) => {
  try {
    const { text } = req.body || {};
    
    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "Text is required", errors: [] });
    }

    // Use the existing proofread logic
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length > 1000) {
      return res.status(400).json({ message: "Text too long (max 1000 words)", errors: [] });
    }

    // Require API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message: "GEMINI_API_KEY not configured on server",
        errors: [],
      });
    }

    // Import Google AI (if not already imported at top)
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a strict spelling checker. Find ONLY clear misspellings.

Rules:
1. Flag obvious misspellings:
   - "teh"→"the", "recieve"→"receive", "wat"→"what", "cak"→"cake"
   - "helo"→"hello", "tommorow"→"tomorrow", "occured"→"occurred"
   - "haave"→"have", "writting"→"writing", "seperate"→"separate"
2. Flag obvious grammar: "He go"→"He goes", "They was"→"They were"
3. DO NOT flag: correct words, spacing, capitalization, punctuation, informal language

Text to check:
"${text}"

For EACH error found, return valid JSON ONLY with this exact format:
[{"start":NUMBER,"end":NUMBER,"type":"spelling","message":STRING,"suggestion":STRING}]

Example: If text is "I have a tommorow meeting"
Return: [{"start":10,"end":18,"type":"spelling","message":"Misspelled word","suggestion":"tomorrow"}]

If no errors, return: []

IMPORTANT:
- Count characters from position 0
- Include BOTH start and end positions
- Always include suggestion field - NEVER empty
- Return ONLY valid JSON array`;

    console.log('🔷 Sending prompt to API');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text().trim();

    console.log('📤 AI Raw Response:', aiText);

    // Parse JSON from AI response
    let errors = [];
    try {
      // Find JSON array in response
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          // Ensure all errors have suggestions
          errors = parsed.filter(e => {
            const hasRequiredFields = e.start !== undefined && e.end !== undefined && e.message && e.suggestion && e.suggestion.trim();
            if (!hasRequiredFields) {
              console.log('⚠️ Skipping error missing fields:', e);
            }
            return hasRequiredFields;
          });
          console.log('✅ Final errors with valid suggestions:', errors.length);
          errors.forEach((e, i) => {
            console.log(`  Error ${i}: pos ${e.start}-${e.end}: "${e.suggestion}" (${e.message})`);
          });
        }
      } else {
        console.log('❌ No JSON array found in response, raw:', aiText);
      }
    } catch (parseError) {
      console.error('❌ JSON parse failed:', parseError.message, 'Raw:', aiText.substring(0, 200));
    }

    return res.json({
      errors: errors,
      corrections: [],
      summary: null,
    });

  } catch (error) {
    console.error("Grammar check error:", error);
    return res.status(500).json({ 
      message: "Internal server error", 
      errors: [] 
    });
  }
});

// Serve frontend in production (or when dist exists)
if (existsSync(distPath)) {
  app.get("/sitemap.xml", (req, res) => {
    const sitemapPath = existsSync(path.join(distPath, "sitemap.xml"))
      ? path.join(distPath, "sitemap.xml")
      : path.join(publicPath, "sitemap.xml");
    return res.sendFile(sitemapPath);
  });

  app.get("/robots.txt", (req, res) => {
    const robotsPath = existsSync(path.join(distPath, "robots.txt"))
      ? path.join(distPath, "robots.txt")
      : path.join(publicPath, "robots.txt");
    return res.sendFile(robotsPath);
  });

  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`CorrectNow API running on http://localhost:${PORT}`);
});
