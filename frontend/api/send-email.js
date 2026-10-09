const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { to, subject, html, text } = req.body || {};
  if (!to || !subject) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  try {
    const user = process.env.MAIL_USER || 'nexora.hackathon699@gmail.com';
    const rawPass = process.env.MAIL_PASSWORD || 'dcge edfm qxay pbil';
    const pass = rawPass.replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || `"Nexora" <${user}>`,
      to,
      subject,
      html,
      text,
    });

    console.log(`Email dispatched successfully to ${to}: ${info.messageId}`);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('Email sending error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
