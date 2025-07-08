# LeetCode Gatekeeper Redirector

This Chrome extension helps you build a LeetCode habit by blocking all browsing until you solve a random LeetCode problem. After solving, you get 3 hours of free browsing time!

## Features

- **Random Problem Assignment:** When you try to visit any site (except LeetCode), you are redirected to a blocking page with a button to a random LeetCode problem.
- **Solve to Unlock:** You must solve the assigned problem (get "Accepted") to unlock browsing.
- **3-Hour Timer:** After a correct submission, you get 3 hours of unrestricted browsing. When the timer expires, you must solve a new problem.
- **Blocking UI:** Friendly UI tells you what to do and lets you jump to your assigned problem.
- **Popup UI:** Click the extension icon to see your current status, assigned problem, and time left.
- **Robust Detection:** Timer only starts after a real, successful submission ("Accepted"), not just by viewing the problem.

## Setup

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select this folder.

## Usage

- Try to visit any website: you'll see a blocking page with a button to your assigned LeetCode problem.
- Solve the problem and get "Accepted".
- After submission, you have 3 hours of unrestricted browsing.
- When the timer ends, the block returns and you must solve a new problem.
- Click the extension icon to see your status and time left.

## How it Works

- The extension assigns you a random LeetCode problem and stores it.
- It blocks all browsing (except LeetCode) until you solve the assigned problem.
- The content script detects a real "Accepted" submission and notifies the background script to start the timer.
- The blocking UI and popup UI show your current status and help you stay on track.

---

Feel free to contribute or suggest improvements!