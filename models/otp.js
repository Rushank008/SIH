const mongoose = require('mongoose');
const mailSender = require('../utils/mailsender')

const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  otp:       { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 120 } // 2 minutes
});

otpSchema.pre("save", async function (next) {
  await mailSender(
    this.email,
    "Verification Code - Certificate System",
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your OTP Code</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh;">
      <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
        <!-- Main Card -->
        <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 24px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15); overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2);">
          
          <!-- Header -->
          <div style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"50\" cy=\"50\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg></div>
            <div style="position: relative; z-index: 1;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white; letter-spacing: -0.5px;">Certificate System</h1>
              <p style="margin: 8px 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">Email Verification</p>
            </div>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h2 style="margin: 0 0 12px; font-size: 24px; font-weight: 600; color: #1f2937; letter-spacing: -0.5px;">Verify Your Email</h2>
              <p style="margin: 0; font-size: 16px; color: #6b7280; line-height: 1.5;">Enter this verification code to complete your registration</p>
            </div>
            
            <!-- OTP Code -->
            <div style="text-align: center; margin: 40px 0;">
              <div style="display: inline-block; position: relative;">
                <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 16px; padding: 24px 32px; border: 2px solid #e5e7eb;">
                  <div style="font-size: 36px; font-weight: 700; color: #6366f1; letter-spacing: 8px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;">
                    ${this.otp}
                  </div>
                </div>
                <div style="position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 18px; z-index: -1; opacity: 0.1;"></div>
              </div>
            </div>
            
            <!-- Info Section -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 20px; margin: 32px 0; border-left: 4px solid #f59e0b;">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="flex-shrink: 0; width: 20px; height: 20px; margin-top: 2px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 500;">This code expires in <strong>2 minutes</strong></p>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #a16207;">For security reasons, don't share this code with anyone</p>
                </div>
              </div>
            </div>
            
            <!-- Security Notice -->
            <div style="text-align: center; padding: 24px 0; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
                Didn't request this code? You can safely ignore this email.<br>
                Your account security is important to us.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">
              © ${new Date().getFullYear()} Certificate System. All rights reserved.
            </p>
            <div style="margin-top: 12px;">
              <a href="#" style="color: #6366f1; text-decoration: none; font-size: 12px; margin: 0 8px;">Privacy Policy</a>
              <span style="color: #cbd5e1;">•</span>
              <a href="#" style="color: #6366f1; text-decoration: none; font-size: 12px; margin: 0 8px;">Support</a>
            </div>
          </div>
        </div>
        
        <!-- Bottom Text -->
        <div style="text-align: center; margin-top: 24px;">
          <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.8);">
            Secure email verification powered by Certificate System
          </p>
        </div>
      </div>
    </body>
    </html>`
  );
  next();
});


module.exports = mongoose.model('OTP', otpSchema);
