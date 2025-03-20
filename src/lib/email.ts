import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function generateMessageNotificationEmail(messageData: {
  senderName: string;
  content: string;
  link: string;
}) {
  const { senderName, content, link } = messageData;
  
  return {
    subject: `New Message from ${senderName}`,
    text: `You have received a new message from ${senderName}:\n\n${content}\n\nView message: ${link}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Message</h2>
        <p>You have received a new message from <strong>${senderName}</strong>:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          ${content}
        </div>
        <p>
          <a href="${link}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Message
          </a>
        </p>
      </div>
    `,
  };
}

export function generateReportNotificationEmail(reportData: {
  reportName: string;
  link: string;
}) {
  const { reportName, link } = reportData;
  
  return {
    subject: `New Report Generated: ${reportName}`,
    text: `A new report "${reportName}" has been generated.\n\nView report: ${link}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Report Generated</h2>
        <p>A new report has been generated:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <strong>${reportName}</strong>
        </div>
        <p>
          <a href="${link}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Report
          </a>
        </p>
      </div>
    `,
  };
} 