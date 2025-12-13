  import mongoose from 'mongoose';
  import mongoosePaginate from 'mongoose-paginate-v2';

  const VisitorSchema = new mongoose.Schema({
    name: { type: String, default: "", required: true },
    refUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    digitalCardLink: { type: String, default: "" },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    mobile_number: { type: String, default: "", required: true },
    email: { type: String, default: "" },
    business_name: { type: String, default: "" },
    business_type: { type: String, default: "" },
    address: { type: String, default: "" },
    pincode: { type: String, default: "" },
    fees: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },

    attendanceStatus: {
      type: String,
      enum: ['present', 'absent'],
      default: 'absent'
    },
    preferences: {
      type: String,
      enum: ['Interested', 'Not Interested', 'Maybe'],
      default: 'Maybe'
    },
  
  });

  VisitorSchema.plugin(mongoosePaginate);

  const Visitor = mongoose.model('Visitor', VisitorSchema);

  export default Visitor;
