import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const notificationSchema = new mongoose.Schema({
 type: { type: String, enum: ['tyfcb', 'event', 'testimonial', 'one-to-one', 'referral','other','feed', 'podcast'], default: "other" },
  title: { type: String, default: "" },
 title: { type: String, default: "" },
  description: { type: String, default: "" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedEntity: { type: mongoose.Schema.Types.ObjectId }, // Add this field
  entityType: { type: String, default: "" }, // Add this field
  isDeleted: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false }, // Add this if not already present
}, { timestamps: true });
notificationSchema.plugin(mongoosePaginate);
notificationSchema.plugin(mongooseAggregatePaginate);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
