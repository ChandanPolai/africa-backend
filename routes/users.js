import {
  submitMemberApplication,
  submitRenewalApplication,
  getActiveApplications,
  editMemberApplication,
  getEventRegistrations,
  submitBasicMemberApplication,
  getActiveApplications1,
  submitEventRegistration,
  convertToDigitalCard,
  matchdigitalcard
} from  '../controllers/users/controllers/form.ctrl.js';
import multer from 'multer';
import createUploadMiddleware from '../middlewares/fileUploader.js';

// Use multer to parse multipart/form-data (even without files)
// .none() means no files expected, just parse the form fields
const parseFormData = multer().none();
const eventRegistrationUpload = createUploadMiddleware("EventPayments").fields([
  { name: 'paymentProof', maxCount: 1 }
]);

import express from 'express';

//mygbs/routes/index.js
const router = express.Router();

router.post('/memberApplication', parseFormData, submitMemberApplication);
router.post('/matchdigitalcard',  matchdigitalcard);
router.post('/renewalApplication', submitRenewalApplication);
router.post('/applications', getActiveApplications);
router.post('/submitEventRegistration', eventRegistrationUpload, submitEventRegistration);
router.post('/submitBasicMemberApplication', submitBasicMemberApplication);
router.post('/getActiveApplications1',  getActiveApplications1);
//router.post('/submitEventRegistration', submitEventRegistration);
router.post('/getEventRegistrations', getEventRegistrations);
router.post('/convertToDigitalCard', convertToDigitalCard);


 



router.post('/editApplication', parseFormData, editMemberApplication);




export default router;
