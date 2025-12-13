import { models } from "../../models/zindex.js";
import { notificationController } from "./notification.controller.js";
import { leaderboardController } from "./leaderboard.controller.js";
import asyncHandler from 'express-async-handler';
import mongoose from "mongoose";
import { response } from "../../utils/response.js";
const getAllOneToOne =asyncHandler( async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, memberId, date, chapter_name, startDate, endDate } =
      req.query;

 
    let query = {};

    if (search) {
      query.$or = [
        { meet_place: new RegExp(search, "i") },
        { topics: new RegExp(search, "i") },
      ];
    }

    if (memberId) {
      query.$or = [{ memberId1: memberId }, { memberId2: memberId }];
    }

    if (date) {
      query.date = {
        $gte: new Date(date),
        $lt: new Date(date + "T23:59:59.999Z"),
      };
    }

    // Date range filter (on createdAt)
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    // Fetch all OneToOnes matching query (no pagination yet)
    let oneToOneQuery = await models.OneToOne.find(query)
      .populate({
        path: "memberId1",
        select: "name chapter_name profilePic",
      })
      .populate({
        path: "memberId2",
        select: "name chapter_name profilePic",
      })
      .populate({
        path: "initiatedBy",
        select: "name chapter_name profilePic",
      });

    let oneToOnes = await oneToOneQuery.sort({ createdAt: -1 });

    // chapter_name filter (after populate)
    if (chapter_name) {
      const chapterLower = chapter_name.toLowerCase();
      oneToOnes = oneToOnes.filter(
        (record) =>
          record.memberId1 &&
          record.memberId1.chapter_name &&
          record.memberId1.chapter_name.toLowerCase() === chapterLower
      );
    }

    const totalDocs = oneToOnes.length;
    const totalPages = Math.ceil(totalDocs / limit);
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;
    const prevPage = hasPrevPage ? page - 1 : null;
    const nextPage = hasNextPage ? page + 1 : null;

    // Pagination on filtered data
    const paginatedOneToOnes = oneToOnes.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      docs: paginatedOneToOnes,
      totalDocs,
      limit,
      totalPages,
      page,
      hasPrevPage,
      hasNextPage,
      prevPage,
      nextPage,
    });
})

const createOneToOne = asyncHandler(async (req, res) => {

  let photo = "";
  if (req.file && req.file.path) {
    photo = req.file.path.replace(/\\/g, "/");
  }


  const oneToOneData = {
    ...req.body,
    ...(photo && { photo }) 
  };

  const newOneToOne = new models.OneToOne(oneToOneData);
  await newOneToOne.save();

  const { memberId1, memberId2 } = req.body;

  const receiver = await models.User.findById(memberId2).lean();
  if (!receiver) {
    return res.status(404).json({ error: "Receiver not found" });
  }

  const giver = await models.User.findById(memberId1).lean();
  if (!giver) {
    return res.status(404).json({ error: "Giver not found" });
  }

  // Send notification if receiver has FCM token
  if (receiver._id && giver._id) {
    await notificationController.NotificationService.createNotification({
      userId: receiver._id,
      triggeredBy: giver._id,
      title: "New One-to-One Received!",
      type  : "referral",
      relatedEntity: newOneToOne._id, // Add this
      entityType: 'oneToOne' ,// Add this
      description: `${giver.name || "Someone"} has sent you a one-to-one.`,
      type: "one-to-one",
      message: "",
    });
  }

  const pointsHistory = leaderboardController.addPointsHistory(memberId1, "one to one", res);
  leaderboardController.addPointsHistory(memberId2, "one to one", res);

  let message = `One-to-One meeting created successfully`;
  if (pointsHistory.success) {
    message += ` and ${pointsHistory.message}`;
  } else if (!pointsHistory.success && pointsHistory.message) {
    message += ` but ${pointsHistory.message}`;
  }

  return res.status(201).json({
    message,
    oneToOne: newOneToOne,
    success: true,
  });
});
const getInitiated =asyncHandler( async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        {
          path: "memberId1",
          select: "name profilePic",
        },
        {
          path: "memberId2",
          select: "name profilePic",
        },
        {
          path: "initiatedBy",
          select: "name profilePic",
        },
      ],
    };

    const result = await models.OneToOne.paginate({ initiatedBy: userId }, options);

    return res.status(200).json({
      success: true,
      message: "Meetings initiated by user fetched successfully!",
      data: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
      },
    });
})

const getNotInitiated = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        {
          path: "memberId1",
          select: "name profilePic",
        },
        {
          path: "memberId2",
          select: "name profilePic",
        },
        {
          path: "initiatedBy",
          select: "name profilePic",
        },
      ],
    };

    const result = await models.OneToOne.paginate(
      {
        initiatedBy: { $ne: userId },
        $or: [{ memberId1: userId }, { memberId2: userId }],
      },
      options
    );

    return res.status(200).json({
      success: true,
      message: "Meetings not initiated by user fetched successfully!",
      data: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
      },
    });
});

const getOneToOneById = asyncHandler(async (req, res) => {
  const { oneToOneId } = req.body;

  // Validate oneToOneId
  if (!oneToOneId || !mongoose.Types.ObjectId.isValid(oneToOneId)) {
    return response.requiredField("Invalid or missing OneToOne ID", res);
  }

  try {
    const oneToOneData = await models.OneToOne.findById(oneToOneId)
      .populate([
        {
          path: "memberId1",
          select: "name chapter_name profilePic",
          model: "User"
        },
        {
          path: "memberId2",
          select: "name chapter_name profilePic",
          model: "User"
        },
        {
          path: "initiatedBy",
          select: "name profilePic",
          model: "User"
        }
      ])
      .lean();

    if (!oneToOneData) {
      return response.notFound("OneToOne meeting not found", res);
    }

   return response.success("OneToOne meeting fetched successfully", oneToOneData, res);
  } catch (error) {
    console.error("Error fetching OneToOne meeting:", error);
    return response.serverError("Internal server error", res);
  }
});

export const oneToOneController={
    getAllOneToOne,
    createOneToOne,
    getInitiated,
    getNotInitiated,
    getOneToOneById
}