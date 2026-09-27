import { Joi, Segments } from 'celebrate';
import type { SchemaOptions } from 'celebrate';

export const saveReviewSchema: SchemaOptions = {
  [Segments.BODY]: Joi.object({
    tmdbId: Joi.number().integer().positive().required().messages({
      'number.base': 'TMDB ID must be a number',
      'number.integer': 'TMDB ID must be an integer',
      'number.positive': 'TMDB ID must be a positive number',
      'any.required': 'TMDB ID is required',
    }),

    media_type: Joi.string().valid('movie', 'tv').required().messages({
      'any.only': 'Media type must be either movie or tv',
      'string.empty': 'Media type is required',
      'any.required': 'Media type is required',
    }),

    reviewContent: Joi.string().trim().min(1).max(2000).required().messages({
      'string.base': 'Review must be a string',
      'string.empty': 'Review cannot be empty',
      'string.min': 'Review cannot be empty',
      'string.max': 'Review cannot exceed 2000 characters',
      'any.required': 'Review is required',
    }),
  }),
};
