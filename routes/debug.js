// debugRoutes.js
import express from 'express';
import mobileRoutes from './mobile.js';
import adminRoutes from './admin.js';
import webRoutes from './web.js';
import userRoutes from './users.js';

function logRoutes(router, prefix = '') {
  router.stack.forEach((layer) => {
    if (layer.route) {
      console.log(`Route: ${prefix}${layer.route.path}`);
    } else if (layer.handle.stack) {
      logRoutes(layer.handle, prefix);
    }
  });
}

console.log('Mobile Routes:');
logRoutes(mobileRoutes, '/mobile');
console.log('\nAdmin Routes:');
logRoutes(adminRoutes, '/admin');
console.log('\nWeb Routes:');
logRoutes(webRoutes, '/');
console.log('\nUser Routes:');
logRoutes(userRoutes, '/users');

// Simulate zindex.js registration
const zindexRoutes = [
  { path: '/mobile', file: mobileRoutes },
  { path: '/admin', file: adminRoutes },
  { path: '/', file: webRoutes },
  { path: '/users', file: userRoutes },
];

const app = express();
zindexRoutes.forEach((route) => {
  try {
    console.log(`Registering route: ${route.path}`);
    app.use(route.path, route.file);
  } catch (err) {
    console.error(`Error registering route ${route.path}:`, err.message);
    console.error(err.stack);
  }
});