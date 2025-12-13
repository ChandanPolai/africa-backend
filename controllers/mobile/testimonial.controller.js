import { models } from "../../models/zindex.js";
import { notificationController } from "./notification.controller.js";
import { leaderboardController } from "./leaderboard.controller.js";
import asyncHandler from 'express-async-handler';
const getAllTestimonials = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, chapterName, startDate, endDate } = req.query;
  const matchStage = {};
  // Date filters
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
    { $sort: { createdAt: -1 } },
    {
      $project: {
        testimonial: 1,
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

const createTestimonial = asyncHandler(async (req, res) => {
  const { giverId, receiverId, date, message: testimonialMessage } = req.body; // Renamed to testimonialMessage
  const existing = await models.TestimonialModel.findOne({ giverId, receiverId });
  if (existing) {
    return res
      .status(200)
      .json({ message: "You have already given a testimonial to this user", success: true});
  }

  const newTestimonial = new models.TestimonialModel({
    giverId,
    receiverId,
    date,
    message: testimonialMessage, // Using renamed variable
  });

  await newTestimonial.save();

  const receiver = await models.User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({ error: "Receiver not found" });
  }

  const giver = await models.User.findById(giverId);
  if (!giver) {
    return res.status(404).json({ error: "Giver not found" });
  }

  // if (receiver._id && giver._id) {
  //   await notificationController.NotificationService.createNotification({
  //     userId: receiver._id,
  //     triggeredBy: giver._id,
  //     type: "testimonial",
  //     title: "New Testimonial Received!",
  //     description: `${giver.name || "Someone"} has sent you a testimonial`,
  //     message: "",
  //   });
  // }

  if (receiver._id && giver._id) {
    await notificationController.NotificationService.createNotification({
      userId: receiver._id,
      triggeredBy: giver._id,
      type: "testimonial",
      title: "New Testimonial Received!",
      description: `${giver.name || "Someone"} has sent you a testimonial`,
      message: "",
      relatedEntity: newTestimonial._id, // Add this
      entityType: 'testimonial' // Add this
    });
  }

  // Add points functionality
  const pointsHistoryGiver = await leaderboardController.addPointsHistory(giverId, "testimonial", res);
  
  let responseMessage = "Testimonial created successfully"; // Changed variable name
  if (pointsHistoryGiver.success) {
    responseMessage += ` and ${pointsHistoryGiver.message}`;
  } else if (!pointsHistoryGiver.success && pointsHistoryGiver.message) {
    responseMessage += ` but ${pointsHistoryGiver.message}`;
  }

  res.status(201).json({
    message: responseMessage, // Using renamed variable
    testimonial: newTestimonial,
    success: true,
  });
});
const getTestimonialsByReceiverId = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const testimonials = await models.TestimonialModel.find({ receiverId })
    .populate("giverId", "name email profilePic")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await models.TestimonialModel.countDocuments({ receiverId });

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    data: testimonials,
  });
})

const getTestimonialByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
const { page = 1, limit = 10 } = req.query;
const Option= {
  page: parseInt(page),
  limit: parseInt(limit),
  sort: { createdAt: -1 },
  populate: [
    { path: "giverId", select: "name email profilePic chapter_name business" },
    
  ],
};
const testimonials = await models.TestimonialModel.paginate({receiverId: userId }, Option);

  res.status(200).json({
    success: true,
    data: testimonials,
  });
});

const toggleTestimonialSelected = asyncHandler(async (req, res) => {
  const { testimonialId } = req.params;
  const { selected } = req.body;

  const testimonial = await models.TestimonialModel.findByIdAndUpdate(
    testimonialId,
    { selected },
    { new: true }
  );

  if (!testimonial) {
    return res
      .status(404)
      .json({ success: false, message: "Testimonial not found" });
  }

  res.status(200).json({
    success: true,
    message: "Selected status updated",
    data: testimonial,
  });
})

const getTestimonialsByReceiverIdWithSelected = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const testimonials = await models.TestimonialModel.find({ receiverId, selected: true })
    .populate({
      path: "giverId",
      select: "name email profilePic chapter_name business",
      populate: {
        path: "business",
        select: "business_name category" // Select only business_name and category
      }
    })
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
});



const getTestimonialsByReceiverIdWithSelected1 = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const testimonials = await models.TestimonialModel.find({ receiverId, selected: true })
    .populate("giverId", "name email profilePic chapter_name business")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Filter business fields after population
  const filteredData = testimonials.map(testimonial => {
    if (testimonial.giverId?.business) {
      testimonial.giverId.business = testimonial.giverId.business.map(biz => ({
        business_name: biz.business_name,
        business_type: biz.business_type,
        primary_business: biz.primary_business,
      }));
    }
    return testimonial;
  });

  const total = await models.TestimonialModel.countDocuments({
    receiverId,
    selected: true,
  });

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    data: filteredData,
  });
});

const TestimonialById =   asyncHandler (async (req, res) => {
   
  const { testimonialId } = req.params;
  const testimonial = await models.TestimonialModel.findById(testimonialId)
    .populate("giverId", "name email profilePic chapter_name business")
    .populate("receiverId", "name email profilePic chapter_name business");
  if (!testimonial) {
    return res.status(404).json({ success: false, message: "Testimonial not found" });
  }
  res.status(200).json({ success: true, data: testimonial });
}
);



export const tenstimonialController = {
  getAllTestimonials,
  createTestimonial,
  TestimonialById,
  getTestimonialsByReceiverId,
  toggleTestimonialSelected,
  getTestimonialsByReceiverIdWithSelected,
  getTestimonialsByReceiverIdWithSelected1,
  getTestimonialByUserId
}