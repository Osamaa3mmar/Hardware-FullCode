import { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import GcodeViewer from './components/GcodeViewer';
import { convertImageToGcode } from './api';
import './App.css';

function App() {
  const [gcode, setGcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (imageFile) => {
    setIsLoading(true);
    setError(null);
    setGcode('');

    try {
      const generatedGcode = await convertImageToGcode(imageFile);
      setGcode(generatedGcode);
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🖊️ Image to G-code Converter</h1>
        <p>Convert images into pen plotter G-code commands</p>
      </header>

      <main className="app-main">
        <ImageUploader 
          onUpload={handleImageUpload} 
          isLoading={isLoading}
        />

        {error && (
          <div className="error-message">
            <h3>⚠️ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {gcode && <GcodeViewer gcode={gcode} />}

        {!gcode && !error && !isLoading && (
          <div className="instructions">
            <h2>How to use:</h2>
            <ol>
              <li>Upload an image file (JPG, PNG, BMP, etc.)</li>
              <li>Click "Generate G-code" to convert the image</li>
              <li>Download or copy the generated G-code</li>
              <li>Send the G-code to your pen plotter</li>
            </ol>
            <div className="tips">
              <h3>Tips for best results:</h3>
              <ul>
                <li>Use high-contrast images with clear outlines</li>
                <li>Simple line art works better than photographs</li>
                <li>Black and white images produce cleaner results</li>
                <li>Keep file size under 10MB</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by React + Node.js | Using Potrace vectorization</p>
      </footer>
    </div>
  );
}

export default App;
