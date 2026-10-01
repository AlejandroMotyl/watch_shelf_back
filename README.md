# Watch Shelf — Backend

The backend API for **Watch Shelf**, a movie and TV database application.

Built with **Express, TypeScript, and PostgreSQL**, the API handles authentication, database-backed sessions, user data, TMDB integration, media-related user interactions, and Cloudinary avatar storage.

## Responsibilities

The backend is responsible for:

- User registration and login
- Database-backed authentication sessions
- Access and refresh token handling
- Logout and session invalidation
- User profiles
- Username and password changes
- Favorites
- Ratings
- Reviews
- Watch history
- TMDB media requests
- Trailer lookup
- Avatar upload and processing
- Request validation
- Error handling
- HTTP request logging

## Tech Stack

### API

- Express
- TypeScript
- Axios
- PostgreSQL
- pg

### Authentication & Validation

- Argon2
- Celebrate / Joi
- Cookie Parser
- HTTP Errors

### File Processing

- Multer
- Sharp
- file-type
- Cloudinary

### Logging

- Pino
- pino-http
- pino-pretty

### External Services

- TMDB
- Cloudinary

## Architecture

```text
Next.js / React
       │
       ▼
   Next.js BFF
       │
       ▼
   Express API
       │
       ├── PostgreSQL
       │
       ├── TMDB
       │
       └── Cloudinary
```

The backend is responsible for application and user data while TMDB provides the external movie and TV metadata.

## Authentication

Watch Shelf uses custom database-backed sessions.

When a user authenticates, the backend creates a session containing:

- Session ID
- Access token
- Refresh token
- Access-token expiration
- Refresh-token expiration
- User ID

Authentication credentials are stored in HTTP-only cookies.

The backend owns the authentication lifecycle, including:

- Login
- Session creation
- Access-token validation
- Access-token refresh
- Logout
- Session deletion
- Session invalidation after password changes

Existing sessions are also invalidated in situations where a fresh authenticated session is required, such as login and password changes.

Passwords are hashed using **Argon2**.

## API Routes

### Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
```

### Media

```text
GET /trending/:media_type
GET /reviews/:media_type
GET /:media_type/:tmdbId
GET /:media_type/:tmdbId/trailer
```

### Favorites

```text
GET    /profile/favorites
POST   /profile/favorites/:media_type/:tmdbId
DELETE /profile/favorites/:media_type/:tmdbId
```

### Watch History

```text
GET  /profile/history
GET  /profile/history/:media_type/:tmdbId
POST /profile/history
```

### Ratings

```text
POST /profile/ratings
GET  /profile/ratings/:media_type/:tmdbId
```

### Reviews

```text
GET  /profile/reviews
GET  /profile/reviews/:media_type/:tmdbId
POST /profile/reviews
```

### Profile

```text
GET   /profile
PATCH /profile
PATCH /profile/username
PATCH /profile/password
```

Authenticated routes use the authentication middleware before accessing user-specific data.

## Database

PostgreSQL stores application-specific user data.

Main tables include:

```text
users
sessions
favorites
ratings
reviews
watch_history
```

User/media relationships use:

```text
(user_id, tmdb_id, media_type)
```

This allows the same database structure to support both movies and TV shows.

For example, a favorite is associated with:

```text
user_id
tmdb_id
media_type
```

Composite uniqueness constraints prevent the same user from creating duplicate relationships for the same media.

## Validation

Request validation is performed at the API boundary using **Celebrate/Joi**.

Examples include:

- Registration fields
- Login fields
- Username updates
- Password updates
- Media route parameters
- Rating values
- Review content
- Watch-history data

Database constraints provide an additional layer of data integrity.

The API does not rely solely on client-side validation.

## TMDB Integration

TMDB provides the external movie and TV data used by Watch Shelf.

The backend communicates with TMDB rather than exposing the TMDB API implementation directly to the frontend.

Media endpoints can retrieve:

- Movie information
- TV information
- Cast
- Crew
- Directors
- Writers
- Reviews
- Trailers
- Trending media

Trailer lookup uses TMDB video data and selects an appropriate YouTube trailer when available.

## Avatar Uploads

User avatars are processed on the backend.

The upload pipeline includes:

```text
Browser
   │
   ▼
Multer
   │
   ▼
File signature validation
   │
   ▼
Sharp
   │
   ├── metadata validation
   ├── rotation
   ├── resizing
   └── WebP conversion
   │
   ▼
Cloudinary
   │
   ▼
PostgreSQL
```

The backend validates uploaded files independently of their filename or MIME type.

Avatars are resized to a consistent format before being uploaded to Cloudinary.

## Error Handling

The API uses HTTP errors for expected request failures and centralized Express error handling.

Typical responses include:

```text
400 Bad Request
401 Unauthorized
404 Not Found
409 Conflict
500 Internal Server Error
```

Database constraint violations are handled where appropriate, such as duplicate usernames or email addresses.

## Logging

HTTP requests are logged using Pino and `pino-http`.

Development logs use `pino-pretty` for readable terminal output.

Example:

```text
GET /profile 200 - 24ms
POST /auth/login 200 - 91ms
```

Sensitive credentials such as access tokens and refresh tokens should never be logged.

## Environment Variables

Create a `.env` file:

```env
PORT=6000
NODE_ENV=development

TMDB_ACCESS_TOKEN=
TMDB_API_KEY=

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Do not commit environment files or credentials to the repository.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the TypeScript project:

```bash
npm run build
```

Start the compiled application:

```bash
npm start
```

Type-check the project:

```bash
npm run typecheck
```

Run ESLint:

```bash
npm run lint
```

## Database

The application requires a PostgreSQL database.

Create the database and configure the connection using:

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

The current project uses manual database setup rather than an automated migration system.

## Related Repository

The Next.js frontend is maintained separately.

**Frontend:** `<frontend-repository-url>`

## Project Status

This project is a portfolio application and is currently under development.

The application is not currently deployed.

## Why I Built It

I built the backend to practice designing a real API around external data while handling persistent user data and authentication myself.

The project gave me practical experience with:

- Express API design
- PostgreSQL data modeling
- Database-backed sessions
- Password hashing
- Request validation
- Authentication middleware
- External API integration
- File processing
- Cloud storage
- Structured logging
- Separation between frontend and backend responsibilities
