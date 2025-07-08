# LeetCode Gatekeeper Redirector

This Chrome extension redirects you to LeetCode whenever you try to visit any website, until you submit a solution on LeetCode. After submission, you get 3 hours of free browsing.

## Setup

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select this folder.

## Usage

- Try to visit any website: you'll be redirected to LeetCode.
- Submit a solution on LeetCode (look for "Accepted").
- After submission, you have 3 hours of unrestricted browsing.
- After 3 hours, redirection resumes until you submit again.

## Notes
- The extension detects solution submission by looking for the word "Accepted" in the page.
- You can customize the time window or platforms in the code.