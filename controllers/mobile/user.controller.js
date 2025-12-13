import { userValdation } from "./validators/users.validator.js";
import { models } from "../../models/zindex.js";
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { response } from "../../utils/response.js";
import { helpers } from "../../utils/helpers.js";
import SubCategory from "../../models/subcategory.model.js";
import { name } from "ejs";

const getAllUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10, verified, meeting_role } = req.query;

  let searchRegex = search ? new RegExp(search, "i") : null;

  let query = {};

  if (searchRegex) {
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { mobile_number: searchRegex },
      { address: searchRegex },
      { chapter_name: searchRegex },
    ];
  }

  if (verified !== undefined) {
    query.verified = verified === "true";
  }

  if (meeting_role) {
    query.meeting_role = meeting_role;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    select:
      "name chapter_name mobile_number email date_of_birth marriage_anniversary profilePic emergency_contact address introduction_details meeting_role business complains suggestions latitude longitude acc_active paid_fees pending_fees due_date_fees points verified verificationCode fcm isActive bioDetails growthSheet topProfile weeklyPresentation",
  };

  const users = await models.User.paginate(query, options);

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully!",
    ...users,
  });

})

const getUsersCommanData = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10, verified, meeting_role, city, chapter_name, category, sub_category } = req.query;

  let searchRegex = search ? new RegExp(search, "i") : null;

  let query = {};

  if (city) {
    query.city = city;
  }
  if (chapter_name) {
    query.chapter_name = chapter_name;
  }
  if (category) {
    query.business = {
      $elemMatch: {
        category: category
      }
    };
  }
  if (sub_category) {
    query.business = {
      $elemMatch: {
        sub_category: sub_category
      }
    };
  }



  if (searchRegex) {
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { mobile_number: searchRegex },
      { address: searchRegex },
      { chapter_name: searchRegex },
      { keywords: searchRegex },
      { "business.product": searchRegex },
      { "business.category": searchRegex },
      { "business.sub_category": searchRegex },
   
      { "business.business_name": searchRegex },
  
    ];
  }

  if (verified !== undefined) {
    query.verified = verified === "true";
  }

  if (meeting_role) {
    query.meeting_role = meeting_role;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { name: 1 },
    collation: { locale: 'en', strength: 2 },
    select: "name email business profilePic keywords city chapter_name state country mobile_number",
  };

  const users = await models.User.paginate(query, options);

  const modifiedDocs = users.docs.map((user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile_number: user.mobile_number,
    profilePic: user.profilePic,
    keywords: user.keywords,
    city: user.city,
    chapter_name: user.chapter_name,
    state: user.state,
    country: user.country,
    business_name:
      user.business && user.business.length > 0
        ? user.business[0].business_name
        : null,
    category:
      user.business && user.business.length > 0
        ? user.business[0].category
        : null,
    sub_category:
      user.business && user.business.length > 0
        ? user.business[0].sub_category
        : null,
    address:
      user.business && user.business.length > 0
        ? user.business[0].address
        : null,
  }));

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully!",
    docs: modifiedDocs,
    totalDocs: users.totalDocs,
    limit: users.limit,
    totalPages: users.totalPages,
    page: users.page,
    pagingCounter: users.pagingCounter,
    hasPrevPage: users.hasPrevPage,
    hasNextPage: users.hasNextPage,
    prevPage: users.prevPage,
    nextPage: users.nextPage,
  });
})

const getInsideChapterData = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10, verified, meeting_role } = req.query;

  const loggedIn_user = await models.User.findById(req.user.userId)
    .select("chapter_name")
    .lean();

  let searchRegex = search ? new RegExp(search, "i") : null;

  let query = {
    chapter_name: loggedIn_user.chapter_name,
    _id: { $ne: req.user.userId },
  };

  if (searchRegex) {
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { mobile_number: searchRegex },
      { address: searchRegex },
      { chapter_name: searchRegex },
    ];
  }

  if (verified !== undefined) {
    query.verified = verified === "true";
  }

  if (meeting_role) {
    query.meeting_role = meeting_role;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { name: 1 }, // Sort by name in ascending order

    collation: { locale: 'en', strength: 2 },
    select: "name email business profilePic mobile_number chapter_name", // Select only needed fields
  };

  const users = await models.User.paginate(query, options);

  // Extract name, _id, email, and business_name from business[0]
  const modifiedDocs = users.docs.map((user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile_number: user.mobile_number,
    profilePic: user.profilePic,
    chapter_name: user.chapter_name,
    business_name:
      user.business && user.business.length > 0
        ? user.business[0].business_name
        : null,
    address:
      user.business && user.business.length > 0
        ? user.business[0].address
        : null,
  }));

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully!",
    docs: modifiedDocs,
    totalDocs: users.totalDocs,
    limit: users.limit,
    totalPages: users.totalPages,
    page: users.page,
    pagingCounter: users.pagingCounter,
    hasPrevPage: users.hasPrevPage,
    hasNextPage: users.hasNextPage,
    prevPage: users.prevPage,
    nextPage: users.nextPage,
  });
})

// const getUsersCommanData = asyncHandler(async (req, res) => {
//   const {
//     search,
//     page = 1,
//     limit = 10,
//     verified,
//     meeting_role,
//     city,
//     chapter_name,
//     category,
//     sub_category,
//     sortBy = 'createdAt', // default sort field
//     order = 'desc'        // default order: 'asc' or 'desc'
//   } = req.query;

//   let searchRegex = search ? new RegExp(search, "i") : null;

//   let query = {};

//   if (city) {
//     query.city = city;
//   }

//   if (chapter_name) {
//     query.chapter_name = chapter_name;
//   }

//   if (category) {
//     query.business = {
//       $elemMatch: {
//         category: category
//       }
//     };
//   }

//   if (sub_category) {
//     query.business = {
//       $elemMatch: {
//         sub_category: sub_category
//       }
//     };
//   }

//   if (searchRegex) {
//     query.$or = [
//       { name: searchRegex },
//       { email: searchRegex },
//       { mobile_number: searchRegex },
//       { address: searchRegex },
//       { chapter_name: searchRegex },
//       { "business.product": searchRegex },
//       { "business.category": searchRegex },
//       { "business.sub_category": searchRegex },
//       { "business.business_name": searchRegex },
//     ];
//   }

//   if (verified !== undefined) {
//     query.verified = verified === "true";
//   }

//   if (meeting_role) {
//     query.meeting_role = meeting_role;
//   }

//   const options = {
//     page: parseInt(page),
//     limit: parseInt(limit),
//     sort: { [sortBy]: order === 'asc' ? 1 : -1 }, // dynamic sorting
//     select: "name email business profilePic keywords city chapter_name state country mobile_number",
//   };

//   const users = await models.User.paginate(query, options);

//   const modifiedDocs = users.docs.map((user) => ({
//     _id: user._id,
//     name: user.name,
//     email: user.email,
//     mobile_number: user.mobile_number,
//     profilePic: user.profilePic,
//     keywords: user.keywords,
//     city: user.city,
//     chapter_name: user.chapter_name,
//     state: user.state,
//     country: user.country,
//     business_name:
//       user.business && user.business.length > 0
//         ? user.business[0].business_name
//         : null,
//     category:
//       user.business && user.business.length > 0
//         ? user.business[0].category
//         : null,
//     sub_category:
//       user.business && user.business.length > 0
//         ? user.business[0].sub_category
//         : null,
//     address:
//       user.business && user.business.length > 0
//         ? user.business[0].address
//         : null,
//   }));

//   res.status(200).json({
//     success: true,
//     message: "Users retrieved successfully!",
//     docs: modifiedDocs,
//     totalDocs: users.totalDocs,
//     limit: users.limit,
//     totalPages: users.totalPages,
//     page: users.page,
//     pagingCounter: users.pagingCounter,
//     hasPrevPage: users.hasPrevPage,
//     hasNextPage: users.hasNextPage,
//     prevPage: users.prevPage,
//     nextPage: users.nextPage,
//   });
// });

const getOutsideChapterData = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10, verified, meeting_role } = req.query;

  const loggedIn_user = await models.User.findById(req.user.userId)
    .select("chapter_name")
    .lean();

  let searchRegex = search ? new RegExp(search, "i") : null;

  let query = { chapter_name: { $ne: loggedIn_user.chapter_name } };

  if (searchRegex) {
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { mobile_number: searchRegex },
      { address: searchRegex },
      { chapter_name: searchRegex },
    ];
  }

  if (verified !== undefined) {
    query.verified = verified === "true";
  }

  if (meeting_role) {
    query.meeting_role = meeting_role;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { name: 1 }, // Sort by name in ascending order
    collation: { locale: 'en', strength: 2 },
    select: "name email business profilePic mobile_number chapter_name", // Select only needed fields
  };

  const users = await models.User.paginate(query, options);

  // Extract name, _id, email, and business_name from business[0]
  const modifiedDocs = users.docs.map((user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile_number: user.mobile_number,
    profilePic: user.profilePic,
    chapter_name: user.chapter_name,
    business_name:
      user.business && user.business.length > 0
        ? user.business[0].business_name
        : null,
    address:
      user.business && user.business.length > 0
        ? user.business[0].address
        : null,
  }));

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully!",
    docs: modifiedDocs,
    totalDocs: users.totalDocs,
    limit: users.limit,
    totalPages: users.totalPages,
    page: users.page,
    pagingCounter: users.pagingCounter,
    hasPrevPage: users.hasPrevPage,
    hasNextPage: users.hasNextPage,
    prevPage: users.prevPage,
    nextPage: users.nextPage,
  });
})

const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await models.User.findById(userId)
    .populate("business")
    .populate("complains.userId")
    .populate("suggestions.userId");

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
})

const createUser = asyncHandler(async (req, res) => {
  const newUser = new User(req.body);
  await newUser.save();

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user: newUser,
  });
})

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedUser = await models.User.findByIdAndDelete(id);

  if (!deletedUser) {
    return res.status(404).json({
      error: "User not found",
    });
  }
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
})

const deleteDisproveUser = asyncHandler(async (req, res) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const result = await User.deleteMany({
    verified: false,
    createdAt: { $lt: fiveMinutesAgo },
  });
  res.status(200).json({
    success: true,
    message: "Users are deleted successfully",
  });
})

const getUserByEmail = asyncHandler(async (req, res) => {
  const user = await models.User.findOne({
    email: req.params.email,
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ success: true, user });
})

const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  let user = await models.User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { business, complains, suggestions, ...updateFields } = req.body;

  if (req.file) {
    updateFields.profilePic = req.file.path.replace(/\\/g, "/"); // or full path
  }

  const updatedUser = await models.User.findByIdAndUpdate(userId, updateFields, {
    new: true,
  });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    updatedUser,
  });
})

const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await models.User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Toggle the acc_active field
  const updatedUser = await models.User.findByIdAndUpdate(
    userId,
    { acc_active: !user.acc_active },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: `User status updated to ${updatedUser.acc_active ? "active" : "inactive"
      }`,
    data: updatedUser,
  });
})

const getUserBusinessDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await models.User.findById(userId).select("business");

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, business: user.business });
})

const addBusiness = asyncHandler(async (req, res) => {
  const user = await models.User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  // console.log(req.file.filename);
  const newBusiness = {
    ...req.body,
    logo: req.file ? req.file.path.replace(/\\/g, "/") : null,
  };

  user.business.push(newBusiness);
  await user.save();

  const addedBusiness = user.business[user.business.length - 1];

  res.status(201).json({
    success: true,
    message: "Business added successfully",
    business: addedBusiness,
  });
})

const updateBusiness = asyncHandler(async (req, res) => {
  const user = await models.User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const businessIndex = user.business.findIndex(
    (biz) => biz._id.toString() === req.params.businessId
  );
  if (businessIndex === -1)
    return res.status(404).json({ error: "Business not found" });

  const updatedBusiness = {
    ...user.business[businessIndex]._doc,
    ...req.body,
    logo: req.file
      ? req.file.path.replace(/\\/g, "/")
      : user.business[businessIndex].logo,
  };

  user.business[businessIndex] = updatedBusiness;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Business updated successfully",
    business: updatedBusiness,
  });
})

const addSocialMediaLinkUser = asyncHandler(async (req, res) => {
  const { userId, Facebook, Instagram, LinkedIn, Twitter, YouTube, WhatsApp } = req.body;

  if (!userId) {
    return response.error("User ID is required", res);
  }

  if (!Facebook && !Instagram && !LinkedIn && !Twitter && !YouTube && !WhatsApp) {
    return response.error("At least one social media link is required", res);
  }

  const user = await models.User.findById(userId);
  if (!user) {
    return response.notFound("User not found", res);
  }


  if (!user.SocialMedia) {
    user.SocialMedia = {};
  }

  user.SocialMedia = {
    Facebook: Facebook || user.SocialMedia.Facebook || "",
    Instagram: Instagram || user.SocialMedia.Instagram || "",
    LinkedIn: LinkedIn || user.SocialMedia.LinkedIn || "",
    Twitter: Twitter || user.SocialMedia.Twitter || "",
    YouTube: YouTube || user.SocialMedia.YouTube || "",
    WhatsApp: WhatsApp || user.SocialMedia.WhatsApp || ""
  };

  await user.save();
  const SocialMedia = user.toObject().SocialMedia;

  return response.success("Social media links added successfully!", { SocialMedia }, res);
});


const getAllComplaints = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const user = await models.User.findById(userId).populate(
    "complains.userId",
    "name email chapter_name profilePic"
  );
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.complains.length === 0) {
    return res.status(404).json({ error: "No complaints found" });
  }
  res.status(200).json({
    success: true,
    message: "Complaints retrieved successfully",
    data: user.complains,
  });
})

const addComplaint = asyncHandler(async (req, res) => {
  const { userId: receiverId } = req.params; // the person receiving the complaint
  const { giverId, details } = req.body; // the person giving the complaint

  // Ensure both fields are present
  if (!giverId || !details) {
    return res.status(400).json({ error: "giverId and details are required" });
  }

  // Validate receiver
  const user = await models.User.findById(receiverId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const newComplaint = {
    userId: new mongoose.Types.ObjectId(giverId),
    details,
  };

  user.complains.push(newComplaint);
  await user.save();

  res.status(201).json({
    success: true,
    message: "Complaint added successfully",
    complains: user.complains,
  });
});


const removeComplaint = asyncHandler(async (req, res) => {
  const user = await models.User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const initialLength = user.complains.length;
  user.complains = user.complains.filter(
    (complaint) => complaint._id.toString() !== req.params.complaintId
  );

  if (initialLength === user.complains.length)
    return res.status(404).json({ error: "Complaint not found" });

  await user.save();
  res
    .status(200)
    .json({ success: true, message: "Complaint removed successfully" });
})

const getAllSuggestion = asyncHandler(async (req, res) => {
  const user = await models.User.findById(req.user.userId).populate(
    "suggestions.userId",
    "name email chapter_name profilePic"
  );
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.suggestions.length === 0) {
    return res.status(404).json({ error: "No suggestions found" });
  }
  res.status(200).json({
    success: true,
    message: "Suggestions retrieved successfully",
    data: user.suggestions,
  });
})

const addSuggestion = asyncHandler(async (req, res) => {
  const giverId = req.user.userId;
  const { userId: receiverId } = req.params;

  const user = await User.findById(receiverId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const newSuggestion = {
    userId: new mongoose.Types.ObjectId(giverId),
    details: req.body.details,
  };

  user.suggestions.push(newSuggestion);
  await user.save();

  res.status(201).json({
    success: true,
    message: "Suggestion added successfully",
    suggestions: user.suggestions,
  });
})

const removeSuggestion = asyncHandler(async (req, res) => {
  const user = await models.User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const initialLength = user.suggestions.length;
  user.suggestions = user.suggestions.filter(
    (suggestion) => suggestion._id.toString() !== req.params.suggestionId
  );

  if (initialLength === user.suggestions.length)
    return res.status(404).json({ error: "Suggestion not found" });

  await user.save();
  res
    .status(200)
    .json({ success: true, message: "Suggestion removed successfully" });
})

const updateBioDetails = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  const user = await models.User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const {
    yearsInBusiness,
    previousTypesOfBusiness,
    spouse,
    children,
    pets,
    hobbies,
    cityOfResidence,
    yearInThatCity,
    myBurningDesire,
    somethingNoOne,
    myKeyToSuccess,
  } = req.body;

  user.bioDetails.yearsInBusiness = yearsInBusiness;
  user.bioDetails.previousTypesOfBusiness = previousTypesOfBusiness;
  user.bioDetails.spouse = spouse;
  user.bioDetails.children = children;
  user.bioDetails.pets = pets;
  user.bioDetails.hobbies = hobbies;
  user.bioDetails.cityOfResidence = cityOfResidence;
  user.bioDetails.yearInThatCity = yearInThatCity;
  user.bioDetails.myBurningDesire = myBurningDesire;
  user.bioDetails.somethingNoOne = somethingNoOne;
  user.bioDetails.myKeyToSuccess = myKeyToSuccess;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Bio details updated successfully",
    bioDetails: user.bioDetails,
  });
})

const updateGrowthSheet = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  const user = await models.User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { goals, accomplishment, interests, networks, skills } = req.body;

  user.growthSheet.goals = goals;
  user.growthSheet.accomplishment = accomplishment;
  user.growthSheet.interests = interests;
  user.growthSheet.networks = networks;
  user.growthSheet.skills = skills;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Growth sheet updated successfully",
    growthSheet: user.growthSheet,
  });
})

const updateTopProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  const user = await models.User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const {
    idealReferral,
    topProduct,
    topProblemSolved,
    favouriteLgnStory,
    idealReferralParter,
  } = req.body;

  user.topProfile.idealReferral = idealReferral;
  user.topProfile.topProduct = topProduct;
  user.topProfile.topProblemSolved = topProblemSolved;
  user.topProfile.favouriteLgnStory = favouriteLgnStory;
  user.topProfile.idealReferralParter = idealReferralParter;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Top profile updated successfully",
    topProfile: user.topProfile,
  });
})

const updateWeeklyPresentation = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const user = await models.User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { presentation1, presentation2 } = req.body;

  user.weeklyPresentation.presentation1 = presentation1;
  user.weeklyPresentation.presentation2 = presentation2;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Weekly presentation updated successfully",
    weeklyPresentation: user.weeklyPresentation,
  });
})

const getNearbyUsers = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius, category } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude and longitude are required!" });
  }

  // Build base query
  const query = {
    latitude: { $exists: true, $ne: "" },
    longitude: { $exists: true, $ne: "" }
  };

  // Add category filter if provided
  if (category) {
    query['business.category'] = category;
  }

  // Fetch users with location data and optional category filter
  const users = await models.User.find(query).select(
    'latitude longitude name mobile_number email address business profilePic chapter_name'
  );

  // Filter users within the specified radius
  let nearbyUsers = users.filter((user) => {
    if (user.latitude && user.longitude) {
      const distance = helpers.calculateDistance(
        latitude,
        longitude,
        user.latitude,
        user.longitude
      );
      return distance <= radius;
    }
    return false;
  });

  // Add distance to each user and sort by distance
  let usersWithDistance = nearbyUsers.map((user) => {
    const userObj = user.toObject();

    // Filter businesses by category if category is provided
    if (category) {
      userObj.business = userObj.business.filter(
        biz => biz.category === category
      );
    }

    return {
      ...userObj,
      distance: helpers.calculateDistance(
        latitude,
        longitude,
        user.latitude,
        user.longitude
      )
    };
  }).sort((a, b) => a.distance - b.distance);

  return res.status(200).json({
    message: "Nearby users fetched successfully!",
    data: {
      nearbyUsers: usersWithDistance,
      filters: {
        appliedCategory: category || 'none',
        radius,
        location: { latitude, longitude }
      }
    },
  });
});
const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.send(`Invalid user ID format: ${userId}`);
    }

    const user = await models.User.findById(userId).lean();

    if (!user) {
      return res.send(`User not found with ID: ${userId}`);
    }

    // Get the actual host from the request
    const requestHost = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${requestHost}`;

    // Get primary business (or first business if no primary marked)
    const primaryBusiness = user.business && user.business.length > 0
      ? user.business.find(b => b.primary_business) || user.business[0]
      : null;

    // Prepare response data with proper image URLs
    const profileData = {
      name: user.name || 'Unknown',
      chapterName: user.chapter_name || '',
      mobileNumber: user.mobile_number || '',
      email: user.email || '',
      address: user.address || '',
      introductionDetails: user.introduction_details || '',
      meetingRole: user.meeting_role || '',

      profilePic: user.profilePic
        ? (user.profilePic.startsWith('http')
          ? user.profilePic
          : `${baseUrl}/${user.profilePic}`)
        : `${baseUrl}/uploads/default.jpg`,

      // Business information
      businessName: primaryBusiness?.business_name || '',
      businessType: primaryBusiness?.business_type || '',
      category: primaryBusiness?.category || '',
      subCategory: primaryBusiness?.sub_category || '',
      products: primaryBusiness?.product || '',
      services: primaryBusiness?.service || '',
      aboutBusiness: primaryBusiness?.about_business_details || '',
      website: primaryBusiness?.website || '',

      businessLogo: primaryBusiness?.logo
        ? (primaryBusiness.logo.startsWith('http')
          ? primaryBusiness.logo
          : `${baseUrl}/${primaryBusiness.logo}`)
        : '',

      businessBanner: primaryBusiness?.banner_image
        ? (primaryBusiness.banner_image.startsWith('http')
          ? primaryBusiness.banner_image
          : `${baseUrl}/${primaryBusiness.banner_image}`)
        : '',

      // Additional user information
      bioDetails: user.bioDetails || {},
      growthSheet: user.growthSheet || {},
      topProfile: user.topProfile || {},
      weeklyPresentation: user.weeklyPresentation || {}
    };

    // Render with the updated data
    return res.render('publicProfile', { profile: profileData });

  } catch (err) {
    console.error("Error in getPublicProfile:", err);
    return res.status(500).send(`
      <h1>Error Loading Profile</h1>
      <p>There was an error loading this profile: ${err.message}</p>
    `);
  }
};

const getAllUsersData = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10, verified } = req.query;


  let searchRegex = search ? new RegExp(search, "i") : null;

  let query = {

  };

  if (searchRegex) {
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { mobile_number: searchRegex },
      { address: searchRegex },
      { chapter_name: searchRegex },
    ];
  }

  if (verified !== undefined) {
    query.verified = verified === "true";
  }



  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { name: 1 },

    collation: { locale: 'en', strength: 2 },
    select: "name email business profilePic mobile_number chapter_name",

  };

  const users = await models.User.paginate(query, options);

  // Extract name, _id, email, and business_name from business[0]
  const modifiedDocs = users.docs.map((user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile_number: user.mobile_number,
    profilePic: user.profilePic,
    chapter_name: user.chapter_name,
    business_name:
      user.business && user.business.length > 0
        ? user.business[0].business_name
        : null,
    address:
      user.business && user.business.length > 0
        ? user.business[0].address
        : null,
  }));

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully!",
    docs: modifiedDocs,
    totalDocs: users.totalDocs,
    limit: users.limit,
    totalPages: users.totalPages,
    page: users.page,
    pagingCounter: users.pagingCounter,
    hasPrevPage: users.hasPrevPage,
    hasNextPage: users.hasNextPage,
    prevPage: users.prevPage,
    nextPage: users.nextPage,
  });
})
const getFeesByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await models.User.findById(userId).select('name email mobile_number fees profilePic chapter_name ');

  if (!user) {
    return response.success('No user found', null, res);
  }

  return response.success('User fees fetched successfully', user, res);
});

// Get authenticated user's userId and memberUserId from token, and store memberUserId if provided
const getAuthenticatedUserIds = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const { memberUserId } = req.body; // Frontend se memberUserId aayega

  if (!userId) {
    return response.badRequest('User ID not found in token', res);
  }

  const user = await models.User.findById(userId);

  if (!user) {
    return response.success('User not found', null, res);
  }

  // Agar memberUserId diya gaya hai, to usko array me add karo
  if (memberUserId) {
    // Initialize array agar nahi hai
    if (!user.memberUserId) {
      user.memberUserId = [];
    }
    
    // Agar already exist nahi karta, to add karo
    if (!user.memberUserId.includes(memberUserId)) {
      user.memberUserId.push(memberUserId);
      await user.save();
    }
  }

  return response.success('User IDs fetched successfully', {
    userId: user._id,
    memberUserId: user.memberUserId || []
  }, res);
});

// Get user data by memberUserId (paginated) - multiple memberUserIds support - same format as getUsersCommanData
const getUserByMemberUserId = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  // Token se logged-in user ka ID nikalo
  const loggedInUserId = req.user.userId; // ya req.user.id - apke middleware ke according

  // Logged-in user ko find karo
  const loggedInUser = await models.User.findById(loggedInUserId).select('memberUserId');

  if (!loggedInUser) {
    return response.notFound('User not found', res);
  }

  // Agar memberUserId array empty hai
  if (!loggedInUser.memberUserId || loggedInUser.memberUserId.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No members found!",
      docs: [],
      totalDocs: 0,
      limit: parseInt(limit),
      page: parseInt(page),
      totalPages: 0,
      pagingCounter: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    });
  }

  // Base query - memberUserId array me jo IDs hai, un users ko find karo
  let query = {
    _id: { $in: loggedInUser.memberUserId }
  };

  // Search filter
  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$and = [
      { _id: { $in: loggedInUser.memberUserId } },
      {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { mobile_number: searchRegex },
          { address: searchRegex },
          { chapter_name: searchRegex },
          { keywords: searchRegex },
          { "business.product": searchRegex },
          { "business.category": searchRegex },
          { "business.sub_category": searchRegex },
          { "business.business_name": searchRegex },
        ]
      }
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { name: 1 },
    collation: { locale: 'en', strength: 2 },
    select: "name email business profilePic keywords city chapter_name state country mobile_number",
  };

  const users = await models.User.paginate(query, options);

  // Format response data
  const modifiedDocs = users.docs.map((user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    mobile_number: user.mobile_number,
    profilePic: user.profilePic,
    keywords: user.keywords,
    city: user.city,
    chapter_name: user.chapter_name,
    state: user.state,
    country: user.country,
    business_name:
      user.business && user.business.length > 0
        ? user.business[0].business_name
        : null,
    category:
      user.business && user.business.length > 0
        ? user.business[0].category
        : null,
    sub_category:
      user.business && user.business.length > 0
        ? user.business[0].sub_category
        : null,
    address:
      user.business && user.business.length > 0
        ? user.business[0].address
        : null,
  }));

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully!",
    docs: modifiedDocs,
    totalDocs: users.totalDocs,
    limit: users.limit,
    page: users.page,
    totalPages: users.totalPages,
    pagingCounter: users.pagingCounter,
    hasPrevPage: users.hasPrevPage,
    hasNextPage: users.hasNextPage,
    prevPage: users.prevPage,
    nextPage: users.nextPage,
  });
});

export const userController = {
  getAllUsers,
  getUsersCommanData,
  getInsideChapterData,
  addSocialMediaLinkUser,
  getOutsideChapterData,
  getUserById,
  createUser,
  deleteUser,
  deleteDisproveUser,
  getUserByEmail,
  updateUser,
  toggleUserStatus,
  getUserBusinessDetails,
  addBusiness,
  updateBusiness,
  getAllComplaints,
  addComplaint,
  removeComplaint,
  getAllSuggestion,
  addSuggestion,
  removeSuggestion,
  updateBioDetails,
  updateGrowthSheet,
  updateTopProfile,
  updateWeeklyPresentation,
  getNearbyUsers,
  getPublicProfile,
  getAllUsersData,
  getFeesByUserId,
  getAuthenticatedUserIds,
  getUserByMemberUserId
}