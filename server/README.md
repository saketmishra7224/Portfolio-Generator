# Portfolio Generator Backend

This is the backend API for the Portfolio Generator application. It provides endpoints for user authentication, profile management, and portfolio data storage.

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   - Create a `.env` file based on the provided `.env.example`
   - Configure MongoDB connection URL
   - Set JWT secret key

3. Start the development server:
   ```
   npm run dev
   ```

4. For production:
   ```
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user (email/password)
- `POST /api/auth/login` - Login user (email/password)
- `POST /api/auth/change-password` - Change password (email/password accounts; requires current password) (protected)
- `POST /api/auth/logout-all` - Invalidate all sessions for the account, including the caller (protected)
- `POST /api/auth/google` - Sign up / sign in with Google. Body: `{ "idToken": "<Google ID token>" }`.
  The ID token is verified server-side (signature, issuer, audience =
  `GOOGLE_CLIENT_ID`, expiry, email) and the app's own JWT is returned —
  same session mechanism as password auth. See `GOOGLE_AUTH_SETUP.md`.
- `GET /api/auth/user` - Get current user data (protected)

### Profile

- `GET /api/profile` - Get user profile (protected)
- `PUT /api/profile` - Update user profile (protected)
- `PUT /api/profile/education` - Update education details (protected)
- `PUT /api/profile/skills` - Update skills (protected)
- `POST /api/profile/projects` - Add a new project (protected)
- `PUT /api/profile/projects/:id` - Update a project (protected)
- `DELETE /api/profile/projects/:id` - Delete a project (protected)
- `POST /api/profile/sections/:section` - Append an item to a resume section (protected)
- `PUT /api/profile/sections/:section/:id` - Update a section item (protected)
- `DELETE /api/profile/sections/:section/:id` - Delete a section item (protected)

### Resume versions

Named resume variants (snapshots owned by the user; the account is never
duplicated). Users without versions keep working on the main profile —
`User.activeResumeVersion` stays null and nothing migrates.

- `GET /api/resumes` - List own versions + active pointer (protected)
- `POST /api/resumes` - Create a version (`name`, `targetRole`, `template`, `theme`, `targetJobDescription`, `data`, or `fromCurrent: true`) (protected, max 10)
- `GET /api/resumes/:id` - Fetch one owned version (protected)
- `PUT /api/resumes/:id` - Rename / retarget / update version data (protected)
- `POST /api/resumes/:id/duplicate` - Copy a version (protected)
- `DELETE /api/resumes/:id` - Delete a version; clears the active pointer if needed (protected)
- `PUT /api/resumes/active` - Select active version (`{ versionId }`) or return to the main resume (`{ versionId: null }`) (protected)

## Database Schema

The application uses MongoDB with the following main collections:

- Users - Stores user accounts and profile data

Each user document contains:
- Personal information (name, email, phone)
- Education details
- Skills
- Projects
- Social links 