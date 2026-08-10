//---- Imports -----
import { env } from './config/env.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { closeDatabase, connectDatabase } from './config/db.js';


// ---- Routes imports -----
import userRoutes from './routes/user.route.js'
import authRoutes from './routes/auth.route.js'
import commentRoutes from './routes/comment.route.js'
import communityRoutes from './routes/community.route.js'
import postRoutes from './routes/post.route.js'
import votesRoutes from './routes/votes.routes.js'

// ---- Process Error Handlers -----
process.on('uncaughtException', (error) => {
    console.error('❌ UNCAUGHT EXCEPTION! shutting down.. ', error.name, error.message);
    console.error(error.stack)
    process.exit(1);
});


process.on('unhandledRejection', (error) => {
    console.error('❌ UNHANDLED REJECTION! shutting down.. ', error.name, error.message);

    if (typeof gracefulShutdown === 'function') {
        gracefulShutdown("unhandledRejection")
    } else {
        process.exit(1);
    }
});

//App 
const app = express();

//---- Middleware -----
app.use(express.urlencoded({ extended: true }));// parse form data
app.use(express.json());

const allowedOrigins = [
    'http://localhost:5173', // Your local React development URL
    'https://reddit-clone-ten.vercel.app', // Your Vercel production URL
    'http://100.61.180.15'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS policy'));
        }
    },
    credentials: true, // Set to true if you are passing cookies or auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//---- Morgan for HTTP request logger -----
if (env.nodeEnv === 'development') {
    app.use(morgan('dev'))

};

//---- Health Check ----
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        environment: env.nodeEnv,
        timestamp: new Date().toISOString()
    });
});


//---- Api Routes ----
app.use('/api/users', userRoutes);// http://localhost:7000/api/users
app.use('/api/auth', authRoutes);//http://localhost:7000/api/auth

app.use('/api/post', postRoutes);//http://localhost:7000/api/post
app.use('/api/comment', commentRoutes);//http://localhost:7000/api/comment
app.use('/api/community', communityRoutes);//http://localhost:7000/api/community
app.use('/api/vote', votesRoutes);//http://localhost:7000/api/votes

//---- 404 Handler ----
app.use((req, res) => {
    res.status(404).json({
        success: false,
        status: 404,
        message: `Route ${req.originalUrl} not found`
    });
});

//---- Start Server ----
let server;

async function startServer() {
    try {
        await connectDatabase();
        server = app.listen(env.port, () => {
            console.log(`✅ Reddit Database running on port ${env.port} [${env.nodeEnv}]`)
        });

    } catch (error) {
        console.error('❌ failed to connect :', error.message);
        process.exit(1);
    }
}

// Only auto-connect/listen when this file is run directly (e.g. `node server.js`).
// When imported (e.g. by tests via `import { app } from './server.js'`), the caller
// is responsible for connecting to a database and/or starting the listener.
// if (import.meta.url === `file://${process.argv[1]}`) {
//     startServer();
// }
if (env.nodeEnv !== 'test') {
    startServer();
}

async function gracefulShutdown(signal) {
    console.log(`\n Signal: ${signal}. Cleaning up....`)


    try {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
            console.log('HTTP server closed')
        }
        await closeDatabase();
        console.log('Database connection closed successfully');
        process.exit(signal === 'uncaughtException' ? 1 : 0)

    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

export { app, startServer };