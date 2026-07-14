const cloudinary = require('../../config/cloudinary');

/**
 * Upload a buffer to Cloudinary with public access mode configuration.
 * @param {Buffer} buffer 
 * @param {string} folder - 'notes' | 'resumes'
 * @param {string} filename 
 * @returns {Promise<{ url: string, publicId: string }>} Secure URL and public ID
 */
exports.uploadFile = (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    // Generate a safe unique ID
    const sanitizedFilename = filename.replace(/\s+/g, '_');
    const publicId = `${Date.now()}_${sanitizedFilename}`;

    // Treat PDFs as 'image' resource type to allow inline browser preview.
    // Word documents, txt, and other files are treated as 'raw' binary attachments.
    const isPdf = filename.toLowerCase().endsWith('.pdf');
    const resourceType = isPdf ? 'image' : 'raw';

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder,
        public_id:     publicId,
        overwrite:     false,
        type:          'upload',    // Force standard delivery asset
        access_mode:   'public',    // Allow public retrieval
      },
      (error, result) => {
        if (error) {
          console.error('[cloudinaryService] Upload stream error:', error);
          return reject(error);
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary by public ID.
 * @param {string} publicId 
 * @returns {Promise<void>}
 */
exports.deleteFile = async (publicId) => {
  if (!publicId) return;
  try {
    // If the publicId does not contain a dot (file extension), it was uploaded as 'image' (PDF).
    // If it contains a dot, it was uploaded as 'raw' (DOCX, TXT, etc.).
    const hasExtension = publicId.includes('.');
    const resourceType = hasExtension ? 'raw' : 'image';

    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`[cloudinaryService] Deleted file ${publicId} (${resourceType}) successfully.`);
  } catch (err) {
    console.error(`[cloudinaryService] Failed to delete file ${publicId}:`, err.message);
    throw err;
  }
};
