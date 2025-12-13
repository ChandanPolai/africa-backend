import { models } from "../../models/zindex.js";
import asyncHandler from "express-async-handler";
import { response } from "../../utils/response.js";
import  axios from "axios";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import  {sendEmail} from "../../config/emailhelper.js";
import { getAllUsers } from "./user.controller.js";
import { leaderboardController } from "./leaderboard.controller.js";




const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password, role,chapter } = req.body;
  if(!role)
    return response.error("please enter role ", 400, res)

  const admin = await models.Admin.findOne({ email, role, chapter });

  if (!admin ) {
    return response.error('Admin not found',500, res);
  }

  
  const hashedPassword = hashPassword(password);
  if (hashedPassword !== admin.password) {
    return response.error('Invalid email or password',500, res);
  }

  const token = generateToken(admin);
  response.success( 'Login successfully', { token, admin }, res);
});

const createAdmin = asyncHandler(async (req, res) => {
  const { email, password,role, name,chapter } = req.body;

  if (!email || !password) {
    return response.error('Email and password are required', 500,res);
  }

  const existingAdmin = await models.Admin.findOne({ email });
  if (existingAdmin) {
    return response.error('Admin already exists',409, res);
  }

  const hashedPassword = hashPassword(password);
  const newAdmin = await models.Admin.create({
    email,
    password: hashedPassword,
    name,
    chapter,
    role:role||admin
  });

  // Send welcome email
  await sendEmail(email, 'welcome', { name });

  return response.success( 'Admin created successfully', {admin: newAdmin },res );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return response.error('Email is required',500, res);
  }

  const admin = await models.Admin.findOne({ email });  
  if (!admin) {
    return response.error('Enter valid Email',500, res);
  }

  // Generate a simple 6-digit code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // In a real app, we have to  save this code to the database with an expiration time
  // await models.PasswordReset.create({
  //   email,
  //   code: resetCode,
  //   expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  // });

  // Send reset email
   admin.code = resetCode
   await admin.save();

  await sendEmail(email, 'reset', { code: resetCode });

  return response.success('Password reset code sent to email', true, res);
});

const generateToken = (admin) => {
  if (!admin || !admin._id) {
    throw new Error("Admin ID is required to generate a token");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(
    { 
      adminId: admin._id, // Keep this for backward compatibility
      role: admin.role,   // Add role
      chapter: admin.chapter // Add chapter
    },
    process.env.JWT_SECRET,
    { expiresIn: "365d" }
  );
};

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const VerifyCode  = async(req,res)=>{
  try{
    let {email,code,password} = req.body
    if(!email){
      return response.error("Please Enter your registered Email", 500, res)
    }
    if(!code){
      return response.error("Please Enter code sent to ypur registered Email", 500, res)
    }

      code = parseInt(code)
      console.log("code is ", code)

    const emailId = await models.Admin.findOne({email,code})
    if(!emailId){
      return response.error("Please Enter valid EmailId or code ", 500, res)
    }
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    // Update password
    emailId.password = hashedPassword;
    await emailId.save();

    return response.success("password updated Successfully", true, res)
}catch(error){
    return response.error("Something went Wrong . Please try again", 500, res)

  }
}



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
    keywords,
    country,
    sponseredBy,
    fcm,
    induction_date
  } = req.body;
  console.log("registerUser", req.body)

  let profilePic = "";
  if (req.file && req.file.path) {
    profilePic = req.file.path.replace(/\\/g, "/");
  }

  const existingUser = await models.User.findOne({ mobile_number });
  if (existingUser) {
    return response.success('Mobile number already registered', null, res);
  }

  if (email) {
    const existingEmailUser = await models.User.findOne({ email });
    if (existingEmailUser) {
      return response.success('Email is already registered', null, res);
    }
  }

  // Fetch chapter details to get registration fee and membership duration
  const chapter = await models.Chapter.findOne({ name: chapter_name });
  if (!chapter) {
    return response.success('Chapter not found', null, res);
  }


  const inductionDate = induction_date ? new Date(induction_date) : new Date();
  const endDate = new Date(inductionDate) ;
  // Default to 365 days if not specified
  console.log("Induction Date:", inductionDate);
  console.log("End Date:", endDate);

  const newUser = await models.User.create({
    name,
    email,
    mobile_number,
    chapter_name,
    meeting_role,
    profilePic,
    date_of_birth,
    city,
    state,
    keywords,
    sponseredBy,
    country,
    fcm: fcm || "",
    
  });
  

  
  if (newUser.sponseredBy) {
    await leaderboardController.addPointsHistory(sponseredBy, "induction", res);
  }

  res.status(200).json({
    message: "User Register Successfully",
    success: true,
    newUser,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const {
    name,
    email,
    mobile_number,
    chapter_name,
    meeting_role,
    date_of_birth,
    city,
    state,
    keywords,
    country,
    sponseredBy,
    fcm,
  } = req.body;

  let profilePic = "";
  if (req.file && req.file.path) {
    profilePic = req.file.path.replace(/\\/g, "/");
  }

  const user = await models.User.findById(userId);
  if (!user) {
    return response.success('User not found', null, res);
  }

  // Check for duplicate mobile number if changed
  if (mobile_number && mobile_number !== user.mobile_number) {
    const existingMobileUser = await models.User.findOne({ mobile_number });
    if (existingMobileUser) {
      return response.success('Mobile number already registered', null, res);
    }
  }

  // Check for duplicate email if changed
  if (email && email !== user.email) {
    const existingEmailUser = await models.User.findOne({ email });
    if (existingEmailUser) {
      return response.success('Email is already registered', null, res);
    }
  }

  // Update fields
  user.name = name || user.name;
  user.email = email || user.email;
  user.mobile_number = mobile_number || user.mobile_number;
  user.chapter_name = chapter_name || user.chapter_name;
  user.meeting_role = meeting_role || user.meeting_role;
  user.date_of_birth = date_of_birth || user.date_of_birth;
  user.city = city || user.city;
  user.state = state || user.state;
  user.keywords = keywords || user.keywords;
  user.country = country || user.country;
  user.sponseredBy = sponseredBy || user.sponseredBy;
  user.fcm = fcm || user.fcm;
  if (profilePic) {
    user.profilePic = profilePic;
  }

  await user.save();

  res.status(200).json({
    message: "User updated successfully",
    success: true,
    user,
  });
});

const userListByParticularChapter = asyncHandler(async (req, res) => {
  const { chapter_name, page = 1, limit = 10, search = "" } = req.body;
  if (!chapter_name) {
    return response.success('Chapter name is required', false, res);
  }

  const query = { chapter_name, isActive: true };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile_number: { $regex: search, $options: "i" } }
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    select: 'name mobile_number email chapter_name ',
    sort: { name: 1 },
  };

  const users = await models.User.paginate(query, options);
  
  if (!users) {
    return response.success('No users found', null, res);
  }
  
  return response.success('Users fetched successfully', users, res);
});

const updateFee = asyncHandler(async (req, res) => {
  const { userId, amount, remarks} = req.body;

  const user = await models.User.findById(userId);
  if (!user) {
    return response.success('User not found', null, res);
  }

  // Update fee details
  user.fees.paid_fee += amount;
  user.fees.pending_fee = user.fees.total_fee - user.fees.paid_fee;

  // Add to fee history
  user.fees.fee_history.push({
    amount,
    payment_date: new Date(),
 remarks
  });

  // Check if membership needs renewal
  const currentDate = new Date();
  if (currentDate > user.fees.end_date && !user.fees.is_renewed) {
    user.fees.total_fee = user.fees.renewal_fee;
    user.fees.paid_fee = 0;
    user.fees.pending_fee = user.fees.renewal_fee;
    user.fees.induction_date = new Date();
    const chapter = await models.Chapter.findOne({ name: user.chapter_name });
    if (chapter) {
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + chapter.fees.membership_duration_days);
      user.fees.end_date = newEndDate;
      user.fees.is_renewed = true;
    }
  }

  await user.save();

  res.status(200).json({
    message: "Fee updated successfully",
    success: true,
    user
  });
});

const getAllFeesUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" ,chapter_name} = req.body;
  const query = {isActive: true};

  if(chapter_name){
    query.chapter_name = chapter_name;
  }
  if(search){
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile_number: { $regex: search, $options: "i" } }
    ];
  }
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    select: 'name mobile_number email chapter_name fees',
    sort: { name: 1 },
    
  };
  const users = await models.User.paginate(query, options);
  
  if (!users) {
    return response.success('No users found', null, res);
  }
  return response.success('Users fetched successfully', users, res);
  });




  export const createSocialMedia = asyncHandler(async (req, res) => {
    const { name, url } = req.body;
  
    if (!name || !url ) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    const newSM = await models.SocialMedia.create({ name, url });
  
    res.status(201).json({
      success: true,
      message: "Social media created successfully",
      data: newSM,
    });
  });
  
  export const updateSocialMedia = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, url } = req.body;
  
    const sm = await models.SocialMedia.findById(id);
    if (!sm) return res.status(404).json({ message: "Social media not found" });
  
    sm.name = name || sm.name;
    sm.url = url || sm.url;
    
  
    const updatedSM = await sm.save();
  
    res.status(200).json({
      success: true,
      message: "Social media updated successfully",
      data: updatedSM,
    });
  });
  
  export const deleteSocialMedia = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const sm = await models.SocialMedia.findById(id);
    if (!sm) return res.status(404).json({ message: "Social media not found" });
  
    await sm.deleteOne();
  
    res.status(200).json({
      success: true,
      message: "Social media deleted successfully",
    });
  });

 
  export const getAllSocialMedia = asyncHandler(async (req, res) => {
    const list = await models.SocialMedia.find().sort({ createdAt: -1 });
  
    res.status(200).json({
      success: true,
      message: "Social media list fetched successfully",
      data: list,
    });
  });

  const getFeesByUserId = asyncHandler(async (req, res) => {
    
    const { userId } = req.params;
    const users = await models.User.findOne(fees);
    
    if (!users) {
      return response.success('No users found', null, res);
    }
    return response.success('Users fetched successfully', users, res);
    });
  
  
  //start

  
// export const convertMemberToUser = async (req, res) => {
//   try {
//       const { id } = req.params;
      
//       // 1. Find the membership application
//       const membership = await models.memberApplication.findById(id);
//       if (!membership) {
//           return response.error('Membership application not found', 404, res );
//       }
      
//       // 2. Check if this mobile number or email already exists in users
//       const existingUserByMobile = await models.User.findOne({ 
//           mobile_number: membership.applicant.mobileNumber 
//       });
      
//       if (existingUserByMobile) {
//           return res.status(409).json({
//               message: 'User with this mobile number already exists',
//               success: false
//           });
//       }
      
//       if (membership.applicant.email) {
//           const existingUserByEmail = await models.User.findOne({ 
//               email: membership.applicant.email 
//           });
          
//           if (existingUserByEmail) {
//               return response.error('User with this email already exists', 400,res);
//           }
//       }
      
//       // 3. Map membership data to user schema
//       const userData = {
//           name: `${membership.applicant.firstName} ${membership.applicant.lastName}`,
//           chapter_name: membership.chapter,
//           city: membership.applicant.businessAddress?.city || '',
//           state: membership.applicant.businessAddress?.state || '',
//           mobile_number: membership.applicant.mobileNumber,
//           email: membership.applicant.email || '',
//           address: `${membership.applicant.businessAddress?.addressLine1 || ''}, ${membership.applicant.businessAddress?.addressLine2 || ''}`.trim().replace(/,$/, ''),
//           business: [{
//               business_name: membership.applicant.companyName || '',
//               business_type: membership.applicant.industry || '',
//               primary_business: true,
//               category: membership.applicant.professionalClassification || '',
//               mobile_number: membership.applicant.mobileNumber,
//               email: membership.applicant.email || '',
//               website: membership.applicant.businessWebsite || '',
//               address: `${membership.applicant.businessAddress?.addressLine1 || ''}, ${membership.applicant.businessAddress?.city || ''}, ${membership.applicant.businessAddress?.state || ''}`.trim().replace(/,$/, ''),
//               about_business_details: membership.experience?.description || ''
//           }],
//           bioDetails: {
//               yearsInBusiness: membership.experience?.lengthOfTime || '',
//               cityOfResidence: membership.applicant.businessAddress?.city || ''
//           },
//           meeting_role: 'Member',
//           profilePic: membership.applicant.livePhoto || 'default.jpg',
//           acc_active: true,
//           verified: true,
//           isActive: true
//       };
      
//       // 4. Set default fee values
//       const defaultRegistrationFee = 1000; // Set your default value
//       const defaultRenewalFee = 500; // Set your default value
//       const defaultMembershipDuration = 365; // 1 year in days
      
//       let registrationFee = defaultRegistrationFee;
//       let renewalFee = defaultRenewalFee;
//       let membershipDuration = defaultMembershipDuration;
      
//       // Try to get chapter details if chapter exists in membership
//       if (membership.chapter) {
//           const chapter = await models.Chapter.findOne({ name: membership.chapter });
//           if (chapter) {
//               registrationFee = chapter.fees?.registration_fee || defaultRegistrationFee;
//               renewalFee = chapter.fees?.renewal_fee || defaultRenewalFee;
//               membershipDuration = chapter.fees?.membership_duration_days || defaultMembershipDuration;
//           }
//       }
      
//       // Calculate dates
//       const inductionDate = new Date();
//       const endDate = new Date(inductionDate);
//       endDate.setDate(endDate.getDate() + membershipDuration);
      
//       // Set fee information
//       const paidAmount = membership.paymentDetails?.amount || 0;
//       userData.fees = {
//           total_fee: registrationFee,
//           paid_fee: paidAmount,
//           pending_fee: Math.max(0, registrationFee - paidAmount),
//           renewal_fee: renewalFee,
//           induction_date: inductionDate,
//           end_date: endDate,
//           is_renewed: false,
//           fee_history: []
//       };
      
//       // Add payment history if payment exists
//       if (paidAmount > 0) {
//           userData.fees.fee_history.push({
//               amount: paidAmount,
//               payment_date: membership.paymentDetails?.paymentDate || new Date(),
//               remarks: 'Initial membership payment'
//           });
//       }
      
//       // 5. Create the new user
//       const newUser = new models.User(userData);
//       await newUser.save();
      
//       // 6. Update membership application to mark it as converted
//       membership.isActive = false;
//       membership.convertedToUser = true;
//       membership.convertedUserId = newUser._id;
//       membership.convertedAt = new Date();
//       await membership.save();
      
//       // 7. Return success response with both records
//       return response.success('Member successfully converted to user', {
//           user: newUser,
//           membership: membership
//       }, res);
      
//   } catch (error) {
//       console.error('Conversion error:', error);
//       return response.error('Server error during conversion: ', 500, res);
//   }
// };

export const convertMemberToUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Find the membership application
    const membership = await models.memberApplication.findById(id);
    if (!membership) {
      return response.error('Membership application not found', 404, res);
    }
    
    // 2. Check if this mobile number or email already exists in users
    const existingUserByMobile = await models.User.findOne({ 
      mobile_number: membership.applicant.mobileNumber 
    });
    
    if (existingUserByMobile) {
      return res.status(409).json({
        message: 'User with this mobile number already exists',
        success: false
      });
    }
    
    if (membership.applicant.email) {
      const existingUserByEmail = await models.User.findOne({ 
        email: membership.applicant.email 
      });
      
      if (existingUserByEmail) {
        return response.error('User with this email already exists', 400, res);
      }
    }
    
    // 3. Map membership data to user schema
    const userData = {
      name: `${membership.applicant.firstName} ${membership.applicant.lastName}`,
      chapter_name: membership.chapter,
      city: membership.applicant.businessAddress?.city || '',
      state: membership.applicant.businessAddress?.state || '',
      date_of_birth: membership.applicant.dateOfBirth ? new Date(membership.applicant.dateOfBirth) : null,
      marriage_anniversary: membership.applicant.anniversaryDate ? new Date(membership.applicant.anniversaryDate) : null,
      sponseredBy: membership.sponseredBy || null,

      mobile_number: membership.applicant.mobileNumber,
      email: membership.applicant.email || '',
      address: `${membership.applicant.businessAddress?.addressLine1 || ''}, ${membership.applicant.businessAddress?.addressLine2 || ''}`.trim().replace(/,$/, ''),
      business: [{
        business_name: membership.applicant.companyName || '',
        business_type: membership.applicant.industry || '',
        primary_business: true,
        category: membership.applicant.professionalClassification || '',
        mobile_number: membership.applicant.mobileNumber,
        email: membership.applicant.email || '',
        website: membership.applicant.businessWebsite || '',
        address: `${membership.applicant.businessAddress?.addressLine1 || ''}, ${membership.applicant.businessAddress?.city || ''}, ${membership.applicant.businessAddress?.state || ''}`.trim().replace(/,$/, ''),
        about_business_details: membership.experience?.description || ''
      }],
      bioDetails: {
        yearsInBusiness: membership.experience?.lengthOfTime || '',
        cityOfResidence: membership.applicant.businessAddress?.city || '',
        spouse:membership.applicant.spouseName || '',

        
      },
      meeting_role: 'Member',
      profilePic: membership.applicant.livePhoto || 'default.jpg',
      acc_active: true,
      verified: true,
      isActive: true
    };
    
   
    const newUser = new models.User(userData);
    await newUser.save();

      if (newUser.sponseredBy) {
      await leaderboardController.addPointsHistory(newUser.sponseredBy, "induction", res);
    }

    let digitalCardResponse = null;
    let digitalCardError = null;
    let whatsappResponse = null;
    let whatsappError = null;
    
    try {
      
      const digitalCardPayload = {
        name: userData.name.trim(),
        email: userData.email || "",
        mobile: userData.mobile_number,
        businessKeyword: userData.business[0]?.business_type || "GBS",
        originId: "685a80c61ecf5bcb96968fb7", 
        countryCode: "91"
      };
      
      console.log("Digital Card Payload:", digitalCardPayload);
      
      const apiResponse = await axios.post(
        'https://gbscard.itfuturz.in/web/create-account/mobile',
        digitalCardPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      
      digitalCardResponse = apiResponse.data;
      
      if (digitalCardResponse && digitalCardResponse.data?.path) {
        newUser.digitalCardLink = digitalCardResponse.data.path;
       
        await newUser.save();
        
        // Prepare WhatsApp message
        const message = `Dear ${userData.name},

Welcome to the Global Business Social community! 🎉 We're thrilled to have you as a member.

Your membership details:
- Name: ${userData.name}
- Chapter: ${userData.chapter_name}


As a valued member, we've created your *Digital Business Profile*:
- Profile: ${digitalCardResponse.data.path}
- Portal: https://gbscustomer.itfuturz.in
- Email: ${userData.email || userData.mobile_number}
- Password: user@1234 (You may change after first login)

This digital profile will help you network with other members and showcase your business. 

Thank you for joining us. We look forward to supporting your business growth!

Warm regards,
[GBS Team]`;
        
        // Send WhatsApp message
        try {
          const whatsappApiResponse = await axios.post(
            'https://whatsapp.itfuturz.in/api/send-message',
            {
              sessionId: "8264abd4-34ab-47de-aac1-0a8e01ed621f",
              to: userData.mobile_number,
              message: message
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          whatsappResponse = whatsappApiResponse.data;
        } catch (whatsappErr) {
          console.error('WhatsApp message sending failed:', whatsappErr);
          whatsappError = {
            message: whatsappErr.message,
            response: whatsappErr.response?.data || null,
            status: whatsappErr.response?.status || 500
          };
        }
      }
    } catch (error) {
      console.error('Digital card creation failed:', error);
      digitalCardError = {
        message: error.message,
        response: error.response?.data || null,
        status: error.response?.status || 500
      };
    }
    
    // 6. Update membership application to mark it as converted
    
  
    await membership.save();
    
    // 7. Return success response with both records and digital card info
    const successResponse = {
      user: newUser,
      membership: membership,
      digitalCard: {
        attempted: true,
        status: digitalCardError ? 'failed' : 'success',
        response: digitalCardError ? digitalCardError : digitalCardResponse,
        timestamp: new Date()
      },
      whatsappNotification: {
        attempted: digitalCardResponse && digitalCardResponse.data?.path ? true : false,
        status: whatsappError ? 'failed' : (whatsappResponse ? 'success' : 'not_attempted'),
        response: whatsappError ? whatsappError : whatsappResponse,
        timestamp: new Date()
      }
    };
    
    return response.success('Member successfully converted to user', successResponse, res);
    
  } catch (error) {
    console.error('Conversion error:', error);
    return response.error('Server error during conversion: ' + error.message, 500, res);
  }
};

export const getMembersForWhatsAppMessage = async (req, res) => {
  try {
    // Fetch all member applications from the database
    const data = await models.memberApplication.find({}).lean();
    
    // Create the message list with mobile numbers and personalized messages
    const list = data.map((member) => {
      const message = `Dear ${member.applicant.firstName || ''} ${member.applicant.lastName || ''},

We are truly grateful for your presence at the Global Business Event! 🙏✨ It was an honor to have you with us.

As a token of our appreciation, we're delighted to gift you a *Digital Business Profile* - our small way to support your business growth journey.

Your exclusive access:
- Profile: ${member.digitalCard}
- Portal: https://gbscustomer.itfuturz.in
- Email: ${member.applicant.email}
- Password: user@1234
(You may change your password after first login)

We sincerely hope this adds value to your business. Thank you for being an important part of the GBS family. 

Warm regards,
[GBS Team]`;

      return {
        mobile: member.applicant.mobileNumber,
        message: message
      };
    });
    
    return response.success("WhatsApp messages prepared successfully!", list, res);
  } catch(error) {
    return response.error(error.message, 500, res);
  }
}

export const getOtpRecords = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    // Build the query object - only get users with OTP
    const query = {
      otp: { $exists: true, $ne: '', $ne: null },
      isActive: true
    };

    // Handle search parameter for email, mobile_number, and otp
    if (search) {
      const sanitizedSearch = search.trim();
      if (sanitizedSearch) {
        query.$or = [
          { email: { $regex: sanitizedSearch, $options: 'i' } },
          { mobile_number: { $regex: sanitizedSearch, $options: 'i' } },
          { otp: { $regex: sanitizedSearch, $options: 'i' } },
          { name: { $regex: sanitizedSearch, $options: 'i' } }
        ];
      }
    }

    // Options for pagination
    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Cap limit at 100 for performance
      sort: { updatedAt: -1 }, // Sort by updatedAt to show recent OTPs first
      select: 'email mobile_number otp otpExpires name createdAt updatedAt', // Only select needed fields
      lean: true
    };

    // Validate pagination parameters
    if (isNaN(options.page) || options.page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number'
      });
    }

    if (isNaN(options.limit) || options.limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit value'
      });
    }

    // Use mongoose-paginate-v2 on User model
    const result = await models.User.paginate(query, options);

    // Transform the data to match the expected format
    const transformedDocs = result.docs.map(user => ({
      _id: user._id,
      email: user.email || 'N/A',
      mobileNo: user.mobile_number || 'N/A',
      mobile_number: user.mobile_number || 'N/A',
      otp: user.otp || 'N/A',
      name: user.name || 'N/A',
      otpExpires: user.otpExpires || null,
      createdAt: user.createdAt || user.updatedAt,
      updatedAt: user.updatedAt,
      // For compatibility with old format
      isUsed: !user.otp || user.otp === '', // OTP is considered used if it's empty
      isSent: !!user.otp && user.otp !== '' // OTP is considered sent if it exists
    }));

    if (!result || transformedDocs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No OTP records found',
        data: {
          totalDocs: 0,
          docs: [],
          totalPages: 0,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP records fetched successfully',
      data: {
        totalDocs: result.totalDocs,
        docs: transformedDocs,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
        pagingCounter: result.pagingCounter,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage
      }
    });
  } catch (error) {
    console.error('Error fetching OTP records:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching OTP records',
      error: error.message
    });
  }
});

export const authController = {
  loginAdmin,
  registerUser,
  getOtpRecords,
  createAdmin,
  updateUser,
  updateFee,
  getAllFeesUsers,
  createSocialMedia,
  convertMemberToUser,
  getMembersForWhatsAppMessage,
  forgotPassword,
  VerifyCode,
  updateSocialMedia,
  deleteSocialMedia,
  getAllSocialMedia,
  userListByParticularChapter
  
}