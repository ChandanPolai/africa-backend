import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const suggestionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  details: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['general', 'feature', 'improvement', 'other'], 
    default: 'general' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'implemented', 'rejected'], 
    default: 'pending' 
  },
  adminResponse: { 
    type: String, 
    default: "" 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

suggestionSchema.plugin(mongoosePaginate);
suggestionSchema.plugin(mongooseAggregatePaginate);

const Suggestion = mongoose.model('Suggestion', suggestionSchema);

export default Suggestion;