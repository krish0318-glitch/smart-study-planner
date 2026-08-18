# Smart Study Planner

A full-stack student productivity platform built with React, Node.js, Express and MongoDB.

## Features
- JWT authentication with bcrypt password hashing
- User-specific protected task APIs
- Create, complete, search, filter and delete study tasks
- Subject, priority, deadline and estimated study time
- Dashboard with productivity metrics
- Subject-wise analytics and completion rate
- Smart daily focus generated from pending tasks
- Responsive desktop/mobile UI

## Run locally

### Backend
1. `cd backend`
2. Copy `.env.example` to `.env`
3. Add your MongoDB Atlas connection string and a strong JWT secret
4. `npm install`
5. `npm run dev` (or `npm start`)

### Frontend
1. `cd frontend`
2. Copy `.env.example` to `.env` if your API is not on localhost
3. `npm install`
4. `npm start`

Default local API: `http://localhost:5000/api`

## Interview talking points
Architecture: React UI → Axios REST API → Express middleware/routes → Mongoose → MongoDB Atlas.
Security: passwords are hashed with bcrypt, JWT protects API routes, and task queries are scoped to the authenticated user.
