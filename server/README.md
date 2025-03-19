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

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user` - Get current user data (protected)

### Profile

- `GET /api/profile` - Get user profile (protected)
- `PUT /api/profile` - Update user profile (protected)
- `PUT /api/profile/education` - Update education details (protected)
- `PUT /api/profile/skills` - Update skills (protected)
- `POST /api/profile/projects` - Add a new project (protected)
- `PUT /api/profile/projects/:id` - Update a project (protected)
- `DELETE /api/profile/projects/:id` - Delete a project (protected)

## Database Schema

The application uses MongoDB with the following main collections:

- Users - Stores user accounts and profile data

Each user document contains:
- Personal information (name, email, phone)
- Education details
- Skills
- Projects
- Social links 