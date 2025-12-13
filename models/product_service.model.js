import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const ProductServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    default: '',
  },
  sub_category_name: {
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

ProductServiceSchema.plugin(mongoosePaginate);

const ProductService = mongoose.model('ProductService', ProductServiceSchema);

export default ProductService;