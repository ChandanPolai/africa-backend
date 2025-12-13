import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoosePaginate from 'mongoose-paginate-v2';

const Testimonial = new mongoose.Schema({
  giverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: "" },
  message: { type: String, default: "", required: true },
  selected: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });
Testimonial.plugin(mongoosePaginate);
Testimonial.plugin(mongooseAggregatePaginate);

const TestimonialModel = mongoose.model("Testimonial", Testimonial);

export default TestimonialModel;
