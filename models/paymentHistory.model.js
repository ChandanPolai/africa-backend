import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const paymentHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feeMasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeMaster',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  razorpayPaymentId: {
    type: String,
  required: true
  },
  razorpayOrderId: {
    type: String,
    default:""
  },
  razorpaySignature: {
    type: String,
    default: ""
  },
  status: {
   type: Boolean,
    default: false
  },
  receipt: {
    type: String,
    default: ""
  },
  refLink: {
    type: String,
    default: ""
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  isRenewed: {
    type: Boolean,
    default: false
  },
  remarks: {
    type: String,
    default: ""
  }
}, { timestamps: true });

paymentHistorySchema.plugin(mongoosePaginate);

const PaymentHistory = mongoose.model('PaymentHistory', paymentHistorySchema);

export default PaymentHistory;