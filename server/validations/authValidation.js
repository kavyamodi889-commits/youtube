// FILE: server/validations/authValidation.js

const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .min(3)
    .max(30)
    .required()
    .messages({
      "string.pattern.base": "Username can only contain letters, numbers and underscores",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must be at most 30 characters",
      "any.required": "Username is required",
    }),
  email: Joi.string().email().required().messages({
    "string.email": "Enter a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).max(72).required().messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required",
  }),
  displayName: Joi.string().max(60).optional().allow(""),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Enter a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};

module.exports = { registerSchema, loginSchema, validate };