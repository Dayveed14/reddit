# Reddit Clone — Backend API

A RESTful API built with Node.js, Express, and MongoDB powering the Reddit Clone project. Handles authentication, communities, posts, comments, voting, and file uploads.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (JSON Web Tokens) |
| File Uploads | Multer + Cloudinary |
| Environment | dotenv |
| Password Hashing | bcryptjs |

## Getting Started

```bash
npm install
npm run dev
```

Server runs on `http://localhost:7000` by default.

## Environment Variables

Create a `.env` file with:

```
NODE_PORT=7000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET_KEY=your_api_secret
FRONTEND_URI=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
UPLOAD_LIMIT_MB=5
```

## API Documentation

See [`docs/API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md) for full endpoint reference, request/response shapes, and known issues.