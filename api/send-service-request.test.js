const test = require('node:test');
const assert = require('node:assert/strict');

const { buildBusinessMessage, buildCustomerMessage, sendTwilioMessage } = require('./send-service-request');

test('buildBusinessMessage includes customer lead details', () => {
  const message = buildBusinessMessage({
    name: 'John Doe',
    phone: '+19731234567',
    email: 'john@example.com',
    service: 'Water heater',
    address: '123 Main St',
    date: '2026-10-10',
    time: '09:00',
    message: 'The unit is leaking.'
  });

  assert.match(message, /NEW SERVICE REQUEST/);
  assert.match(message, /John Doe/);
  assert.match(message, /\+19731234567/);
  assert.match(message, /The unit is leaking\./);
});

test('buildCustomerMessage confirms the request was received', () => {
  const message = buildCustomerMessage('Jane');

  assert.match(message, /Jane/);
  assert.match(message, /received your request/i);
  assert.match(message, /contact you shortly/i);
});

test('sendTwilioMessage posts to the Twilio API', async () => {
  const originalFetch = global.fetch;
  let body;

  global.fetch = async (url, options) => {
    body = options.body;
    return {
      ok: true,
      status: 200,
      text: async () => 'ok'
    };
  };

  try {
    await sendTwilioMessage({
      accountSid: 'ACtest',
      authToken: 'secret',
      to: '+19739998888',
      from: '+19730001111',
      body: 'Hello there'
    });

    assert.match(String(body), /To=%2B19739998888/);
    assert.match(String(body), /From=%2B19730001111/);
    assert.match(String(body), /Body=Hello\+there/);
  } finally {
    global.fetch = originalFetch;
  }
});
