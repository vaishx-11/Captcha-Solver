import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import yayGif from './yay.gif'; // Import the local GIF file

const Text = () => {
  const [captchaImage, setCaptchaImage] = useState(''); // URL for CAPTCHA image
  const [userInput, setUserInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false); // To manage button state
  const [isVerified, setIsVerified] = useState(false); // Track CAPTCHA verification status

  // Fetch CAPTCHA from the backend
  const fetchCaptcha = async () => {
    try {
      const response = await axios.get('http://localhost:5003/api/captcha'); // No need for responseType: 'blob'
      setCaptchaImage(`${response.data.url}?${new Date().getTime()}`); // Add a timestamp to avoid caching
    } catch (error) {
      toast.error('Failed to load CAPTCHA. Please try again.');
      console.error('Error fetching CAPTCHA:', error);
    }
  };

  // Verify the CAPTCHA input
  const verifyCaptcha = async () => {
    setIsVerifying(true); // Disable button during verification
    try {
      const response = await axios.post('http://localhost:5003/api/verify-captcha', {
        inputCaptcha: userInput.trim(),
      });

      if (response.data.success) {
        toast.success(response.data.message); // Show success message
        setIsVerified(true); // Set verification status to true
      } else {
        toast.error(response.data.message); // Show failure message
      }
    } catch (error) {
      toast.error('Verification Failed. Try Again!');
      console.error('Error verifying CAPTCHA:', error);
    } finally {
      fetchCaptcha(); // Refresh CAPTCHA after each attempt
      setUserInput(''); // Clear input field
      setIsVerifying(false); // Re-enable button
    }
  };

  useEffect(() => {
    fetchCaptcha(); // Load CAPTCHA on component mount
  }, []);

  return (
    <div className="relative text-white bg-black font-mono w-full h-screen flex flex-col items-center justify-start pt-10">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />

      {isVerified ? (
        // Content to display after successful verification
        <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl mb-4">Congrats! You’re officially human! 🎉</h1>
        <img
          src={yayGif} // Use the imported GIF
          alt="Success"
          className="w-48 h-auto" // Adjust the size as needed
        />
      </div>
      ) : (
        // Content to display before verification
        <>
          <h1 className="text-4xl">Text CAPTCHA</h1>

          {captchaImage && (
            <img
              src={captchaImage}
              alt="CAPTCHA"
              className="scale-150 mt-32 bg-white"
            />
          )}

          <input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="mt-12 p-2 bg-black border-b-2 border-white w-64 text-center text-2xl outline-none transition-all duration-700 ease-in-out focus:border-b-4 focus:text-3xl"
            placeholder="Type CAPTCHA"
          />

          <button
            disabled={isVerifying}
            className={`bg-black p-4 w-64 mt-4 text-3xl border-white border-2 transition-all duration-300 ease-in-out hover:bg-white hover:text-black ${
              isVerifying ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={verifyCaptcha}
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </>
      )}
    </div>
  );
};

export default Text;