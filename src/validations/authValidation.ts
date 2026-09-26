import { Joi, Segments } from 'celebrate';
import type { SchemaOptions } from 'celebrate';

export const registerUserSchema: SchemaOptions = {
  [Segments.BODY]: Joi.object({
    username: Joi.string().trim().max(16).required().messages({
      'string.empty': 'Username is required',
      'string.max': 'Username must not exceed 16 characters',
      'any.required': 'Username is required',
    }),

    email: Joi.string().trim().email().max(128).required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 128 characters',
      'any.required': 'Email is required',
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/[A-Z]/, 'uppercase')
      .pattern(/[a-z]/, 'lowercase')
      .pattern(/[0-9]/, 'digit')
      .pattern(/[^A-Za-z0-9]/, 'special')
      .pattern(/^\S+$/, 'no whitespace')
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',

        'string.pattern.name': 'Password must contain {#name}',

        'any.required': 'Password is required',
      }),
  }),
};
export const loginUserSchema: SchemaOptions = {
  [Segments.BODY]: Joi.object({
    email: Joi.string().trim().email().max(128).required().messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 128 characters',
      'any.required': 'Email is required',
    }),

    password: Joi.string().min(1).max(128).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password is required',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required',
    }),
  }),
};

export const updatePasswordSchema: SchemaOptions = {
  [Segments.BODY]: Joi.object({
    currentPassword: Joi.string().min(1).max(128).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password is required',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required',
    }),
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/[A-Z]/, 'uppercase')
      .pattern(/[a-z]/, 'lowercase')
      .pattern(/[0-9]/, 'digit')
      .pattern(/[^A-Za-z0-9]/, 'special character')
      .pattern(/^\S+$/, 'no whitespace')
      .required()
      .messages({
        'string.empty': 'New password is required',
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password must not exceed 128 characters',

        'string.pattern.name': 'New password must contain {#name}',

        'any.required': 'New password is required',
      }),
  }),
};
export const updateUsernameSchema: SchemaOptions = {
  [Segments.BODY]: Joi.object({
    username: Joi.string().trim().max(16).required().messages({
      'string.empty': 'Username is required',
      'string.max': 'Username must not exceed 16 characters',
      'any.required': 'Username is required',
    }),
  }),
};
