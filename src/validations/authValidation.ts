import { Joi, Segments } from 'celebrate';
import type { SchemaOptions } from 'celebrate';
export const registerUserSchema: SchemaOptions = {
  [Segments.BODY]: Joi.object({
    // ? age: Joi.number().integer().min(12).max(65).required(),
    username: Joi.string().trim().max(16).required(),
    email: Joi.string().trim().email().max(128).required(),
    password: Joi.string().trim().pattern(/^\S+$/).min(8).max(128).required(),
  }),
};
export const loginUserSchema: SchemaOptions = {
  [Segments.BODY]: Joi.object({
    email: Joi.string().trim().email().max(128).required(),
    password: Joi.string().trim().pattern(/^\S+$/).min(8).max(128).required(),
  }),
};
