import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const LinkSchema = new mongoose.Schema({
    url: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: true });

const ImageCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    links: [LinkSchema],
    status: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

ImageCategorySchema.plugin(mongoosePaginate);

const ImageCategory = mongoose.model('ImageCategory', ImageCategorySchema);

export default ImageCategory;

