import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const CitySchema = new mongoose.Schema({
  name: {
    type: String,
    default: '',
  },
  state_name: {
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

CitySchema.plugin(mongoosePaginate);

const City = mongoose.model('City', CitySchema);

export default City;
