// Mailgun API route for sending emails
import { NextResponse } from 'next/server';
import Mailgun from 'mailgun.js';



const sendSimpleMessage = async (to: string, template: string, link: string) => {
    const mailgun = new Mailgun(FormData);

    const mg = mailgun.client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY || '',
        url: 'https://api.mailgun.net',
    });

    try {
        const data = await mg.messages.create("kirk.1905newmedia.com", {
            from: process.env.MAILGUN_FROM,
            to: to,
            template: template,
            'h:X-Mailgun-Variables': JSON.stringify({
                link: link,
            }),
        });

        console.log(data); // logs response data
    } catch (error) {
        console.log(error); //logs any error
    }
}


export async function POST(request: Request) {
    try {
        const { to, email_template, link } = await request.json();

        if (!to || !email_template || !link) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        await sendSimpleMessage(to, email_template, link);
        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}