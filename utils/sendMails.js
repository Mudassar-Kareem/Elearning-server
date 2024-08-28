const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const sendMail = async (options) => {
    const transporter = nodemailer.createTransport({
        host:process.env.SMTP_HOST,
        port:process.env.SMTP_PORT,
        secure:process.env.ACTIVATION_SECRET,
        auth: {
            user:process.env.SMTP_MAIL,
            pass:process.env.SMTP_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false 
        }
    });

    const { email, subject, template, data } = options;
    const templatePath = path.join(__dirname, '../mails', template);
    console.log('Template Path:', templatePath); // Verify path

    try {
        const html = await ejs.renderFile(templatePath, data);

        const mailOptions = {
            from:process.env.SMTP_MAIL,
            to: email,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        console.error('Detailed Error Info:', error.message);
        throw new Error('Error sending email');
    }
};

module.exports = sendMail;
