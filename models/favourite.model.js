import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const favouriteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User who added the favorite
    favoriteUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User or business profile added to favorites
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

favouriteSchema.plugin(mongoosePaginate);
favouriteSchema.plugin(mongooseAggregatePaginate);

const Favourite = mongoose.model('favourites', favouriteSchema);

export default Favourite