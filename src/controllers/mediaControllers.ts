import axios from 'axios';
import type { Request, Response } from 'express';
import createHttpError from 'http-errors';
import type {
  TMDBVideo,
  ApiResponse,
  MovieId,
  TVId,
  Movie,
  TV,
} from '../types/media.js';
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
  const { media_type } = req.params;
  const { data } = await tmdb.get<ApiResponse>(`/trending/${media_type}/week`);
  const results = data.results.map((media) => ({
    ...media,
    media_type: media_type,
  }));

  res.status(200).json({
    ...data,
    results,
  });
};

export const getMediaById = async (req: Request, res: Response) => {
  const { media_type, tmdbId } = req.params;
  const { data: mediaData } = await tmdb.get<TVId | MovieId>(
    `/${media_type}/${tmdbId}`,
  );
  const { data: creditsData } = await tmdb.get<MediaCredits>(
    `/${media_type}/${tmdbId}/credits`,
  );
  const media = { ...mediaData, media_type: media_type };
  const staff: MediaStaff = {
    directors: creditsData.crew.filter((person) => person.job === 'Director'),
    writers: creditsData.crew.filter((person) =>
      ['Writer', 'Screenplay', 'Story', 'Novel'].includes(person.job),
    ),

    stars: creditsData.cast.slice(0, 10),
  };

  res.status(200).json({ media, staff });
};

export const getMediaTrailerById = async (req: Request, res: Response) => {
  const { tmdbId, media_type } = req.params;

  const endpoint = `/${media_type}/${tmdbId}/videos`;

  const { data } = await tmdb.get(endpoint, {
    params: {
      language: 'en-US',
    },
  });

  let videos: TMDBVideo[] = data.results ?? [];

  if (videos.length === 0) {
    const fallbackResponse = await tmdb.get(endpoint);

    videos = fallbackResponse.data.results ?? [];
  }

  const youtubeVideos = videos.filter(
    (video) => video.site === 'YouTube' && video.type === 'Trailer',
  );

  const trailer =
    youtubeVideos.find((video) => video.official === true) ??
    youtubeVideos.find((video) => video.official === false) ??
    youtubeVideos[0];

  if (!trailer) {
    throw createHttpError(404, 'Trailer not found');
  }

  res.status(200).json({
    trailer: {
      key: trailer.key,
      name: trailer.name,
    },
  });
};

type RawMovie = Omit<Movie, 'media_type'>;
type RawTV = Omit<TV, 'media_type'>;

interface RawApiResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: RawMovie[] | RawTV[];
}

interface MediaReviewResult {
  id: number;
  title: string;
  year: string;
  poster: string | null;
  review: {
    rating: number | null;
    text: string;
    author: string;
  };
}

export const getMediaReviews = async (req: Request, res: Response) => {
  const { page = '1' } = req.query;
  const { media_type } = req.params;

  const { data: rawPopularMedia } = await tmdb.get<RawApiResponse>(
    `/${media_type}/popular`,
    { params: { page } },
  );

  const popularMedia: ApiResponse = {
    ...rawPopularMedia,
    results: rawPopularMedia.results.map((item) => ({
      ...item,
      media_type,
    })) as TV[] | Movie[],
  };

  const settled = await Promise.allSettled(
    popularMedia.results.map(async (media: TV | Movie) => {
      const { data: reviews } = await tmdb.get<ReviewsResponse>(
        `/${media_type}/${media.id}/reviews`,
      );

      const rated = [...reviews.results].sort(
        (a, b) =>
          (b.author_details.rating ?? -1) - (a.author_details.rating ?? -1),
      );
      const bestReview = rated[0];
      if (!bestReview) return null;

      const title = media.media_type === 'tv' ? media.name : media.title;
      const date =
        media.media_type === 'tv' ? media.first_air_date : media.release_date;

      return {
        id: media.id,
        title,
        year: date.slice(0, 4),
        poster: media.poster_path,
        review: {
          rating: bestReview.author_details.rating,
          text: bestReview.content.replace(/<[^>]*>/g, ''),
          author: bestReview.author,
        },
      };
    }),
  );

  const mediaWithReviews = settled
    .filter(
      (result): result is PromiseFulfilledResult<MediaReviewResult> =>
        result.status === 'fulfilled' && result.value !== null,
    )
    .map((result) => result.value);

  res.status(200).json({
    page: popularMedia.page,
    total_pages: popularMedia.total_pages,
    results: mediaWithReviews,
  });
};
