import mongoose from 'mongoose';

const TestimonialRequestSchema = new mongoose.Schema({
  giverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, default: "" },
  requested: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const TestimonialRequest = mongoose.model("TestimonialRequest", TestimonialRequestSchema);

export default TestimonialRequest;
