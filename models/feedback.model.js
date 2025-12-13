import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    eventId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Event', 
        required: true 
    },
    title: {
        type: String,
        required: false
    },
    details: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'complaint', 'suggestion'],
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

feedbackSchema.plugin(mongoosePaginate);
feedbackSchema.plugin(mongooseAggregatePaginate);

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;