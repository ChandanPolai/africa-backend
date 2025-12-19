import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";
import mongoose from "mongoose";
// const getUserDataCounts = asyncHandler(async (req, res) => {
//     const { userId } = req.params;
//     const { timeFilter } = req.query; // '6months', '12months', or 'all'

//     if (!userId) {
//         return response.requiredField("User ID is required", res);
//     }

//     // Calculate date range based on filter
//     let dateFilter = {};
//     if (timeFilter === '6months') {
//         const sixMonthsAgo = new Date();
//         sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
//         dateFilter = { createdAt: { $gte: sixMonthsAgo } };
//     } else if (timeFilter === '12months') {
//         const twelveMonthsAgo = new Date();
//         twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
//         dateFilter = { createdAt: { $gte: twelveMonthsAgo } };
//     }
//     // For 'all' or no filter, we don't add any date condition

//     // Common query conditions
//     const baseQuery = (model, userIdField) => ({
//         ...dateFilter,
//         [userIdField]: userId
//     });

//     // Count documents with time filter
//     const referralGiven = await models.Referral.countDocuments(
//         baseQuery(models.Referral, 'giver_id')
//     );

//     const referralReceived = await models.Referral.countDocuments(
//         baseQuery(models.Referral, 'receiver_id')
//     );

//     const oneToOne = await models.OneToOne.countDocuments({
//         ...dateFilter,
//         $or: [{ memberId1: userId }, { memberId2: userId }]
//     });

//     const tyfcbGiven = await models.Tyfcbs.countDocuments(
//         baseQuery(models.Tyfcbs, 'giverId')
//     );

//     const visitorCount = await models.Visitor.countDocuments(
//         baseQuery(models.Visitor, 'refUserId')
//     );

//     return response.success('data found', {
//         data: {
//             referralGiven,
//             referralReceived,
//             oneToOne,
//             tyfcbGiven,
//             visitor: visitorCount,
//             timeFilter: timeFilter || 'all' // Return the filter used
//         }
//     }, res);
// });


// const getUserDataCounts = asyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   const { timeFilter } = req.query; // '7days', '6months', '12months', or 'all'
//   if (!userId) {
//     return response.requiredField("User ID is required", res);
//   }
//   // Calculate date range based on filter
//   let dateFilter = {};
//   if (timeFilter === '7days') {
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//     dateFilter = { createdAt: { $gte: sevenDaysAgo } };
//   } else if (timeFilter === '6months') {
//     const sixMonthsAgo = new Date();
//     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
//     dateFilter = { createdAt: { $gte: sixMonthsAgo } };
//   } else if (timeFilter === '12months') {
//     const twelveMonthsAgo = new Date();
//     twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
//     dateFilter = { createdAt: { $gte: twelveMonthsAgo } };
//   }
//   // Common query conditions
//   const baseQuery = (userIdField) => ({
//     ...dateFilter,
//     [userIdField]: userId
//   });
//   const referralGiven = await models.Referral.countDocuments(baseQuery('giver_id'));
//   const referralReceived = await models.Referral.countDocuments(baseQuery('receiver_id'));
//   const oneToOne = await models.OneToOne.countDocuments({
//     ...dateFilter,
//     $or: [{ memberId1: userId }, { memberId2: userId }]
//   });
//   const visitorCount = await models.Visitor.countDocuments(baseQuery('refUserId'));
//   const testimonialCount = await models.TestimonialModel.countDocuments(baseQuery('receiverId'));
//   console.log(testimonialCount, "testimonialCount");
//   // Calculate total TYFCB amount from all records in the selected time range
//   const tyfcbStats = await models.Tyfcbs.aggregate([
//     {
//       $match: {
//         ...dateFilter,
//         $or: [
//           { giverId: new mongoose.Types.ObjectId(userId) },
//           { receiverId: new mongoose.Types.ObjectId(userId) }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalAmount: { $sum: "$amount" },
//         givenAmount: {
//           $sum: {
//             $cond: [{ $eq: ["$giverId", new mongoose.Types.ObjectId(userId)] }, "$amount", 0]
//           }
//         },
//         receivedAmount: {
//           $sum: {
//             $cond: [{ $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] }, "$amount", 0]
//           }
//         }
//       }
//     }
//   ]);
//   const stats = tyfcbStats[0] || { totalAmount: 0, givenAmount: 0, receivedAmount: 0 };
//   return response.success('data found', {
//     data: {
//       referralGiven,
//       referralReceived, 
//       oneToOne,
//       visitor: visitorCount,
//       tyfcbTotalAmount: stats.totalAmount,
//       tyfcbGiven: stats.givenAmount,
//       tyfcbReceived: stats.receivedAmount,
//       testimonial: testimonialCount,
//       timeFilter: timeFilter || 'all'
//     }
//   }, res);
// });




// const getUserDataCounts = asyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   const { timeFilter } = req.query; // '7days', '6months', '12months', or 'all'
//   if (!userId) {
//     return response.requiredField("User ID is required", res);
//   }
//   // Calculate date range based on filter
//   let dateFilter = {};
//   if (timeFilter === '7days') {
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//     dateFilter = { createdAt: { $gte: sevenDaysAgo } };
//   } else if (timeFilter === '6months') {
//     const sixMonthsAgo = new Date();
//     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
//     dateFilter = { createdAt: { $gte: sixMonthsAgo } };
//   } else if (timeFilter === '12months') {
//     const twelveMonthsAgo = new Date();
//     twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
//     dateFilter = { createdAt: { $gte: twelveMonthsAgo } };
//   }
//   // Common query conditions
//   const baseQuery = (userIdField) => ({
//     ...dateFilter,
//     [userIdField]: userId
//   });
//   const referralGiven = await models.Referral.countDocuments(baseQuery('giver_id'));
//   const referralReceived = await models.Referral.countDocuments(baseQuery('receiver_id'));
//   const oneToOne = await models.OneToOne.countDocuments({
//     ...dateFilter,
//     $or: [{ memberId1: userId }, { memberId2: userId }]
//   });
//   const visitorCount = await models.Visitor.countDocuments(baseQuery('refUserId'));
//   const testimonialCount = await models.TestimonialModel.countDocuments(baseQuery('receiverId'));
//   console.log(testimonialCount, "testimonialCount");
//   // Calculate total TYFCB amount from all records in the selected time range
//   const tyfcbStats = await models.Tyfcbs.aggregate([
//     {
//       $match: {
//         ...dateFilter,
//         $or: [
//           { giverId: new mongoose.Types.ObjectId(userId) },
//           { receiverId: new mongoose.Types.ObjectId(userId) }
//         ]
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalAmount: { $sum: "$amount" },
//         givenAmount: {
//           $sum: {
//             $cond: [{ $eq: ["$giverId", new mongoose.Types.ObjectId(userId)] }, "$amount", 0]
//           }
//         },
//         receivedAmount: {
//           $sum: {
//             $cond: [{ $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] }, "$amount", 0]
//           }
//         }
//       }
//     }
//   ]);
//   const stats = tyfcbStats[0] || { totalAmount: 0, givenAmount: 0, receivedAmount: 0 };
//   return response.success('data found', {
//     data: {
//       referralGiven,
//       referralReceived, 
//       oneToOne,
//       visitor: visitorCount,
//       tyfcbTotalAmount: stats.totalAmount,
//       tyfcbReceived: stats.givenAmount,
//       tyfcbGiven: stats.receivedAmount,
//       testimonial: testimonialCount,
//       timeFilter: timeFilter || 'all'
//     }
//   }, res);
// });



const getUserDataCount = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { timeFilter } = req.query; // 'currentMonth', '7days', '6months', '12months', or 'all'
  
  if (!userId) {
    return response.requiredField("User ID is required", res);
  }

  // Calculate date range based on filter
  let dateFilter = {};
  let currentMonth = null;
  
  if (timeFilter === 'currentMonth') {
    const now = new Date();
    currentMonth = {
      name: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear()
    };
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    dateFilter = { createdAt: { $gte: firstDay, $lte: lastDay } };
  } else if (timeFilter === '7days') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    dateFilter = { createdAt: { $gte: sevenDaysAgo } };
  } else if (timeFilter === '6months') {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    dateFilter = { createdAt: { $gte: sixMonthsAgo } };
  } else if (timeFilter === '12months') {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    dateFilter = { createdAt: { $gte: twelveMonthsAgo } };
  }

  // Common query conditions
  const baseQuery = (userIdField) => ({
    ...dateFilter,
    [userIdField]: userId
  });

  const referralGiven = await models.Referral.countDocuments(baseQuery('giver_id'));
  const referralReceived = await models.Referral.countDocuments(baseQuery('receiver_id'));
  const oneToOne = await models.OneToOne.countDocuments({
    ...dateFilter,
    $or: [{ memberId1: userId }, { memberId2: userId }]
  });
  const visitorCount = await models.Visitor.countDocuments(baseQuery('refUserId'));
  const testimonialCount = await models.TestimonialModel.countDocuments(baseQuery('receiverId'));

  // Calculate total TYFCB amount from all records in the selected time range
  const tyfcbStats = await models.Tyfcbs.aggregate([
    {   
      $match: {
        ...dateFilter,
        $or: [
          { giverId: new mongoose.Types.ObjectId(userId) },
          { receiverId: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        givenAmount: {
          $sum: {
            $cond: [{ $eq: ["$giverId", new mongoose.Types.ObjectId(userId)] }, "$amount", 0]
          }
        },
        receivedAmount: {
          $sum: {
            $cond: [{ $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] }, "$amount", 0]
          }
        }
      }
    }
  ]);

  const stats = tyfcbStats[0] || { totalAmount: 0, givenAmount: 0, receivedAmount: 0 };

  return response.success('data found', {
    data: {
      referralGiven,
      referralReceived, 
      oneToOne,
      visitor: visitorCount,
      tyfcbTotalAmount: stats.totalAmount,
      tyfcbGiven: stats.givenAmount,
      tyfcbReceived: stats.receivedAmount,
      testimonial: testimonialCount,
      timeFilter: timeFilter || 'all',
      currentMonth // Will be null if not currentMonth filter
    }
  }, res);
});




const getUserDataCounts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { timeFilter } = req.query; // 'currentMonth', '7days', '6months', '12months', or 'all'
  
  if (!userId) {
    return response.requiredField("User ID is required", res);
  }

  // Calculate date range based on filter
  let dateFilter = {};
  let currentMonth = null;
  
  if (timeFilter === 'currentMonth') {
    const now = new Date();
    currentMonth = {
      name: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear()
    };
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    dateFilter = { createdAt: { $gte: firstDay, $lte: lastDay } };
  } else if (timeFilter === '7days') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    dateFilter = { createdAt: { $gte: sevenDaysAgo } };
  } else if (timeFilter === '6months') {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    dateFilter = { createdAt: { $gte: sixMonthsAgo } };
  } else if (timeFilter === '12months') {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    dateFilter = { createdAt: { $gte: twelveMonthsAgo } };
  }

  // Common query conditions
  const baseQuery = (userIdField) => ({
    ...dateFilter,
    [userIdField]: userId
  });

  const referralGiven = await models.Referral.countDocuments(baseQuery('giver_id'));
  const referralReceived = await models.Referral.countDocuments(baseQuery('receiver_id'));
  const oneToOne = await models.OneToOne.countDocuments({
    ...dateFilter,
    $or: [{ memberId1: userId }, { memberId2: userId }]
  });
  const visitorCount = await models.Visitor.countDocuments(baseQuery('refUserId'));
  const testimonialCount = await models.TestimonialModel.countDocuments(baseQuery('receiverId'));

  // Calculate total TYFCB amount from all records in the selected time range
  const tyfcbStats = await models.Tyfcbs.aggregate([
    {   
      $match: {
        ...dateFilter,
        $or: [
          { giverId: new mongoose.Types.ObjectId(userId) },
          { receiverId: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        givenAmount: {
          $sum: {
            $cond: [{ $eq: ["$giverId", new mongoose.Types.ObjectId(userId)] }, "$amount", 0]
          }
        },
        receivedAmount: {
          $sum: {
            $cond: [{ $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] }, "$amount", 0]
          }
        }
      }
    }
  ]);

  const stats = tyfcbStats[0] || { totalAmount: 0, givenAmount: 0, receivedAmount: 0 };

  return response.success('data found', {
    data: {
      referralGiven,
      referralReceived, 
      oneToOne,
      visitor: visitorCount,
      tyfcbTotalAmount: stats.totalAmount,
      tyfcbGiven: stats.givenAmount,
      tyfcbReceived: stats.receivedAmount,
      testimonial: testimonialCount,
      timeFilter: timeFilter || 'all',
      currentMonth // Will be null if not currentMonth filter
    }
  }, res);
});

const getUserDataCountsDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { timeFilter } = req.query; // 'currentMonth', '7days', '6months', '12months', or 'all'

  if (!userId) {
    return response.requiredField("User ID is required", res);
  }

  // Calculate date range based on filter
  let dateFilter = {};
  let currentMonth = null;

  if (timeFilter === 'currentMonth') {
    const now = new Date();
    currentMonth = {
      name: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear()
    };
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    dateFilter = { createdAt: { $gte: firstDay, $lte: lastDay } };
  } else if (timeFilter === '7days') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    dateFilter = { createdAt: { $gte: sevenDaysAgo } };
  } else if (timeFilter === '6months') {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    dateFilter = { createdAt: { $gte: sixMonthsAgo } };
  } else if (timeFilter === '12months') {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    dateFilter = { createdAt: { $gte: twelveMonthsAgo } };
  }

  // Common query conditions
  const baseQuery = (userIdField) => ({
    ...dateFilter,
    [userIdField]: userId
  });

  // Get detailed referral data
  const referralGiven = await models.Referral.find(baseQuery('giver_id'))
    .populate('receiver_id', 'name email profileImage')
    .lean();

  const referralReceived = await models.Referral.find(baseQuery('receiver_id'))
    .populate('giver_id', 'name email profileImage')
    .lean();

  // Get detailed one-to-one data
  const oneToOne = await models.OneToOne.find({
    ...dateFilter,
    $or: [{ memberId1: userId }, { memberId2: userId }]
  })
    .populate('memberId1', 'name email profileImage')
    .populate('memberId2', 'name email profileImage')
    .populate('initiatedBy', 'name email profileImage')
    .lean();

  // Get detailed visitor data
  const visitors = await models.Visitor.find(baseQuery('refUserId'))
    // .populate('userId', 'name email profileImage')
    .lean();

  // Get detailed testimonial data
  const testimonials = await models.TestimonialModel.find(baseQuery('receiverId'))
    .populate('giverId', 'name email profileImage')
    .lean();

  // Get detailed TYFCB data
  const tyfcbGiven = await models.Tyfcbs.find({
    ...dateFilter,
    giverId: userId
  })
    .populate('receiverId', 'name email profileImage')
    .populate('referralId')
    .lean();

  const tyfcbReceived = await models.Tyfcbs.find({
    ...dateFilter,
    receiverId: userId
  })
    .populate('giverId', 'name email profileImage')
    .populate('referralId')
    .lean();

  // Calculate TYFCB totals
  const tyfcbStats = {
    totalAmount: tyfcbGiven.reduce((sum, item) => sum + item.amount, 0) +
      tyfcbReceived.reduce((sum, item) => sum + item.amount, 0),
    givenAmount: tyfcbGiven.reduce((sum, item) => sum + item.amount, 0),
    receivedAmount: tyfcbReceived.reduce((sum, item) => sum + item.amount, 0)
  };

  return response.success('data found', {
    data: {
      referrals: {
        given: referralGiven,
        received: referralReceived,
        count: {
          given: referralGiven.length,
          received: referralReceived.length
        }
      },
      oneToOne: {
        details: oneToOne,
        count: oneToOne.length
      },
      visitors: {
        details: visitors,
        count: visitors.length
      },
      testimonials: {
        details: testimonials,
        count: testimonials.length
      },
      tyfcb: {
        given: tyfcbGiven,
        received: tyfcbReceived,
        totals: {
          totalAmount: tyfcbStats.totalAmount,
          givenAmount: tyfcbStats.givenAmount,
          receivedAmount: tyfcbStats.receivedAmount
        }
      },
      timeFilter: timeFilter || 'all',
      currentMonth // Will be null if not currentMonth filter
    }
  }, res);
});
const getNextNearestEvent = asyncHandler(async (req, res) => {
    const { userId } = req.body;
  
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return response.serverError("Invalid or missing userId", res);
    }
  
    const user = await models.User.findById(userId).select("chapter_name");
  
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }
  
    const currentDate = new Date();
  
    const nextEvent = await models.Event.findOne({
      date: { $gt: currentDate },
      chapter_name: user.chapter_name
    })
      .sort({ date: 1 })
      .limit(1);
  
    if (!nextEvent) {
      return res.status(200).json({
        success: false,
        message: "No event found",
        data: null,
      });
    }
  
    const visitorCount = await models.Visitor.countDocuments({ eventId: nextEvent._id });
  
    res.json({
      success: true,
      data: nextEvent,
      visitorCount
    });
  });
  

  // const getNextNearestEvent = asyncHandler(async (req, res) => {
  //   const { userId } = req.body;
  
  //   if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
  //     return response.serverError("Invalid or missing userId", res);
  //   }
  
  //   const user = await models.User.findById(userId).select("chapter_name");
  
  //   if (!user) {
  //     return res.status(404).json({
  //       success: false,
  //       message: "User not found",
  //       data: null,
  //     });
  //   }
  
  //   const currentDate = new Date();
  
  //   const futureEvents = await models.Event.find({
  //     date: { $gt: currentDate },
  //     chapter_name: user.chapter_name
  //   }).sort({ date: 1 }); // Remove limit for all future events
  
  //   if (!futureEvents || futureEvents.length === 0) {
  //     return res.status(200).json({
  //       success: false,
  //       message: "No event found",
  //       data: [],
  //     });
  //   }
  
  //   // Gather visitor counts for each event
  //   const eventsWithVisitorCounts = await Promise.all(
  //     futureEvents.map(async event => {
  //       const visitorCount = await models.Visitor.countDocuments({ eventId: event._id });
  //       return {
  //         ...event.toObject(),
  //         visitorCount
  //       };
  //     })
  //   );
  
  //   res.json({
  //     success: true,
  //     data: eventsWithVisitorCounts
  //   });
  // });

   const getDataCounts = asyncHandler(async (req, res) => {
    // Get userId from token (set by authMiddleware)
    const userId = req.user?.userId;
    console.log("userId", userId);
    
    if (!userId) {
        return response.unauthorized("User not authenticated", res);
    }

    // Find user by userId to check isAdmin
    const user = await models.User.findById(userId).select('isAdmin');
    
    if (!user) {
        return response.success("User not found", null ,res);
    }

    // Check if user is admin
    if (!user.isAdmin) {
        return response.success("You are not authorized to access this data", null, res);
    }

    // If admin exists, return the same data as admin API
    // Extract query parameters
    const { state, city, chapter, fromDate, toDate } = req.query;
    
    const userFilter = {};
    if (state) userFilter.state = state;
    if (city) userFilter.city = city;
    if (chapter) userFilter.chapter_name = chapter;
    
    const dateFilter = {};
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) dateFilter.$lte = new Date(toDate);
    
    // Apply date filter to all relevant models
    if (Object.keys(dateFilter).length > 0) {
        userFilter.createdAt = dateFilter;
    }

    // Get filtered user IDs once to reuse
    let userIds = [];
    if (Object.keys(userFilter).length > 0) {
        userIds = await models.User.find(userFilter).distinct('_id');
    }

    // Count users with filters
    const userCount = await models.User.countDocuments(userFilter);
    
    // Count admins (no location filter as per current model)
    const adminCount = await models.Admin.countDocuments();
    
    // Count asks (no location filter as per current model)
    const askCount = await models.Asks.countDocuments();
    
    // REFERRALS - Count given and received separately
    const referralGivenFilter = {};
    const referralReceivedFilter = {};
    
    if (userIds.length > 0) {
        referralGivenFilter.giver_id = { $in: userIds };
        referralReceivedFilter.receiver_id = { $in: userIds };
    }
    if (Object.keys(dateFilter).length > 0) {
        referralGivenFilter.createdAt = dateFilter;
        referralReceivedFilter.createdAt = dateFilter;
    }
    
    const [referralGivenCount, referralReceivedCount] = await Promise.all([
        models.Referral.countDocuments(referralGivenFilter),
        models.Referral.countDocuments(referralReceivedFilter)
    ]);
    
    // TYFCBs - Count given and received separately
    const tyfcbGivenFilter = {};
    const tyfcbReceivedFilter = {};
    
    if (userIds.length > 0) {
        tyfcbGivenFilter.giverId = { $in: userIds };
        tyfcbReceivedFilter.receiverId = { $in: userIds };
    }
    if (Object.keys(dateFilter).length > 0) {
        tyfcbGivenFilter.createdAt = dateFilter;
        tyfcbReceivedFilter.createdAt = dateFilter;
    }
    
    const [tyfcbGivenCount, tyfcbReceivedCount] = await Promise.all([
        models.Tyfcbs.countDocuments(tyfcbGivenFilter),
        models.Tyfcbs.countDocuments(tyfcbReceivedFilter)
    ]);
    
    // ONE-TO-ONE MEETINGS - Count initiated and participated
    const oneToOneInitiatedFilter = {};
    const oneToOneParticipatedFilter = {};
    
    if (userIds.length > 0) {
        oneToOneInitiatedFilter.memberId1 = { $in: userIds };
        oneToOneParticipatedFilter.memberId2 = { $in: userIds };
    }
    if (Object.keys(dateFilter).length > 0) {
        oneToOneInitiatedFilter.createdAt = dateFilter;
        oneToOneParticipatedFilter.createdAt = dateFilter;
    }
    
    const [oneToOneInitiatedCount, oneToOneParticipatedCount] = await Promise.all([
        models.OneToOne.countDocuments(oneToOneInitiatedFilter),
        models.OneToOne.countDocuments(oneToOneParticipatedFilter)
    ]);
    
    // TESTIMONIALS - Count given and received separately
    const testimonialGivenFilter = {};
    const testimonialReceivedFilter = {};
    
    if (userIds.length > 0) {
        testimonialGivenFilter.giverId = { $in: userIds };
        testimonialReceivedFilter.receiverId = { $in: userIds };
    }
    if (Object.keys(dateFilter).length > 0) {
        testimonialGivenFilter.createdAt = dateFilter;
        testimonialReceivedFilter.createdAt = dateFilter;
    }
    
    const [testimonialGivenCount, testimonialReceivedCount] = await Promise.all([
        models.TestimonialModel.countDocuments(testimonialGivenFilter),
        models.TestimonialModel.countDocuments(testimonialReceivedFilter)
    ]);
    
    // Other counts (no relationship filters)
    const testimonialReqCount = await models.TestimonialRequest.countDocuments();
    const bannerCount = await models.Banner.countDocuments();
    const eventCount = await models.Event.countDocuments();

    const data = {
        users: userCount,
        admins: adminCount,
        asks: askCount,
        
        // Relationship-based counts
        referrals: {
            given: referralGivenCount,
            received: referralReceivedCount,
            total: referralGivenCount + referralReceivedCount
        },
        tyfcbs: {
            given: tyfcbGivenCount,
            received: tyfcbReceivedCount,
            total: tyfcbGivenCount + tyfcbReceivedCount
        },
        oneToOnes: {
            initiated: oneToOneInitiatedCount,
            participated: oneToOneParticipatedCount,
            total: oneToOneInitiatedCount + oneToOneParticipatedCount
        },
        testimonials: {
            given: testimonialGivenCount,
            received: testimonialReceivedCount,
            total: testimonialGivenCount + testimonialReceivedCount
        },
        
        // Other counts
        testimonialReqs: testimonialReqCount,
        banners: bannerCount,
        events: eventCount,
    };
    
    return response.success("Data counts fetched successfully", data, res);
});

// Simple analytics API - Get iOS, Android, and Total users count
const getUserAnalytics = asyncHandler(async (req, res) => {
  try {
    // Count iOS users
    const iosUsers = await models.User.countDocuments({ 
      deviceType: 'ios',
      isActive: true 
    });

    // Count Android users
    const androidUsers = await models.User.countDocuments({ 
      deviceType: 'android',
      isActive: true 
    });

    // Count total active users
    const totalUsers = await models.User.countDocuments({ 
      isActive: true 
    });

    const Application = {
      Image: "https://community.itfuturz.in/images/community.png",
      ApplicationName: "Africa Community",
    }

    return response.success('Analytics data fetched successfully', {
      iosUsers,
      androidUsers,
      totalUsers,
      Application
    }, res);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return response.error('Failed to fetch analytics data', 500, res);
  }
});
    
export const getCOuntController = {
    getNextNearestEvent,
    getUserDataCounts,
  getUserDataCountsDetails,
  getDataCounts,
  getUserAnalytics
}