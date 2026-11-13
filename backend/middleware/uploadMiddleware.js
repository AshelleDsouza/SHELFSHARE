const multer = require('multer');
const path = require('path');

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/octet-stream', // Some browsers report docx/pptx as octet-stream
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx']);

// Memory storage is optimal for serverless environments (e.g. Vercel)
// Files are held in memory buffer and streamed to Cloudinary or written locally
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new Error(
        `Unsupported file extension: ${ext}. Only PDF, DOC, DOCX, PPT, and PPTX files are permitted.`
      ),
      false
    );
  }

  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new Error(`Unsupported MIME type: ${file.mimetype}. Please upload a valid document format.`),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Megabytes limit
  },
});

module.exports = upload;
