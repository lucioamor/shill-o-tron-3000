document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('detectShills').addEventListener('click', function() {
    console.log('Manual detect triggered (optional)');
    chrome.runtime.sendMessage({ action: 'authenticate' }, () => {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "detectShills"});
        window.close(); // Close popup after triggering
      });
    });
  });
  // Note: Automatic detection is now handled by content.js on page load
});