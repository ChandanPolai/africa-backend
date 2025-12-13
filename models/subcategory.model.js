import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const SubCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    default: '',
  },
  category_name: {
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

SubCategorySchema.plugin(mongoosePaginate);

const SubCategory = mongoose.model('SubCategory', SubCategorySchema);

export default SubCategory;