// Mailgun API route for sending emails
import { NextResponse } from 'next/server';
import Mailgun from 'mailgun.js';



const sendSimpleMessage = async (to: string, subject: string, text: string) => {
    const mailgun = new Mailgun(FormData);

    const mg = mailgun.client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY || '',
        url: 'https://api.mailgun.net',
    });

    try {
        const data = await mg.messages.create("kirk.1905newmedia.com", {
            from: process.env.MAILGUN_FROM,
            to: ["Jason Shultz <accounts@1905newmedia.com>"],
            subject: "Hello Jason Shultz",
            text: "Congratulations Jason Shultz, you just sent an email with Mailgun! You are truly awesome!",
        });

        console.log(data); // logs response data
    } catch (error) {
        console.log(error); //logs any error
    }
}


export async function POST(request: Request) {
    try {
        const { to, subject, text } = await request.json();

        if (!to || !subject || !text) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        await sendSimpleMessage(to, subject, text);
        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}