import 'dotenv/config';
const required = (key, fallback = undefined) => {
    const value = process.env[key] ?? fallback;

    //
    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${key}`)
    } return value;

    
};

export const env = {

    //Server
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
    port: parseInt(process.env.NODE_PORT || "7000", 10),

    //Uploads
    uploadLimitMb: parseInt(process.env.UPLOAD_LIMIT_MB || '5', 10),

    //Database
    mongoURI: required("MONGO_URI"),

    // Frontend & CORS
    frontendURI: process.env.FRONTEND_URI || 'http://localhost:5173',
    corsOrigins: (process.env.CORS_ORIGIN || "").split(",").map((O) => O.trim()).filter(Boolean),

    //JWT
    jwtAccessSecret: required("JWT_SECRET"),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

    //Cloudinary
    cloudinaryApiSecretKey: required("CLOUDINARY_API_SECRET_KEY"),
    cloudinaryApiKey: required("CLOUDINARY_API_KEY"),
    cloudinaryCloudName: required("CLOUDINARY_CLOUD_NAME")
};