import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate  from 'mongoose-aggregate-paginate-v2';

const blockedUserSchema = new mongoose.Schema({
    blockerUserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    blockedUserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });


blockedUserSchema.index({ blockerUserId: 1, blockedUserId: 1 }, { unique: true });

blockedUserSchema.plugin(mongoosePaginate);
blockedUserSchema.plugin(mongooseAggregatePaginate);

const blocked = mongoose.model('blocked', blockedUserSchema);

export default blocked;


