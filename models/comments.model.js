import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentSchema = new mongoose.Schema(
  {
    feedId: { type: mongoose.Schema.Types.ObjectId },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comment: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.plugin(mongoosePaginate);
commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model('comments', commentSchema);

export default Comment;
