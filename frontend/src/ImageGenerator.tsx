import React, {useState} from 'react';
import { generateImageFromText } from './utils/utils';

const ImageGenerator = () => {
      const [prompt, setPrompt] = useState<string>('a tiger doing a handstand');
      const [imgUrl, setImgUrl] = useState<string>('')
      const [isGenerating, setIsGenerating] = useState<boolean>(false)
      const [error, setError] = useState<string>('');
  const handleImageGeneration = async () => {
    try {
      if (!prompt) {
        setError('Please enter a prompt first')
        return;
      }
      setIsGenerating(true)
      const result = await generateImageFromText(prompt)
      if (result) {
        // set generated image
        setImgUrl(result)
        setIsGenerating(false)
      }
    } catch (err) {
      setIsGenerating(false)
      console.log('could not generate image:', err.message)
    }
  }

    const downloadImage = () => {
        if (imgUrl) {
          const link = document.createElement('a');
          link.href = imgUrl;
          link.download = 'generated_image.png'; // Set the download filename
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link); // Clean up
        }
      };
    return (
      <>
        <div className='flex flex-col items-center'>
            <input
                className='bg-white text-zinc-800 p-[8px] w-sm mb-6 mt-8'
                value={prompt}
                type='text'
                onChange={(e) => setPrompt(e.target.value)}
            />
            {!isGenerating &&
            <button
                className='bg-blue-700 mb-6 w-2xs p-[8px]'
                onClick={handleImageGeneration}
            >
                Send prompt
            </button>
            }
            {isGenerating && <p>Generating Image...</p>}
        </div>
        {imgUrl && 
            <div className='justify-items-center'>
              <img src={imgUrl} alt="img from blob" />
              <button onClick={downloadImage}>Download Image</button>
            </div>
        }
      </>
    )
}

export default ImageGenerator;