import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const schema = new mongoose.Schema({
  name: { type: String, default: "" },
  mobile: { type: String, default: "" },
  companyEmailId: { type: String, default: "" },
  companyName: { type: String, default: "" },
  businessMobile: { type: String, default: "" },
  address: { type: String, default: "" },
  keywords: { type: String, default: "" },
  notes: { type: String, default: "" },
  userId: { type: mongoose.Types.ObjectId, default: null },
  frontImage: { type: String, default: null },
  backImage: { type: String, default: null },
  businessType: { type: String, default: "" },
  website: { type: String, default: "" },
}, { timestamps: true });

schema.plugin(mongoosePaginate);

const ScannedBusinessCard = mongoose.model("ScannedBusinessCard", schema);

export default ScannedBusinessCard;
