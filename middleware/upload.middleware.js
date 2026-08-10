import { env } from "../config/env.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecretKey
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "Reddit-clone",
        allowed_formats: ["jpeg", "jpg", "png", "webp"],
    }
});

const fileFilter = (req, file, cb) => {
    // Define allowed MIME types
    const mimetype = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    
    // Check if file.mimetype matches
    if (mimetype.includes(file.mimetype)) {
        // Accept file
        cb(null, true);
    } else {
        // Reject file with an error
        cb(new Error("Only images (jpeg, jpg, png, webp) are allowed!"), false);
    }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: env.uploadLimitMb * 1024 * 1024 } });

export default upload;