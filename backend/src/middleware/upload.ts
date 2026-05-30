import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Ensure uploads folder exists in parent project directory
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage (Temporary and local fallback storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, PNG and WEBP image uploads are allowed!'));
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  try {
    // If Cloudinary keys are missing, keep the local upload and return the relative path
    if (
      !process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.log('Cloudinary not configured. Serving upload locally.');
      return `/uploads/${file.filename}`;
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'grocery-expiry-tracker'
    });

    // Delete local temp file
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error('Failed to delete temp file:', err);
    }

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failed, falling back to local storage URL:', error);
    return `/uploads/${file.filename}`;
  }
};
