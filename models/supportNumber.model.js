import mongoose from "mongoose";

const numberSchema = new mongoose.Schema({
  mobileNumber: {
    type: Number,
    default: 0,
  },
});

const SupportNumber = mongoose.model("SupportNumber", numberSchema);

export default SupportNumber;
