
import mongoose from "mongoose";
import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";

const createLeaderboard =asyncHandler( async (req, res) => {
    const newLeaderboard = new models.Leaderboard(req.body);
    const savedLeaderboard = await newLeaderboard.save();

    return response.create('Leaderboard entry created successfully', savedLeaderboard, res);
})

// Get all leaderboard entries with pagination
const getAllLeaderboards = asyncHandler(async (req, res) => {
  const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
  } = req.query;

  // Build filter object for search
  const filter = search
      ? { name: { $regex: search, $options: "i" } }
      : {};

  // Build options for pagination
  const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
  };

  const result = await models.Leaderboard.paginate(filter, options);

  if (!result || result.docs.length === 0) {
      return response.success("No leaderboard entries found", null, res);
  }

  return response.success("Leaderboard entries fetched successfully", result, res);
});

// Get a single leaderboard entry by ID
const getLeaderboardById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const leaderboard = await models.Leaderboard.findById(id);

    if (!leaderboard) {
      return response.success('Leaderboard entry not found',null, res);
    }

    return response.success('Leaderboard entry fetched successfully', leaderboard, res);
})

// Update a leaderboard entry
const updateLeaderboard = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const updatedLeaderboard = await models.Leaderboard.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedLeaderboard) {
      return response.success('Leaderboard entry not found',null, res);
    }

    return response.success('Leaderboard entry updated successfully', updatedLeaderboard, res);
})

// Delete a leaderboard entry
const deleteLeaderboard = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedLeaderboard = await models.Leaderboard.findByIdAndDelete(id);

    if (!deletedLeaderboard) {
      return response.success('Leaderboard entry not found',null, res);
    }

    return response.success('Leaderboard entry deleted successfully', true, res);
})

const addPointsHistory = asyncHandler(async (userId, leaderboardName, customDate = null) => {
  const leaderboardData = await models.Leaderboard.findOne({ name: leaderboardName });
  if (!leaderboardData) {
    return {
      success: false,
      error: "Leaderboard not found"
    };
  }

  const user = await models.User.findById(userId);
  let pointsHistory = await models.PointsHistory.findOne({ userId });

  if (!pointsHistory) {
    pointsHistory = new models.PointsHistory({
      userId,
      points: {},
    });
  }

  const pointsType = leaderboardData.name.replace(/ /g, "_");
  const pointsValue = leaderboardData.point;
  const monthCountLimit = leaderboardData.month_count;

  const allowedTypes = [
    "one_to_one", "referal", "attendance_regular",
    "induction", "visitor", "event_attendance", "testimonial"
  ];

  if (!allowedTypes.includes(pointsType)) {
    return {
      success: false,
      error: "Invalid leaderboard name for points type",
    };
  }

  const pointsArray = pointsHistory.points[pointsType] || [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthEntries = pointsArray.filter((entry) => {
    const entryDate = new Date(entry.createdAt || now);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  }).length;

  if (monthCountLimit > 0 && currentMonthEntries >= monthCountLimit) {
    return {
      success: false,
      message: `Monthly limit reached for ${pointsType}. Max ${monthCountLimit} allowed this month.`,
    };
  }

  if (!pointsHistory.points[pointsType]) {
    pointsHistory.points[pointsType] = [];
  }

  pointsHistory.points[pointsType].push({ value: pointsValue , createdAt: customDate || new Date()});
  await models.PointsHistory.findOneAndUpdate(
    { userId },

    { points: pointsHistory.points },
     
    { new: true }
  );

  user.points = (user.points || 0) + pointsValue;
  await user.save();

  return {
    success: true,
    message: `${pointsValue} Points added successfully`,
    data: {
      point: pointsValue,
      [pointsType]: {
        status: 'present'
      }
    }
  };
});
const addTyfcbPointsHistory =asyncHandler( async (userId, res) => {
    const leaderboardData = await models.Leaderboard.findOne({
      name: "tyfcb",
    });

    if (!leaderboardData) {
     return response.success('Tyfcb leaderboard not found',null, res);
    }

    const user = await models.User.findById(userId);

    let pointsHistory = await models.PointsHistory.findOne({ userId }).lean();
    // Create new pointsHistory doc if doesn't exist
    if (!pointsHistory) {
      pointsHistory = await models.PointsHistory.create({
        userId,
        points: {},
      });
    }

    const pointsType = leaderboardData.name; // e.g. 'tyfca'
    const pointsValue = leaderboardData.point; // e.g. 5
    const monthCountLimit = leaderboardData.month_count; // e.g. 2
    const amount_limit = leaderboardData.amount_limit; // e.g. 20,00,000
    const from_date = new Date(leaderboardData.from_date);
    const to_date = new Date(leaderboardData.to_date);
    to_date.setHours(23, 59, 59, 999);
    const current_date = new Date();

    if (to_date < current_date) {
       return response.conflict('Leaderboard date is expired', res);
    }

    const totalTyfcb = await models.Tyfcbs.aggregate([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: from_date, $lte: to_date },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const totalTyfcbAmount =
      totalTyfcb.length > 0 ? totalTyfcb[0].totalAmount : 0;

    if (totalTyfcbAmount < amount_limit) {
      return response.conflict(
        `Your total tyfcb is still less than ${amount_limit}.`,
        res
      );
    }

    // Get all entries for that pointsType
    const pointsArray = pointsHistory.points[pointsType] || [];

    // is already points is added in specidied time peroid
    const alreadyAdded = pointsArray.some((entry) => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= from_date && entryDate <= to_date;
    });

    if (alreadyAdded) {
       return response.conflict('Points already added for specified time period', res);
    }

    // Push new object to corresponding array
    pointsHistory.points[pointsType].push({ value: pointsValue });
    let overAllPoints = pointsHistory.points;

    await models.PointsHistory.findOneAndUpdate(
      { userId },
      { points: overAllPoints },
      { new: true }
    );

    user.points = (user.points || 0) + pointsValue;
    user.save();
   return response.success(
      `${pointsValue} Points added successfully`,
      { point: leaderboardData.point },
      res
    );
})

const getPointsHistory =asyncHandler( async (req, res) => {
    let { page = 1, limit = 10, chapter_name, year, month, userId } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Prepare match conditions
    const matchConditions = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      matchConditions.userId = new mongoose.Types.ObjectId(userId);
    }

    const aggregationPipeline = [
      // Match by userId if provided
      { $match: matchConditions },

      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // Filter by chapter_name if provided
      ...(chapter_name
        ? [
            {
              $match: {
                "user.chapter_name": { $regex: chapter_name, $options: "i" },
              },
            },
          ]
        : []),

      // Project only necessary fields
      {
        $project: {
          userId: "$user._id",
          name: "$user.name",
          chapter_name: "$user.chapter_name",
          profilePic: "$user.profilePic",
          points: 1,
        },
      },

      // Unwind points keys into documents (to make filtering by createdAt easier)
      {
        $project: {
          userId: 1,
          name: 1,
          chapter_name: 1,
          profilePic: 1,
          pointsArray: {
            $objectToArray: "$points",
          },
        },
      },
      { $unwind: "$pointsArray" }, // { k: "one to one", v: [ {value, createdAt}, ... ] }

      // Unwind inner point arrays
      {
        $unwind: {
          path: "$pointsArray.v",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Optional filtering by month/year
      ...(month || year
        ? [
            {
              $match: {
                ...(year
                  ? {
                      "pointsArray.v.createdAt": {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31T23:59:59.999Z`),
                      },
                    }
                  : {}),
              },
            },
          ]
        : []),

      ...(month
        ? [
            {
              $addFields: {
                monthMatch: { $month: "$pointsArray.v.createdAt" },
              },
            },
            {
              $match: {
                monthMatch: parseInt(month),
              },
            },
          ]
        : []),

      // Group back per user and point category to sum values
      {
        $group: {
          _id: {
            userId: "$userId",
            name: "$name",
            chapter_name: "$chapter_name",
            profilePic: "$profilePic",
            category: "$pointsArray.k",
          },
          totalPoints: { $sum: "$pointsArray.v.value" },
        },
      },

      // Group again to build leaderboardPoints object per user
      {
        $group: {
          _id: {
            userId: "$_id.userId",
            name: "$_id.name",
            chapter_name: "$_id.chapter_name",
            profilePic: "$_id.profilePic",
          },
          pointsByCategory: {
            $push: {
              k: "$_id.category",
              v: "$totalPoints",
            },
          },
        },
      },

      // Format leaderboardPoints object and exclude _id
      {
        $project: {
          _id: 0, // Explicitly exclude _id
          userId: "$_id.userId",
          name: "$_id.name",
          chapter_name: "$_id.chapter_name",
          profilePic: "$_id.profilePic",
          leaderboardPoints: {
            $arrayToObject: "$pointsByCategory",
          },
        },
      },

      // Ensure all categories are always present (even if 0)
      {
        $addFields: {
          "leaderboardPoints.one_to_one": {
            $ifNull: ["$leaderboardPoints.one_to_one", 0],
          },
          "leaderboardPoints.referal": {
            $ifNull: ["$leaderboardPoints.referal", 0],
          },
          "leaderboardPoints.attendance_regular": {
            $ifNull: ["$leaderboardPoints.attendance_regular", 0],
          },
          "leaderboardPoints.induction": {
            $ifNull: ["$leaderboardPoints.induction", 0],
          },
          "leaderboardPoints.visitor": {
            $ifNull: ["$leaderboardPoints.visitor", 0],
          },
          "leaderboardPoints.event_attendance": {
            $ifNull: ["$leaderboardPoints.event_attendance", 0],
          },
        },
      },

      // Sort by total points desc
      {
        $addFields: {
          totalPointsSum: {
            $add: [
              "$leaderboardPoints.one_to_one",
              "$leaderboardPoints.referal",
              "$leaderboardPoints.attendance_regular",
              "$leaderboardPoints.induction",
              "$leaderboardPoints.visitor",
              "$leaderboardPoints.event_attendance",
            ],
          },
        },
      },
      { $sort: { totalPointsSum: -1 } },

      // Facet for pagination
      {
        $facet: {
          docs: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await models.PointsHistory.aggregate(aggregationPipeline);
    const docs = result[0].docs;
    const totalDocs = result[0].totalCount[0]?.count || 0;

    const responseData = {
      docs,
      totalDocs,
      limit,
      totalPages: Math.ceil(totalDocs / limit),
      page,
      hasPrevPage: page > 1,
      hasNextPage: page * limit < totalDocs,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page * limit < totalDocs ? page + 1 : null,
    };

    return response.success('Points history fetched successfully', responseData, res);
})

const getAllPointsHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, fromDate, toDate, chapter_name } = req.body;

  // Optional chapter name filtering
  let chapterFilter = {};
  if (chapter_name) {
    chapterFilter.chapter_name = chapter_name;
  }

  // Create date filter
  let dateFilter = {};
  if (fromDate && toDate) {
    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    dateFilter = {
      $and: [
        { createdAt: { $gte: startDate } },
        { createdAt: { $lte: endDate } }
      ]
    };
  } else if (fromDate) {
    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: startDate } };
  } else if (toDate) {
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);
    dateFilter = { createdAt: { $lte: endDate } };
  }

  // Get all users with optional chapter filter
  const users = await models.User.find(chapterFilter, '_id name profilePic chapter_name');
  const userIds = users.map(user => user._id);

  // Aggregation pipeline (same as yours, but using all userIds)
  const pipeline = [
    {
      $match: {
        userId: { $in: userIds }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: 1,
        name: '$user.name',
        chapter_name: '$user.chapter_name',
        profilePic: '$user.profilePic',
        points: 1
      }
    },
    {
      $project: {
        userId: 1,
        name: 1,
        chapter_name: 1,
        profilePic: 1,
        ...['one_to_one', 'referal', 'attendance_regular', 'induction', 'visitor', 'event_attendance', 'tyfcb', 'testimonial'].reduce((acc, key) => {
          acc[key] = {
            $sum: {
              $map: {
                input: `$points.${key}`,
                as: 'point',
                in: {
                  $cond: [
                    {
                      $and: [
                        fromDate ? { $gte: ['$$point.createdAt', new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
                        toDate ? { $lte: ['$$point.createdAt', new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
                      ]
                    },
                    '$$point.value',
                    0
                  ]
                }
              }
            }
          };
          return acc;
        }, {})
      }
    },
    {
      $addFields: {
        totalPointsSum: {
          $add: [
            '$one_to_one',
            '$referal',
            '$attendance_regular',
            '$induction',
            '$visitor',
            '$event_attendance',
            '$tyfcb',
            '$testimonial'
          ]
        },
        leaderboardPoints: {
          one_to_one: '$one_to_one',
          referal: '$referal',
          attendance_regular: '$attendance_regular',
          induction: '$induction',
          visitor: '$visitor',
          event_attendance: '$event_attendance',
          tyfcb: '$tyfcb',
          testimonial: '$testimonial'
        }
      }
    },
    { $sort: { totalPointsSum: -1, name: 1 } },
    {
      $facet: {
        metadata: [
          { $count: 'totalDocs' },
          {
            $addFields: {
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: {
                $ceil: {
                  $divide: ['$totalDocs', parseInt(limit)]
                }
              }
            }
          }
        ],
        docs: [
          { $skip: (parseInt(page) - 1) * parseInt(limit) },
          { $limit: parseInt(limit) }
        ]
      }
    }
  ];

  const result = await models.PointsHistory.aggregate(pipeline);
  const metadata = result[0].metadata[0] || { totalDocs: 0, totalPages: 0 };

  return response.success('Points history fetched successfully', {
    docs: result[0].docs,
    totalDocs: metadata.totalDocs,
    limit: parseInt(limit),
    totalPages: metadata.totalPages,
    page: parseInt(page),
    hasPrevPage: parseInt(page) > 1,
    hasNextPage: parseInt(page) < metadata.totalPages,
    prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
    nextPage: parseInt(page) < metadata.totalPages ? parseInt(page) + 1 : null
  }, res);
});

export const leaderboardController = {
  createLeaderboard,
  getAllLeaderboards,
  getLeaderboardById,
  updateLeaderboard,
  deleteLeaderboard,
  addPointsHistory,
  addTyfcbPointsHistory,
  getPointsHistory,
  getAllPointsHistory
};
