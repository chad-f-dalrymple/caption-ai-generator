import React, { useState, useRef, ChangeEvent } from 'react';
import { FaCopy } from "react-icons/fa";
import { 
  uploadImageForAnalysis, 
  createImagePreview, 
  generateHtmlCode, 
  copyToClipboard,
} from './utils/utils'; // Assuming the previous TypeScript utilities are in this file

// Define component prop types
interface ImageAnalyzerProps {
  maxFileSize?: number; // Optional override for max file size in bytes
  onAnalysisComplete?: (result: AnalysisResult) => void; // Optional callback
}

// Define component state types
interface AnalysisResult {
  altText: string;
  caption: string;
  [key: string]: any;
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ 
  maxFileSize = 10 * 1024 * 1024, // Default 10MB
  onAnalysisComplete 
}) => {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError('');
    setCopied(false);
    setAnalysis(null);
    setHtmlCode('');
    
    const selectedFile = e.target.files && e.target.files[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Validate file size
    if (selectedFile.size > maxFileSize) {
      setError(`Image is too large. Please select an image under ${maxFileSize / (1024 * 1024)}MB.`);
      return;
    }
    
    // Set the file and create preview
    setFile(selectedFile);
    createImagePreview(selectedFile, (dataUrl: string) => {
      setPreviewUrl(dataUrl);
    });
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };


  
  // Handle analyze button click
  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select an image file first.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Upload and analyze the image
      const result = await uploadImageForAnalysis(file);
      
      // Update state with results
      setAnalysis(result);
      
      // Generate HTML code
      const html = generateHtmlCode(
        file.name, 
        result.altText, 
        result.caption
      );
      setHtmlCode(html);
      
      // Call the optional callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle copy HTML code
  const handleCopyCode = async () => {
    if (!htmlCode) return;
    
    const success = await copyToClipboard(htmlCode);
    setCopied(success);
    
    // Reset copied status after 3 seconds
    if (success) {
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
  };

  const fixSeparatedFirstLetters = (inputString: string) => {
    const pattern = /\b([A-Z])\s+([a-z]+)\b/g;
    // Replace pattern with the first letter followed directly by the rest of the word
    return inputString.replace(pattern, (match, firstLetter, restOfWord) => {
      return `${firstLetter}${restOfWord}`;
    });
  }
  
  const capitalizeFirstLetter = (sentence: string) =>  sentence.charAt(0).toUpperCase() + sentence.slice(1);


  return (
    <div className="image-analyzer">
      {/* File input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      {/* Upload button */}
      <div className="upload-section flex flex-col items-center">
        <button 
          className="upload-button bg-blue-700 mt-6 mb-6 w-2xs p-[8px]"
          onClick={triggerFileInput}
          disabled={isLoading}
        >
          Select Image
        </button>
        <button
            className="analyze-button bg-blue-700 mb-6 w-2xs p-[8px]"
            onClick={handleAnalyze}
            disabled={isLoading || !file}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
        </button>
        
        {file && (
          <div className="file-info">
            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>
      <div className='flex flex-row justify-center'>
        {/* Preview section */}
        {previewUrl && (
          <div className="preview-section mr-10">
            <h2 className='text-xl font-bold mb-4'>Preview</h2>
            <div className="image-preview m-auto mt-8 mb-8">
              <img src={previewUrl} alt="Preview" />
            </div>
          </div>
        )}

        {/* Analysis results */}
        {analysis && (
          <div className="analysis-results w-lg">
            <h2 className='text-xl font-bold mb-4'>Analysis Results</h2>
            
            <div className="result-item mb-4">
            <span className='text-lg font-bold'>Alt Text</span>
              <p className='text-left'>{fixSeparatedFirstLetters(analysis.altText)}</p>
            </div>
            
            <div className="result-item mb-4">
            <span className='text-lg font-bold'>Caption</span>
              <p className='text-left'>{capitalizeFirstLetter(analysis.caption)}</p>
            </div>
            
            <div className="html-code mb-4">
              <span className='text-lg font-bold'>Generated HTML</span>
              <pre><code>{htmlCode}</code></pre>
              
              <button
                className="copy-button"
                onClick={handleCopyCode}
                disabled={!htmlCode}
              >
                <span className='flex flex-row items-center'>
                  <FaCopy style={{ verticalAlign: 'middle', marginRight: '6px' }} /> 
                  <span>{copied ? 'Copied!' : 'Copy HTML'}</span>
                </span>
              </button>
              
            </div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;