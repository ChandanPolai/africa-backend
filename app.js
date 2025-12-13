import path from 'path';
import { fileURLToPath } from 'url';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import dbConfig from './config/database.js';
import zindexRoutes from './routes/zindex.js';
import qs from 'qs';
import fs from 'fs';


// __dirname replacement in ESM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const envPath = path.resolve(
  process.cwd(),
  `.env${process.env.NODE_ENV != null ? `.${process.env.NODE_ENV}` : ''}`
);
dotenv.config({ path: envPath });

dbConfig(); 



const app = express();

// Setup CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Changed to true to support nested objects
app.use(cookieParser());
//app.use(fileUpload());
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    req.body = qs.parse(req.body);
  }
  next();
});

// app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/adminapp', express.static(path.join(__dirname, 'adminapp')));
app.use('/userpanel', express.static(path.join(__dirname, 'userpanel')));
app.use('/images', express.static(path.join(__dirname, 'views', 'images')));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/adminapp', (req, res) => {
  res.sendFile(path.join(__dirname, 'adminapp', 'index.html'));
});

app.get('/userpanel', (req, res) => {
  res.sendFile(path.join(__dirname, 'userpanel', 'index.html'));
});
// app.get(/^\/userpanel(\/.*)?$/, (req, res) => {
//   res.sendFile(path.join(__dirname, 'userpanel', 'index.html'));
// });



// Register routes
zindexRoutes.forEach((route) => {
  try {
    console.log('Registering route:', route.path);
    app.use(route.path, route.file);
  } catch (err) {
    console.error(`Failed to register route ${route.path}:`, err);
    throw err; 
  }
});

app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    req.body = qs.parse(req.body);
  }
  next();
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  const result = {
    message: err.message || 'Internal Server Error',
    status: statusCode,
    data: null,
  };

  if (process.env.NODE_ENV === 'dev') {
    result.stack = err.stack;
  }

  res.status(statusCode).json(result);
});

// NOTE:
// The HTTP server and port listening are handled in `bin/www.js`.
// Do NOT call `app.listen` here, otherwise the port will be bound twice
// and you will see "Port XXXX is already in use" errors.
export default app;
