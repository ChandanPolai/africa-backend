

import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

// Address Schema
const AddressSchema = new mongoose.Schema({
  addressLine1: { type: String },
  addressLine2: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String }
});

// Business Reference Schema
const BusinessReferenceSchema = new mongoose.Schema({
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  businessName: { type: String },
  phone: { type: String, match: /^[0-9]{10}$/ },
  email: { type: String, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  relationship: { type: String }
});

// Payment Details Schema
const PaymentSchema = new mongoose.Schema({
  amount: { type: Number, default: 1000 }, // Default event fee
  paymentProof: { type: String, default:"" }, // Path to uploaded file
  paymentDate: { type: Date, default: Date.now }
});

// Main Schema
const memberApplicationSchema = new mongoose.Schema({
  userType: { 
    type: String, 
    enum: ['Visitor', 'Member'], 
    default: 'Member'
  },
  chapter: { 
    type: String, 
    enum: ['Achiever', 'Believer', 'Creator','Dreamer','Elevator', 'GBS Drona', ''], 
    default: '' 
  },
  region: { type: String, default: '' },
  invitedBy: { type: String, required: true },
  visitDate: { type: Date, default: null },
  howHeardAbout: { type: String, default: '' },
  paymentDetails: { type: PaymentSchema, default: {} },
  digitalCard:{
    type: String, default:""
  },
  applicant: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    companyName: { type: String, default: '' },
    industry: { type: String, default: '' },
    professionalClassification: { type: String, default: '' },
    businessAddress: { type: AddressSchema, default: {} },
    email: { type: String, default: '', match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    businessWebsite: { type: String },
    mobileNumber: { 
      type: String, 
      required: true, 
      match: /^[0-9]{10}$/,
      index: true 
    },
    secondaryPhone: { type: String, match: /^[0-9]{10}$/ },
    adhaarNumber: { type: String, default: "", match: /^[0-9]{12}$/ },
    gstNumber: { type: String },
    // NEW FIELDS ADDED HERE
    dateOfBirth: { type: Date },
    spouseName: { type: String, default: '' },
    anniversaryDate: { type: Date, default: null },
    bloodGroup: { type: String, default: '' },
    // END OF NEW FIELDS
    aadhaarPhoto: { type: String },
    livePhoto: { type: String }
  },
  experience: {
    description: { type: String, default: '' },
    lengthOfTime: { type: String, default: '' },
    education: { type: String, default: '' },
    licenseRevoked: { type: String, enum: ['No', 'Yes'], default: 'No' },
    isPrimaryOccupation: { type: String, enum: ['Yes', 'No'], default: 'Yes' }
  },
  standards: {
    commitmentToMeetings: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    commitmentToSubstitute: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    commitmentToReferrals: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    referralAbility: { type: Number, min: 0, max: 10, default: 5 }
  },
  gbsHistory: {
    previousMember: { type: String, enum: ['Yes', 'No'], default: 'No' },
    otherNetworkingOrgs: { type: String, enum: ['Yes', 'No'], default: 'No' }
  },
  references: {
    reference1: { type: BusinessReferenceSchema, default: {} },
    reference2: { type: BusinessReferenceSchema, default: {} },
    informedReferences: { type: Boolean, required: true, default: false }
  },
  termsAccepted: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, default: false },
  eventRegistration: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

memberApplicationSchema.plugin(mongoosePaginate);
memberApplicationSchema.plugin(mongooseAggregatePaginate);

const MemberApplication = mongoose.model('memberApplications', memberApplicationSchema);
export default MemberApplication;