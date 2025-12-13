import asyncHandler from "express-async-handler";
import {models} from '../../models/zindex.js'
import otpService from "../../config/OTPService.js";
import jwt from 'jsonwebtoken';
import sendVerificationMail from "../../utils/email-verification.js";
import { helpers } from "../../utils/helpers.js";
import { leaderboardController } from "./leaderboard.controller.js";

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const registerUser = asyncHandler(async (req, res) => {
    const {
      name,
      email,
      mobile_number,
      chapter_name,
      meeting_role,
      date_of_birth,
      city,
      state,
      country,
      sponseredBy,
      fcm,
    } = req.body;

    let profilePic = "";
    if (req.file && req.file.path) {
      profilePic = req.file.path.replace(/\\/g, "/");
    }

    const existingUser = await models.User.findOne({ mobile_number });
    if (existingUser) {
      return res.status(400).json({ error: "Mobile number already registered", success: false });
    }

    if (email) {
      const existingEmailUser = await models.User.findOne({ email });
      if (existingEmailUser) {
        return res.status(400).json({ error: "Email is already registered", success: false });
      }
    }

    const otpResult = await otpService.sendOTP(mobile_number);
    if (!otpResult.success) {
      return res.status(400).json({ error: "Failed to send verification OTP", success: false });
    }

   
    const newUser = new models.User({
      name,
      email,
      mobile_number,
      chapter_name,
      meeting_role,
      profilePic,
      date_of_birth,
      city,
      state,
      sponseredBy,
      country,
      fcm: fcm || "",
    });

    await newUser.save();

    if (newUser.sponseredBy) {
      await leaderboardController.addPointsHistory(sponseredBy, "induction", res);
    }

    res.status(201).json({
      message: "Verification OTP sent to mobile number",
      success: true,
      newUser,
    });
})

const isVerified = asyncHandler(async (req, res) => {
    const { mobile_number, otpCode, fcm, deviceId } = req.body;

    if (!deviceId){
        return res.status(400).json({ error: "Device ID is required", success: false });
    }
    const otpVerified = await otpService.verifyOTP(mobile_number, otpCode);

    if (!otpVerified.success) {
        return res.status(400).json({ error: "Invalid or expired OTP", success: false });
    }
    const updateFields = { verified: true };
    if (fcm) updateFields.fcm = fcm;
    if (deviceId) updateFields.deviceId = deviceId;

    const user = await models.User.findOneAndUpdate(
      { mobile_number },
      { $set: updateFields },
      { new: true }
    );
    if (!user) return res.status(400).json({ error: "User not found", success: false });

    const userData = await models.User.findOne({ _id: user._id, isActive: true });
    const token = helpers.generateToken(userData);

    return res.status(200).json({
      message: "OTP verified successfully!",
      success: true,
      user: userData,
      token,
    });
})

const resendMobileOTP = asyncHandler(async (req, res) => {
    // const { error, value } = validator.resendOTP.validate(req.body);
    // if (error) {
    //   return response.success(error.message, null, res);
    // }
    const { mobile_number } = req.body;
    const result = await otpService.resendOTP(mobile_number);
    if (result.success) {
      return res.status(200).json({
        message: result.message,
        success: true,
        sessionId: result.data.sessionId,
        expiresAt: result.data.expiresAt,
      });
    } else {
      return res.status(400).json({
        error: result.message,
        success: false,
      });
    }
})

const resendOtp = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User id not found" });
  }
  const user = await models.User.findById(userId);

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  if (user.verified) {
    return res.status(400).json({ error: "Email is already verified" });
  }

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  user.verificationCode = verificationCode;

  await user.save();
  await sendVerificationMail(user.email, verificationCode);

  return res
    .status(200)
    .json({ message: "Varification code sent!!!", user: user });
})


const verifyUser = asyncHandler(async (req, res) => {
  const { email, verificationCode } = req.body;
  try {
    const user = await models.User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    user.verified = true;
    user.verificationCode = "";
    await user.save();

    const token = helpers.generateToken(user);

    res
      .status(200)
      .json({ message: "User Verified successfully!!!", user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during verifing user" });
  }
})

const loginUser = asyncHandler(async (req, res) => {
  const { mobile_number, fcm, deviceId } = req.body;
  if (!deviceId) {
    return res
      .status(400)
      .json({ error: "Device ID is required", success: false });
  }

  if (!mobile_number) {
    return res
      .status(400)
      .json({ error: "Mobile number is required", success: false });
  }
  const deviceType = req.headers['x-device-type'] || 'unknown';
  console.log('Device Type:', req.headers);
  const user = await models.User.findOne({ mobile_number });

  if (!user) {
      return res.status(401).json({ error: "User not found" });
  }

  
  user.deviceType = deviceType;
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLogin = new Date();

  if (fcm) user.fcm = fcm;
  await user.save();

  if (!user.deviceId || user.deviceId !== deviceId || !user.verified) {
    const otpResult = await otpService.sendOTP(mobile_number);

    console.log('otpResult in loginUser:', otpResult);
    
    if (!otpResult.success) {
      return res
        .status(400)
        .json({ error: "Failed to send verification OTP", success: false });
    }
    return res.status(200).json({
      message: "Verification code sent on mobile number",
      success: true,
    });
  }
    const token = helpers.generateToken(user);
    res.json({ token, user, success: true });
})

const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ error: "Refresh token required" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newToken = generate({ _id: decoded.id });

    res.json({ token: newToken });
})

export const authenticationController= {registerUser, verifyUser, isVerified, resendMobileOTP, resendOtp,loginUser,refreshToken };
