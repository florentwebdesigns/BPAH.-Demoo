const requiredFields = ['name', 'phone', 'email', 'service', 'address', 'date', 'time', 'message'];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = async function handler(request, response) {
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

  const message = [
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

  const twilioBody = new URLSearchParams({
    To: businessPhoneNumber,
    From: twilioPhoneNumber,
    Body: message
  });

  try {
    const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: twilioBody
    });

    if (!twilioResponse.ok) {
      console.error('Twilio rejected the SMS request:', twilioResponse.status);
      return response.status(502).json({ error: 'We could not send your request. Please call us directly.' });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('SMS request failed:', error);
    return response.status(502).json({ error: 'We could not send your request. Please call us directly.' });
  }
};
