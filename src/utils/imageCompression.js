// Use the browser-image-compression library you already have installed
import imageCompression from 'browser-image-compression';

export const compressImageOptimized = async (file) => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 600,
    useWebWorker: true,
    fileType: 'image/jpeg',
    quality: 0.7
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Image compression failed:', error);
    return file;
  }
};