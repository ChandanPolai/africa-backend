import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const feedSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who created the feed
  description: { type: String, default: "" },
  images: [{ type: String, default: "" }],
  likeCount: { type: Number, default: 0 },
  title: { type: String, default: "" },
  commentCount: { type: Number, default: 0 },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comments' }],
  relatedEntity: { type: mongoose.Schema.Types.ObjectId }, // Add this field
  entityType: { type: String, default: "" }, // Add this field
  isDeleted: { type: Boolean, default: false }, // Soft delete 
}, { timestamps: true });

feedSchema.plugin(mongoosePaginate);
feedSchema.plugin(mongooseAggregatePaginate);

const Feed = mongoose.model('Feed', feedSchema);

export default Feed;
