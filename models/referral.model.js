import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const referralSchema = new mongoose.Schema({
  giver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referral_type: { type: String, enum: ['inside', 'outside'], required: true },
  referral_status: {
    told_them_you_would_will: { type: Boolean, default: false },
    given_card: { type: Boolean, default: false },
  },
  referral: { type: String, required: false, trim: true },
  mobile_number: { type: String, required: true, match: /^[0-9]{10}$/ },
  address: { type: String, required: false, trim: true },
  comments: { type: String, default: '', trim: true },
  business_name: { type: String, required: true, trim: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now },
});

referralSchema.plugin(mongoosePaginate);

const Referral = mongoose.model('Referral', referralSchema);

export default Referral;
