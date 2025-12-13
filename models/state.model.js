import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const schema = new mongoose.Schema({
  name: { type: String, default: "" },
  country_name: { type: String, default: "" },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

schema.plugin(mongoosePaginate);

const State = mongoose.model("State", schema);

export default State;
