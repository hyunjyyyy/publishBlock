### How to Build and Package CleanBook

Since CleanBook is a cross-browser extension using Manifest V3, you can package it for both Chrome and Firefox.

#### 1. Automated Build (Recommended)

You can use the provided `build.sh` script to create ZIP files for both browsers.

1.  Open your terminal.
2.  Navigate to the project root.
3.  Make the script executable:
    ```bash
    chmod +x build.sh
    ```
4.  Run the script:
    ```bash
    ./build.sh
    ```
5.  The packaged extensions will be available in the `dist/` directory.

---

#### 2. Manual Packaging

**For Google Chrome:**

1.  Go to `chrome://extensions/`.
2.  Enable **Developer mode** (top right).
3.  Click **Pack extension**.
4.  Select the project root folder.
5.  Chrome will generate a `.crx` file and a `.pem` private key.
    - _Alternatively_, you can just ZIP all files (including `manifest.json`) and upload the ZIP to the Chrome Web Store.

**For Mozilla Firefox:**

1.  You can use the `web-ext` tool (recommended by Mozilla):
    ```bash
    npx web-ext build
    ```
2.  _Alternatively_, you can manually ZIP all files (ensure `manifest.json` is at the root of the ZIP).
3.  Submit the ZIP to [AMO (Add-ons for Firefox)](https://addons.mozilla.org/developers/).

---

#### 3. Local Development / Testing

**Chrome / Edge / Brave:**

1.  Go to `chrome://extensions/`.
2.  Turn on **Developer mode**.
3.  Click **Load unpacked** and select the project root folder.

**Firefox:**

1.  Go to `about:debugging#/runtime/this-firefox`.
2.  Click **Load Temporary Add-on...**.
3.  Select the `manifest.json` file in the project root.
