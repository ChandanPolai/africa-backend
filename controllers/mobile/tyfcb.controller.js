import { models } from "../../models/zindex.js";
import { leaderboardController } from "./leaderboard.controller.js";
import { notificationController } from "./notification.controller.js";
import asyncHandler from 'express-async-handler';
import {response} from "../../utils/response.js";
import mongoose from "mongoose";

const createTyfcb = asyncHandler(async (req, res) => {
  const { giverId, receiverId, comments } = req.body;
  const receiver = await models.User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({ error: "Receiver not found" });
  }

  const giver = await models.User.findById(giverId);
  if (!giver) {
    return res.status(404).json({ error: "Receiver not found" });
  }

  const newTyfcb = new models.Tyfcbs(req.body);
  await newTyfcb.save();
  // Send notification if receiver has FCM token
  // if (receiver.fcm) {
  //     await sendNotification(
  //         receiver.fcm,
  //         `New TYFCB Received!`,
  //         `${giver.name || 'Someone'} has sent you a TYFCB.`,
  //     );
  // }

  leaderboardController.addTyfcbPointsHistory(receiverId, res);

  if (receiver._id && giver._id) {
    await notificationController.NotificationService.createNotification({
      userId: receiver._id,
      triggeredBy: giver._id,
      relatedEntity: newTyfcb._id, // Add this
      entityType: 'tyfcb' ,// Add this
      type: "tyfcb",
      title: "New TYFCB Received!",
      description: `${giver.name || "Someone"} has sent you a TYFCB.`,
      message: "",
    });
  }
  res
    .status(201)
    .json({ message: "TYFCB created successfully", tyfcb: newTyfcb });
})

const getTyfcbsByGiverId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: "receiverId", select: "name email profilePic businessName" },
      { path: "referralId" },
    ],
    sort: { createdAt: -1 },
  };

  const result = await models.Tyfcbs.paginate({ giverId: userId }, options);

  res.status(200).json({
    success: true,
    message: "TYFCBs given by user fetched successfully!",
    data: result,
  });
})

const getTyfcbsByReceiverId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: "giverId", select: "name email profilePic businessName" },
      { path: "referralId" },
    ],
    sort: { createdAt: -1 },
  };

  const result = await models.Tyfcbs.paginate({ receiverId: userId }, options);

  res.status(200).json({
    success: true,
    message: "TYFCBs received by user fetched successfully!",
    data: result,
  });
})

const getTyfcbById = asyncHandler(async (req, res) => {
  const { tyfcbId } = req.body;

  if (!tyfcbId || !mongoose.Types.ObjectId.isValid(tyfcbId)) {
    return response.requiredField("Invalid or missing TYFCB ID", res);
  }

  try {
    const tyfcbData = await models.Tyfcbs.findById(tyfcbId)
      .populate([
        {
          path: "giverId",
          select: "name chapter_name profilePic",
          model: "User"
        },
        {
          path: "receiverId",
          select: "name chapter_name profilePic",
          model: "User"
        },
        {
          path: "referralId",
          select: "referral_type referral_status comments rating",
          model: "Referral",
          populate: [
            {
              path: "giver_id",
              select: "name profilePic",
              model: "User"
            },
            {
              path: "receiver_id",
              select: "name profilePic",
              model: "User"
            }
          ]
        }
      ])
      .lean();

    if (!tyfcbData) {
      return response.notFound("TYFCB record not found", res);
    }

    return response.success("TYFCB record fetched successfully", tyfcbData, res);
  } catch (error) {
    console.error("Error fetching TYFCB record:", error);
    return response.serverError("Internal server error", res);
  }
});



export const tyfcbController = {
  createTyfcb,
  getTyfcbsByGiverId,
  getTyfcbsByReceiverId,
  getTyfcbById
}