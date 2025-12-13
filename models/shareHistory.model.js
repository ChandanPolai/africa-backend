import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const shareHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        default: ""
    },
    mobile_number: {
        type: String,
        required: true
    },
}, { timestamps: true });

shareHistorySchema.plugin(mongoosePaginate);
shareHistorySchema.plugin(mongooseAggregatePaginate);

const ShareHistory = mongoose.model('ShareHistory', shareHistorySchema);

export default ShareHistory;