async function forwardToEve(payload, message) {
  const url = process.env.EVE_WEBHOOK_URL;
  const token = process.env.EVE_WEBHOOK_TOKEN;
  if (!url) {
    console.warn("[zac-relay] EVE_WEBHOOK_URL missing; skip Eve forward");
    return { ok: false, skipped: true };
  }

  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }

  // Prefer original AgentMail payload; attach normalized summary for Eve routines.
  const body = {
    ...payload,
    event_type: payload?.event_type || "message.received",
    zac_normalized: message,
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      body: text.slice(0, 500),
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { forwardToEve };
