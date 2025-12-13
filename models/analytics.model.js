// models/analytics.model.js
import mongoose from 'mongoose';

const dailyAnalyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  userMetrics: {
    newUsers: { type: Number, default: 0 },
    usersByChapter: mongoose.Schema.Types.Mixed, // { "Achiever": 10, "Believer": 5 }
    usersByRegion: mongoose.Schema.Types.Mixed   // { "North": 5, "South": 3 }
  },
  membershipMetrics: {
    newApplications: { type: Number, default: 0 },
    applicationsByChapter: mongoose.Schema.Types.Mixed
  },
  engagementMetrics: {
    newFeeds: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    avgLikesPerFeed: { type: Number, default: 0 },
    avgCommentsPerFeed: { type: Number, default: 0 }
  },
  businessMetrics: {
    newReferrals: { type: Number, default: 0 },
    referralTypes: {
      inside: { type: Number, default: 0 },
      outside: { type: Number, default: 0 }
    },
    newOneToOneMeetings: { type: Number, default: 0 },
    newTestimonials: { type: Number, default: 0 },
    newTYFCBs: { type: Number, default: 0 },
    totalTYFCBAmount: { type: Number, default: 0 },
    avgTYFCBAmount: { type: Number, default: 0 }
  },
  askAndLeadMetrics: {
    newAsks: { type: Number, default: 0 },
    completedAsks: { type: Number, default: 0 },
    newLeads: { type: Number, default: 0 },
    completedLeads: { type: Number, default: 0 }
  },
  loginMetrics: {
    totalLogins: { type: Number, default: 0 },
    loginsByDevice: {
      android: { type: Number, default: 0 },
      ios: { type: Number, default: 0 },
      web: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 }
    },
    uniqueUsers: { type: Number, default: 0 },
    returningUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 }
  },
  visitorMetrics: {
    newVisitors: { type: Number, default: 0 },
    visitorStatus: {
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 }
    },
    visitorPreferences: {
      interested: { type: Number, default: 0 },
      notInterested: { type: Number, default: 0 },
      maybe: { type: Number, default: 0 }
    }
  }
}, { timestamps: true });

const DailyAnalytics = mongoose.model('DailyAnalytics', dailyAnalyticsSchema);

export default DailyAnalytics;