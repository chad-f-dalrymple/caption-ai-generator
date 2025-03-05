import React, { useState } from 'react';
import ImageAnalyzer from './ImageAnalyzer';
import './App.css'

// Define the AnalysisResult interface at the app level
interface AnalysisResult {
  altText: string;
  caption: string;
  [key: string]: any;
}

const App: React.FC = () => {
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  
  // Handle analysis completion
  const handleAnalysisComplete = (result: AnalysisResult) => {
    setLastAnalysis(result);
    
    // You could also log analytics, save to local storage, etc.
    console.log('Analysis completed:', result);
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>Image Accessibility Tool</h1>
        <p>Upload an image to generate alt text and captions for web accessibility</p>
      </header>
      
      <main>
        <ImageAnalyzer 
          maxFileSize={15 * 1024 * 1024} // 15MB
          onAnalysisComplete={handleAnalysisComplete}
        />
        
        {lastAnalysis && (
          <div className="analysis-history">
            <h3>Recent Analysis Stats</h3>
            <p>Alt text length: {lastAnalysis.altText.length} characters</p>
            <p>Caption length: {lastAnalysis.caption.length} characters</p>
            
            {/* Display any additional metrics from the analysis */}
            {lastAnalysis.confidenceScore && (
              <p>Confidence Score: {(lastAnalysis.confidenceScore * 100).toFixed(1)}%</p>
            )}
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} - Image Accessibility Tool</p>
      </footer>
    </div>
  );
};

export default App;