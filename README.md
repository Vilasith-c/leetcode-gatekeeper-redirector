Of course. Here is a complete `README.md` file for your extension, based on the files you provided.

## LeetCode Gatekeeper

A Chrome extension to help you build a consistent LeetCode habit by blocking distracting websites until you solve a problem.

***

### Features

* **Focus Mode**: Blocks all non-LeetCode websites to keep you focused on your coding practice.
* **Random Problem Assignment**: When your Browse is blocked, the extension assigns a random "Easy" LeetCode problem from a curated list for you to solve.
* **Smart Unlock**: Automatically detects a correct "Accepted" submission on the LeetCode website to grant you Browse access.
* **3-Hour Freedom Timer**: After solving a problem, you get a 3-hour window of unrestricted Browse. The popup shows a countdown timer for your convenience.
* **Status Popup**: Click the extension icon at any time to see your currently assigned problem or check the time remaining on your freedom timer.

***

### How It Works

1.  When you try to visit any website, the extension's background script intercepts the request.
2.  If you don't have active "freedom time," you are redirected to a local block page. This page provides a button to navigate directly to your assigned LeetCode problem.
3.  Once you submit a correct solution on LeetCode, a content script running on the page detects the "Accepted" status.
4.  The content script notifies the background script, which grants you a 3-hour freedom timer and allows you to browse any website.
5.  When the timer expires, the cycle repeats with a new problem.

***

### Installation

1.  Save all the extension files (`manifest.json`, `.js` files, `.html` files) into a single folder on your computer.
2.  Open the Google Chrome browser and navigate to `chrome://extensions`.
3.  In the top-right corner, enable **Developer mode**.
4.  Click the **Load unpacked** button and select the folder where you saved the extension files.

***

### Usage

* **To start**, simply try to browse any website. If your freedom timer is not active, the block page will appear automatically.
* **To check your status**, click the extension's icon in the Chrome toolbar to see the popup with your assigned problem or remaining time.