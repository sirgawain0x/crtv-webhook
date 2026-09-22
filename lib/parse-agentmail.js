function pickString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v && typeof v === "object") {
      if (typeof v.email === "string" && v.email.trim()) {
        const name = typeof v.name === "string" && v.name.trim() ? v.name.trim() : "";
        return name ? `${name} <${v.email.trim()}>` : v.email.trim();
      }
      if (typeof v.address === "string" && v.address.trim()) return v.address.trim();
    }
  }
  return "";
}

function extractMessage(payload) {
  const root = payload && typeof payload === "object" ? payload : {};
  const msg =
    root.message ||
    (root.data && root.data.message) ||
    root.data ||
    root;

  const from = pickString(
    msg.from,
    msg.from_,
    msg.sender,
    msg.fromAddress,
    msg.from_email,
    root.from,
    root.from_
  );

  const subject = pickString(msg.subject, root.subject) || "(no subject)";
  const inbox = pickString(
    msg.inbox_id,
    msg.inboxId,
    msg.inbox,
    msg.email,
    root.inbox_id,
    root.inboxId
  );
  const previewRaw = pickString(
    msg.preview,
    msg.text,
    msg.snippet,
    msg.body,
    msg.extractedText
  );
  const preview =
    previewRaw.length > 280 ? `${previewRaw.slice(0, 277)}...` : previewRaw;
  const messageId = pickString(msg.message_id, msg.messageId, msg.id);
  const eventType = pickString(
    root.event_type,
    root.eventType,
    root.type,
    msg.event_type
  );

  return {
    from: from || "Unknown",
    subject,
    inbox: inbox || "unknown",
    preview: preview || "...",
    messageId,
    eventType,
  };
}

function shouldProcessEvent(payload) {
  const t = String(
    payload?.event_type || payload?.eventType || payload?.type || ""
  ).toLowerCase();
  if (!t) {
    // No type → treat as inbound if a message object exists (AgentMail sometimes omits type).
    return !!(payload?.message || payload?.data?.message);
  }
  if (t === "message.sent" || t.endsWith(".sent")) return false;
  return (
    t === "message.received" ||
    t.startsWith("message.received") ||
    t === "email.received"
  );
}

module.exports = { extractMessage, shouldProcessEvent, pickString };
