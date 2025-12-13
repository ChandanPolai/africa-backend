
import asyncHandler from 'express-async-handler';
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';

export const createContactUs = asyncHandler(async (req, res) => {
    const {  Entityname, email, phone, message, address } = req.body;
  
  
    
    let image = "";
    if(req.file){
        image = req.file.path.replace(/\\/g, "/");
    }
    
   
    const newSM = await models.ContactUs.create({ 
      
            Entityname: Entityname || "",
            email: email || "",
            mobile_number: phone || "", // Note: Using 'phone' param for 'mobile_number' field
            address:address|| "", // Your schema requires this
            pic: image, // Goes in contactUs per your schema
            message: message || ""
        }
    );
  
    // Response matching your original format
    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: newSM // Returning full document as you did
    })});

export const updateContactUs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {  Entityname, email, mobile_number, address, message } = req.body;

  const sm = await models.ContactUs.findById(id);
 
  

  let image = sm.pic; 

  if(req.file){
    image = req.file.path.replace(/\\/g, "/");
  }

  // Update only provided fields

  if (Entityname) sm.Entityname = Entityname;
  if (email) sm.email = email;
  if (mobile_number) sm.mobile_number = mobile_number;
  if (address) sm.address = address;
  if (message) sm.message = message;
  sm.pic = image; // Always update image if new one was uploaded

  const updatedSM = await sm.save();

  res.status(200).json({
    success: true,
    message: "Social media updated successfully",
    data: updatedSM,
  });
});




  
  
  
 
  export const getAllContactUs = asyncHandler(async (req, res) => {
    const list = await models.ContactUs.find().sort({ createdAt: -1 });
  
    res.status(200).json({
      success: true,
      message: "Social media list fetched successfully",
      data: list,
    });
  });

 
  
export const ContactUsController = {
    getAllContactUs,
    updateContactUs,
    createContactUs
    
  };
  