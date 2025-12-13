import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const postSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['news', 'event', 'announcement']
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },



    location: { type: String, default: "" },
    mapUrl: { type: String, default: "" },
    venue: { type: String, default: "" }
}, { timestamps: true });

postSchema.plugin(mongoosePaginate);
postSchema.plugin(mongooseAggregatePaginate);

const Post = mongoose.model('posts', postSchema);

export default Post