import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const ChapterSchema = new mongoose.Schema({
  name: {
    type: String,
    default: '',
  },
  city_name: {
    type: String,
    default: '',
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ChapterSchema.plugin(mongoosePaginate);

const Chapter = mongoose.model('Chapter', ChapterSchema);

export default Chapter;
  