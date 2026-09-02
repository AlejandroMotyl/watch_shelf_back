import axios from 'axios';
import type { Request, Response } from 'express';
import createHttpError from 'http-errors';
import type { ApiResponse, MovieId, TVId } from '../types/media.js';
import type { MediaCredits, MediaStaff } from '../types/staff.js';
import type { ReviewsResponse } from '../types/reviews.js';

export const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export const getTrendingMedia = async (req: Request, res: Response) => {
  const { type } = req.params;
  const { data } = await tmdb.get<ApiResponse>(`/trending/${type}/week`);
  if (!data) {
    throw createHttpError(404, 'Media not found');
  }
  const results = data.results.map((media) => ({
    ...media,
    media_type: type,
  }));

  res.status(200).json({
    ...data,
    results,
  });
};

export const getMediaById = async (req: Request, res: Response) => {
  const { type, id } = req.params;
  const { data: mediaData } = await tmdb.get<TVId | MovieId>(`/${type}/${id}`);
  const { data: creditsData } = await tmdb.get<MediaCredits>(
    `/${type}/${id}/credits`,
  );
  if (!mediaData || !creditsData) {
    throw createHttpError(404, 'Media not found');
  }
  const media = { ...mediaData, media_type: type };
  const staff: MediaStaff = {
    directors: creditsData.crew.filter((person) => person.job === 'Director'),
    writers: creditsData.crew.filter((person) =>
      ['Writer', 'Screenplay', 'Story', 'Novel'].includes(person.job),
    ),

    stars: creditsData.cast.slice(0, 10),
  };

  res.status(200).json({ media, staff });
};

export const getMediaReviews = async (req: Request, res: Response) => {
  const { page = 1 } = req.query;
  const { type } = req.params;

  const { data: popularMedia } = await tmdb.get<ApiResponse>(
    `/${type}/popular`,
    {
      params: {
        page,
      },
    },
  );

  const mediaWithReviews = (
    await Promise.all(
      popularMedia.results.map(async (media) => {
        const { data: reviews } = await tmdb.get<ReviewsResponse>(
          `/${type}/${media.id}/reviews`,
        );

        const bestReview = reviews.results[0];

        if (!bestReview) {
          return null;
        }

        const title = media.media_type === 'tv' ? media.name : media.title;

        const date =
          media.media_type === 'tv' ? media.first_air_date : media.release_date;

        return {
          id: media.id,
          title,
          year: date?.slice(0, 4) ?? '',
          poster: media.poster_path,
          review: {
            rating: bestReview.author_details.rating,
            text: bestReview.content.replace(/<[^>]*>/g, ''),
            author: bestReview.author,
          },
        };
      }),
    )
  ).filter((media) => media !== null);

  res.status(200).json({
    page: popularMedia.page,
    total_pages: popularMedia.total_pages,
    results: mediaWithReviews,
  });
};
