import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    required: true, // URL or file path to the badge image
  },
 
  
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });
badgeSchema.plugin(mongoosePaginate);
badgeSchema.plugin(mongooseAggregatePaginate);

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;