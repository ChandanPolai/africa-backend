import mongoose from "mongoose";
const ContactUsSchema = new mongoose.Schema({
    
Entityname: { type: String, default: ""},
email: { type: String, default: "" },
mobile_number: { type: String  },
address: { type: String, default: "" },                  
pic: { type: String, default: "" },
message: { type: String, default: "" }

});

const ContactUs = mongoose.model("ContactUs", ContactUsSchema);
export default ContactUs;
