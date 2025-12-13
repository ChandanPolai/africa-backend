import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";
import { notificationController } from "../mobile/notification.controller.js";
import { leaderboardController } from "../mobile/leaderboard.controller.js";
import moment from 'moment-timezone';

const IST = 'Asia/Kolkata'

const getAllTyfcb = asyncHandler(async (req, res) => { 
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const {
    search, 
    giverId,
    receiverId,
    referral_type,
    business_type,
    chapter_name,
    startDate,
    endDate,
  } = req.query;

  // Build base query
  let query = {};

  if (search) {
    query.$or = [{ comments: new RegExp(search, "i") }];
  }
  if (giverId) query.giverId = giverId;
  if (receiverId) query.receiverId = receiverId;
  if (referral_type) query.referral_type = referral_type;
  if (business_type) query.business_type = business_type;

  // Date range filter with moment.js IST
  if (startDate && endDate) {
    const startOfDay = moment.tz(startDate, IST).startOf('day').toDate();
    const endOfDay = moment.tz(endDate, IST).endOf('day').toDate();
    query.createdAt = { $gte: startOfDay, $lte: endOfDay };
  } else if (startDate) {
    const startOfDay = moment.tz(startDate, IST).startOf('day').toDate();
    query.createdAt = { $gte: startOfDay };
  } else if (endDate) {
    const endOfDay = moment.tz(endDate, IST).endOf('day').toDate();
    query.createdAt = { $lte: endOfDay };
  }

  // 🧠 your earlier code had an *extra closing brace here*
  // which broke the async function — we’ve removed it ✅

  // Fetch all TYFCBs matching query
  let tyfcbs = await models.Tyfcbs.find(query).lean()
    .populate({
      path: "giverId",
      select: "name chapter_name profilePic",
    })
    .populate({
      path: "receiverId",
      select: "name chapter_name profilePic",
    })
    .populate({
      path: "referralId",
    });

  if (!tyfcbs || tyfcbs.length === 0) {
    return response.success("No Data found", {
      docs: [],
      totalDocs: 0,
      limit,
      totalPages: 0,
      page,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null
    }, res);
  }

  // Format dates to IST for response
  tyfcbs = tyfcbs.map(record => ({
    ...record,
    createdAtIST: moment.tz(record.createdAt, IST).format('DD MMM YYYY, hh:mm A'),
    updatedAtIST: record.updatedAt ? moment.tz(record.updatedAt, IST).format('DD MMM YYYY, hh:mm A') : null
  }));

  // Sort alphabetically by giver name (A → Z)
  tyfcbs.sort((a, b) => {
    if (!a.giverId?.name) return 1;
    if (!b.giverId?.name) return -1;
    return a.giverId.name.localeCompare(b.giverId.name);
  });

  // chapter_name filter (after populate)
  if (chapter_name) {
    tyfcbs = tyfcbs.filter(
      (record) =>
        record.giverId &&
        record.giverId.chapter_name &&
        record.giverId.chapter_name.toLowerCase() === chapter_name.toLowerCase()
    );
  }

  const totalDocs = tyfcbs.length;
  const totalPages = Math.ceil(totalDocs / limit);
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;
  const prevPage = hasPrevPage ? page - 1 : null;
  const nextPage = hasNextPage ? page + 1 : null;

  // Pagination on filtered + sorted data
  const paginatedTyfcbs = tyfcbs.slice(skip, skip + limit);

  return response.success('Data found', {
    docs: paginatedTyfcbs,
    totalDocs,
    limit,
    totalPages,
    page,
    hasPrevPage,
    hasNextPage,
    prevPage,
    nextPage,
    filters: {
      startDate: startDate ? moment.tz(startDate, IST).format('YYYY-MM-DD') : null,
      endDate: endDate ? moment.tz(endDate, IST).format('YYYY-MM-DD') : null,
      timezone: "IST (Asia/Kolkata)"
    }
  }, res);
});





// controllers/tyfcbController.js - Updated function with moment.js IST time handling
const getUserTyfcbSummary = asyncHandler(async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      chapter_name,
      referral_type,
      business_type,
      groupBy = "giver", // "giver" or "receiver"
      page = 1,
      limit = 10
    } = req.body;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build base query
    let query = {};

    // Date range filter with moment.js IST timezone
    if (startDate && endDate) {
      const startOfDay = moment.tz(startDate, IST).startOf('day').toDate();
      const endOfDay = moment.tz(endDate, IST).endOf('day').toDate();
      
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else if (startDate) {
      const startOfDay = moment.tz(startDate, IST).startOf('day').toDate();
      query.createdAt = { $gte: startOfDay };
    } else if (endDate) {
      const endOfDay = moment.tz(endDate, IST).endOf('day').toDate();
      query.createdAt = { $lte: endOfDay };
    }

    if (referral_type) query.referral_type = referral_type;
    if (business_type) query.business_type = business_type;

    // Fetch TYFCB records with population
    const tyfcbs = await models.Tyfcbs.find(query)
      .populate({
        path: "giverId",
        select: "name chapter_name profilePic",
      })
      .populate({
        path: "receiverId",
        select: "name chapter_name profilePic",
      })
      .lean();

    if (tyfcbs.length === 0) {
      return response.success("No TYFCB records found", {
        summary: {
          totalAmount: 0,
          totalTransactions: 0,
          averageAmount: 0,
          uniqueUsers: 0
        },
        userSummaries: [],
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          totalUsers: 0,
          hasNextPage: false,
          hasPrevPage: false,
          usersPerPage: limitNum
        },
        filters: {
          startDate: startDate ? moment.tz(startDate, IST).format('YYYY-MM-DD') : null,
          endDate: endDate ? moment.tz(endDate, IST).format('YYYY-MM-DD') : null,
          chapter_name: chapter_name || "All chapters",
          referral_type: referral_type || "All types",
          business_type: business_type || "All types",
          groupBy,
          recordCount: 0
        }
      }, res);
    }

    // Filter by chapter if specified
    let filteredTyfcbs = tyfcbs;
    if (chapter_name) {
      filteredTyfcbs = tyfcbs.filter(record => {
        const user = groupBy === "giver" ? record.giverId : record.receiverId;
        return user && user.chapter_name && 
               user.chapter_name.toLowerCase() === chapter_name.toLowerCase();
      });
    }

    // Group by user and calculate totals
    const userSummaryMap = new Map();

    filteredTyfcbs.forEach(record => {
      const user = groupBy === "giver" ? record.giverId : record.receiverId;
      const counterpart = groupBy === "giver" ? record.receiverId : record.giverId;
      
      if (!user) return;

      const userId = user._id.toString();
      
      if (!userSummaryMap.has(userId)) {
        userSummaryMap.set(userId, {
          user: {
            _id: user._id,
            name: user.name,
            chapter_name: user.chapter_name,
            profilePic: user.profilePic
          },
          totalAmount: 0,
          transactionCount: 0,
          firstTransaction: record.createdAt,
          lastTransaction: record.createdAt
        });
      }

      const userSummary = userSummaryMap.get(userId);
      userSummary.totalAmount += record.amount;
      userSummary.transactionCount += 1;
      
      if (new Date(record.createdAt) < new Date(userSummary.firstTransaction)) {
        userSummary.firstTransaction = record.createdAt;
      }
      if (new Date(record.createdAt) > new Date(userSummary.lastTransaction)) {
        userSummary.lastTransaction = record.createdAt;
      }
    });

    // Convert map to array and calculate averages
    let userSummaries = Array.from(userSummaryMap.values()).map(summary => ({
      user: summary.user,
      totalAmount: summary.totalAmount,
      transactionCount: summary.transactionCount,
      averageAmount: summary.totalAmount / summary.transactionCount,
      firstTransaction: moment.tz(summary.firstTransaction, IST).format('DD MMM YYYY'),
      lastTransaction: moment.tz(summary.lastTransaction, IST).format('DD MMM YYYY')
    }));

    // Sort by total amount (descending)
    userSummaries.sort((a, b) => b.totalAmount - a.totalAmount);

    // Calculate overall summary
    const totalAmount = userSummaries.reduce((sum, user) => sum + user.totalAmount, 0);
    const totalTransactions = userSummaries.reduce((sum, user) => sum + user.transactionCount, 0);
    const totalUsers = userSummaries.length;

    // Apply pagination
    const totalPages = Math.ceil(totalUsers / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Get paginated results
    const paginatedUserSummaries = userSummaries.slice(skip, skip + limitNum);

    return response.success("TYFCB summary fetched successfully!", {
      summary: {
        totalAmount,
        totalTransactions,
        averageAmount: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
        uniqueUsers: totalUsers
      },
      userSummaries: paginatedUserSummaries,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        hasNextPage,
        hasPrevPage,
        usersPerPage: limitNum,
        showingUsers: paginatedUserSummaries.length
      },
      filters: {
        startDate: startDate ? moment.tz(startDate, IST).format('YYYY-MM-DD') : "All time",
        endDate: endDate ? moment.tz(endDate, IST).format('YYYY-MM-DD') : "All time",
        chapter_name: chapter_name || "All chapters",
        referral_type: referral_type || "All types",
        business_type: business_type || "All types",
        groupBy,
        recordCount: filteredTyfcbs.length
      }
    }, res);

  } catch (error) {
    console.error("Error fetching TYFCB summary:", error);
    return response.error("Failed to fetch TYFCB summary", 500, res);
  }
});

const createTyfcb = asyncHandler(async (req, res) => {
  const { giverId, receiverId, comments,  amount, referral_type, business_type} = req.body;
  console.log("createTyfcb", req.body);
  const receiver = await models.User.findById(receiverId);
  console.log("receiver", receiver);
  if (!receiver) {
    return res.status(404).json({ error: "Receiver not found" });
  }

 

  const giver = await models.User.findById(giverId);
  console.log("giver", giver);
  if (!giver) {
    return res.status(404).json({ error: "Receiver not found" });
  }

  const newTyfcb =  await models.Tyfcbs.create({
    giverId,
    receiverId,
    comments,
    amount,
   
    referral_type,
    business_type,
  });
  
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
      relatedEntity: giver._id, // Add this
      entityType: 'tyfcb', // Add this
      
      title: "New TYFCB Received!",
      description: `${giver.name || "Someone"} has sent you a TYFCB.`,
      message: "",
    });
  }
  res
    .status(201)
    .json({ message: "TYFCB created successfully", tyfcb: newTyfcb });
})

const deleteTyfcb = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tyfcb = await models.Tyfcbs.findById(id);
  if (!tyfcb) {
    return res.status(404).json({ error: "TYFCB entry not found" });
  }

  await tyfcb.remove();
  res.status(200).json({ message: "TYFCB deleted successfully" });
});

const updateTyfcb = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { giverId, receiverId, comments, amount, referral_type, business_type } = req.body;

  console.log("updateTyfcb", req.body);

  const tyfcb = await models.Tyfcbs.findById(id);
  if (!tyfcb) {
    return res.status(404).json({ error: "TYFCB entry not found" });
  }

  // Optional: Validate receiver & giver if needed
  const receiver = await models.User.findById(receiverId);
  const giver = await models.User.findById(giverId);
  if (!receiver || !giver) {
    return res.status(404).json({ error: "Giver or Receiver not found" });
  }

  tyfcb.giverId = giverId;
  tyfcb.receiverId = receiverId;
  tyfcb.comments = comments;
  tyfcb.amount = amount;
  tyfcb.referral_type = referral_type;
  tyfcb.business_type = business_type;

  await tyfcb.save();

  res.status(200).json({ message: "TYFCB updated successfully", tyfcb });
});


export const tyfcbController = {
  getAllTyfcb,
  createTyfcb,
  updateTyfcb,
  deleteTyfcb,
  getUserTyfcbSummary
}