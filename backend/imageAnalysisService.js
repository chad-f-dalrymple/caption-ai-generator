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
    
    if (!huggingfaceToken) {
      console.warn('No Hugging Face API token found in .env file. Please add HUGGINGFACE_API_TOKEN to your .env file.');
      return getMockAnalysisResults();
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    try {
      // First, get a descriptive caption using a captioning model
      console.log('Requesting caption from Hugging Face API...');
      const captionResponse = await axios.post(
        'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
        imageBuffer,
        {
          headers: {
            'Authorization': `Bearer ${huggingfaceToken}`,
            'Content-Type': 'application/octet-stream'
          },
          responseType: 'json',
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      // Check the response structure
      console.log('Caption API response structure:', JSON.stringify(captionResponse.data).slice(0, 200) + '...');
      
      // Basic caption from the model
      const basicCaption = captionResponse.data[0]?.generated_text || 'Image without description';
      console.log('Received basic caption:', basicCaption);
      
      // Then, get more detailed image analysis from a vision-language model
      console.log('Requesting detailed analysis from Hugging Face API...');
      const analysisResponse = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/git-large-coco',
        imageBuffer,
        {
          headers: {
            'Authorization': `Bearer ${huggingfaceToken}`,
            'Content-Type': 'application/octet-stream'
          },
          responseType: 'json',
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      // Get detailed analysis
      const detailedAnalysis = analysisResponse.data[0]?.generated_text || '';
      console.log('Received detailed analysis of length:', detailedAnalysis.length);
      
      // Optional: Get image classification for additional context
      console.log('Requesting classification from Hugging Face API...');
      const classificationResponse = await axios.post(
        'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
        imageBuffer,
        {
          headers: {
            'Authorization': `Bearer ${huggingfaceToken}`,
            'Content-Type': 'application/octet-stream'
          },
          responseType: 'json',
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      // Get top classifications/tags
      const classifications = classificationResponse.data
        .slice(0, 3)
        .map(item => item.label)
        .join(', ');
      console.log('Received classifications:', classifications);
      
      // Create the alt text (keep it concise)
      const altText = formatAltText(basicCaption);
      
      // Create a more detailed caption by combining information
      const caption = formatCaption(detailedAnalysis, basicCaption, classifications);
      
      return {
        altText,
        caption
      };
    } catch (error) {
      console.error('Error calling Hugging Face API:');
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from API. Network issue or API service down.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      console.log('Falling back to mock data due to API error');
      return getMockAnalysisResults();
    }
  } catch (error) {
    console.error('Error in analyzeImageWithAI:', error);
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
  console.log(`Processing uploaded image at path: ${imagePath}`);

  try {
    // Analyze the image
    const results = await analyzeImageWithAI(imagePath);
    
    // Delete the uploaded file after analysis (optional)
    // Uncomment this if you want to delete files after processing
    // fs.unlinkSync(imagePath);
    
    return results;
  } catch (error) {
    // Clean up the file on error
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    throw error;
  }
}

/**
 * Formats the alt text to be concise and appropriate
 * @param {string} text - Raw text from the model
 * @returns {string} - Formatted alt text
 */
function formatAltText(text) {
  // Remove any periods at the end
  let altText = text.trim();
  if (altText.endsWith('.')) {
    altText = altText.slice(0, -1);
  }
  
  // Ensure it starts with a capital letter
  altText = altText.charAt(0).toUpperCase() + altText.slice(1);
  
  // Limit length to ~125 characters (standard for alt text)
  if (altText.length > 125) {
    altText = altText.substring(0, 122) + '...';
  }
  
  return altText;
}

/**
 * Formats the caption to be more detailed and informative
 * @param {string} detailedText - Detailed analysis from the model
 * @param {string} basicCaption - Basic caption from the model
 * @param {string} classifications - Classification tags
 * @returns {string} - Formatted caption
 */
function formatCaption(detailedText, basicCaption, classifications) {
  // If we have a good detailed analysis, use it
  if (detailedText && detailedText.length > basicCaption.length) {
    // Clean up the detailed text (sometimes models add weird prefixes)
    let cleanText = detailedText.replace(/^(Caption: |Description: |Image shows: )/, '');
    return cleanText;
  }
  
  // Otherwise, combine the basic caption with classifications
  let caption = basicCaption;
  
  // Add classifications if available
  if (classifications && classifications.length > 0) {
    caption += ` The image contains: ${classifications}.`;
  }
  
  return caption;
}

/**
 * Provides mock results when API is unavailable
 * @returns {Object} - Mock analysis results
 */
function getMockAnalysisResults() {
  return {
    altText: "Example image showing content that would normally be analyzed by AI",
    caption: "This is a placeholder caption for demonstration purposes. In production, this would be replaced with AI-generated analysis describing the content, context, and details of the uploaded image."
  };
}

export default {
  analyzeImageWithAI,
  processUploadedImage
};