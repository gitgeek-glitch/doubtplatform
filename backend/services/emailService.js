import nodemailer from "nodemailer"
import crypto from "crypto"
import dotenv from "dotenv"

dotenv.config()

console.log("Email configuration:")
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "Set" : "Not set")
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Set" : "Not set")

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("WARNING: Email credentials not found in environment variables")
  console.error("EMAIL_USER:", process.env.EMAIL_USER)
  console.error("EMAIL_PASS:", process.env.EMAIL_PASS ? "[HIDDEN]" : "undefined")
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
})

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP connection error:", error)
    } else {
      console.log("SMTP server is ready to take our messages")
    }
  })
} else {
  console.log("Skipping SMTP verification due to missing credentials")
}

const otpStore = new Map()

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString()
}

export const sendOTP = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.")
  }

  try {
    const mailOptions = {
      from: `"DoubtSolve" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "DoubtSolve - Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">DoubtSolve</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your College Doubt-Solving Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Thank you for registering with DoubtSolve! Please use the verification code below to complete your registration:
            </p>
            
            <div style="background: white; border: 2px dashed #667eea; padding: 20px; margin: 25px 0; text-align: center; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 3px;">${otp}</span>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 0;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #999; font-size: 12px;">
              © 2025 DoubtSolve. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `Your DoubtSolve verification code is: ${otp}. This code will expire in 10 minutes.`,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", result.messageId)
    return result
  } catch (error) {
    console.error("Email sending failed:", error)
    throw new Error("Failed to send email: " + error.message)
  }
}

export const storeOTP = (email, otp) => {
  otpStore.set(email, {
    otp,
    timestamp: Date.now(),
    attempts: 0,
  })

  setTimeout(() => {
    otpStore.delete(email)
  }, 10 * 60 * 1000)
}

export const verifyOTP = (email, otp) => {
  const storedData = otpStore.get(email)

  if (!storedData) {
    return { success: false, message: "OTP expired or not found" }
  }

  if (storedData.attempts >= 3) {
    otpStore.delete(email)
    return { success: false, message: "Too many failed attempts" }
  }

  const isExpired = Date.now() - storedData.timestamp > 10 * 60 * 1000
  if (isExpired) {
    otpStore.delete(email)
    return { success: false, message: "OTP has expired" }
  }

  if (storedData.otp !== otp) {
    storedData.attempts++
    return { success: false, message: "Invalid OTP" }
  }

  otpStore.delete(email)
  return { success: true, message: "OTP verified successfully" }
}
