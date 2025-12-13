import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const participationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  preference:{
    type: String,
    enum: ['yes', 'no', 'substitute'],
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

participationSchema.plugin(mongoosePaginate);

const Participation = mongoose.model('Participation', participationSchema);

export default Participation;
