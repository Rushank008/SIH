const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.auth = async (req, res, next) => {
  let token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ success: false, message: "Token missing" });
  }
  token = token.replace("Bearer ", "");

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decode;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Token is invalid, please login again",
    });
  }
};

exports.IsAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "This is a protected route only admins",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User cannot be verified",
    });
  }
};

exports.IsOfficer = async (req, res, next) => {
  try {
    if (req.user.role !== "admin" || req.user.role !== "officer") {
      return res.status(403).json({
        success: false,
        message: "This is a protected route only Officers",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User cannot be verified",
    });
  }
};

exports.IsClerk = async (req, res, next) => {
  try {
    if (req.user.role !== "admin" || req.user.role !== "clerk") {
      return res.status(403).json({
        success: false,
        message: "This is a protected route only Clerk",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User cannot be verified",
    });
  }
};
