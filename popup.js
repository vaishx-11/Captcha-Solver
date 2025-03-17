document.getElementById("solveCaptcha").addEventListener("click", async () => {
  // Execute a script in the active tab to extract the CAPTCHA
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["contentScript.js"]
    });
  } catch (error) {
    console.error("Error injecting script:", error);
  }
});
