import asyncHandler from 'express-async-handler';
import { models } from "../../models/zindex.js";
import { response } from "../../utils/response.js";
import moment from 'moment-timezone';



// Set timezone to IST
moment.tz.setDefault('Asia/Kolkata');

/*const getDataCounts = asyncHandler(async (req, res) => {
    const userCount = await models.User.countDocuments();
    const adminCount = await models.Admin.countDocuments();
    const askCount = await models.Asks.countDocuments();
    const referralCount = await models.Referral.countDocuments();
    const tyfcbCount = await models.Tyfcbs.countDocuments();
    const oneToOneCount = await models.OneToOne.countDocuments();
    const testimonialCount = await models.TestimonialModel.countDocuments();
    const testimonialReqCount = await models.TestimonialRequest.countDocuments();
    const bannerCount = await models.Banner.countDocuments();
    const eventCount = await models.Event.countDocuments();

    const data = {
        users: userCount,
        admins: adminCount,
        asks: askCount,
        referrals: referralCount,
        tyfcbs: tyfcbCount,
        oneToOnes: oneToOneCount,
        testimonials: testimonialCount,
        testimonialReqs: testimonialReqCount,
        banners: bannerCount,
        events: eventCount,
    };

    return response.success("Data counts fetched successfully", data, res);
});*/

const getDataCounts = asyncHandler(async (req, res) => {
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




const getCountsByChapter = asyncHandler(async (req, res) => {
  const { chapterName, timeFilter } = req.body;
  
  // Validate time filter
  const validFilters = ['lastWeek', 'lastMonth', 'allTime'];
  if (!validFilters.includes(timeFilter)) {
    return response.error("Invalid time filter. Must be one of: lastWeek, lastMonth, allTime",500, res);
  }

  // Calculate date ranges based on filter
  let startDate;
  let endDate = moment().endOf('day');
  switch (timeFilter) {
  case 'lastWeek':
    startDate = moment().subtract(1, 'weeks').startOf('day');
    endDate = moment().endOf('day');
    break;

  case 'lastMonth':
    startDate = moment().subtract(1, 'month').startOf('month');
    endDate   = moment().subtract(1, 'month').endOf('month');
    break;

  case 'allTime':
    startDate = moment(0);
    endDate = moment().endOf('day');
    break;
  }

  try {
    // Get all users in the specified chapter
    const chapterUsers = await models.User.find({ chapter_name: chapterName }, '_id');
    const userIds = chapterUsers.map(user => user._id);

    // Get all events for the specified chapter within the time range
    const chapterEvents = await models.Event.find({
      chapter_name: chapterName,
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    }, '_id');
    
    const eventIds = chapterEvents.map(event => event._id);

    // Count referrals
    const referralCount = await models.Referral.countDocuments({
      giver_id: { $in: userIds },
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    });

    // Count TYFCB and calculate total amount
    const tyfcbData = await models.Tyfcbs.aggregate([
      {
        $match: {
          giverId: { $in: userIds },
          createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmountGiven: { $sum: "$amount" }
        }
      }
    ]);

    // Count one-to-one meetings
    const oneToOneCount = await models.OneToOne.countDocuments({
      $or: [
        { memberId1: { $in: userIds } },
        { memberId2: { $in: userIds } }
      ],
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    });

    // Count testimonials
    const testimonialCount = await models.TestimonialModel.countDocuments({
      giverId: { $in: userIds },
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    });

    // NEW: Count visitors who attended chapter events (marked as present)
    const visitorCount = await models.Visitor.countDocuments({
      eventId: { $in: eventIds },
      attendanceStatus: 'present',
      createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    });

    // Prepare response
    const result = {
      chapterName,
      timePeriod: {
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD'),
        filter: timeFilter
      },
      counts: {
        referrals: referralCount,
        tyfcb: tyfcbData[0]?.count || 0,
        tyfcbTotalAmount: tyfcbData[0]?.totalAmountGiven || 0,
        oneToOneMeetings: oneToOneCount,
        testimonials: testimonialCount,
        visitors: visitorCount, // NEW: Visitor count added
        totalEvents: chapterEvents.length // NEW: Total events count
      }
    };

    return response.success("Counts retrieved successfully", result, res);
  } catch (error) {
    console.error("Error fetching counts:", error);
    return response.error("Failed to retrieve counts",  500, res);
  }
});




export const getCountController = {
    getDataCounts, getCountsByChapter
};
