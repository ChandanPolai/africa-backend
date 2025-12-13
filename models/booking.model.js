// models/podcastBooking.model.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const podcastBookingSchema = new mongoose.Schema({
  slotId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PodcastSlot', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'cancelled'], 
    default: 'pending' 
  },
  adminNotes: { type: String, default: '' },
  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  processedAt: { type: Date }
}, { timestamps: true });

// Index for faster querying
podcastBookingSchema.index({ slotId: 1, userId: 1 }, { unique: true });
podcastBookingSchema.plugin(mongoosePaginate);
podcastBookingSchema.plugin(mongooseAggregatePaginate);

  const PodcastBooking = mongoose.model('PodcastBooking', podcastBookingSchema);

export default PodcastBooking;