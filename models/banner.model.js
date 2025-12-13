import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' }, // Banner title
    description: { type: String, default: '' }, // Banner description
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Creator
    image: { type: String, default: '' }, // Image path
    redirectUrl: { type: String, default: '' }, // URL to redirect
    contact: { type: String, default: '' }, // Contact details
    fromDate: { type: Date, default: null }, // Start date
    toDate: { type: Date, default: null }, // End date
    isActive: { type: Boolean, default: true }, // Status (active/inactive)
  },
  { timestamps: true }
);

const Banner = mongoose.model('Banner', BannerSchema);

export default Banner;
