import nodemailer from "nodemailer";
import { ApiError } from "./apiError.js";

const sendMailOtp = async (email, otp) => {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transport.sendMail({
      from: `"Resume Studio" <${process.env.SMTP_USER}>`,
      to: `${email}`,
      subject: `Your Verification Code - Resume Studio`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 25px; background: #f8fafc;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
            
            <h2 style="text-align: center; color: #2563eb; margin-top: 0; font-size: 24px; font-weight: 700;">Resume Studio</h2>
            
            <p style="font-size: 15px; color: #334155; line-height: 1.5;">
              Hello,
            </p>
            
            <p style="font-size: 15px; color: #475569; line-height: 1.5;">
              Use the following One-Time Password (OTP) to verify your account or reset your password:
            </p>
            
            <div style="text-align: center; margin: 28px 0;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #1e293b; background: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px solid #cbd5e1; display: inline-block;">
                ${otp}
              </span>
            </div>
            
            <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
              ⏱️ This OTP is valid for <strong>10 minutes</strong>. For security, never share this code with anyone.
            </p>
            
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
              If you didn't request this code, you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            
            <p style="font-size: 12px; text-align: center; color: #94a3b8; margin-bottom: 0;">
              &copy; ${new Date().getFullYear()} Resume Studio. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    console.log("OTP email sent successfully: %s", info.messageId);
    return info;
  } catch (err) {
    console.error("Error while sending OTP email:", err);
    switch (err.code) {
      case "ECONNECTION":
      case "ETIMEOUT":
        throw new ApiError(500, "Email network connection error. Please try again later.");
      case "EAUTH":
        throw new ApiError(500, "Email service authentication failed.");
      case "EENVELOPE":
        throw new ApiError(400, "Invalid recipient email address.");
      default:
        throw new ApiError(500, err.message || "Failed to send OTP email.");
    }
  }
};

export { sendMailOtp };
