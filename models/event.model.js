import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    default: '',
  },
  event_or_meeting: {
    type: String,
    enum: ['event', 'meeting'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  mode:{
    type: String,
    enum: ['online', 'offline'],
    default: 'offline',
  },
  amount: {
    type: Number,
    default: 0,
  },
  
  startTime: {  
    type: String,
    default: ''
  },
  endTime: {    
    type: String,
    default: ''
  },
  paid: {
    type: Boolean,
    default: false,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  details: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  photos: [{
    type: String,
    default: '',
  }],
  videos: [{
    type: String,
    default: '',
  }],
  mapURL: {
    type: String,
    default: '',
  },

  location: {
    type: String,
    default: '',
  },
  chapter_name: {
    type: String,
    default: '',
  },
}, { timestamps: true });
eventSchema.plugin(mongoosePaginate);
eventSchema.plugin(mongooseAggregatePaginate);

const Event = mongoose.model('Event', eventSchema);export default Event;