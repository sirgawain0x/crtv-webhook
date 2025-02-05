const crypto = require("crypto");
require("dotenv").config({ path: ".env.local" });

// Your webhook ID
const webhookId = process.env.WEBHOOK_ID;

// Create a random string for the signature
const randomBytes = crypto.randomBytes(32);
const signature = randomBytes.toString("hex");

// Generate HMAC signature using your webhook ID
const hmac = crypto.createHmac("sha256", webhookId);
hmac.update(signature);
const webhookSignature = hmac.digest("hex");

console.log("Use this as your Webhook Signature when creating the webhook:");
console.log(webhookSignature);
