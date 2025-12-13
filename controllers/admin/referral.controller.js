import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";

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
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of the day
      matchStage.createdAt.$lte = end;
    }
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
    { $sort: {"giver_id.name": 1 } },
    {
      $project: {
        referral_status: 1,
        referral_type: 1,
        referral: 1,
        mobile_number: 1,
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
  return response.success("Referrals fetched successfullnull,y", {
    docs,
    totalDocs,
    limit: pageLimit,
    totalPages: Math.ceil(totalDocs / pageLimit),
    page: pageNum,
    hasPrevPage: pageNum > 1,
    hasNextPage: pageNum * pageLimit < totalDocs,
    prevPage: pageNum > 1 ? pageNum - 1 : null,
    nextPage: pageNum * pageLimit < totalDocs ? pageNum + 1 : null,
  }, res);
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
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of the day
      matchStage.createdAt.$lte = end;
    }
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
  if (!docs.length) return response.success("No Data found",null,res);

  return response.success("Referrals received fetched successfullnull,y", {
    docs,
    totalDocs,
    limit: pageLimit,
    totalPages: Math.ceil(totalDocs / pageLimit),
    page: pageNum,
    hasPrevPage: pageNum > 1,
    hasNextPage: pageNum * pageLimit < totalDocs,
    prevPage: pageNum > 1 ? pageNum - 1 : null,
    nextPage: pageNum * pageLimit < totalDocs ? pageNum + 1 : null,
  }, res);
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

  if (!result.docs.length) return response.success("Data not Found",null,res);

  return response.success("Referrals given by user fetched successfullnull,y", {
    docs: result.docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  }, res);
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

  if (!result.docs.length) return response.success("Data not found",null,res);

  return response.success("Referrals received by user fetched successfullnull,y", {
    docs: result.docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  }, res);
})

export const referralController = {
  getAllReferrals,
  getAllReferralsRecieved,
  getReferralsGivenByUser,
  getReferralsReceivedByUser
}