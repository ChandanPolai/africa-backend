import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const oneToOneSchema = new mongoose.Schema({
  memberId1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  memberId2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meet_place: { type: String, default: "" },
  photo: { type: String, default: "" },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  date: { type: Date, default: null },
  topics: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

oneToOneSchema.plugin(mongoosePaginate);

const OneToOne = mongoose.model('OneToOne', oneToOneSchema);

export default OneToOne;
