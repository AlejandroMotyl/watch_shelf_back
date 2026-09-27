import { Joi, Segments } from 'celebrate';
import type { SchemaOptions } from 'celebrate';

export const mediaParamsSchema: SchemaOptions = {
  [Segments.PARAMS]: Joi.object({
    media_type: Joi.string().valid('movie', 'tv').required().messages({
      'any.only': 'Media type must be either movie or tv',
      'string.empty': 'Media type is required',
      'any.required': 'Media type is required',
    }),

    tmdbId: Joi.number().integer().positive().required().messages({
      'number.base': 'TMDB ID must be a number',
      'number.integer': 'TMDB ID must be an integer',
      'number.positive': 'TMDB ID must be a positive number',
      'any.required': 'TMDB ID is required',
    }),
  }),
};
