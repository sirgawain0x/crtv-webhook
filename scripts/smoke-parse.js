const assert = require("assert");
const { extractMessage, shouldProcessEvent } = require("../lib/parse-agentmail");

const sample = {
  event_type: "message.received",
  message: {
    inbox_id: "creative-eve@agentmail.to",
    message_id: "<smoke@test>",
    from: "Creative Platform <creative-357@agentmail.to>",
    subject: "[EXEC] relay smoke",
    preview: "Zac-Relay end-to-end smoke from Eve",
  },
};

assert.strictEqual(shouldProcessEvent(sample), true);
assert.strictEqual(shouldProcessEvent({ event_type: "message.sent" }), false);

const m = extractMessage(sample);
assert.strictEqual(m.from, "Creative Platform <creative-357@agentmail.to>");
assert.strictEqual(m.subject, "[EXEC] relay smoke");
assert.strictEqual(m.inbox, "creative-eve@agentmail.to");

const nested = {
  event_type: "message.received",
  data: {
    message: {
      inboxId: "tmobile@agentmail.to",
      from_: "Deal Desk <ops@example.com>",
      subject: "[TM] quote",
      text: "hello",
    },
  },
};
const m2 = extractMessage(nested);
assert.strictEqual(m2.from, "Deal Desk <ops@example.com>");
assert.strictEqual(m2.inbox, "tmobile@agentmail.to");

const objFrom = extractMessage({
  message: {
    from: { name: "Jeff", email: "jeff@turso.tech" },
    subject: "Welcome",
    inbox_id: "creative-357@agentmail.to",
  },
});
assert.strictEqual(objFrom.from, "Jeff <jeff@turso.tech>");

console.log("smoke-parse ok");
