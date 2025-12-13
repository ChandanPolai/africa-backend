import mongoose from "mongoose";
import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";


// Get all leaderboard entries with pagination
const getAllLeaderboards = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
  };
  const result = await models.Leaderboard.paginate({}, options);
  res.status(200).json({
    success: true,
    message: "Leaderboard entries fetched successfully",
    ...result,
  });
})

// Get a single leaderboard entry by ID
const getLeaderboardById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const leaderboard = await models.Leaderboard.findById(id);

  if (!leaderboard) {
    return res.status(404).json({
      success: false,
      message: "Leaderboard entry not found",
    });
  }

  res.status(200).json({
    success: true,
    data: leaderboard,
  });
})

const addPointsHistory = asyncHandler(async (userId, leaderboardName, res) => {
  const leaderboardData = await models.Leaderboard.findOne({
    name: leaderboardName,
  });

  if (!leaderboardData) {
    return {
      success: false,
      error: "Leaderboard not found",
    };
  }

  const user = await models.User.findById(userId);

  let pointsHistory = await models.PointsHistory.findOne({ userId });

  // Create new pointsHistory doc if doesn't exist
  if (!pointsHistory) {
    pointsHistory = await models.PointsHistory.create({
      userId,
      points: {},
    });
  }

  const pointsType = leaderboardData.name.replace(/ /g, "_"); // e.g. 'one to one'  => 'one_to_one'
  const pointsValue = leaderboardData.point; // e.g. 5
  const monthCountLimit = leaderboardData.month_count; // e.g. 2

  const allowedTypes = [
    "one_to_one",
    "referal",
    "attendance_regular",
    "induction",
    "visitor",
    "event_attendance",
    "testimonial" // Add testimonial to allowed types
  ];

  if (!allowedTypes.includes(pointsType)) {
    return {
      success: false,
      error: "Invalid leaderboard name for points type",
    };
  }

  // Initialize the points array if it doesn't exist
  if (!pointsHistory.points[pointsType]) {
    pointsHistory.points[pointsType] = [];
  }

  // Get current month + year
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  // Count how many entries were added in the current month
  const currentMonthEntries = pointsHistory.points[pointsType].filter((entry) => {
    const entryDate = new Date(entry.createdAt || now);
    return (
      entryDate.getMonth() === currentMonth &&
      entryDate.getFullYear() === currentYear
    );
  }).length;

  // If month_count > 0, enforce limit
  if (monthCountLimit > 0 && currentMonthEntries >= monthCountLimit) {
    return {
      success: false,
      message: `Monthly limit reached for ${pointsType}. You can add maximum ${monthCountLimit} points this month.`,
    };
  }

  // Push new object to corresponding array with createdAt
  pointsHistory.points[pointsType].push({
    value: pointsValue,
    createdAt: new Date()
  });

  await models.PointsHistory.findOneAndUpdate(
    { userId },
    { points: pointsHistory.points },
    { new: true }
  );

  // Update user points
  user.points = (user.points || 0) + pointsValue;
  await user.save();
  
  return {
    success: true,
    message: `${pointsValue} Points added successfully`,
    point: leaderboardData.point,
  };
});

const addTyfcbPointsHistory = asyncHandler(async (userId, res) => {
  const leaderboardData = await models.Leaderboard.findOne({
    name: "tyfcb",
  });

  if (!leaderboardData) {
    return {
      success: false,
      error: "Tyfcb leaderboard not found",
    };
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
    return {
      success: false,
      error: "Leaderboard date is expired",
    };
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
    return {
      success: false,
      error: `your total tyfcb is still less than ${amount_limit}.`,
    };
  }

  // Get all entries for that pointsType
  const pointsArray = pointsHistory.points[pointsType] || [];

  // is already points is added in specidied time peroid
  const alreadyAdded = pointsArray.some((entry) => {
    const entryDate = new Date(entry.createdAt);
    return entryDate >= from_date && entryDate <= to_date;
  });

  if (alreadyAdded) {
    return {
      success: false,
      error: "Points already added for specified time period",
    };
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
  return response.success(`${pointsValue} Points added successfully`, { point: leaderboardData.point }, res);
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


// const getPointsHistory1 = asyncHandler(async (req, res) => {
//   const { userId, page = 1, limit = 10, fromDate, toDate } = req.body;
//   console.log("body", req.body);
  
//   if (!userId) {
//       return response.error("User ID is required",400, res);
//   }

//   // Get user details to extract chapter name
//   const user = await models.User.findById(userId);
//   if (!user) {
//       return response.notFound("User not found", res);
//   }

//   const chapterName = user.chapter_name;
//   if (!chapterName) {
//       return response.badRequest("User doesn't belong to any chapter", res);
//   }

//   // Create precise date filters (including end-of-day time)
//   let dateFilter = {};
//   if (fromDate && toDate) {
//       const startDate = new Date(fromDate);
//       startDate.setHours(0, 0, 0, 0);
      
//       const endDate = new Date(toDate);
//       endDate.setHours(23, 59, 59, 999);
      
//       dateFilter = {
//           $and: [
//               { createdAt: { $gte: startDate } },
//               { createdAt: { $lte: endDate } }
//           ]
//       };
//   } else if (fromDate) {
//       const startDate = new Date(fromDate);
//       startDate.setHours(0, 0, 0, 0);
//       dateFilter = { createdAt: { $gte: startDate } };
//   } else if (toDate) {
//       const endDate = new Date(toDate);
//       endDate.setHours(23, 59, 59, 999);
//       dateFilter = { createdAt: { $lte: endDate } };
//   }

//   // Get all users in the same chapter
//   const chapterUsers = await models.User.find({ chapter_name: chapterName }, '_id name profilePic');
//   const chapterUserIds = chapterUsers.map(user => user._id);

//   // Main aggregation pipeline
//   const pipeline = [
//       {
//           $match: {
//               userId: { $in: chapterUserIds }
//           }
//       },
//       {
//           $lookup: {
//               from: 'users',
//               localField: 'userId',
//               foreignField: '_id',
//               as: 'user'
//           }
//       },
//       {
//           $unwind: '$user'
//       },
//       {
//           $project: {
//               userId: 1,
//               name: '$user.name',
//               chapter_name: '$user.chapter_name',
//               profilePic: '$user.profilePic',
//               points: 1
//           }
//       },
//       {
//           $project: {
//               userId: 1,
//               name: 1,
//               chapter_name: 1,
//               profilePic: 1,
//               one_to_one: {
//                   $sum: {
//                       $map: {
//                           input: "$points.one_to_one",
//                           as: "point",
//                           in: {
//                               $cond: [
//                                   {
//                                       $and: [
//                                           fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
//                                           toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
//                                       ]
//                                   },
//                                   "$$point.value",
//                                   0
//                               ]
//                           }
//                       }
//                   }
//               },
//               referal: {
//                   $sum: {
//                       $map: {
//                           input: "$points.referal",
//                           as: "point",
//                           in: {
//                               $cond: [
//                                   {
//                                       $and: [
//                                           fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
//                                           toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
//                                       ]
//                                   },
//                                   "$$point.value",
//                                   0
//                               ]
//                           }
//                       }
//                   }
//               },
//               attendance_regular: {
//                   $sum: {
//                       $map: {
//                           input: "$points.attendance_regular",
//                           as: "point",
//                           in: {
//                               $cond: [
//                                   {
//                                       $and: [
//                                           fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
//                                           toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
//                                       ]
//                                   },
//                                   "$$point.value",
//                                   0
//                               ]
//                           }
//                       }
//                   }
//               },
//               induction: {
//                   $sum: {
//                       $map: {
//                           input: "$points.induction",
//                           as: "point",
//                           in: {
//                               $cond: [
//                                   {
//                                       $and: [
//                                           fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
//                                           toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
//                                       ]
//                                   },
//                                   "$$point.value",
//                                   0
//                               ]
//                           }
//                       }
//                   }
//               },
//               visitor: {
//                   $sum: {
//                       $map: {
//                           input: "$points.visitor",
//                           as: "point",
//                           in: {
//                               $cond: [
//                                   {
//                                       $and: [
//                                           fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
//                                           toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
//                                       ]
//                                   },
//                                   "$$point.value",
//                                   0
//                               ]
//                           }
//                       }
//                   }
//               },
//               event_attendance: {
//                   $sum: {
//                       $map: {
//                           input: "$points.event_attendance",
//                           as: "point",
//                           in: {
//                               $cond: [
//                                   {
//                                       $and: [
//                                           fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
//                                           toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
//                                       ]
//                                   },
//                                   "$$point.value",
//                                   0
//                               ]
//                           }
//                       }
//                   }
//               },
//               tyfcb: {
//                   $sum: {
//                       $map: {
//                           input: "$points.tyfcb",
//                           as: "point",
//                           in: {
//                               $cond: [
//                                   {
//                                       $and: [
//                                           fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
//                                           toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
//                                       ]
//                                   },
//                                   "$$point.value",
//                                   0
//                               ]
//                           }
//                       }
//                   }
//               },
//               testimonial: {
//                   $sum: {
//                       $map: {
//                           input: "$points.testimonial",
//                           as: "point",
//                           in: {
//                               $cond: [
//                                   {
//                                       $and: [
//                                           fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
//                                           toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
//                                       ]
//                                   },
//                                   "$$point.value",
//                                   0
//                               ]
//                           }
//                       }
//                   }
//               }
//           }
//       },
//       {
//           $addFields: {
//               totalPointsSum: {
//                   $add: [
//                       "$one_to_one",
//                       "$referal",
//                       "$attendance_regular",
//                       "$induction",
//                       "$visitor",
//                       "$event_attendance",
//                       "$tyfcb",
//                       "$testimonial"
//                   ]
//               },
//               leaderboardPoints: {
//                   induction: "$induction",
//                   visitor: "$visitor",
//                   event_attendance: "$event_attendance",
//                   tyfcb: "$tyfcb",
//                   testimonial: "$testimonial",
//                   referal: "$referal",
//                   one_to_one: "$one_to_one",
//                   attendance_regular: "$attendance_regular"
//               }
//           }
//       },
//       {
//           $sort: { 
//               totalPointsSum: -1,  // Primary sort by total points (descending)
//               name: 1             // Secondary sort by name (ascending)
//           }
//       },
//       {
//           $facet: {
//               metadata: [
//                   { $count: "totalDocs" },
//                   { $addFields: { 
//                       page: parseInt(page), 
//                       limit: parseInt(limit),
//                       totalPages: { 
//                           $ceil: { 
//                               $divide: ["$totalDocs", parseInt(limit)] 
//                           } 
//                       }
//                   } }
//               ],
//               docs: [
//                   { $skip: (parseInt(page) - 1) * parseInt(limit) },
//                   { $limit: parseInt(limit) }
//               ]
//           }
//       }
//   ];

//   // Execute aggregation
//   const result = await models.PointsHistory.aggregate(pipeline);

//   // Format the response
//   const metadata = result[0].metadata[0] || { totalDocs: 0, totalPages: 0 };
//   const responseData = {
//       docs: result[0].docs,
//       totalDocs: metadata.totalDocs,
//       limit: parseInt(limit),
//       totalPages: metadata.totalPages,
//       page: parseInt(page),
//       hasPrevPage: parseInt(page) > 1,
//       hasNextPage: parseInt(page) < metadata.totalPages,
//       prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
//       nextPage: parseInt(page) < metadata.totalPages ? parseInt(page) + 1 : null
//   };

//   return response.success("Points history fetched successfully", responseData, res);
// });
const getPointsHistory1 = asyncHandler(async (req, res) => {
  const { userId, page = 1, limit = 10, fromDate, toDate, filter } = req.body;
  
  if (!userId) {
      return response.error("User ID is required",400, res);
  }

  // Get user details to extract chapter name
  const user = await models.User.findById(userId);
  if (!user) {
      return response.notFound("User not found", res);
  }

  const chapterName = user.chapter_name;
  if (!chapterName) {
      return response.badRequest("User doesn't belong to any chapter", res);
  }

  // Create precise date filters
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

  // Get all users in the same chapter
  const chapterUsers = await models.User.find({ chapter_name: chapterName }, '_id name profilePic');
  const chapterUserIds = chapterUsers.map(user => user._id);

  // Build the sort object dynamically based on filter
  let sortField = "totalPointsSum";
  
  if (filter && filter !== 'null' && filter !== '') {
      // Map filter to actual field names
      const filterMap = {
          'one_to_one': 'one_to_one',
          'referal': 'referal', 
          'attendance_regular': 'attendance_regular',
          'induction': 'induction',
          'visitor': 'visitor',
          'event_attendance': 'event_attendance',
          'tyfcb': 'tyfcb',
          'testimonial': 'testimonial'
      };
      
      if (filterMap[filter]) {
          sortField = filterMap[filter];
      }
  }

  // Main aggregation pipeline
  const pipeline = [
      {
          $match: {
              userId: { $in: chapterUserIds }
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
      {
          $unwind: '$user'
      },
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
              one_to_one: {
                  $sum: {
                      $map: {
                          input: "$points.one_to_one",
                          as: "point",
                          in: {
                              $cond: [
                                  {
                                      $and: [
                                          fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
                                          toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
                                      ]
                                  },
                                  "$$point.value",
                                  0
                              ]
                          }
                      }
                  }
              },
              referal: {
                  $sum: {
                      $map: {
                          input: "$points.referal",
                          as: "point",
                          in: {
                              $cond: [
                                  {
                                      $and: [
                                          fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
                                          toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
                                      ]
                                  },
                                  "$$point.value",
                                  0
                              ]
                          }
                      }
                  }
              },
              attendance_regular: {
                  $sum: {
                      $map: {
                          input: "$points.attendance_regular",
                          as: "point",
                          in: {
                              $cond: [
                                  {
                                      $and: [
                                          fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
                                          toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
                                      ]
                                  },
                                  "$$point.value",
                                  0
                              ]
                          }
                      }
                  }
              },
              induction: {
                  $sum: {
                      $map: {
                          input: "$points.induction",
                          as: "point",
                          in: {
                              $cond: [
                                  {
                                      $and: [
                                          fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
                                          toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
                                      ]
                                  },
                                  "$$point.value",
                                  0
                              ]
                          }
                      }
                  }
              },
              visitor: {
                  $sum: {
                      $map: {
                          input: "$points.visitor",
                          as: "point",
                          in: {
                              $cond: [
                                  {
                                      $and: [
                                          fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
                                          toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
                                      ]
                                  },
                                  "$$point.value",
                                  0
                              ]
                          }
                      }
                  }
              },
              event_attendance: {
                  $sum: {
                      $map: {
                          input: "$points.event_attendance",
                          as: "point",
                          in: {
                              $cond: [
                                  {
                                      $and: [
                                          fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
                                          toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
                                      ]
                                  },
                                  "$$point.value",
                                  0
                              ]
                          }
                      }
                  }
              },
              tyfcb: {
                  $sum: {
                      $map: {
                          input: "$points.tyfcb",
                          as: "point",
                          in: {
                              $cond: [
                                  {
                                      $and: [
                                          fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
                                          toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
                                      ]
                                  },
                                  "$$point.value",
                                  0
                              ]
                          }
                      }
                  }
              },
              testimonial: {
                  $sum: {
                      $map: {
                          input: "$points.testimonial",
                          as: "point",
                          in: {
                              $cond: [
                                  {
                                      $and: [
                                          fromDate ? { $gte: ["$$point.createdAt", new Date(new Date(fromDate).setHours(0, 0, 0, 0))] } : true,
                                          toDate ? { $lte: ["$$point.createdAt", new Date(new Date(toDate).setHours(23, 59, 59, 999))] } : true
                                      ]
                                  },
                                  "$$point.value",
                                  0
                              ]
                          }
                      }
                  }
              }
          }
      },
      {
          $addFields: {
              totalPointsSum: {
                  $add: [
                      "$one_to_one",
                      "$referal",
                      "$attendance_regular",
                      "$induction",
                      "$visitor",
                      "$event_attendance",
                      "$tyfcb",
                      "$testimonial"
                  ]
              },
              leaderboardPoints: {
                  induction: "$induction",
                  visitor: "$visitor",
                  event_attendance: "$event_attendance",
                  tyfcb: "$tyfcb",
                  testimonial: "$testimonial",
                  referal: "$referal",
                  one_to_one: "$one_to_one",
                  attendance_regular: "$attendance_regular"
              }
          }
      },
      // Dynamic sorting based on filter
      {
          $sort: { 
              [sortField]: -1,  // Dynamic field name based on filter
              name: 1           // Secondary sort by name
          }
      },
      {
          $facet: {
              metadata: [
                  { $count: "totalDocs" }
              ],
              docs: [
                  { $skip: (parseInt(page) - 1) * parseInt(limit) },
                  { $limit: parseInt(limit) }
              ]
          }
      }
  ];

  // Execute aggregation
  const result = await models.PointsHistory.aggregate(pipeline);

  // Format the response
  const metadata = result[0].metadata[0] || { totalDocs: 0 };
  const totalDocs = metadata.totalDocs || 0;
  const totalPages = Math.ceil(totalDocs / parseInt(limit));
  const currentPage = parseInt(page);
  
  const responseData = {
      docs: result[0].docs,
      totalDocs: totalDocs,
      limit: parseInt(limit),
      totalPages: totalPages,
      page: currentPage,
      hasPrevPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
      nextPage: currentPage < totalPages ? currentPage + 1 : null
  };

  return response.success("Points history fetched successfully", responseData, res);
});

export const leaderboardController = {
  addPointsHistory,
  addTyfcbPointsHistory,
  getLeaderboardById,
  getAllLeaderboards,
  getPointsHistory,
  getPointsHistory1
}