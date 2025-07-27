const path = require("path");
const { uploadToCloudinaryPrivate } = require("../utils/UploadToCloudinary");
const CertificateRequest = require("../models/certificateRequest");
const auditlog = require("../models/auditlog");
const Service = require("../models/service");
const certificateRequest = require("../models/certificateRequest");

exports.ApplyService = async (req, res, next) => {
  /**
   * Get service ID from params
   * Fetch service from DB to get its requirment
   * Validate that the user submitted all required documents and fields
   * Upload files to Cloudinary (using multer + uploadToCloudinaryPrivate utils)
   * Add it to DB
   * Return Success
   */
  try {
    const user_id = req.user.id;
    const service_id = req.params.id;

    // 1. Get the service by ID

    // Prevent duplicate application if not rejected
    const existingRequest = await CertificateRequest.findOne({
      user: user_id,
      service: service_id,
      status: { $in: ["submitted", "in_process", "approved"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message:
          "You've already applied for this service and it's under process or approved.",
      });
    }

    const service = await Service.findById(service_id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // 2. We'll collect the uploaded files info here for saving later
    const uploadedRequirements = [];

    // 3. Loop through each required field and validate + upload
    for (const requiredDoc of service.requirements) {
      const label = requiredDoc.label;
      const type = requiredDoc.type;

      if (type === "text") {
        const value = req.body[label];
        if (requiredDoc.required && !value) {
          return res.status(400).json({
            success: false,
            message: `Missing required field: ${label}`,
          });
        }

        if (value) {
          uploadedRequirements.push({
            label,
            type: "text",
            value,
          });
        }
      }

      if (type === "file") {
        const uploadedFiles =
          req.files?.filter((file) => file.fieldname === label) || [];

        if (requiredDoc.required && uploadedFiles.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Missing required document: ${label}`,
          });
        }

        for (const file of uploadedFiles) {
          // File type and size validation
          const allowedExtensions = [".jpg", ".jpeg", ".png"];
          const ext = path.extname(file.originalname).toLowerCase();
          const maxSize = 2 * 1024 * 1024; // 2MB

          if (!allowedExtensions.includes(ext)) {
            return res.status(400).json({
              success: false,
              message: `Invalid file type for ${label}. Only PDF, JPG, PNG allowed.`,
            });
          }

          if (file.size > maxSize) {
            return res.status(400).json({
              success: false,
              message: `File too large for ${label}. Max size is 2MB.`,
            });
          }

          const cloudResult = await uploadToCloudinaryPrivate(file.path);
          uploadedRequirements.push({
            label,
            type: "file",
            value: cloudResult.secure_url, // <-- save full URL instead of public_id
          });
        }
      }
    }

    // 4. Create new certificate request
    const newRequest = await CertificateRequest.create({
      user: user_id,
      service: service_id,
      requirements: uploadedRequirements,
      status: "submitted",
      isLocked: false,
    });

    await auditlog.create({
      certRequestId: service_id,
      userId: user_id,
      role: "user",
      action: "Submitted",
      message: `User Submiited for service ${service.name}`,
    });

    // 5. Return success response
    return res.status(201).json({
      success: true,
      message: "Certificate request submitted successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.AppliedService = async (req, res, next) => {
  /**
   * Get user id from token
   * Gett all the applied services
   * Display them
   * Use populate so user can see the service name
   */
  try {
    const user_id = req.user.id;

    const Requests = await certificateRequest
      .find({ user: user_id, status: { $in: ["submitted", "in_process"] } })
      .populate("service", "name eligibility");

    res.status(200).json({
      success: true,
      requests: Requests,
    });
  } catch (err) {
    next(err);
  }
};

exports.AppliedServiceByID = async (req, res, next) => {
  /**
   * Get user id from token
   * Get service id from param
   * check if he has applied for that service
   * Display it
   */
  try {
    const requestId = req.params.id;
    const userId = req.user.id;

    // Find the request by ID and ensure it belongs to this user
    const request = await certificateRequest
      .findOne({
        _id: requestId,
        user: userId,
      })
      .populate("service", "name eligibility");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Prepare clean response
    const responseData = {
      _id: request._id,
      status: request.status,
      service: request.service,
      requirements: request.requirements,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };

    // If approved and certificate exists, include it
    if (request.status === "approved" && request.certificateUrl) {
      responseData.certificateUrl = request.certificateUrl;
    }

    // If rejected and notes exist, include rejection reason
    if (request.status === "rejected" && request.notes) {
      responseData.rejectionReason = request.note;
    }

    return res.status(200).json({
      success: true,
      request: responseData,
    });
  } catch (err) {
    next(err);
  }
};
