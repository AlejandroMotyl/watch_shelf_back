import { Joi, Segments } from 'celebrate';
import type { SchemaOptions } from 'celebrate';

export const saveRatingSchema: SchemaOptions = {
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

    rating: Joi.number().min(1).max(10).required().messages({
      'number.base': 'Rating must be a number',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must not exceed 10',
      'any.required': 'Rating is required',
    }),
  }),
};
