// models/podcast.model.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import moment from 'moment-timezone';

const podcastSchema = new mongoose.Schema({
  podcasterName: { type: String, required: true },
  podcasterImage: { type: String, required: true },
  aboutPodcaster: { type: String, required: true },
  venue: { type: String, required: true },
  startDate: { 
    type: Date, 
    required: true,
    set: function(date) {
      // Convert to IST when setting
      return moment(date).tz('Asia/Kolkata').startOf('day').toDate();
    }
  },
  endDate: { 
    type: Date, 
    required: true,
    set: function(date) {
      // Convert to IST when setting
      return moment(date).tz('Asia/Kolkata').endOf('day').toDate();
    }
  },

  status: { 
    type: String, 
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], 
    default: 'upcoming' 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

podcastSchema.plugin(mongoosePaginate);

const Podcast = mongoose.model('Podcast', podcastSchema);

export default Podcast;