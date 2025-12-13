import asyncHandler from "express-async-handler";
import { models } from "../../models/zindex.js";
import jwt from "jsonwebtoken";
import sendVerificationMail from "../../utils/email-verification.js";
import { helpers } from "../../utils/helpers.js";
import { leaderboardController } from "./leaderboard.controller.js";

const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

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
      keywords,
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

    // let otpServices = new otpService();
    // const otpResult = await otpServices.sendOTP(mobile_number);
    // if (!otpResult.success) {
    //   return res.status(400).json({ error: "Failed to send verification OTP", success: false });
    // }

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
      keywords,
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


// sarim profilecalculation Logic 
const calculateProfileCompletion = (user) => {
  
  const weights = {
    basicInfo: 30,
    businessInfo: 30,
    bioDetails: 15,
    growthSheet: 10,
    topProfile: 10,
    weeklyPresentation: 5
  };

  let completion = 0;

  const basicInfoFields = [
    'name', 'city', 'state', 'country', 'mobile_number', 'email', 
    'date_of_birth', 'profilePic', 'emergency_contact', 'address'
  ];
  const completedBasicFields = basicInfoFields.filter(field => {
    if (field === 'profilePic') return user[field] && user[field] !== 'default.jpg';
    return user[field] && user[field] !== '';
  }).length;
  completion += (completedBasicFields / basicInfoFields.length) * weights.basicInfo;

 
  if (user.business && user.business.length > 0) {
    const primaryBusiness = user.business.find(b => b.primary_business) || user.business[0];
    const businessFields = [
      'business_name', 'business_type', 'category', 'sub_category',
      'product', 'service', 'mobile_number', 'email', 'address'
    ];
    const completedBusinessFields = businessFields.filter(field => 
      primaryBusiness[field] && primaryBusiness[field] !== ''
    ).length;
    completion += (completedBusinessFields / businessFields.length) * weights.businessInfo;
  }

 
  const bioFields = [
    'yearsInBusiness', 'previousTypesOfBusiness', 'spouse', 
    'children', 'hobbies', 'cityOfResidence', 'myBurningDesire'
  ];
  const completedBioFields = bioFields.filter(field => 
    user.bioDetails && user.bioDetails[field] && user.bioDetails[field] !== ''
  ).length;
  completion += (completedBioFields / bioFields.length) * weights.bioDetails;

  const growthFields = ['goals', 'accomplishment', 'interests', 'skills'];
  const completedGrowthFields = growthFields.filter(field => 
    user.growthSheet && user.growthSheet[field] && user.growthSheet[field] !== ''
  ).length;
  completion += (completedGrowthFields / growthFields.length) * weights.growthSheet;


  const topProfileFields = ['idealReferral', 'topProduct', 'topProblemSolved'];
  const completedTopProfileFields = topProfileFields.filter(field => 
    user.topProfile && user.topProfile[field] && user.topProfile[field] !== ''
  ).length;
  completion += (completedTopProfileFields / topProfileFields.length) * weights.topProfile;

  
  const presentationFields = ['presentation1', 'presentation2'];
  const completedPresentationFields = presentationFields.filter(field => 
    user.weeklyPresentation && user.weeklyPresentation[field] && user.weeklyPresentation[field] !== ''
  ).length;
  completion += (completedPresentationFields / presentationFields.length) * weights.weeklyPresentation;

  completion = Math.round(completion * 100) / 100;

  return {
    percentage: completion > 100 ? 100 : completion, 
    isComplete: completion >= 80 
  };
};

const getProfileCompletion = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(500).json({

      message:"userId not found ",
      data:false,
      success:true
      
    })}

  const user = await models.User.findById(userId);
  if (!user) {
    return res.status(404).json({

      message:"user not found ",
      data:false,
      success:true
      
    })}
  

  const completion = calculateProfileCompletion(user);

  // return response.success("Profile completion calculated successfully", {
  //   isProfileCompleted: completion.isComplete,
  //   profileCompletionPercentage: completion.percentage
  // }, res);

  return res.status(200).json({
    message: "Profile completion calculated successfully",
    data: {
      isProfileCompleted: completion.isComplete,
      profileCompletionPercentage: completion.percentage
    },
    success: true
  });
  


  })


// EMAIL + DEVICE-BASED OTP VERIFICATION (replaces mobile OTP)
// Route: POST /auth/verify-mobile
// Body: { email, otp, deviceId, fcm }
const isVerified = asyncHandler(async (req, res) => {
  const { email, otp, deviceId, fcm } = req.body;
  console.log("Email OTP verification attempt:", { email, otp, deviceId });

  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required", success: false });
  }

  if (!deviceId) {
    return res
      .status(400)
      .json({ error: "Device ID is required", success: false });
  }

  const user = await models.User.findOne({ email, isActive: true });
  if (!user) {
    return res.status(404).json({ error: "User not found", success: false });
  }

  // Check OTP and expiry
  if (
    !user.otp ||
    !user.otpExpires ||
    user.otp !== otp ||
    user.otpExpires < new Date()
  ) {
    return res
      .status(400)
      .json({ error: "Invalid or expired OTP", success: false });
  }

  user.verified = true;
  user.deviceId = deviceId;
  if (fcm) user.fcm = fcm;
  user.otp = "";
  user.otpExpires = null;
  await user.save();

  const token = helpers.generateToken(user);

  return res.status(200).json({
    message: "OTP verified successfully!",
    success: true,
    user,
    token,
  });
});

// Route: POST /auth/resend-mobile-otp
// Body: { email }
const resendMobileOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required", success: false });
  }

  const user = await models.User.findOne({ email, isActive: true });
  if (!user) {
    return res.status(404).json({ error: "User not found", success: false });
  }

  const isBypassUser =
    process.env.BYPASS_EMAIL && email === process.env.BYPASS_EMAIL;
  const otp = isBypassUser
    ? process.env.BYPASS_OTP || "2345"
    : generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  try {
    await sendVerificationMail(email, otp);
  } catch (error) {
    console.error("Resend OTP email sending failed:", error);
    return res.status(500).json({
      error: "Failed to resend OTP email",
      success: false,
    });
  }

  return res.status(200).json({
    message: "OTP resent to your email successfully",
    success: true,
  });
});

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

// EMAIL + DEVICE-BASED LOGIN
// Route: POST /auth/login
// Body: { email, deviceId, fcm }
// Behaviour:
// - Same deviceId & already verified: direct login (no OTP)
// - New/different deviceId OR not verified: send OTP to email, require /auth/verify-mobile
const loginUser = asyncHandler(async (req, res) => {
  const { email, fcm, deviceId } = req.body;
  console.log("Login request received (email/device):", req.body);

  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required", success: false });
  }

  if (!deviceId) {
    return res
      .status(400)
      .json({ error: "Device ID is required", success: false });
  }

  const deviceType = req.headers["x-device-type"] || "unknown";

  const user = await models.User.findOne({ email, isActive: true });

  if (!user) {
    return res.status(404).json({ error: "User not found", success: false });
  }

  user.deviceType = deviceType;
  user.loginCount = (user.loginCount || 0) + 1;
  user.lastLogin = new Date();
  if (fcm) user.fcm = fcm;

  const isBypassUser =
    process.env.BYPASS_EMAIL && email === process.env.BYPASS_EMAIL;

  // Same device and already verified -> direct login, no OTP
  if (user.deviceId && user.deviceId === deviceId && user.verified) {
    await user.save();
    const token = helpers.generateToken(user);
    return res.json({
      message: "Login successful",
      token,
      user,
      success: true,
      otpRequired: false,
    });
  }

  // Need OTP via email
  const otp = isBypassUser
    ? process.env.BYPASS_OTP || "2345"
    : generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  try {
    await sendVerificationMail(email, otp);
  } catch (error) {
    console.error("Verification email sending failed:", error);
    return res.status(500).json({
      error: "Failed to send OTP email",
      success: false,
    });
  }

  return res.status(200).json({
    message: "OTP sent to your email for verification",
    success: false, // IMPORTANT: so Flutter goes to verification screen
    otpRequired: true,
  });
});

const isLT = asyncHandler(async (req, res) => {
  const { email} = req.body;    

  if (!email) {
    return res.status(400).json({ message: "Email is required" , success: false, data: false  });
  }

  const user = await models.Admin.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
if(user.role || user.role !== 'LT') {
    return res.status(403).json({
      message: "User is not a LT",
      success: false,
      data: false

    });
  }
return res.status(200).json({
    message: "User is a LT",
    success: true,
    data: true

  });
})

const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ error: "Refresh token required" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newToken = generate({ _id: decoded.id });

    res.json({ token: newToken });
})

export const authenticationController = {
  registerUser,
  verifyUser,
  isLT,
  isVerified,
  resendMobileOTP,
  getProfileCompletion,
  resendOtp,
  loginUser,
  refreshToken,
};
