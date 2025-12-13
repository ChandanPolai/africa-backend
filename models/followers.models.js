import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const followerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User who is following
    followedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User being followed
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

followerSchema.plugin(mongoosePaginate);
followerSchema.plugin(mongooseAggregatePaginate);

const Follower = mongoose.model('followers', followerSchema);
export default Follower