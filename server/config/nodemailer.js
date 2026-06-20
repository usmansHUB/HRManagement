const nodemailer = require('nodemailer');

let transporter;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  // Fallback to console mock mailer
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('--- [MOCK MAIL SENT] ---');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body:\n${mailOptions.text || mailOptions.html}`);
      console.log('------------------------');
      return { messageId: 'mock-id-12345' };
    }
  };
}

module.exports = transporter;
