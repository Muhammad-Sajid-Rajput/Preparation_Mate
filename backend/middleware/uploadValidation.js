const multer = require('multer');
const path = require('path');

const ALLOWED_MAPPING = {
  pdf: {
    mime: ['application/pdf'],
    ext: ['.pdf'],
    maxSize: 20 * 1024 * 1024 // 20MB
  },
  resume: {
    mime: ['application/pdf'],
    ext: ['.pdf'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  doc: {
    mime: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    ext: ['.pdf', '.doc', '.docx', '.txt'],
    maxSize: 15 * 1024 * 1024 // 15MB
  },
  image: {
    mime: ['image/jpeg', 'image/png', 'image/webp'],
    ext: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSize: 5 * 1024 * 1024 // 5MB
  }
};

/**
 * Generate a safe filename by replacing spaces and special characters.
 * @param {string} originalName 
 * @returns {string} Safe filename
 */
const getSafeFilename = (originalName) => {
  if (!originalName) return `file_${Date.now()}`;
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const safeBase = base
    .replace(/[^a-zA-Z0-9]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')           // Deduplicate consecutive underscores
    .substring(0, 100);            // Limit length
  return `${safeBase}${ext.toLowerCase()}`;
};

/**
 * Reusable multer-based upload validation middleware creator.
 * @param {string} type - 'pdf' | 'resume' | 'doc' | 'image'
 */
const validateUpload = (type) => {
  const config = ALLOWED_MAPPING[type];
  if (!config) {
    throw new Error(`Invalid upload configuration type: ${type}`);
  }

  const uploader = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxSize },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const isMimeValid = config.mime.includes(file.mimetype);
      const isExtValid = config.ext.includes(ext);

      if (isMimeValid && isExtValid) {
        // Mutate originalname to be a safe name for downstream services
        file.originalname = getSafeFilename(file.originalname);
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed extensions: ${config.ext.join(', ')}`));
      }
    }
  });

  return (req, res, next) => {
    uploader.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next();
    });
  };
};

module.exports = {
  validateUpload,
  getSafeFilename
};
