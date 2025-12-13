import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate  from 'mongoose-aggregate-paginate-v2';


const  reportSchema = new mongoose.Schema({
    reporterId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users', 
        required: true 
    },
    reportedItemType: { 
        type: String, 
        required: true,
        enum: ['profile', 'feed'] 
    },
    reportedItemId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        refPath: 'reportedItemType' 
    },
    reason: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: "" 
    },
    status: { 
        type: String, 
        default: 'pending',
        enum: ['pending', 'reviewed', 'resolved', 'rejected'] 
    },
    adminComment: { 
        type: String, 
        default: "" 
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

reportSchema.plugin(mongoosePaginate);
reportSchema.plugin(mongooseAggregatePaginate);

const report = mongoose.model('report', reportSchema);

export default report;

