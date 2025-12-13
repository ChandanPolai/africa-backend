import mobileRoutes from './mobile.js';
import adminRoutes from './admin.js';
import webRoutes from './web.js';
import  userRoutes from './users.js';
 
export default [
  {
    path: '/mobile',
    file: mobileRoutes,
  },
  {
    path: '/admin',
    file: adminRoutes,
  },

  { path: '/', file: webRoutes },
  {path: '/users', file: userRoutes}, // Added index route for consistency
];
