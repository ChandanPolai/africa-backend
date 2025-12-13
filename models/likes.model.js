import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const likeSchema = new mongoose.Schema({
  feedId: { type: mongoose.Schema.Types.ObjectId, ref: 'feeds', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

likeSchema.plugin(mongoosePaginate);
likeSchema.plugin(mongooseAggregatePaginate);

const Like = mongoose.model('Like', likeSchema);

export default Like;
