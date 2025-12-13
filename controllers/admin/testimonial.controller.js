import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";

const getAllTestimonials = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, chapterName, startDate, endDate } = req.query;
  const matchStage = {};

  // Date filters
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) {
      matchStage.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
    }
  }

  const pageNum = parseInt(page, 10);
  const pageLimit = parseInt(limit, 10);
  const skip = (pageNum - 1) * pageLimit;

  const aggregationPipeline = [
    { $match: matchStage },

    // Lookup giverId
    {
      $lookup: {
        from: "users",
        localField: "giverId",
        foreignField: "_id",
        as: "giverId",
      },
    },
    { $unwind: "$giverId" },

    // Lookup receiverId
    {
      $lookup: {
        from: "users",
        localField: "receiverId",
        foreignField: "_id",
        as: "receiverId",
      },
    },
    { $unwind: "$receiverId" },

    // Optional chapter name filter on giver
    ...(chapterName
      ? [{ $match: { "giverId.chapter_name": new RegExp(chapterName, "i") } }]
      : []),

    // ✅ Alphabetical sort by giver name (A → Z)
    { $sort: { "giverId.name": 1 } },

    {
      $project: {
        testimonial: 1,
        date: 1,
        message: 1,
        createdAt: 1,
        giverId: {
          _id: "$giverId._id",
          name: "$giverId.name",
          chapter_name: "$giverId.chapter_name",
          profilePic: "$giverId.profilePic",
        },
        receiverId: {
          _id: "$receiverId._id",
          name: "$receiverId.name",
          chapter_name: "$receiverId.chapter_name",
          profilePic: "$receiverId.profilePic",
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

  const result = await models.TestimonialModel.aggregate(aggregationPipeline);
  const docs = result[0].docs;
  const totalDocs = result[0].totalCount[0]?.count || 0;

  return response.success("Testimonials fetched successfully", {
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
});


const getTestimonialsByReceiverIdWithSelected = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const testimonials = await models.TestimonialModel.find({ receiverId, selected: true })
    .populate("giverId", "name email profilePic chapter_name " )  
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await models.TestimonialModel.countDocuments({
    receiverId,
    selected: true,
  });

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    data: testimonials,
  });
})


export const testimonialController = {
  getAllTestimonials,
  getTestimonialsByReceiverIdWithSelected
}