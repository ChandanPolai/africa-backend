import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    default: '',
    required: true,
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

countrySchema.plugin(mongoosePaginate);

const Country = mongoose.model('Country', countrySchema);

export default Country;
