/* let nodemailer = require('nodemailer'); */
import nodemailer from 'nodemailer';
/* require('dotenv').config(); */
import 'dotenv/config.js';
let environment = process.env;

export const GmailTransport = nodemailer.createTransport({
    service: environment.GMAIL_SERVICE_NAME,
    host: environment.GMAIL_SERVICE_HOST,
    secure:environment.GMAIL_SERVICE_SECURE,
    port: environment.GMAIL_SERVICE_PORT,
    auth: {
        user: environment.GMAIL_USER_NAME,
        pass: environment.GMAIL_USER_PASSWORD
    }
});

/* export const SMTPTransport = nodemailer.createTransport({
    host: environment.SMTP_SERVICE_HOST,
    port: environment.SMTP_SERVICE_PORT,
    secure: environment.SMTP_SERVICE_SECURE, // upgrade later with STARTTLS
    debug: true,
    auth: {
        user: environment.SMTP_USER_NAME,
        pass: environment.SMTP_USER_PASSWORD
    }
}); */

export const ViewOption = (transport, hbs) => {
    transport.use('compile', hbs({
            viewPath: 'views/email',
            extName: '.hbs'
    }));
}
