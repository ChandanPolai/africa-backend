import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


const AttandanceSchema = 

// attendance.js
 new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { 
    type: String, 
    enum: ['present', 'absent'], 
    default: 'present' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
});

// Add pagination plugins
AttandanceSchema.plugin(mongoosePaginate);
AttandanceSchema.plugin(mongooseAggregatePaginate);

const Attandance = mongoose.model('Attandance', AttandanceSchema);

export default Attandance;

