import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Upload an image and get G-code
 * @param {File} imageFile - The image file to convert
 * @returns {Promise<string>} - The generated G-code text
 */
export async function convertImageToGcode(imageFile) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post(`${API_BASE_URL}/convert`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 second timeout for large images
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.error || 'Failed to convert image');
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Make sure the backend is running.');
    } else {
      // Error setting up request
      throw new Error(error.message);
    }
  }
}

/**
 * Check API health status
 * @returns {Promise<object>} - Health check response
 */
export async function checkHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  } catch (error) {
    throw new Error('API is not responding');
  }
}
