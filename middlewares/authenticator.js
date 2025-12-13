import jwt from 'jsonwebtoken';
import {response} from '../utils/response.js';
import models from '../models/zindex.js';

export const authenticateMobileToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return response.unauthorized(res);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return response.forbidden('Invalid token!', res);
    } else {
      models.users
        .findById(user.id)
        .lean()
        .then((result) => {
          if (result.isActive) {
            req.token = user;
            next();
          } else {
            return response.unauthorized(res);
          }
        })
        .catch((err) => {
          return response.unauthorized(res);
        });
    }
  });
};
