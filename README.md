# Shill-O-Tron 3000

**Shill-O-Tron 3000** is a proof-of-concept Chrome extension designed to detect and highlight potential shilling activity on Reddit. It scans comment threads for repetitive link promotion and flags suspicious behavior—all in a playful and experimental way. 🚀

## Features
- **Detects repetitive link promotion** in Reddit comment threads
- **OAuth integration** for secure Reddit API access
- **Local storage of tokens** (no external servers involved)
- **User privacy focused** – no personal data is stored beyond your session
- **Fully open-source** and transparent!

## Installation

### Manual Installation
1. Download the repository:
   ```sh
   git clone https://github.com/lucioamor/shill-o-tron-3000.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer Mode" (toggle in the top right corner)
4. Click "Load unpacked"
5. Select the folder containing the cloned repo
6. The extension is now installed!

## How It Works
1. Click on the **Shill-O-Tron 3000** popup in Chrome
2. Authenticate via Reddit OAuth (read-only access to comments)
3. Navigate to a Reddit thread and activate the "Zap Shills Now! ⚡" button
4. The extension analyzes the comments for repetitive link promotion
5. Suspicious activity is flagged for further review!

## Permissions Explained
Shill-O-Tron 3000 requests the following permissions:
- **`activeTab`** – To analyze the Reddit thread currently being viewed
- **`identity`** – For secure Reddit OAuth authentication
- **`storage`** – To store Reddit access tokens locally (no external storage)
- **`https://www.reddit.com/*` and `https://oauth.reddit.com/*`** – Required for API access to retrieve public comment data

For more details, see the [Permissions Explained](permissions.html) page.

## Privacy Policy
Your data stays **on your device**. We do not store, sell, or share any personal information. Full details can be found in our [Privacy Policy](privacy.html).

## Contributing
Contributions are welcome! If you’d like to improve **Shill-O-Tron 3000**:
1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Make your changes and commit (`git commit -m "Added awesome feature"`)
4. Push to your branch (`git push origin feature-branch`)
5. Open a Pull Request 🎉

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
For inquiries, visit [nxlv.ai](https://nxlv.ai) or reach out on GitHub!

