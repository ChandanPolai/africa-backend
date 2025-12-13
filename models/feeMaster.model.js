import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const feeMasterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ""
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['monthly', 'quarterly', 'half-yearly', 'annually'],
    required: true
  },
  durationInMonths: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

feeMasterSchema.plugin(mongoosePaginate);

const FeeMaster = mongoose.model('FeeMaster', feeMasterSchema);

export default FeeMaster;