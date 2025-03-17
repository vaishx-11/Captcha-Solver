



// // CODE TO INPUT TEXT AND CLICK ON VERIFY BUTTON

// (async function () {
//     // Function to find an element using XPath
//     const findElementByXPath = (xpath) => {
//       const result = document.evaluate(
//         xpath,
//         document,
//         null,
//         XPathResult.FIRST_ORDERED_NODE_TYPE,
//         null
//       );
//       return result.singleNodeValue;
//     };
//     const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
//     try {
//       // XPath for the input box and the button
//       const inputXPath = '//*[@id="root"]/div/input';  // Replace with your input box XPath
//       const buttonXPath = '//*[@id="root"]/div/button';  // Replace with your button XPath
  
//       // Find the input box and button elements
//       const inputElement = findElementByXPath(inputXPath);
//       const buttonElement = findElementByXPath(buttonXPath);
  
//       if (inputElement && buttonElement) {
//         // Insert "hello" into the input box
//         inputElement.value = "hello";
//         await delay(2000);
//         // Click the button
//         buttonElement.click();
//         console.log("Text inserted and button clicked.");
//       } else {
//         console.error("Input or button not found using the specified XPath.");
//       }
//     } catch (error) {
//       console.error("Error occurred while automating the process:", error);
//     }
//   })();
(async function () {
  // Function to find an element using XPath
  const findElementByXPath = (xpath) => {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  };

  try {
    // XPath for the input box and the button
    const inputXPath = '//*[@id="root"]/div/input';  // Replace with your input box XPath
    const buttonXPath = '//*[@id="root"]/div/button';  // Replace with your button XPath

    // Find the input box and button elements
    const inputElement = findElementByXPath(inputXPath);
    const buttonElement = findElementByXPath(buttonXPath);

    if (inputElement && buttonElement) {
      // Send request to Python server to get CAPTCHA result
      const imagePath = "C:\\Users\\Venka\\OneDrive\\Desktop\\captchasolver\\backend\\captcha.png";
 // Use the same path
      const response = await fetch('http://localhost:5000/predict_captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_path: imagePath }),
      });

      const data = await response.json();

      if (data.captcha_text) {
        // Insert the predicted text into the input box
        inputElement.value = data.captcha_text;
        console.log("Predicted text inserted: " + data.captcha_text);

        // Dispatch both change and input events to notify the browser
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);

        const changeEvent = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(changeEvent);

        // Add a small delay to ensure events are handled
        await new Promise(resolve => setTimeout(resolve, 500));

        // Trigger the button click programmatically
        buttonElement.click();
        console.log("Button clicked.");
      } else {
        console.error("Error getting CAPTCHA text:", data.error);
      }
    } else {
      console.error("Input or button not found using the specified XPath.");
    }
  } catch (error) {
    console.error("Error occurred while automating the process:", error);
  }
})();
