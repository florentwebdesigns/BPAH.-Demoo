const requiredFields = ['name', 'phone', 'email', 'service', 'address', 'date', 'time', 'message'];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildBusinessMessage(requestData) {
  return [
    'NEW SERVICE REQUEST',
    '',
    `Name: ${requestData.name}`,
    `Phone: ${requestData.phone}`,
    `Email: ${requestData.email}`,
    `Service: ${requestData.service}`,
    `Address: ${requestData.address}`,
    `Preferred Date: ${requestData.date}`,
    `Preferred Time: ${requestData.time}`,
    `Problem: ${requestData.message}`
  ].join('\n');
}

function buildCustomerMessage(name) {
  return `Hi ${name}, thanks for contacting Basco Plumbing & Heating. We received your request and a team member will contact you shortly.`;
}

async function sendTwilioMessage({ accountSid, authToken, to, from, body }) {
  const twilioBody = new URLSearchParams({
    To: to,
    From: from,
    Body: body
  });

  const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: twilioBody
  });

  if (!twilioResponse.ok) {
    const errorText = await twilioResponse.text().catch(() => '');
    throw new Error(`Twilio rejected the SMS request: ${twilioResponse.status} ${errorText}`);
  }

  return twilioResponse;
}

async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const body = request.body || {};
  const requestData = Object.fromEntries(requiredFields.map((field) => [field, clean(body[field])]));
  const missingField = requiredFields.find((field) => !requestData[field]);

  if (missingField) {
    return response.status(400).json({ error: 'Please complete every field before submitting.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestData.email)) {
    return response.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const businessPhoneNumber = process.env.BUSINESS_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhoneNumber || !businessPhoneNumber) {
    console.error('SMS environment variables are not configured.');
    return response.status(500).json({ error: 'Service requests are temporarily unavailable. Please call us directly.' });
  }

  const customerMessage = buildCustomerMessage(requestData.name);
  const businessMessage = buildBusinessMessage(requestData);

  try {
    await sendTwilioMessage({
      accountSid,
      authToken,
      to: businessPhoneNumber,
      from: twilioPhoneNumber,
      body: businessMessage
    });

    await sendTwilioMessage({
      accountSid,
      authToken,
      to: requestData.phone,
      from: twilioPhoneNumber,
      body: customerMessage
    });

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('SMS request failed:', error);
    return response.status(502).json({ error: 'We could not send your request. Please call us directly.' });
  }
}

module.exports = handler;
module.exports.buildBusinessMessage = buildBusinessMessage;
module.exports.buildCustomerMessage = buildCustomerMessage;
module.exports.sendTwilioMessage = sendTwilioMessage;
