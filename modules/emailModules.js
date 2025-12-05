// const accessToken = require('../googleAccessToken.json'),
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: true
    }
});

const project_url = process.env.BASE_URL;

const welcomeEmail = async (toEmail, userName, enc_dt = '') => {
    try{
        return new Promise((resolve, reject) => {
            const mailOptions = {
                from: process.env.EMAIL,
                to: `${toEmail}`,
                subject: "Speedy Lingo | Welcome to Speedy Lingo",
                html: `<!DOCTYPE html>
            <head>
            <meta charset="utf-8">
            <title>Index</title>
            
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            
                
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet"> 
                
            </head>
            <style>
                body{ width: 650px; font-family: 'IBM Plex Sans', sans-serif; background-color: #f6f7fb; display: block; }
                a{ text-decoration: none; }
                span { font-size: 14px; }
                p { font-size: 13px; line-height: 1.7; letter-spacing: 0.7px; margin-top: 0; }
                .text-center{ text-align: center }
                h6 { font-size: 16px; margin: 0 0 18px 0; }
                .btn-custom:hover { background: #7030A0; color: #fff; }
            </style>    
            
            <body style="margin: 30px auto;">
                <table style="width: 100%; border: 1px solid #24695c;">
                    <tbody>
                        <tr>
                            <td>
                                <table style="background-color: #f6f7fb; width: 100%">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <table style="width: 650px; margin: 0 auto;">
                                                    <tbody>
                                                        <tr>
                                                            <td style="text-align: center;">
                                                                <a href="${project_url}"><img class="img-fluid" src="https://speedylingo.com/images/speedy_lingo.png" alt="Speedy Lingo" style=" width: 220px; height: auto; "></a>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table style="width: 650px; margin: 0 auto; background-color: #fff; border-radius: 8px">
                                    <tbody>
                                        <tr>
                                            <td style="padding: 30px; text-align: center;">
                                                <h3 style="font-weight: 600; font-size: 25px; margin: 25px;">Hi ${userName},</h3>
                                                <p style="margin: 0px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 400; letter-spacing: 0px; color: rgb(119, 119, 119) !important;">My top tip for learning French? Get to a 7 day streak! Just one lesson a day is all it takes to keep your streak going.</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 0 30px 30px 30px; text-align: center;">
                                                <a href="${project_url}/login" style="display: inline-block; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; border: 2px solid #86b0fb; color: #FFF; background: #0f6cbd !important;" class="btn-custom">Learn Now</a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <hr style="max-width: 80%; color: grey; border-color: rgb(249 249 249);">
                                <table style="width: 650px; margin: 0 auto; background-color: #fff; border-radius: 8px">
                                    <tbody>
                                        <tr>
                                            <td style="padding: 0 30px; text-align: center;">
                                                <h5 style="font-weight: 600; font-size: 25px; margin: 25px;">Learn on your own time, in less time</h5>
                                                <p style="margin: 0px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 400; letter-spacing: 0px; color: rgb(119, 119, 119) !important;">Studies show beginner Duolingo learners can learn as much French as university students, in half the time.* And they never had to pull an all-nighter!</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 0 30px 30px 30px; text-align: center;">
                                                <a href="${project_url}/login" style="display: inline-block; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; border: 2px solid #86b0fb; color: #FFF; background: #0f6cbd !important;" class="btn-custom">Learn Now</a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table style="width: 650px; margin: 0 auto; margin-top: 30px">
                                    <tbody>
                                        <tr style="text-align: center">
                                            <td>
                                                <p style="color: #999; margin-bottom: 0">Powered By Speedy Lingo</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </body>
        </html>`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    resolve({ suc: 0, msg: error })
                } else {
                    console.log('Email sent:', info.response);
                    resolve({ suc: 1, msg: info.response })
                }
            });
        })
    }catch(error){
        console.log('Error in sending welcome email:', error);
    }
}

module.exports = { welcomeEmail };