// controllers/analytics.controller.js
import cron from 'node-cron';
import moment from 'moment-timezone';
import DailyAnalytics from '../../models/analytics.model.js';
import User from '../../models/users.model.js';
import memberApplications from '../../models/memberApplication.m.js';
import OneToOne from '../../models/oneToOne.model.js';
import Testimonial from '../../models/testimonial.model.js';
import Tyfcbs from '../../models/tyfcb.model.js';
import Like from '../../models/likes.model.js';
import Feed from '../../models/feed.model.js';
import Comment from '../../models/comments.model.js';
import Referral from '../../models/referral.model.js';
import Visitor from '../../models/visitor.model.js';
import Ask from '../../models/ask.model.js';

const convertToUTC = (date) => {
  return moment.tz(date, TIMEZONE).utc().toDate();
};


// Constants
const TIMEZONE = 'Asia/Kolkata'; // IST
const CRON_SCHEDULE = '0 3 * * *';
//For testing: '*/1 * * * *' - every minute

// Run every day at 3 AM IST


cron.schedule(CRON_SCHEDULE, async () => {
  try {
    console.log('Running daily analytics job...');
    
    // Get yesterday's date range in IST
    const istYesterday = moment().tz(TIMEZONE).subtract(1, 'day');
    const startOfDay = istYesterday.startOf('day').toDate();
    const endOfDay = istYesterday.endOf('day').toDate();
    
    console.log(`Processing analytics for IST date: ${istYesterday.format('YYYY-MM-DD')}`);
    console.log(`UTC equivalent range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Check if analytics already exists for this date
    const existingAnalytics = await DailyAnalytics.findOne({ 
      date: { 
        $gte: startOfDay, 
        $lte: endOfDay 
      } 
    });
    
    if (existingAnalytics) {
      console.log('Analytics already exists for', istYesterday.format('YYYY-MM-DD'));
      return;
    }

    // 7. LOGIN METRICS (NEW SECTION)
    const loginResults = await User.aggregate([
      {
        $match: {
          lastLogin: {
            $gte: convertToUTC(startOfDay),
            $lte: convertToUTC(endOfDay)
          }
        }
      },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
          users: { $addToSet: '$_id' }
        }
      }
    ]);

    // Calculate login metrics
    const loginsByDevice = { android: 0, ios: 0, web: 0, unknown: 0 };
    let totalLogins = 0;
    let uniqueUserIds = new Set();

    loginResults.forEach(item => {
      const deviceType = item._id || 'unknown';
      if (loginsByDevice.hasOwnProperty(deviceType)) {
        loginsByDevice[deviceType] = item.count;
      }
      totalLogins += item.count;
      
      // Add user IDs to the set for unique count
      item.users.forEach(userId => uniqueUserIds.add(userId.toString()));
    });

    const uniqueUsers = uniqueUserIds.size;

    // Count new vs returning users
    const newUsersToday = await User.countDocuments({
      createdAt: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      },
      lastLogin: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      }
    });

    const returningUsers = Math.max(0, uniqueUsers - newUsersToday);

    // 1. User Metrics (only new users by createdAt)
    const newUsers = await User.countDocuments({
      createdAt: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      }
    });

    // Users by chapter
    const usersByChapter = await User.aggregate([
      { $match: { 
        createdAt: { 
          $gte: convertToUTC(startOfDay), 
          $lte: convertToUTC(endOfDay) 
        } 
      }},
      { $group: {
          _id: '$chapter_name',
          count: { $sum: 1 }
      }}
    ]);

    const usersByChapterObj = {};
    usersByChapter.forEach(item => {
      usersByChapterObj[item._id || 'Unknown'] = item.count;
    });

    // Users by region
    const usersByRegion = await User.aggregate([
      { $match: { 
        createdAt: { 
          $gte: convertToUTC(startOfDay), 
          $lte: convertToUTC(endOfDay) 
        } 
      }},
      { $group: {
          _id: '$region',
          count: { $sum: 1 }
      }}
    ]);

    const usersByRegionObj = {};
    usersByRegion.forEach(item => {
      usersByRegionObj[item._id || 'Unknown'] = item.count;
    });

    // 2. Membership Application Metrics
    const newApplications = await memberApplications.countDocuments({
      createdAt: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      }
    });

    const applicationsByChapter = await memberApplications.aggregate([
      { $match: { 
        createdAt: { 
          $gte: convertToUTC(startOfDay), 
          $lte: convertToUTC(endOfDay) 
        } 
      }},
      { $group: {
          _id: '$chapter',
          count: { $sum: 1 }
      }}
    ]);

    const applicationsByChapterObj = {};
    applicationsByChapter.forEach(item => {
      applicationsByChapterObj[item._id || 'Unknown'] = item.count;
    });

    // 3. Engagement Metrics
    const newFeeds = await Feed.countDocuments({
      createdAt: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      }
    });

    const feedInteractions = await Feed.aggregate([
      { $match: { 
        createdAt: { 
          $gte: convertToUTC(startOfDay), 
          $lte: convertToUTC(endOfDay) 
        } 
      }},
      { $group: {
          _id: null,
          totalLikes: { $sum: '$likeCount' },
          totalComments: { $sum: '$commentCount' },
          count: { $sum: 1 }
      }}
    ]);

    // 4. Business Metrics
    const newReferrals = await Referral.countDocuments({
      createdAt: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      }
    });

    const referralTypes = await Referral.aggregate([
      { $match: { 
        createdAt: { 
          $gte: convertToUTC(startOfDay), 
          $lte: convertToUTC(endOfDay) 
        } 
      }},
      { $group: {
          _id: '$referral_type',
          count: { $sum: 1 }
      }}
    ]);

    const referralTypesObj = {
      inside: 0,
      outside: 0
    };
    referralTypes.forEach(item => {
      if (item._id === 'inside') referralTypesObj.inside = item.count;
      else if (item._id === 'outside') referralTypesObj.outside = item.count;
    });

    const newOneToOneMeetings = await OneToOne.countDocuments({
      createdAt: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      }
    });

    const newTestimonials = await Testimonial.countDocuments({
      createdAt: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      }
    });

    const tyfcbsData = await Tyfcbs.aggregate([
      { $match: { 
        createdAt: { 
          $gte: convertToUTC(startOfDay), 
          $lte: convertToUTC(endOfDay) 
        } 
      }},
      { $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
      }}
    ]);

    // 5. Ask and Lead Metrics
    const newAsks = await Ask.countDocuments({
      createdAt: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      }
    });

    const completedAsks = await Ask.countDocuments({
      'leads.status': 'completed',
      updatedAt: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      }
    });

    const newLeads = await Ask.aggregate([
      { $unwind: '$leads' },
      { $match: { 
        'leads.createdAt': { 
          $gte: convertToUTC(startOfDay), 
          $lte: convertToUTC(endOfDay) 
        } 
      }},
      { $group: {
          _id: null,
          count: { $sum: 1 }
      }}
    ]);

    const completedLeads = await Ask.aggregate([
      { $unwind: '$leads' },
      { $match: { 
        'leads.status': 'completed',
        'leads.createdAt': { 
          $gte: convertToUTC(startOfDay), 
          $lte: convertToUTC(endOfDay) 
        } 
      }},
      { $group: {
          _id: null,
          count: { $sum: 1 }
      }}
    ]);

    // 6. Visitor Metrics
    const newVisitors = await Visitor.countDocuments({
      createdAt: { 
        $gte: convertToUTC(startOfDay), 
        $lte: convertToUTC(endOfDay) 
      }
    });

    const visitorStatus = await Visitor.aggregate([
      { $match: { 
        createdAt: { 
          $gte: convertToUTC(startOfDay), 
          $lte: convertToUTC(endOfDay) 
        } 
      }},
      { $group: {
          _id: '$attendanceStatus',
          count: { $sum: 1 }
      }}
    ]);

    const visitorStatusObj = {
      present: 0,
      absent: 0
    };
    visitorStatus.forEach(item => {
      if (item._id === 'present') visitorStatusObj.present = item.count;
      else if (item._id === 'absent') visitorStatusObj.absent = item.count;
    });

    const visitorPreferences = await Visitor.aggregate([
      { $match: { 
        createdAt: { 
          $gte: convertToUTC(startOfDay), 
          $lte: convertToUTC(endOfDay) 
        } 
      }},
      { $group: {
          _id: '$preferences',
          count: { $sum: 1 }
      }}
    ]);

    const visitorPreferencesObj = {
      interested: 0,
      notInterested: 0,
      maybe: 0
    };
    visitorPreferences.forEach(item => {
      if (item._id === 'Interested') visitorPreferencesObj.interested = item.count;
      else if (item._id === 'Not Interested') visitorPreferencesObj.notInterested = item.count;
      else if (item._id === 'Maybe') visitorPreferencesObj.maybe = item.count;
    });

    // Create the daily analytics record
    await DailyAnalytics.create({
      date: startOfDay, // Storing in local IST time
      userMetrics: {
        newUsers,
        usersByChapter: usersByChapterObj,
        usersByRegion: usersByRegionObj
      },
      membershipMetrics: {
        newApplications,
        applicationsByChapter: applicationsByChapterObj
      },
      engagementMetrics: {
        newFeeds,
        totalLikes: feedInteractions[0]?.totalLikes || 0,
        totalComments: feedInteractions[0]?.totalComments || 0,
        avgLikesPerFeed: feedInteractions[0] ? 
          Math.round(feedInteractions[0].totalLikes / feedInteractions[0].count) : 0,
        avgCommentsPerFeed: feedInteractions[0] ? 
          Math.round(feedInteractions[0].totalComments / feedInteractions[0].count) : 0
      },
      businessMetrics: {
        newReferrals,
        referralTypes: referralTypesObj,
        newOneToOneMeetings,
        newTestimonials,
        newTYFCBs: tyfcbsData[0]?.count || 0,
        totalTYFCBAmount: tyfcbsData[0]?.totalAmount || 0,
        avgTYFCBAmount: tyfcbsData[0] ? 
          Math.round(tyfcbsData[0].totalAmount / tyfcbsData[0].count) : 0
      },
      askAndLeadMetrics: {
        newAsks,
        completedAsks,
        newLeads: newLeads[0]?.count || 0,
        completedLeads: completedLeads[0]?.count || 0
      },
      visitorMetrics: {
        newVisitors,
        visitorStatus: visitorStatusObj,
        visitorPreferences: visitorPreferencesObj
      },
      // ADD LOGIN METRICS
      loginMetrics: {
        totalLogins,
        loginsByDevice,
        uniqueUsers,
        returningUsers,
        newUsers: newUsersToday
      }
    });

    console.log('Daily analytics job completed successfully for', istYesterday.format('YYYY-MM-DD'));
  } catch (err) {
    console.error('Error in daily analytics job:', err);
    // Consider adding error notification here
  }
});
  // API endpoint to get analytics (timezone-aware)
  export const getDailyAnalytics = async (req, res) => {
    try {
      const { date, timezone = TIMEZONE } = req.body;
      let query = {};
      
      if (date) {
        // Parse the requested date in the specified timezone
        const localDate = moment.tz(date, 'YYYY-MM-DD', timezone);
        const startOfDay = localDate.startOf('day').toDate();
        const endOfDay = localDate.endOf('day').toDate();
        
        query.date = { 
          $gte: startOfDay, 
          $lte: endOfDay 
        };
      } else {
        // Default to yesterday in the specified timezone
        const localYesterday = moment().tz(timezone).subtract(1, 'day');
        query.date = { 
          $gte: localYesterday.startOf('day').toDate(),
          $lte: localYesterday.endOf('day').toDate()
        };
      }
      
      const analytics = await DailyAnalytics.findOne(query);
      
      if (!analytics) {
        return res.status(404).json({
          success: false,
          message: `No analytics data found for ${date || 'yesterday'} in timezone ${timezone}`,
          data: null
        });
      }
      
      // Convert dates to local timezone for response
      const localAnalytics = {
        ...analytics.toObject(),
        date: moment(analytics.date).tz(timezone).format('YYYY-MM-DD'),
        createdAt: moment(analytics.createdAt).tz(timezone).format(),
        updatedAt: moment(analytics.updatedAt).tz(timezone).format()
      };
      
      return res.status(200).json({
        success: true,
        message: "Daily analytics data",
        data: localAnalytics
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };
  
  // API endpoint to get analytics with date range
  export const getAnalyticsByDateRange = async (req, res) => {
    try {
      const { startDate, endDate, timezone = TIMEZONE } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Both startDate and endDate are required"
        });
      }
      
      // Parse the requested dates in the specified timezone
      const localStartDate = moment.tz(startDate, 'YYYY-MM-DD', timezone).startOf('day').toDate();
      const localEndDate = moment.tz(endDate, 'YYYY-MM-DD', timezone).endOf('day').toDate();
      
      const analytics = await DailyAnalytics.find({ 
        date: { 
          $gte: localStartDate, 
          $lte: localEndDate 
        } 
      }).sort({ date: 1 });
      
      if (!analytics || analytics.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No analytics data found between ${startDate} and ${endDate} in timezone ${timezone}`,
          data: null
        });
      }
      
      // Convert dates to local timezone for response
      const localAnalytics = analytics.map(item => ({
        ...item.toObject(),
        date: moment(item.date).tz(timezone).format('YYYY-MM-DD'),
        createdAt: moment(item.createdAt).tz(timezone).format(),
        updatedAt: moment(item.updatedAt).tz(timezone).format()
      }));
      
      return res.status(200).json({
        success: true,
        message: "Analytics data for date range",
        data: localAnalytics
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };
  
  // API endpoint to get summary statistics
  export const getAnalyticsSummary = async (req, res) => {
    try {
      const { days = 30, timezone = TIMEZONE } = req.body;
      
      const endDate = moment().tz(timezone).endOf('day').toDate();
      const startDate = moment().tz(timezone).subtract(days, 'days').startOf('day').toDate();
      
      const analytics = await DailyAnalytics.find({ 
        date: { 
          $gte: startDate, 
          $lte: endDate 
        } 
      }).sort({ date: 1 });
      
      if (!analytics || analytics.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No analytics data found for the last ${days} days`,
          data: null
        });
      }
      
      // Calculate summary statistics
      const summary = {
        totalUsers: analytics.reduce((sum, item) => sum + item.userMetrics.newUsers, 0),
        totalApplications: analytics.reduce((sum, item) => sum + item.membershipMetrics.newApplications, 0),
        totalFeeds: analytics.reduce((sum, item) => sum + item.engagementMetrics.newFeeds, 0),
        totalLikes: analytics.reduce((sum, item) => sum + item.engagementMetrics.totalLikes, 0),
        totalComments: analytics.reduce((sum, item) => sum + item.engagementMetrics.totalComments, 0),
        totalReferrals: analytics.reduce((sum, item) => sum + item.businessMetrics.newReferrals, 0),
        totalOneToOne: analytics.reduce((sum, item) => sum + item.businessMetrics.newOneToOneMeetings, 0),
        totalTestimonials: analytics.reduce((sum, item) => sum + item.businessMetrics.newTestimonials, 0),
        totalTYFCBs: analytics.reduce((sum, item) => sum + item.businessMetrics.newTYFCBs, 0),
        totalTYFCBAmount: analytics.reduce((sum, item) => sum + item.businessMetrics.totalTYFCBAmount, 0),
        totalAsks: analytics.reduce((sum, item) => sum + item.askAndLeadMetrics.newAsks, 0),
        totalVisitors: analytics.reduce((sum, item) => sum + item.visitorMetrics.newVisitors, 0),
        dailyAverages: {
          users: Math.round(analytics.reduce((sum, item) => sum + item.userMetrics.newUsers, 0) / analytics.length),
          applications: Math.round(analytics.reduce((sum, item) => sum + item.membershipMetrics.newApplications, 0) / analytics.length),
          feeds: Math.round(analytics.reduce((sum, item) => sum + item.engagementMetrics.newFeeds, 0) / analytics.length)
        }
      };
      
      return res.status(200).json({
        success: true,
        message: `Analytics summary for the last ${days} days`,
        data: {
          summary,
          timeframe: {
            startDate: moment(startDate).tz(timezone).format('YYYY-MM-DD'),
            endDate: moment(endDate).tz(timezone).format('YYYY-MM-DD'),
            days: analytics.length
          }
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };

export const analyticsController = {
    
    getAnalyticsByDateRange,
    getDailyAnalytics,
    getAnalyticsSummary,
    getAnalyticsByDateRange

  }