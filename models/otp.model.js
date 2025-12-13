import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
const otpSchema = new mongoose.Schema({
  mobileNo: { type: String, required: true },
  otp: { type: String, required: false },
  name:{type:String, required:false},
  sessionId: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  isSent: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index for faster queries
otpSchema.index({ mobileNo: 1, isUsed: 1, expiresAt: 1 });
otpSchema.plugin(mongoosePaginate);
const OTP = mongoose.model('OTP', otpSchema);


export default OTP;
