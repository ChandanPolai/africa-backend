import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const complaintSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  title: { 
    type: String, 
    default: ""
  },
  details: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String, 
    default: "" 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'resolved', 'rejected'], 
    default: 'pending' 
  },
  category: { 
    type: String, 
    enum: ['general', 'technical', 'account', 'other'], 
    default: 'general' 
  },
  adminResponse: { 
    type: String, 
    default: "" 
  },
  resolvedAt: { 
    type: Date 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

complaintSchema.plugin(mongoosePaginate);
complaintSchema.plugin(mongooseAggregatePaginate);

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;