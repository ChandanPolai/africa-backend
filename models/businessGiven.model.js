import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const businessGivenSchema = new mongoose.Schema({
  giverUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  receiverUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  partnerName: { 
    type: String, 
    required: true 
  },
  chapterName: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  businessCategory: { 
    type: String, 
    required: true 
  },
  businessSubCategory: { 
    type: String, 
    required: true 
  },
  askId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Ask" 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending'
  },
  transactionDate: { 
    type: Date, 
    default: Date.now 
  },
  notes: { 
    type: String 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

businessGivenSchema.plugin(mongoosePaginate);
businessGivenSchema.plugin(mongooseAggregatePaginate);

const BusinessGiven = mongoose.model('BusinessGiven', businessGivenSchema);

export default BusinessGiven;