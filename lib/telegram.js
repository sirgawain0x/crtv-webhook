async function notifyTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[zac-relay] TELEGRAM_BOT_TOKEN/CHAT_ID missing; skip notify");
    return { ok: false, skipped: true };
  }

  const text = [
    "🔔 New Email Received",
    "",
    `From: ${message.from}`,
    `Subject: ${message.subject}`,
    `Inbox: ${message.inbox}`,
    "",
    `Preview: ${message.preview}`,
  ].join("\n");

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: ctrl.signal,
    });
    const body = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, body: body.slice(0, 500) };
    }
    return { ok: true, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { notifyTelegram };
