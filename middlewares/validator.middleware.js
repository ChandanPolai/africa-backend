import {response} from '../utils/response.js'
const validator = (schema) => {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json(error.details[0].message);
        // return response.requiredField(error.details[0].message,res)
      }
      next();
    };
  };
  
export default validator