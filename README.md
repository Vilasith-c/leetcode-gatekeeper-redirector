## LeetCode Gatekeeper

A Chrome extension to help you build a consistent LeetCode habit by blocking distracting websites until you solve a problem.

***

### Features

* **Focus Mode**: Blocks all non-LeetCode websites to keep you focused on your coding practice.
* **Customizable Difficulty**: Choose between Easy, Medium, and Hard problems to match your skill level.
* **Random Problem Assignment**: When your browsing is blocked, the extension assigns a random LeetCode problem based on your chosen difficulty.
* **Generate New Problem**: Don't like the assigned problem? Click a button to get a new one on demand.
* **Smart Unlock**: Automatically detects a correct "Accepted" submission on the LeetCode website to grant you browsing access.
* **Adjustable Freedom Timer**: Set your own "freedom" timer duration. After solving a problem, you get a window of unrestricted browsing.
* **Visual Timer**: The popup displays a circular progress bar to visualize the remaining time.
* **Daily Streak**: Track your daily problem-solving streak to stay motivated.
* **Status Popup**: Click the extension icon at any time to see your currently assigned problem, check the time remaining, or change your settings.

***

### How It Works

1.  When you try to visit any website, the extension's background script intercepts the request.
2.  If you don't have active "freedom time," you are redirected to a visually appealing block page. This page provides a button to navigate directly to your assigned LeetCode problem.
3.  Once you submit a correct solution on LeetCode, a content script running on the page detects the "Accepted" status.
4.  The content script notifies the background script, which grants you a freedom timer (with your chosen duration) and allows you to browse any website.
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
* **To check your status and change settings**, click the extension's icon in the Chrome toolbar. From the popup, you can:
    *   See your assigned problem.
    *   Check the remaining time on your freedom timer.
    *   Choose your preferred problem difficulty.
    *   Generate a new problem.
    *   Set the duration of your freedom timer.
    *   View your daily streak.