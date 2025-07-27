const nodemailer = require('nodemailer')

const mailSender = async(email,subject,body) => {
     try{
        const transporter = nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            port: 465,
            secure: true,
            auth:{
                user:process.env.MAIL_USER,
                pass:process.env.MAIL_PASS,
            }
        })     
        const info = await transporter.sendMail({
            from: '"Government Admin" <rushanknanda999@gmail.com>',
            to: email,
            subject: `${subject}`,
            html: `${body}`
        })

        console.log(info)
        return info;
     }
     catch(err){
        console.log(`An error occured while sending mail : ${err.message} `)
     }
}
module.exports = mailSender;