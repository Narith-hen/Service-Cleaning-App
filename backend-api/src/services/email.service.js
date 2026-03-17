const { Resend } = require('resend');

let resendClient = null;

const getResendClient = () => {
  if (resendClient) return resendClient;
  if (!process.env.RESEND_API_KEY) return null;
  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
};

const sendWelcomeEmail = async ({ to, firstName }) => {
  const client = getResendClient();
  const from = process.env.RESEND_FROM;

  if (!client || !from) {
    return null;
  }

  try {
    await client.emails.send({
      from,
      to: [to],
      subject: 'Welcome to Somaet',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Welcome to Somaet, ${firstName || 'there'}!</h2>
          <p>Thanks for signing up. You can now chat directly with your cleaner for every booking.</p>
          <p>If you have any questions, just reply to this email.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error?.message || error);
  }

  return true;
};

module.exports = {
  sendWelcomeEmail
};
