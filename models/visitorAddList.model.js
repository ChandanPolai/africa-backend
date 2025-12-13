import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const VisitorAddListSchema = new mongoose.Schema({
    name: { type: String, default: "", required: true },
    refUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, default: "" },
    mobile_number: { type: String, default: "", required: true },
    email: { type: String, default: "" },
    business_name: { type: String, default: "" }
}, { timestamps: true });
VisitorAddListSchema.plugin(mongoosePaginate);
const VisitorAddList = mongoose.model("VisitorAddList", VisitorAddListSchema);
export default VisitorAddList;












