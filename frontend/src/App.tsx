import React, { useState } from 'react';
import ImageAnalyzer from './ImageAnalyzer';
import ImageGenerator from './ImageGenerator';
import './App.css'

// Define the AnalysisResult interface at the app level
interface AnalysisResult {
  altText: string;
  caption: string;
  [key: string]: any;
}

const App: React.FC = () => {
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [appView, setAppView] = useState<string>('Accesibility')
  const [isToggled, setIsToggled] = useState(false);

  const toggleHandler = () => {
    setIsToggled(!isToggled);
    isToggled ? setAppView('Accesibility') : setAppView('Generation');
  };
  
  // Handle analysis completion
  const handleAnalysisComplete = (result: AnalysisResult) => {
    setLastAnalysis(result);
    
    // You could also log analytics, save to local storage, etc.
    console.log('Analysis completed:', result);
  };
  
  return (
    <div className="app">
      <div>
        <button className='bg-blue-700 mb-6 w-xs p-[8px]' onClick={toggleHandler}>
          {`Switch to ${isToggled ? 'Image Accessibility Tool' : 'Image Generation Tool'}`}
        </button>
      </div>
      <header className="app-header">
        <h1 className='mb-4'>{appView === 'Accesibility' ? 'Image Accessibility Tool' : 'Image Generation Tool'}</h1>
        <p>{`${appView === 'Accesibility' ? 'Upload an image to generate alt text and captions for web accessibility' : 'Generate a custom image from a prompt'}`}</p>
      </header>
      
      <main>
        <>
        {appView === 'Generation' && 
          <ImageGenerator />
        }
        {appView === 'Accesibility' &&
          <ImageAnalyzer 
            maxFileSize={15 * 1024 * 1024} // 15MB
            onAnalysisComplete={handleAnalysisComplete}
          />
        }
          
        {lastAnalysis && appView === 'Accesibility' && (
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
        </>
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} - Image Accessibility Tool</p>
      </footer>
    </div>
  );
};

export default App;