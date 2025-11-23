# MongoDB Atlas Setup Instructions

## Step 1: Get Your MongoDB Atlas Connection String

1. Open Command Prompt or PowerShell
2. Navigate to Atlas CLI:
   ```
   cd "C:\Program Files (x86)\MongoDB Atlas CLI"
   ```

3. Login to Atlas (if not already logged in):
   ```
   atlas auth login
   ```

4. List your clusters:
   ```
   atlas clusters list
   ```

5. Get your connection string:
   ```
   atlas clusters connectionStrings describe <YOUR_CLUSTER_NAME>
   ```

## Step 2: Update Your Environment Variables

Replace the connection string in `server/.env`:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/portfolio-generator?retryWrites=true&w=majority
```

Make sure to:
- Replace `<username>` with your MongoDB Atlas username
- Replace `<password>` with your MongoDB Atlas password
- Replace `<cluster>` with your actual cluster address
- Keep `portfolio-generator` as the database name

## Step 3: Test the Connection

Run the server to test:
```
cd server
npm install
npm start
```

Then visit: http://localhost:5000/api/db-status

## For Render Deployment

Add these environment variables in Render dashboard:
- `MONGODB_URI`: Your Atlas connection string
- `JWT_SECRET`: A secure random string (generate one using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
- `NODE_ENV`: production
