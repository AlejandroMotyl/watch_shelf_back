export type User = {
  avatar_url: string;
  id: number;
  username: string;
  email: string;
  created_at: Date;
};
export type WatchHistory = {
  id: number;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  release_date: string | null;
  genres: number[];
  progress_seconds: number;
  duration_seconds: number | null;
  watched_at: Date;
};

export type Rating = {
  id: number;
  user_id: number;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  rating: number;
  created_at: Date;
  updated_at: Date;
};
export type RatingInput = {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  rating: number;
};
