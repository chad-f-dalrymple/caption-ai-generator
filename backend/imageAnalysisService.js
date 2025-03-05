import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Analyzes an image using Hugging Face models with robust fallback strategies
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Object>} - Object containing altText and caption
 */
export async function analyzeImageWithAI(imagePath) {
  try {
    const huggingfaceToken = process.env.HUGGINGFACE_API_TOKEN;
    
    console.log('------------------------------------------------------------');
    console.log('Starting image analysis');
    console.log('HF Token exists:', !!huggingfaceToken);
    console.log('Token first 4 chars:', huggingfaceToken ? huggingfaceToken.substring(0, 4) : 'none');
    console.log('Image path:', imagePath);
    console.log('------------------------------------------------------------');
    
    if (!huggingfaceToken) {
      console.warn('No Hugging Face API token found in .env file. Please add HUGGINGFACE_API_TOKEN to your .env file.');
      return getMockAnalysisResults();
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Define all available models grouped by functionality
    const models = {
      caption: [
        'nlpconnect/vit-gpt2-image-captioning',
        'Salesforce/blip-image-captioning-base',
        'openai/clip-vit-base-patch32' // Different approach but can work
      ],
      analysis: [
        'microsoft/git-base-coco',
        'nlpconnect/vit-gpt2-image-captioning', // Can double as analysis in a pinch
        'salesforce/blip-image-captioning-base' // Can also double as analysis
      ],
      classification: [
        'microsoft/resnet-50',
        'facebook/deit-base-distilled-patch16-224',
        'google/vit-base-patch16-224'
      ]
    };
    
    // Results object that we'll build up
    let results = {
      captionSuccess: false,
      analysisSuccess: false,
      classificationSuccess: false,
      captionText: '',
      analysisText: '',
      classifications: []
    };
    
    // Try caption models
    for (const model of models.caption) {
      if (results.captionSuccess) break;
      
      try {
        console.log(`Trying caption model: ${model}`);
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${model}`,
          imageBuffer,
          {
            headers: {
              'Authorization': `Bearer ${huggingfaceToken}`,
              'Content-Type': 'application/octet-stream'
            },
            responseType: 'json',
            timeout: 15000 // Shorter timeout to try more models
          }
        );
        
        // Different models have different response formats
        if (response.data && Array.isArray(response.data) && response.data[0]?.generated_text) {
          results.captionText = response.data[0].generated_text;
          results.captionSuccess = true;
          console.log(`Caption success with ${model}: ${results.captionText}`);
        } else if (response.data && typeof response.data === 'object' && response.data.generated_text) {
          results.captionText = response.data.generated_text;
          results.captionSuccess = true;
          console.log(`Caption success with ${model}: ${results.captionText}`);
        } else if (response.data && typeof response.data === 'string') {
          results.captionText = response.data;
          results.captionSuccess = true;
          console.log(`Caption success with ${model}: ${results.captionText}`);
        } else {
          console.log(`Unexpected response format from ${model}:`, response.data);
        }
      } catch (error) {
        console.log(`Caption model ${model} failed:`, error.message);
      }
    }
    
    // Try analysis models (if caption didn't work, we'll skip this to save time)
    if (results.captionSuccess) {
      for (const model of models.analysis) {
        if (results.analysisSuccess) break;
        
        try {
          console.log(`Trying analysis model: ${model}`);
          const response = await axios.post(
            `https://api-inference.huggingface.co/models/${model}`,
            imageBuffer,
            {
              headers: {
                'Authorization': `Bearer ${huggingfaceToken}`,
                'Content-Type': 'application/octet-stream'
              },
              responseType: 'json',
              timeout: 15000
            }
          );
          
          // Different models have different response formats
          if (response.data && Array.isArray(response.data) && response.data[0]?.generated_text) {
            results.analysisText = response.data[0].generated_text;
            results.analysisSuccess = true;
            console.log(`Analysis success with ${model}: ${results.analysisText.substring(0, 50)}...`);
          } else if (response.data && typeof response.data === 'object' && response.data.generated_text) {
            results.analysisText = response.data.generated_text;
            results.analysisSuccess = true;
            console.log(`Analysis success with ${model}: ${results.analysisText.substring(0, 50)}...`);
          } else if (response.data && typeof response.data === 'string') {
            results.analysisText = response.data;
            results.analysisSuccess = true;
            console.log(`Analysis success with ${model}: ${results.analysisText.substring(0, 50)}...`);
          } else {
            console.log(`Unexpected response format from ${model}:`, response.data);
          }
        } catch (error) {
          console.log(`Analysis model ${model} failed:`, error.message);
        }
      }
    }
    
    // Try classification models (if we got at least a caption, otherwise skip)
    if (results.captionSuccess) {
      for (const model of models.classification) {
        if (results.classificationSuccess) break;
        
        try {
          console.log(`Trying classification model: ${model}`);
          const response = await axios.post(
            `https://api-inference.huggingface.co/models/${model}`,
            imageBuffer,
            {
              headers: {
                'Authorization': `Bearer ${huggingfaceToken}`,
                'Content-Type': 'application/octet-stream'
              },
              responseType: 'json',
              timeout: 15000
            }
          );
          
          // Handle response
          if (response.data && Array.isArray(response.data)) {
            results.classifications = response.data
              .slice(0, 3)
              .map(item => item.label || item.generated_text || item)
              .filter(label => typeof label === 'string');
            
            if (results.classifications.length > 0) {
              results.classificationSuccess = true;
              console.log(`Classification success with ${model}: ${results.classifications.join(', ')}`);
            }
          }
        } catch (error) {
          console.log(`Classification model ${model} failed:`, error.message);
        }
      }
    }
    
    // Did we get any useful results?
    if (!results.captionSuccess) {
      console.log('All caption models failed. Using mock data.');
      return getMockAnalysisResults();
    }
    
    // Format the results
    console.log('results:', results)
    const altText = formatAltText(results.captionText);
    
    // Create caption based on available data
    let caption;
    if (results.analysisSuccess && results.analysisText) {
      caption = formatCaption(results.analysisText, results.captionText, results.classifications.join(', '));
    } else if (results.classificationSuccess) {
      caption = `${results.captionText}. This image contains: ${results.classifications.join(', ')}.`;
    } else {
      caption = results.captionText;
    }
    
    return {
      altText,
      caption
    };
  } catch (error) {
    console.error('Error in analyzeImageWithAI:', error);
    return getMockAnalysisResults();
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