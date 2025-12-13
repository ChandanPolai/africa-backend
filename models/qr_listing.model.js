import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const qrListingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scanned_profiles: [
    {
      profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

qrListingSchema.plugin(mongoosePaginate);

const QRListing = mongoose.model('QRListing', qrListingSchema);

export default QRListing;
