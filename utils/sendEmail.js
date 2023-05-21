import { createTransport } from "nodemailer";

// function directly we got from the mailtrap
export const sendEmail = async (to, subject, text) => {
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  await transporter.sendMail({ to, subject, text, from: "myid@gmail.com" })
}