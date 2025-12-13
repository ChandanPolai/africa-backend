import express from 'express';
import { helpers } from '../utils/helpers.js';
const router = express.Router();

router.get('/', (req, res) => res.render('landing'));
router.get('/link-tree', (req, res) => res.render('gbs-link-tree'));
router.get('/member-application', (req, res) => res.render('member-application'));
router.get('/renewal-application', (req, res) => res.render('renewal-application'));
router.get('/gbs-registration', (req, res) => res.render('gbs-registration'));
router.get('/gbs-launch', (req, res) => res.render('gbs-launch'));
router.get('/success', (req, res) => res.render('success'));
router.get('/visitor-scan', (req, res) => res.render('visitor-scan'));

console.log('All paths in this router:');

router.post('/notification', async (req, res) => {
  try {
    const { fcm, title, description } = req.body;
    await helpers.sendNotification(fcm, title, description);
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
// router.stack.forEach((layer) => {
//   if (layer.route) {
//     console.log(
//       `${Object.keys(layer.route.methods).join(',')} ${layer.route.path}`
//     );
//   }
// });

export default router;
