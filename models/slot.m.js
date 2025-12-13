import mongoose from 'mongoose';
import moment from 'moment-timezone';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const podcastSlotSchema = new mongoose.Schema({
  podcastId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Podcast', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true,
    set: function(date) {
      return moment(date).tz('Asia/Kolkata').startOf('day').toDate();
    },
    get: function(date) {
      return moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD');
    }
  },
  startTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(time) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: props => `${props.value} is not a valid time format (HH:mm)`
    }
  },
  endTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(time) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: props => `${props.value} is not a valid time format (HH:mm)`
    }
  },
  capacity: { type: Number, required: true, min: 1 },
  bookedCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['available', 'booked', 'closed'], 
    default: 'available' 
  },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true,
  toJSON: { getters: true }
});

podcastSlotSchema.index({ podcastId: 1, date: 1, startTime: 1, endTime: 1 }, { unique: true });

podcastSlotSchema.virtual('isFull').get(function() {
  return this.bookedCount >= this.capacity;
});
podcastSlotSchema.plugin(mongoosePaginate);
podcastSlotSchema.plugin(mongooseAggregatePaginate);

const PodcastSlot = mongoose.model('PodcastSlot', podcastSlotSchema);

export default PodcastSlot;