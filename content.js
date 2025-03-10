// Helper function to extract domain from a URL
function extractDomainFromUrl(url) {
  try {
    const parser = new URL(url);
    return parser.host.split('.').slice(-2).join('.');
  } catch (e) {
    return null;
  }
}

// Helper function to extract all domains from a comment body
function getLinkDomains(commentBody) {
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const matches = commentBody.match(urlRegex) || [];
  return [...new Set(matches.map(url => extractDomainFromUrl(url)).filter(Boolean))];
}

// Helper function to count domains and total comments across a user's history
async function getDomainCounts(username, token) {
  // Section: Fetch User Comments - Retrieves comment history via Reddit API and caches counts
  const response = await fetch(`https://oauth.reddit.com/user/${username}/comments?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  const comments = data.data.children.map(child => child.data.body);
  const domainCount = { __totalComments: comments.length };
  comments.forEach(comment => {
    getLinkDomains(comment).forEach(domain => {
      domainCount[domain] = (domainCount[domain] || 0) + 1;
    });
  });
  if (!domainCount.__totalComments) domainCount.__totalComments = 0;
  return domainCount;
}

// Helper function to calculate shill percentage for grading
function calculateShillPercentage(domainCounts) {
  // Section: Calculate Shill Percentage - Determines the percentage of shilling in a user's history
  if (!domainCounts || !domainCounts.__totalComments || domainCounts.__totalComments === 0) return 0;
  const maxDomainCount = Math.max(...Object.values(domainCounts).filter(count => count > 0 && count !== domainCounts.__totalComments), 0);
  return (maxDomainCount / domainCounts.__totalComments) * 100;
}

// Whitelist of legitimate domains (not considered for shilling)
const whitelistedDomains = [
  'facebook.com', 'x.com', 'linkedin.com', 'instagram.com', 'pinterest.com',
  'tiktok.com', 'mastodon.social', 'threads.net', 'bluesky.com',
  'github.com', 'stackoverflow.com', 'dev.to',
  'medium.com', 'substack.com', 'blogspot.com', 'tumblr.com',
  'youtube.com', 'vimeo.com', 'imgur.com', 'flickr.com',
  'wikipedia.org', 'imdb.com', 'goodreads.com',
  'reddit.com',
];

// Inject CSS styles for opacity flagging and Shill-O-Tron indicator
function injectStyles() {
  const styleId = 'shill-detector-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .shill-flagged {
        opacity: 0.3 !important; /* -70% opacity for shiller's text */
        transition: opacity 0.3s;
      }
      .shill-flagged-thread {
        opacity: 0.3 !important; /* -70% opacity for replies */
        transition: opacity 0.3s;
      }
      .shill-label {
        display: inline-block;
        background-color: #333333;
        color: #cccccc;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 3px;
        margin-left: 8px;
        cursor: help;
        position: relative;
      }
      .shill-label::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: nowrap;
        visibility: hidden;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .shill-label:hover::after {
        visibility: visible;
        opacity: 1;
      }
      .shill-label.red-alert {
        opacity: 1; background-color: #ff4444 !important;
      }
      .shill-label.orange-alert {
        opacity: 1; background-color: #ff8800 !important;
      }
      .shill-o-tron {
        position: fixed;
        top: 10px;
        left: 10px; /* Moved to top-left */
        background-color: #2ecc71;
        color: #ffffff;
        padding: 8px 15px;
        border-radius: 5px;
        font-size: 16px;
        font-family: 'Comic Sans MS', cursive;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s, transform 0.3s;
        transform: scale(0.9);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        white-space: pre-wrap; /* Allow multiple lines */
      }
      .shill-o-tron.active {
        opacity: 0.95;
        transform: scale(1);
        animation: shillPulse 1.5s infinite;
      }
      .shill-o-tron-findings {
        position: fixed;
        top: 50px;
        left: 10px;
        background-color: #e74c3c;
        color: #ffffff;
        padding: 10px 15px;
        border-radius: 5px;
        font-size: 14px;
        font-family: 'Comic Sans MS', cursive;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .shill-o-tron-findings.active {
        opacity: 0.95;
      }
      @keyframes shillPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Parse Reddit thread to extract usernames and links, filtering out comments without links
function parseThread() {
  // Section: Parse Thread - Extracts usernames and links from shreddit-comment elements
  const comments = document.querySelectorAll('shreddit-comment');
  return Array.from(comments).flatMap(comment => {
    const usernameElement = comment.querySelector('div[slot="commentMeta"] a[href*="/user/"]');
    const username = usernameElement ? usernameElement.textContent.trim() : null;
    const contentDiv = comment.querySelector('div[id$="-comment-rtjson-content"]');
    const links = contentDiv
      ? Array.from(contentDiv.querySelectorAll('a'))
          .map(a => a.href)
          .filter(href => href.startsWith('http'))
      : [];
    return username && links.length > 0 ? [{ username, links, element: comment }] : [];
  });
}

// Flag a comment and its downstream thread with enhanced label
function flagComment(userData, link, count, totalComments) {
  // Section: Flag Comment - Applies visual flagging and calculates shill grade
  const { username, element } = userData;
  element.classList.add('shill-flagged');
  const metaDiv = element.querySelector('div[slot="commentMeta"]');
  if (metaDiv) {
    const label = document.createElement('span');
    label.className = 'shill-label';
    const domain = extractDomainFromUrl(link);
    const shillPercentage = calculateShillPercentage(userDomainCounts.get(username) || {});
    let alertLevel = '';
    let alertClass = '';
    console.log(`Shill Percentage for ${username}: ${shillPercentage}%`);

    if (shillPercentage === 50) {
      alertLevel = 'Red Alert';
      alertClass = 'red-alert';
    } else if (shillPercentage >= 20) {
      alertLevel = 'Orange Alert';
      alertClass = 'orange-alert';
    }

    label.textContent = `Potential Shill ${shillPercentage.toFixed(0)}% - ${alertLevel}`;
    label.className += ` ${alertClass}`;
    label.setAttribute('data-tooltip', `Promoted ${domain} ${count} times`);
    metaDiv.appendChild(label);
  }

  const nextReplyDiv = element.querySelector('div[slot="next-reply"]');
  if (nextReplyDiv) {
    nextReplyDiv.querySelectorAll('shreddit-comment').forEach(reply => reply.classList.add('shill-flagged-thread'));
  }
}

// Fetch user comments concurrently
async function fetchUserCommentsConcurrently(usernames, token) {
  // Section: Fetch User Comments Concurrently - Parallel API calls for performance
  const promises = usernames.map(username =>
    fetch(`https://oauth.reddit.com/user/${username}/comments?limit=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(response => response.json())
  );
  const results = await Promise.all(promises);
  return results.map(data => data.data.children.map(child => child.data.body));
}

// Cache for user domain counts and total comments
const userDomainCounts = new Map();

// Main logic for automatic shill detection with Shill-O-Tron feedback
injectStyles();

let observer = new MutationObserver(() => {
  // Section: Observer Initialization - Monitors DOM with debouncing
  const comments = document.querySelectorAll('shreddit-comment');
  if (comments.length > 0) {
    observer.disconnect();
    detectShills();
  }
});
observer.observe(document.body, { childList: true, subtree: true, once: true }); // Debounce with once option

// Create Shill-O-Tron and Findings elements
const shillOTron = document.createElement('div');
shillOTron.className = 'shill-o-tron';
document.body.appendChild(shillOTron);

const shillOTronFindings = document.createElement('div');
shillOTronFindings.className = 'shill-o-tron-findings';
document.body.appendChild(shillOTronFindings);

// Automatic shill detection function
async function detectShills() {
  // Section: Automatic Detection Logic - Runs shill detection on page load
  shillOTron.classList.add('active');
  shillOTron.textContent = 'Shill-O-Tron 3000 Booting Up...\n';

  chrome.storage.local.get('redditToken', async ({ redditToken }) => {
    if (!redditToken) {
      console.error("No token found");
      shillOTron.textContent += 'Shill-O-Tron 3000: Token Missing! 🚨\n';
      setTimeout(() => shillOTron.classList.remove('active'), 3000);
      return;
    }
    console.log("Token retrieved:", redditToken.slice(0, 10) + "...");
    shillOTron.textContent += `Token retrieved: ${redditToken.slice(0, 10)}...\n`;

    const userLinks = parseThread();
    shillOTron.textContent += `Processing ${userLinks.length} users...\n`;
    console.log("Processing users:", userLinks.length);

    // Fetch comments concurrently for unique users
    const uniqueUsers = [...new Set(userLinks.map(entry => entry.username))];
    shillOTron.textContent += `Fetching for ${uniqueUsers.length} unique users...\n`;
    const commentData = await fetchUserCommentsConcurrently(uniqueUsers, redditToken);
    uniqueUsers.forEach((username, index) => {
      const comments = commentData[index];
      const domainCount = { __totalComments: comments.length };
      comments.forEach(comment => getLinkDomains(comment).forEach(domain => {
        domainCount[domain] = (domainCount[domain] || 0) + 1;
      }));
      if (!domainCount.__totalComments) domainCount.__totalComments = 0;
      userDomainCounts.set(username, domainCount);
      shillOTron.textContent += `Fetched comments for ${username}\n`;
      console.log(`Fetched comments for ${username}`);
    });

    // Track flagged users
    const flaggedUsers = new Set();
    let shillCount = 0;
    const totalUsers = userLinks.length;

    for (const userData of userLinks) {
      const { username, links, element } = userData;
      const domainCounts = userDomainCounts.get(username) || { __totalComments: 0 };
      for (const link of links) {
        const domain = extractDomainFromUrl(link);
        if (domain && !whitelistedDomains.includes(domain) && domainCounts[domain] >= 3 && !flaggedUsers.has(username)) {
          flagComment(userData, link, domainCounts[domain], domainCounts.__totalComments);
          console.log(`Flagged ${username} for ${link} (domain: ${domain}, count: ${domainCounts[domain]})`);
          flaggedUsers.add(username);
          shillOTron.textContent += `Flagged ${username} for ${link} (domain: ${domain}, count: ${domainCounts[domain]})\n`;
	      shillCount++;
          break;
        }
      }
    }

    // Display findings before fading out
    const findingsMsg = `Shill-O-Tron 3000 \nZapped ${shillCount} Sneaky Shillers \namong ${totalUsers} Redditors! 🎉`;
    shillOTronFindings.textContent = findingsMsg;
    shillOTronFindings.classList.add('active');
    setTimeout(() => {
      shillOTronFindings.classList.remove('active');
      shillOTron.classList.remove('active');
    }, 5000);
  });
}

// Listen for manual trigger (optional, for testing)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "detectShills") {
    detectShills();
  }
});