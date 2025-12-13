import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const leaderboardSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  point: { type: Number, default: 0 },
  month_count: { type: Number, default: 0 },
  amount_limit: { type: Number },
  from_date: { type: Date },
  to_date: { type: Date },
  isDeleted: { type: Boolean, default: false },
});

leaderboardSchema.plugin(mongoosePaginate);

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

export default Leaderboard;
