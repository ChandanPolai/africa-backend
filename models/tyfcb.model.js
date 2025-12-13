import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const TyfcbsSchema = new mongoose.Schema({
  giverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: "Referral", default: null },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: "" },
  referral_type: { type: String, enum: ["Inside", "Outside", "Tier3+"], required: true },
  business_type: { type: String, enum: ["New", "Repeat"], required: true },
  comments: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

TyfcbsSchema.plugin(mongoosePaginate);

const Tyfcbs = mongoose.model("Tyfcbs", TyfcbsSchema);

export default Tyfcbs; 
