const { Webhook } = require("svix");
const { extractMessage, shouldProcessEvent } = require("../lib/parse-agentmail");
const { notifyTelegram } = require("../lib/telegram");
const { forwardToEve } = require("../lib/forward-eve");

function getRawBody(req) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  return JSON.stringify(req.body ?? {});
}

function verifySvix(req, rawBody) {
  const secret =
    process.env.AGENTMAIL_WEBHOOK_SECRET ||
    process.env.SVIX_SECRET ||
    process.env.WH_SECRET;
  if (!secret) {
    if (process.env.REQUIRE_WEBHOOK_SECRET === "1") {
      const err = new Error("Webhook secret required but not configured");
      err.statusCode = 500;
      throw err;
    }
    console.warn("[zac-relay] no webhook secret configured; skipping Svix verify");
    return;
  }
  const wh = new Webhook(secret);
  const headers = {
    "svix-id": req.headers["svix-id"],
    "svix-timestamp": req.headers["svix-timestamp"],
    "svix-signature": req.headers["svix-signature"],
  };
  wh.verify(rawBody, headers);
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = getRawBody(req);
  let payload;
  try {
    payload = typeof req.body === "object" && req.body !== null && !Buffer.isBuffer(req.body)
      ? req.body
      : JSON.parse(rawBody || "{}");
  } catch {
    return res.status(400).json({ ok: false, error: "invalid json" });
  }

  try {
    verifySvix(req, rawBody);
  } catch (err) {
    console.error("[zac-relay] svix verify failed", err?.message || err);
    return res.status(401).json({ ok: false, error: "invalid signature" });
  }

  if (!shouldProcessEvent(payload)) {
    console.log("[zac-relay] ignored event", payload?.event_type || payload?.type);
    return res.status(200).json({ ok: true, ignored: true });
  }

  const message = extractMessage(payload);
  const results = { telegram: null, eve: null };

  try {
    results.telegram = await notifyTelegram(message);
  } catch (err) {
    console.error("[zac-relay] telegram failed", err?.message || err);
    results.telegram = { ok: false, error: String(err?.message || err) };
  }

  try {
    results.eve = await forwardToEve(payload, message);
  } catch (err) {
    console.error("[zac-relay] eve forward failed", err?.message || err);
    results.eve = { ok: false, error: String(err?.message || err) };
  }

  // Always ack AgentMail so delivery does not retry-storm.
  return res.status(200).json({ ok: true, message, results });
};
