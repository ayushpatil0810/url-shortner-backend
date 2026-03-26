import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import { MAILTRAP_CONFIG } from "../config/env.js";

// Function to send an email using Mailgen and Nodemailer
const sendEmail = async (options: {
  to: string;
  subject: string;
  mailgenContent: any;
}) => {
  const mailgenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Your App Name",
      link: "https://yourapp.com",
    },
  });
  // Generate the email content in both plaintext and HTML formats
  const emailTextual = mailgenerator.generatePlaintext(options.mailgenContent);
  const emailHTML = mailgenerator.generate(options.mailgenContent);

  // Create a transporter using Nodemailer with Mailtrap configuration
  const transporter = nodemailer.createTransport({
    host: MAILTRAP_CONFIG.host,
    port: MAILTRAP_CONFIG.port,
    auth: MAILTRAP_CONFIG.auth,
  });

  // Define the email options including sender, recipient, subject, and content
  const mail = {
    from: MAILTRAP_CONFIG.auth.user,
    to: options.to,
    subject: options.subject,
    text: emailTextual,
    html: emailHTML,
  };
  // Send the email and handle any potential errors
  try {
    await transporter.sendMail(mail);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
// Function to generate email content based on the type of email (welcome or forgot password)
const emailContent = (
  username: string,
  emailType: "forgot" | "welcome",
  verificationLink?: string,
  passwordResetLink?: string,
) => {
  return {
    body: {
      name: username,
      intro:
        emailType === "welcome"
          ? "Welcome to our service! We're excited to have you on board."
          : "You have requested to reset your password.",
      action: {
        instructions:
          emailType === "welcome"
            ? "To verify your email address, please click the button below:"
            : "To reset your password, please click the button below:",
        button: {
          color: emailType === "welcome" ? "#22BC66" : "#FF6136",
          text: emailType === "welcome" ? "Verify Email" : "Reset Password",
          link:
            emailType === "welcome"
              ? verificationLink || "https://yourapp.com/verify-email"
              : passwordResetLink || "https://yourapp.com/reset-password",
        },
      },
      outro:
        "If you have any questions, feel free to reach out to our support team.",
    },
  };
};

export { sendEmail, emailContent };
