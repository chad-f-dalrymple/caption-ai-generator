import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Analyzes an image using Hugging Face models
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} - Object containing altText and caption
 */
export async function analyzeImageWithAI(imagePath) {
  try {
    const huggingfaceToken = process.env.HUGGINGFACE_API_TOKEN;
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // First, get a descriptive caption using a captioning model
    const captionResponse = await axios.post(
      'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large',
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${huggingfaceToken}`,
          'Content-Type': 'application/octet-stream'
        },
        responseType: 'json'
      }
    );
    
    // Basic caption from the model
    const basicCaption = captionResponse.data[0]?.generated_text || 'Image without description';
    
    // Then, get more detailed image analysis from a vision-language model
    const analysisResponse = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/git-large-coco',
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${huggingfaceToken}`,
          'Content-Type': 'application/octet-stream'
        },
        responseType: 'json'
      }
    );
    
    // Get detailed analysis
    const detailedAnalysis = analysisResponse.data[0]?.generated_text || '';
    
    // Optional: Get image classification for additional context
    const classificationResponse = await axios.post(
      'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${huggingfaceToken}`,
          'Content-Type': 'application/octet-stream'
        },
        responseType: 'json'
      }
    );
    
    // Get top classifications/tags
    const classifications = classificationResponse.data
      .slice(0, 3)
      .map(item => item.label)
      .join(', ');
    
    // Create the alt text (keep it concise)
    const altText = basicCaption;
    
    // Create a more detailed caption by combining information
    const caption = detailedAnalysis || 
      `${basicCaption}. This image contains: ${classifications}.`;
    
    return {
      altText: altText,
      caption: caption
    };
  } catch (error) {
    console.error('Error in AI service:', error);
    throw new Error('Failed to process image with AI service');
  }
}

/**
 * Process the uploaded image
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Analysis results
 */
export async function processUploadedImage(req) {
  if (!req.file) {
    throw new Error('No image file provided');
  }

  // Get the path to the uploaded file
  const imagePath = req.file.path;

  try {
    // Analyze the image
    const results = await analyzeImageWithAI(imagePath);
    
    // Delete the uploaded file after analysis (optional)
    fs.unlinkSync(imagePath);
    
    return results;
  } catch (error) {
    // Clean up the file on error
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    throw error;
  }
}

export default {
  analyzeImageWithAI,
  processUploadedImage
};