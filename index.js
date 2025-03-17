const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const svgCaptcha = require('svg-captcha');
const svg2img = require('svg2img'); // Install this: npm install svg2img
const Jimp = require('jimp'); // Install this: npm install jimp
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());

let currentCaptcha = ''; // Stores the current CAPTCHA text

// Serve CAPTCHA as a PNG image with white background
app.get('/api/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 5,
    ignoreChars: '01lABCDEFGHIJKLMNOPQRSTUVWXYZ',
    noise: 3,
    color: false,
    width: "150"
  }); // Generate the CAPTCHA SVG
  currentCaptcha = captcha.text.toLowerCase(); // Store the text for verification

  // Convert SVG to PNG
  svg2img(captcha.data, { format: 'png' }, async (error, buffer) => {
    if (error) {
      console.error('Error converting SVG to PNG:', error);
      return res.status(500).json({ success: false, message: 'Failed to generate CAPTCHA.' });
    }

    try {
      // Load the PNG buffer into Jimp
      const image = await Jimp.read(buffer);

      // Create a white background and composite the CAPTCHA image onto it
      const captchaImage = new Jimp(image.bitmap.width, image.bitmap.height, 0xffffffff); // White background
      captchaImage.composite(image, 0, 0);

      // Save the processed image to a file
      const captchaPath = path.join(__dirname, 'captcha.png');
      await captchaImage.writeAsync(captchaPath);

      // Respond with the URL of the CAPTCHA image
      res.json({ url: `${req.protocol}://${req.get('host')}/captcha.png` });
    } catch (jimpError) {
      console.error('Error processing CAPTCHA image with Jimp:', jimpError);
      res.status(500).json({ success: false, message: 'Failed to process CAPTCHA image.' });
    }
  });
});

// Serve the saved CAPTCHA image
app.use('/captcha.png', (req, res) => {
  const captchaPath = path.join(__dirname, 'captcha.png');
  res.sendFile(captchaPath);
});

// Verify the CAPTCHA input
app.post('/api/verify-captcha', (req, res) => {
  const { inputCaptcha } = req.body;

  if (!inputCaptcha) {
    console.log('no text');
    return res.status(400).json({ success: false, message: 'Input is required.' });
  }

  if (inputCaptcha.toLowerCase() === currentCaptcha) {
    currentCaptcha = ''; // Clear CAPTCHA after successful verification

    // Delete the CAPTCHA image after successful verification
    const captchaPath = path.join(__dirname, 'captcha.png');
    if (fs.existsSync(captchaPath)) {
      fs.unlinkSync(captchaPath);
    }

    return res.status(200).json({ success: true, message: 'Verification Successful!' });
  } else {
    return res.status(400).json({ success: false, message: 'Verification Failed. Try Again!' });
  }
});

// Start the server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));