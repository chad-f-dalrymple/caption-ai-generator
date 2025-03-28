/**
 * Utility functions for handling image uploads and processing
 */

/**
 * Type for analysis results returned from the backend
 */
interface AnalysisResult {
    altText: string;
    caption: string;
    [key: string]: any; // For any additional properties the API might return
  }
  
  /**
   * Upload an image to the backend for analysis
   * @param {File} file - The image file to upload
   * @returns {Promise<AnalysisResult>} - The analysis results with altText and caption
   */
export async function uploadImageForAnalysis(file: File): Promise<AnalysisResult> {
    // Validate the file
    if (!file || !file.type.match('image.*')) {
        throw new Error('Please select a valid image file');
    }

    // Check file size (limit to 10MB)
    const MAX_SIZE: number = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
        throw new Error('Image is too large. Please select an image under 10MB.');
    }

    // Create form data
    const formData: FormData = new FormData();
    formData.append('image', file);

    try {
        // Send the request to the backend API
        const response: Response = await fetch('/api/analyze-image', {
            method: 'POST',
            body: formData
        });
        
        // Check if request was successful
        if (!response.ok) {
            const errorData: { error?: string } = await response.json();
            throw new Error(errorData.error || 'Failed to analyze image');
        }
        
        // Parse and return the data
        const data: AnalysisResult = await response.json();
        return data;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}
  
  /**
   * Create a preview of the image before uploading
   * @param {File} file - The image file to preview
   * @param {Function} callback - Function to call with the image data URL
   */
export function createImagePreview(file: File, callback: (dataUrl: string) => void): void {
    if (!file || !file.type.match('image.*')) {
        return;
    }

    const reader: FileReader = new FileReader();

    reader.onload = function(e: ProgressEvent<FileReader>) {
        if (e.target && e.target.result) {
        callback(e.target.result as string);
        }
    };

    reader.readAsDataURL(file);
}
  
  /**
   * Generate HTML code using the alt text and caption
   * @param {string} imageName - Name of the image file
   * @param {string} altText - The alt text for accessibility
   * @param {string} caption - The detailed caption
   * @returns {string} - Generated HTML code
   */
export function generateHtmlCode(imageName: string, altText: string, caption: string): string {
    return `<figure>
        <img src="${imageName}" alt="${altText}">
        <figcaption>${caption}</figcaption>
    </figure>`;
}
  
  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} - Whether the copy was successful
   */
export async function copyToClipboard(text: string): Promise<boolean> {
try {
    // Modern approach using Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
    }
    
    // Fallback for older browsers
    const textArea: HTMLTextAreaElement = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success: boolean = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
} catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
}
}

  /**
   * Generate image using the provided prompt
   * @param {string} prompt - Name of the image file
   */
export async function generateImageFromText(prompt: string): Promise<any> {    
    try {
        // Send the request to the backend API
        const response: Response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        // Check if request was successful
        if (!response.ok) {
            const errorData: { error?: string } = await response.json();
            throw new Error(errorData.error || 'Failed to analyze image');
        }
        
        // Parse and return the data
        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );
        return `data:image/png;base64,${base64}`;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}