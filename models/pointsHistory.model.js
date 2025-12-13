import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const pointsHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: '' },
  points: {
    one_to_one: [
      { value: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } },
    ],
    referal: [
      { value: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } },
    ],
    attendance_regular: [
      { value: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } },
    ],
    induction: [
      { value: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } },
    ],
    visitor: [
      { value: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } },
    ],
    event_attendance: [
      { value: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } },
    ],
    tyfcb: [
      { value: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } },
    ],
  },
});

pointsHistorySchema.plugin(mongoosePaginate);

const PointsHistory = mongoose.model('PointsHistory', pointsHistorySchema);

export default PointsHistory;
