import { Joi, Segments } from 'celebrate';
import type { SchemaOptions } from 'celebrate';

export const addWatchHistorySchema: SchemaOptions = {
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

    progressSeconds: Joi.number()
      .min(0)
      .required()
      .when('durationSeconds', {
        is: Joi.number(),
        then: Joi.number().max(Joi.ref('durationSeconds')),
      })
      .messages({
        'number.base': 'Progress must be a number',
        'number.min': 'Progress cannot be negative',
        'number.max': 'Progress cannot be greater than duration',
        'any.required': 'Progress is required',
      }),

    durationSeconds: Joi.number()
      .greater(0)
      .allow(null)
      .default(null)
      .messages({
        'number.base': 'Duration must be a number',
        'number.greater': 'Duration must be greater than 0',
      }),
  }),
};
