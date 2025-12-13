import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const userSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  digitalCardLink: {
    type: String, default: ""
  },
  chapter_name: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "" },
  mobile_number: { type: String, default: "" },
  email: { type: String, default: "" },
  date_of_birth: { type: Date, default: null },
  
  marriage_anniversary: { type: Date, default: null },
  profilePic: { type: String, default: "default.jpg" },
  emergency_contact: { type: String, default: "" },
  address: { type: String, default: "" },
  introduction_details: { type: String, default: "" },
  meeting_role: { type: String, default: "" },
  keywords: { type: String, default: "" },
  business: [{
    logo: { type: String, default: "" },
    banner_image: { type: String, default: "" },
    business_name: { type: String, default: "" },
    business_type: { type: String, default: "" },
    primary_business: { type: Boolean, default: false },
    category: { type: String, default: "" },

    sub_category: { type: String, default: "" },
    product: { type: String, default: "" },
    service: { type: String, default: "" },
    formation: { type: String, default: "" },
    establishment: { type: Date, default: "" },
    team_size: { type: Number, default: 0 },
    mobile_number: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    address: { type: String, default: "" },
    about_business_details: { type: String, default: "" }
  }],
  complains: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    details: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
  }],
  suggestions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    details: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
  }],
  bioDetails: {
    yearsInBusiness: { type: String, default: "" },
    previousTypesOfBusiness: { type: String, default: "" },
    spouse: { type: String, default: "" },
    children: { type: String, default: "" },
    pets: { type: String, default: "" },
    hobbies: { type: String, default: "" },
    cityOfResidence: { type: String, default: "" },
    yearInThatCity: { type: String, default: "" },
    myBurningDesire: { type: String, default: "" },
    somethingNoOne: { type: String, default: "" },
    myKeyToSuccess: { type: String, default: "" },
  },
 
  growthSheet: {
    goals: { type: String, default: "" },
    accomplishment: { type: String, default: "" },
    interests: { type: String, default: "" },
    networks: { type: String, default: "" },
    skills: { type: String, default: "" },
  },
  topProfile: {
    idealReferral: { type: String, default: "" },
    topProduct: { type: String, default: "" },
    topProblemSolved: { type: String, default: "" },
    favouriteLgnStory: { type: String, default: "" },
    idealReferralParter: { type: String, default: "" }
  },
  weeklyPresentation: {
    presentation1: { type: String, default: "" },
    presentation2: { type: String, default: "" },
  },
  
  fees: {
    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeMaster'
    },
    total_fee: { type: Number, default: 0 },
    paid_fee: { type: Number, default: 0 },
    pending_fee: { type: Number, default: 0 },
    renewal_fee: { type: Number, default: 0 },
    induction_date: { type: Date, default: Date.now },
    end_date: { type: Date, default: null },
    is_renewed: { type: Boolean, default: false },
    fee_history: [{
      paymentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "PaymentHistory" 
      },
      amount: { type: Number, required: true },
      payment_date: { type: Date, default: Date.now },
      remarks: { type: String, default: "" }
    }]
  },

  SocialMedia: {

    Facebook: { type: String, default: "" },
    Instagram: { type: String, default: "" },
    LinkedIn: { type: String, default: "" },
    Twitter: { type: String, default: "" },
    YouTube: { type: String, default: "" },
    WhatsApp: { type: String, default: "" },


  },
    
  deviceType: { 
    type: String, 
    enum: ['android', 'ios', 'web', 'unknown'], 
    default: 'unknown' 
  },
  latitude: { type: String, default: "" },
  longitude: { type: String, default: "" },
  acc_active: { type: Boolean, default: true },
  paid_fees: { type: Number, default: 0 },
  pending_fees: { type: Number, default: 0 },
  due_date_fees: { type: Date, default: "" },
  points: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verificationCode: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  deviceId: { type: String, default: "" },
  fcm: { type: String, default: "" },
  badges: [{
    badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true },
    assignedAt: { type: Date, default: Date.now },
    //assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Admin who assigned the badge
  }],

  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    default: []
  }],
  blockedByUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    default: []
  }],
  blockCount: { type: Number, default: 0 },
  sponseredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  memberUserId: [{ type: String, default: "" }], // Multiple Member User IDs array

  // Email-based OTP login fields (similar to ND-VIBE)
  otp: { type: String, default: "" },
  otpExpires: { type: Date, default: null },
}, { timestamps: true });

userSchema.plugin(mongoosePaginate);
userSchema.plugin(mongooseAggregatePaginate);

const User = mongoose.model('User', userSchema);

export default User;
