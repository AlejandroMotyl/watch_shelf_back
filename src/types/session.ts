export type Session = {
  id: number;
  user_id: number;
  access_token: string;
  refresh_token: string;
  access_token_valid_until: Date;
  refresh_token_valid_until: Date;
  created_at: Date;
  updated_at: Date;
};
