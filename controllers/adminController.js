const Service = require("../models/service");
const AuditLog = require("../models/auditlog")

exports.AddService = async (req, res, next) => {
  /**
   * Make sure Admin is accessing
   * Take input of name,elegibility and requirment of service
   * Validate the inputs
   * Add it to the db
   */
  try{  
  const { name, eligibility, requirments } = req.body;
  if (!name || !eligibility || !requirments) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }
  if (!Array.isArray(requirments)) {
    return res.status(400).json({
      success: false,
      message: "Requirements must be an array",
    });
  }

  for (const req of requirments) {
    // Validate 'label'
    if (typeof req.label !== "string" || !req.label.trim()) {
      return res.status(400).json({
        success: false,
        message: "Each requirement must have a valid non-empty 'label'",
      });
    }

    // Validate 'type' if present
    if (req.type !== undefined && req.type !== "text" && req.type !== "file") {
      return res.status(400).json({
        success: false,
        message: "'type' must be either 'text' or 'file' if provided",
      });
    }

    // Validate 'required' if present
    if (req.required !== undefined && typeof req.required !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "'required' must be a boolean if provided",
      });
    }
  }
  const newService = await Service.create({
    name,
    eligibility,
    requirements: requirments,
    createdBy: req.user.id, // assuming admin info comes from token
  });

  //ADD AUDIT LOGS 
    await AuditLog.create({
      userId: req.user.id,
      role: req.user.role,
      action: 'created_service',
      message: `Admin created a new service named "${name}"`,
    });

  res.status(201).json({
    success: true,
    message: "Service created successfully",
    service: newService,
  });
}
catch(err){
    next(err)
}
};

exports.SeeService = async (req,res,next) => {
    /**
     * See if user is logged in
     * Just give all teh services 
     */
    try{
        const services = await Service.find();
        if(services){
            return res.status(200).json({
                success:true,
                services
            })
        }
    }
    catch(err){
        next(err)
    }
}

exports.deleteService = async (req, res, next) => {
    /**
     * See if user is admin
     * Delete if exists
     */
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

   const deleted = await Service.findByIdAndDelete(id);

   if(deleted){
    res.status(200).json({
      success: true,
      message: "Service deleted successfully"
    });
   }
  } catch (err) {
    next(err);
  }
};

exports.editService = async (req, res, next) => {
    /**
     * See if the user is admin
     * see if the service exists
     * IF so update and give everything again
     * same validations as addservice
     */
  try {
    const { id } = req.params;
    const { name, eligibility, requirments } = req.body;

    if (!name || !eligibility || !requirments) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!Array.isArray(requirments)) {
      return res.status(400).json({
        success: false,
        message: "Requirements must be an array",
      });
    }

    for (const req of requirments) {
      if (typeof req.label !== "string" || !req.label.trim()) {
        return res.status(400).json({
          success: false,
          message: "Each requirement must have a valid non-empty 'label'",
        });
      }

      if (
        req.type !== undefined &&
        req.type !== "text" &&
        req.type !== "file"
      ) {
        return res.status(400).json({
          success: false,
          message: "'type' must be either 'text' or 'file' if provided",
        });
      }

      if (
        req.required !== undefined &&
        typeof req.required !== "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message: "'required' must be a boolean if provided",
        });
      }
    }

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { name, eligibility, requirments },
      { new: true }
    );

    // UPDATE AUDIT LOG
     await AuditLog.create({
      userId: req.user.id,
      role: req.user.role,
      action: 'updated_service',
      message: `Admin updated service "${name}" (ID: ${serviceId})`,
    });

    if (!updatedService) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service: updatedService
    });

  } catch (err) {
    next(err);
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'name role') // to get name and role of action taker
      .populate('certRequestId', '_id status'); // optional

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
