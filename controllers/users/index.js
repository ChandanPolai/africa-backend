  import {
    submitMemberApplication,
    submitRenewalApplication,
    getActiveApplications,
    editMemberApplication
  } from './controllers/form.ctrl.js';

  import express from 'express';

  
  const router = express.Router();
  
  router.post('/memberApplication', submitMemberApplication);
  router.post('/renewalApplication', submitRenewalApplication);
  router.post('/applications', getActiveApplications);
  // In your routes file
router.post('/editApplication', editMemberApplication);
  
  export default router;
  