const CLIENT_ID = 'BsZPoHxyrKDN6EWbAHSYaw';
const CLIENT_SECRET = 'Ug3cQzp8amEM6F9JBOpZ05iY6hdEWA'; // Replace with your client secret
const REDIRECT_URI = 'https://jomlfkgbbheenbpekjbiphbmapnbldge.chromiumapp.org';

// Generate a random state
const generateState = () => Math.random().toString(36).substring(2, 15);

// Define the AUTH_URL
const AUTH_URL = `https://www.reddit.com/api/v1/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&response_type=code&state=${encodeURIComponent(generateState())}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&duration=permanent&scope=${encodeURIComponent('identity read history')}`;

// Function to initiate OAuth
function launchAuthFlow() {
  console.log('Launching auth flow with URL:', AUTH_URL);
  chrome.identity.launchWebAuthFlow({
    url: AUTH_URL,
    interactive: true
  }, (redirectUrl) => {
    if (chrome.runtime.lastError || !redirectUrl) {
      console.error('Auth error:', chrome.runtime.lastError);
      return;
    }
    console.log('Redirect URL:', redirectUrl);
    const urlParams = new URLSearchParams(redirectUrl.split('#')[0].split('?')[1]);
    const code = urlParams.get('code');
    console.log('Authorization code:', code);
    if (code) {
      exchangeCodeForToken(code);
    }
  });
}

// Exchange authorization code for token
function exchangeCodeForToken(code) {
  fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
    },
    body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
  })
  .then(response => response.json())
  .then(data => {
    console.log('Token response:', data);
    if (data.access_token) {
      chrome.storage.local.set({ redditToken: data.access_token }, () => {
        console.log('Token stored:', data.access_token);
      });
    } else {
      console.error('Token exchange failed:', data);
    }
  })
  .catch(error => console.error('Token fetch error:', error));
}

// Listen for messages to start auth
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'authenticate') {
    launchAuthFlow();
  }
});