
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "" },
  email: { type: String, required: true, unique: true, default: "" },
  chapter: { type: String, enum:['Achiever', 'Believer', 'Creator', 'Dreamer','Elevator', 'All'], default: 'All' }, // Added chapter field
  role:{type:String, enum:['admin','advisoryBoard','supportDirector', 'SupportAmbassador','LT', 'accountant'] ,default:'admin'},
  password: { type: String, required: true, default: "" },
  createdAt: { type: Date, default: Date.now },
  code:{type:Number, default:2345}

});

adminSchema.plugin(mongoosePaginate);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
