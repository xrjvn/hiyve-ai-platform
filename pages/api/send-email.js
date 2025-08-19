// pages/api/send-email.js
export default async function handler(req, res) {
  const { subject, body } = req.body;

  const zapierWebhookURL = 'https://hooks.zapier.com/hooks/catch/23710851/u3fg7c1/'; // replace with yours

  try {
    const response = await fetch(zapierWebhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body }),
    });

    const result = await response.text();
    res.status(200).json({ status: 'sent', result });
  } catch (error) {
    console.error('Error sending to Zapier:', error);
    res.status(500).json({ error: 'Failed to send email via Zapier' });
  }
}
