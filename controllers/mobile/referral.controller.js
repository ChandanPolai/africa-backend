import { models } from "../../models/zindex.js";
import { notificationController } from "./notification.controller.js";
import { leaderboardController } from "./leaderboard.controller.js";
import asyncHandler from 'express-async-handler';
import { response } from '../../utils/response.js';


const createReferral = asyncHandler(async (req, res) => {
  const newReferral = new models.Referral(req.body);
  await newReferral.save();

  const { giver_id, receiver_id, comments, address,  business_name } = req.body;

  const receiver = await models.User.findById(receiver_id);
  if (!receiver) {
    return res.status(404).json({ error: "Receiver not found" });
  }

  const giver = await models.User.findById(giver_id);
  if (!giver) {
    return res.status(404).json({ error: "Receiver not found" });
  }
  if (receiver._id && giver._id) {
    await notificationController.NotificationService.createNotification({
      userId: receiver._id,
      triggeredBy: giver._id,
      title: "New Referral Received!",
      type  : "referral",
      relatedEntity: newReferral._id, // Add this
      entityType: 'referral' ,// Add this
      description: `${giver.name || "Someone"} has sent you a referral.`,
      message: "",
    });
  }

  const pointsHistory = await leaderboardController.addPointsHistory(giver_id, "referal", res);

  let message = `Referral created successfully`;
  if (pointsHistory.success) {
    message += ` and ${pointsHistory.message}`;
  } else if (!pointsHistory.success && pointsHistory.message) {
    message += ` but ${pointsHistory.message}`;
  }

  res.status(201).json({
    message,
    referral: newReferral,
    success: true,
  });
})

const getAllReferrals = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    giverId,
    receiverId,
    referralType,
    referralStatus,
    rating,
    chapterName,
    startDate,
    endDate,
  } = req.query;
  const matchStage = {};
  if (search) {
    matchStage.$or = [
      { referral: new RegExp(search, "i") },
      { comments: new RegExp(search, "i") },
    ];
  }
  if (giverId) matchStage.giver_id = giverId;
  if (receiverId) matchStage.receiver_id = receiverId;
  if (referralType) matchStage.referral_type = referralType;
  if (referralStatus) matchStage[`referral_status.${referralStatus}`] = true;
  if (rating) matchStage.rating = parseFloat(rating);
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  const pageNum = parseInt(page, 10);
  const pageLimit = parseInt(limit, 10);
  const skip = (pageNum - 1) * pageLimit;
  const aggregationPipeline = [
    { $match: matchStage },
    // Lookup giver details
    {
      $lookup: {
        from: "users",
        localField: "giver_id",
        foreignField: "_id",
        as: "giver_id",
      },
    },
    { $unwind: "$giver_id" },
    // Lookup receiver details
    {
      $lookup: {
        from: "users",
        localField: "receiver_id",
        foreignField: "_id",
        as: "receiver_id",
      },
    },
    { $unwind: "$receiver_id" },
    // Filter on giver's chapter name (if specified)
    ...(chapterName
      ? [
        {
          $match: { "giver_id.chapter_name": new RegExp(chapterName, "i") },
        },
      ]
      : []),
    { $sort: { createdAt: -1 } },
    {
      $project: {
        referral_status: 1,
        referral_type: 1,
        referral: 1,
        mobile_number: 1,
        business_name: 1,
        address: 1,
        comments: 1,
        rating: 1,
        createdAt: 1,
        giver_id: {
          _id: "$giver_id._id",
          name: "$giver_id.name",
          chapter_name: "$giver_id.chapter_name",
          profilePic: "$giver_id.profilePic",
        },
        receiver_id: {
          _id: "$receiver_id._id",
          name: "$receiver_id.name",
          chapter_name: "$receiver_id.chapter_name",
          profilePic: "$receiver_id.profilePic",
        },
      },
    },
    {
      $facet: {
        docs: [{ $skip: skip }, { $limit: pageLimit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];
  const result = await models.Referral.aggregate(aggregationPipeline);
  const docs = result[0].docs;
  const totalDocs = result[0].totalCount[0]?.count || 0;
  res.status(200).json({
    success: true,
    docs,
    totalDocs,
    limit: pageLimit,
    totalPages: Math.ceil(totalDocs / pageLimit),
    page: pageNum,
    hasPrevPage: pageNum > 1,
    hasNextPage: pageNum * pageLimit < totalDocs,
    prevPage: pageNum > 1 ? pageNum - 1 : null,
    nextPage: pageNum * pageLimit < totalDocs ? pageNum + 1 : null,
  });
})

const getReferralsGivenByUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: "receiver_id", select: "name email profilePic mobile_number" },
    ],
    sort: { createdAt: -1 },
  };

  const result = await models.Referral.paginate({ giver_id: userId }, options);

  return res.status(200).json({
    success: true,
    message: "Referrals given by user fetched successfully",
    data: result.docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  });
})


const getreferralByReferralId = asyncHandler(async (req, res) => {
  const { referralId } = req.body;

  if (!referralId) {
    return response.requiredField("referralId is required", res);
  }

  const referraldata = await models.Referral.findById(referralId).populate([{
    path: "giver_id",
    select: "name email profilePic mobile_number chapter_name"
  },{path: "receiver_id",
    select: "name email profilePic mobile_number chapter_name"
  }]).lean();
  if (!referraldata) {
    return response.resourceNotAvailable("Referral not found", res);
  }
  return response.success("Referral fetched successfully", referraldata, res);

})

const getReferralsReceivedByUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: "giver_id", select: "name email profilePic mobile_number" },
    ],
    sort: { createdAt: -1 },
  };

  const result = await models.Referral.paginate({ receiver_id: userId }, options);

  return res.status(200).json({
    success: true,
    message: "Referrals received by user fetched successfully",
    data: result.docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  });
})

const getAllReferralsRecieved = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    giverId,
    receiverId,
    referralType,
    referralStatus,
    rating,
    chapterName,
    startDate,
    endDate,
  } = req.query;
  const matchStage = {};
  if (search) {
    matchStage.$or = [
      { referral: new RegExp(search, "i") },
      { comments: new RegExp(search, "i") },
    ];
  }
  if (giverId) matchStage.giver_id = giverId;
  if (receiverId) matchStage.receiver_id = receiverId;
  if (referralType) matchStage.referral_type = referralType;
  if (referralStatus) matchStage[`referral_status.${referralStatus}`] = true;
  if (rating) matchStage.rating = parseFloat(rating);
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  const pageNum = parseInt(page, 10);
  const pageLimit = parseInt(limit, 10);
  const skip = (pageNum - 1) * pageLimit;
  const aggregationPipeline = [
    { $match: matchStage },
    // Lookup giver details
    {
      $lookup: {
        from: "users",
        localField: "giver_id",
        foreignField: "_id",
        as: "giver_id",
      },
    },
    { $unwind: "$giver_id" },
    // Lookup receiver details
    {
      $lookup: {
        from: "users",
        localField: "receiver_id",
        foreignField: "_id",
        as: "receiver_id",
      },
    },
    { $unwind: "$receiver_id" },
    // Filter on giver's chapter name (if specified)
    ...(chapterName
      ? [
        {
          $match: {
            "receiver_id.chapter_name": new RegExp(chapterName, "i"),
          },
        },
      ]
      : []),
    { $sort: { createdAt: -1 } },
    {
      $project: {
        referral_status: 1,
        referral_type: 1,
        referral: 1,
        mobile_number: 1,
        address: 1,
        business_name: 1,
        comments: 1,
        rating: 1,
        createdAt: 1,
        giver_id: {
          _id: "$giver_id._id",
          name: "$giver_id.name",
          chapter_name: "$giver_id.chapter_name",
          profilePic: "$giver_id.profilePic",
        },
        receiver_id: {
          _id: "$receiver_id._id",
          name: "$receiver_id.name",
          chapter_name: "$receiver_id.chapter_name",
          profilePic: "$receiver_id.profilePic",
        },
      },
    },
    {
      $facet: {
        docs: [{ $skip: skip }, { $limit: pageLimit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];
  const result = await models.Referral.aggregate(aggregationPipeline);
  const docs = result[0].docs;
  const totalDocs = result[0].totalCount[0]?.count || 0;
  res.status(200).json({
    success: true,
    docs,
    totalDocs,
    limit: pageLimit,
    totalPages: Math.ceil(totalDocs / pageLimit),
    page: pageNum,
    hasPrevPage: pageNum > 1,
    hasNextPage: pageNum * pageLimit < totalDocs,
    prevPage: pageNum > 1 ? pageNum - 1 : null,
    nextPage: pageNum * pageLimit < totalDocs ? pageNum + 1 : null,
  });
})

const updateReferral = asyncHandler(async (req, res) => {
  const { referralId } = req.params;
  const updatedReferral = await models.Referral.findByIdAndUpdate(
    referralId,
    req.body,
    { new: true }
  );
  if (!updatedReferral) {
    return res.status(404).json({ error: "Referral not found" });
  }
  res.status(200).json({
    message: "Referral updated successfully",
    referral: updatedReferral,
  });
})

const deleteReferral = asyncHandler(async (req, res) => {
  const { referralId } = req.params;

  const deletedReferral = await models.Referral.findByIdAndDelete(referralId);
  if (!deletedReferral) {
    return res.status(404).json({ error: "Referral not found" });
  }
  res.status(200).json({ message: "Referral deleted successfully" });
})

export const referralController = {
  createReferral,
  getAllReferrals,
  getReferralsGivenByUser,
  getReferralsReceivedByUser,
  getAllReferralsRecieved,
  updateReferral,
  deleteReferral,
  getreferralByReferralId,
}