
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const VisitorScannerSchema = new mongoose.Schema({
  name: { type: String, default: "", required: true },
  referBy: { type:String, default: "" },

  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  mobile_number: { type: String, default: "", required: true },
  email: { type: String, default: "" },
  businessCategory: { type: String, default: "" },
  address: { type: String, default: "" },
  pincode: { type: String, default: "" },
  
  createdAt: { type: Date, default: Date.now },
  preferences: {
    type: String,
    enum: ['Interested', 'Not Interested', 'Maybe'],
    default: 'Maybe'
  },
 
});

VisitorScannerSchema.plugin(mongoosePaginate);

const VisitorScanner = mongoose.model('VisitorScanner', VisitorScannerSchema);

export default VisitorScanner;
