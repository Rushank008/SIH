const certificateRequest = require("../models/certificateRequest");
const { uploadToCloudinaryPrivate } = require("../utils/UploadToCloudinary");
const auditlog = require("../models/auditlog");
const mailSender = require("../utils/mailsender");

exports.getAssignedRequests = async (req, res, next) => {
  /**
   * check users role
   * If on submitted let clerk view it
   * If in proceess let officer view it
   * Send response
   */
  try {
    const staffRole = req.user.role; // either 'clerk' or 'officer'

    let statusFilter = [];

    if (staffRole === "clerk") {
      statusFilter = ["submitted"];
    } else if (staffRole === "officer") {
      statusFilter = ["in_process"];
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role",
      });
    }

    const requests = await certificateRequest
      .find({ status: { $in: statusFilter } })
      .populate("user", "name email") // Optional: show user info
      .populate("service", "name"); // Show service info

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    next(err);
  }
};

exports.lockRequest = async (req, res, next) => {
  /**
   * Firstly get the certificate request id through param
   * From token get the staff id
   * Save in audit log
   */
  try {
    const requestId = req.params.id;
    const staffId = req.user.id;

    const request = await certificateRequest.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    if (request.isLocked) {
      return res
        .status(400)
        .json({ success: false, message: "Request is already locked" });
    }

    request.isLocked = true;
    request.lockedBy = staffId;
    await request.save();

    await auditlog.create({
      certRequestId: request._id,
      userId: req.user.id,
      role: req.user.role,
      action: "locked",
      message: `Request locked by ${req.user.role} ${req.user.name}`,
    });

    res.status(200).json({
      success: true,
      message: "Request locked successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.getAssignedRequestById = async (req, res) => {
  /**
   * Get the Request id
   * check the staff id
   * check if it is assigned to that staff
   * return certficate request information
   */
  try {
    const requestId = req.params.id;
    const staffId = req.user._id; // from token

    const request = await certificateRequest.findOne({
      _id: requestId,
      assignedTo: staffId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found or not assigned to you",
      });
    }

    res.status(200).json({ success: true, request });
  } catch (err) {
    console.error("Failed to fetch assigned request:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateRequestStatus = async (req, res) => {
  /**
   * Get the certificate id
   * From token get the Staff id
   * Get status,certificate url or rejection note from the staff currently working
   * check if its the staff sending the req
   * Send email Respectively
   */
  try {
    const staffId = req.user._id;
    const { id } = req.params;
    let { status, certificateUrl, rejectionNote } = req.body;

    const request = await certificateRequest
      .findOne({
        _id: id,
        assignedTo: staffId,
      })
      .populate("user"); // populate user to get email

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found or not assigned to you",
      });
    }

    //  Block update if already approved or rejected
    // if (["approved", "rejected"].includes(request.status)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Request has already been ${request.status} and cannot be changed.`,
    //   });
    // }

    //  Upload certificate file if present
    if (status === "approved" && req.files && req.files.length > 0) {
      const uploadResult = await uploadToCloudinaryPrivate(
        req.files[0].path,
        "certificates"
      );
      certificateUrl = uploadResult.secure_url;
    }

    // Update fields
    request.status = status;
    request.locked = false; // Unlock after decision

    if (status === "approved") {
      request.certificateUrl = certificateUrl;
      // Send email with certificate link
      await mailSender(
        request.user.email,
        "Certificate Approved - Certificate System",
        `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Certificate Approved</title>
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
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.1);"></div>
          <div style="position: relative; z-index: 1;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white; letter-spacing: -0.5px;">Certificate System</h1>
            <p style="margin: 8px 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">Certificate Approved</p>
          </div>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 40px 40px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="margin: 0 0 12px; font-size: 28px; font-weight: 600; color: #1f2937; letter-spacing: -0.5px;">🎉 Congratulations!</h2>
            <p style="margin: 0; font-size: 18px; color: #6366f1; font-weight: 600; line-height: 1.5;">Your certificate has been approved</p>
            <p style="margin: 12px 0 0; font-size: 16px; color: #6b7280; line-height: 1.5;">You can now download your official certificate</p>
          </div>
          
          <!-- Download Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${certificateUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3); transition: all 0.3s ease;">
              <span style="display: inline-flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Download Certificate
              </span>
            </a>
          </div>
          
          <!-- Certificate Info -->
          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 16px; padding: 24px; margin: 32px 0; border-left: 4px solid #6366f1;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="flex-shrink: 0; width: 20px; height: 20px; margin-top: 2px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <p style="margin: 0; font-size: 14px; color: #4338ca; font-weight: 600;">Certificate Details</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #6366f1; line-height: 1.4;">
                  • Your certificate is digitally signed and verified<br>
                  • Certificate can be shared and verified online
                </p>
              </div>
            </div>
          </div>
          
          <!-- Footer Message -->
          <div style="text-align: center; padding: 24px 0; border-top: 1px solid #f3f4f6;">
            <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
              Thank you for using Certificate System
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
          🎓 Celebrating your achievement with Certificate System
        </p>
      </div>
    </div>
  </body>
  </html>`
      );
    }

    if (status === "rejected") {
      request.rejectionNote = rejectionNote;
      // Send rejection email
      await mailSender(
        request.user.email,
        "Certificate Rejected - Certificate System",
        `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Certificate Rejected</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
  </head>
  <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh;">
    <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
      <!-- Main Card -->
      <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 24px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15); overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2);">
        
        <!-- Header -->
        <div style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.1);"></div>
          <div style="position: relative; z-index: 1;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white; letter-spacing: -0.5px;">Certificate System</h1>
            <p style="margin: 8px 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">Certificate Review</p>
          </div>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 40px 40px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="margin: 0 0 12px; font-size: 28px; font-weight: 600; color: #1f2937; letter-spacing: -0.5px;">Certificate Not Approved</h2>
            <p style="margin: 0; font-size: 18px; color: #ef4444; font-weight: 600; line-height: 1.5;">Your certificate application requires revision</p>
            <p style="margin: 12px 0 0; font-size: 16px; color: #6b7280; line-height: 1.5;">Please review the feedback below and resubmit</p>
          </div>
          
          <!-- Rejection Reason -->
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 16px; padding: 24px; margin: 32px 0; border-left: 4px solid #ef4444;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="flex-shrink: 0; width: 20px; height: 20px; margin-top: 2px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <p style="margin: 0; font-size: 14px; color: #b91c1c; font-weight: 600;">Feedback</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #dc2626; line-height: 1.5; background: white; padding: 12px; border-radius: 8px; border: 1px solid #fecaca;">
                  ${rejectionNote}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3); transition: all 0.3s ease;">
              <span style="display: inline-flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12L12 3L21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 3V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Resubmit Application
              </span>
            </a>
          </div>
          
          <!-- Help Section -->
          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 16px; padding: 24px; margin: 32px 0; border-left: 4px solid #6b7280;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="flex-shrink: 0; width: 20px; height: 20px; margin-top: 2px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13M12 17H12.01" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <p style="margin: 0; font-size: 14px; color: #374151; font-weight: 600;">Need Help?</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280; line-height: 1.4;">
                  • Review our certificate requirements<br>
                  • Ensure all documents are clear and complete<br>
                  • Contact support if you need assistance
                </p>
              </div>
            </div>
          </div>
          
          <!-- Footer Message -->
          <div style="text-align: center; padding: 24px 0; border-top: 1px solid #f3f4f6;">
            <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
              Thank you for using Certificate System
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">
            © ${new Date().getFullYear()} Certificate System. All rights reserved.
          </p>
          <div style="margin-top: 12px;">
            <a href="#" style="color: #ef4444; text-decoration: none; font-size: 12px; margin: 0 8px;">Privacy Policy</a>
            <span style="color: #cbd5e1;">•</span>
            <a href="#" style="color: #ef4444; text-decoration: none; font-size: 12px; margin: 0 8px;">Support</a>
          </div>
        </div>
      </div>
      
      <!-- Bottom Text -->
      <div style="text-align: center; margin-top: 24px;">
        <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.8);">
          We're here to help you succeed with Certificate System
        </p>
      </div>
    </div>
  </body>
  </html>`
      );
    }

    if (status === "in_process") {
      request.assignedTo = null; // Optional: allow officer to pick it next
      // Or you can auto-assign to officer if that’s your flow
    }

    await request.save();

    await auditlog.create({
      certRequestId: request._id,
      userId: req.user.id, // from token
      role: req.user.role, // from token
      action: status,
      message:
        status === "approved"
          ? `Certificate approved. URL: ${certificateUrl}`
          : status === "rejected"
          ? `Rejected: ${rejectionNote}`
          : `Marked in_process`,
    });

    res
      .status(200)
      .json({ success: true, message: "Status updated and request unlocked" });
  } catch (err) {
    console.error("Failed to update request status:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
