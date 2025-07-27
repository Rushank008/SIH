const Otp = require("../models/otp");
const User = require("../models/user");
const otpgenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

require("dotenv").config();
exports.sendOtp = async (req, res, next) => {
  /**
   * Get user email
   * check if user already registered
   * if OTP entry exists for the user return: please try again after 2 mins
   * generate an OTP
   * create a OTP db entry with 2 mins (sends an email in pre middleware)
   * return success response
   */
  try {
    const email = req.body.email;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const prevOtp = await Otp.findOne({ email });
    if (prevOtp) {
      return res
        .status(400)
        .json({ success: false, message: "Please retry again after 2 mins " });
    }
    const otp = otpgenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const otpEntry = await Otp.create({
      email: email,
      otp: otp,
    });

    if (otpEntry) {
      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  /**
   * Confirm the otp
   * Take user infromation
   * input verfication
   * save in user
   */
  try {
    const { otp, name, password, email, confirmPassword } = req.body;
    if (!name || !password || !email) {
     return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (password != confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passsword do not match",
      });
    }
    const otpinDB = await Otp.findOne({ email });
    if (!otpinDB) {
      return res.status(400).json({
        success: false,
        message: "OTP expired please regenrate new otp",
      });
    }
    if (otpinDB.otp != otp) {
      return res.status(403).json({
        success: false,
        message: "OTP invalid please retry",
      });
    } else {
      const hashedpassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedpassword,
        role: "user",
      });
      if (user) {
        await Otp.deleteOne({ email });
        return res.status(200).json({
          success: true,
          message: "User created successfully",
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  /**
   * Take email and password
   * Validate input
   * check if its correct
   * generate a token
   */
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return req.status(400).json({
        success: false,
        message: "All field are required",
      });
    }
    const exist = await User.findOne({ email });
    if (exist) {
      const validPassword = await bcrypt.compare(password, exist.password);
      if (validPassword) {
        const payload = { id: exist._id, email: exist.email, role: exist.role };
        const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY, {
          expiresIn: "2h",
        });
        if (token) {
          return res.status(200).json({
            success: true,
            message: "Successfully Logged in",
            Token: token,
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: "Password incorrect",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "No user exists with this email",
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.admin_signup = async (req, res, next) => {
  /**
   * Check if User is admin through routes
   * Get name,email,password
   * validate input
   * Hash passwords
   * Give a role
   * Save in the Database
   */
  try {
    const { name, email, password, confirmedpassword, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (password != confirmedpassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }
    const hashedpassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedpassword,
      role,
    });
    if (user) {
      return res.status(200).json({
        success: true,
        message: `${role} Created Successfully`,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.admin_login = async (req, res, next) => {
  /**'
   * Make sure it is an admin
   * Take email and pass and role
   * check if they r valid
   * Generate a token and add role in payload
   */
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const exist = await User.findOne({ email, role });
    if (!exist) {
      return res.status(400).json({
        success: false,
        message: `No User exist on this email with ${role} role`,
      });
    }
    const PassswordMatch = await bcrypt.compare(password, exist.password);
    if (!PassswordMatch) {
      return res.status(403).json({
        success: false,
        message: "Password is incorrect",
      });
    }
    const payload = { id: exist._id, email: exist.email, role: exist.role };
    const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "2h",
    });
    if (token) {
      return res.status(200).json({
        success: true,
        message: "Successfully Logged in",
        Token: token,
      });
    }
  } catch (err) {
    next(err);
  }
};
