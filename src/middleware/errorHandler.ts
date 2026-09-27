import axios from 'axios';
import type { ErrorRequestHandler } from 'express';
import { HttpError } from 'http-errors';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (axios.isAxiosError(err)) {
    console.error('Axios request failed:', {
      method: err.config?.method?.toUpperCase(),
      url: err.config?.url,
      status: err.response?.status,
      data: err.response?.data,
      code: err.code,
    });

    if (err.response) {
      const status = err.response.status;

      if (status === 404) {
        return res.status(404).json({
          message: 'Media not found',
        });
      }

      if (status === 429) {
        return res.status(429).json({
          message: 'Media service rate limit exceeded',
        });
      }

      if (status >= 500) {
        return res.status(502).json({
          message: 'Media service is temporarily unavailable',
        });
      }
    }

    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(502).json({
        message: 'Media service is unavailable',
      });
    }

    return res.status(502).json({
      message: 'Unable to fetch media data',
    });
  }

  if (err instanceof HttpError) {
    console.error('HTTP error:', {
      method: req.method,
      path: req.originalUrl,
      status: err.status,
      message: err.message,
    });
    return res.status(err.status).json({
      message: err.message || err.name,
    });
  }

  console.error('Unexpected error:', {
    method: req.method,
    path: req.originalUrl,
    error: err instanceof Error ? err.message : err,
  });

  return res.status(500).json({
    message: isDevelopment
      ? err instanceof Error
        ? err.message
        : 'Unknown error'
      : 'Something went wrong. Please try again later.',
  });
};
