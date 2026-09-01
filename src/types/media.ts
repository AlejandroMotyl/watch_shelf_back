export interface Media {
  adult: boolean;
  backdrop_path: string | null;
  id: number;
  overview: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  original_language: string;
  genre_ids: number[];
  popularity: number;
  vote_average: number;
  vote_count: number;
  softcore: boolean;
}
export interface TV extends Media {
  media_type: 'tv';
  name: string;
  original_name: string;
  first_air_date: string;
  origin_country: string[];
}
export interface Movie extends Media {
  media_type: 'movie';
  title: string;
  original_title: string;
  release_date: string;
}

export type MediaIdBase = {
  adult: boolean;
  backdrop_path: string | null;
  genres: Genre[];
  homepage: string | null;
  id: number;
  overview: string;
  popularity: number;
  poster_path: string | null;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string | null;
  vote_average: number;
  vote_count: number;
  softcore: boolean;
  origin_country: string[];
  original_language: string;
};
export interface MovieId extends MediaIdBase {
  media_type: 'movie';

  belongs_to_collection: unknown | null;
  budget: number;
  imdb_id: string | null;
  original_title: string;
  release_date: string;
  revenue: number;
  runtime: number;
  title: string;
  video: boolean;
}
export interface TVId extends MediaIdBase {
  media_type: 'tv';

  name: string;
  original_name: string;
  first_air_date: string;
  number_of_episodes: number;
  number_of_seasons: number;
}

export interface ApiResponse {
  page: number;
  results: TV[] | Movie[];
  total_pages: number;
  total_results: number;
}
export type Genre = {
  id: number;
  name: string;
};

export type ProductionCompany = {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
};

export type ProductionCountry = {
  iso_3166_1: string;
  name: string;
};

export type SpokenLanguage = {
  english_name: string;
  iso_639_1: string;
  name: string;
};
