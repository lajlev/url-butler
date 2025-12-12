# Browser Butler

A Chrome extension that allows you to customize your browsing experience with configurable rules to manage URLs, hide elements, and more.

## Features

- Automatically remove or add URL parameters based on domain-specific rules
- Path-based redirects (e.g., always redirect `/u/0` to `/u/2`)
- **Hide elements on webpages using CSS selectors**
- Easy-to-use settings panel for managing rules
- Toggle extension on/off globally
- Enable/disable individual rules
- Test CSS selectors before saving rules
- Automatic handling of dynamically loaded content
- Comes with default rules:
  - marmalade-ai.com: removes `debug_mode=true` parameter
  - gemini.google.com: redirects `/u/0` to `/u/2`

## Installation

### Install from Source

1. Clone or download this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right corner
4. Click "Load unpacked"
5. Select the `url-butler` folder
6. The extension icon should appear in your Chrome toolbar

## Usage

### Accessing Settings

Click the Browser Butler icon in your Chrome toolbar to open the settings panel.

### Global Toggle

Use the toggle switch in the top right of the settings panel to enable or disable the extension entirely.

### Managing Rules

#### Viewing Rules

All configured rules are displayed in the settings panel with:
- Domain name
- Rule details (parameters, paths, or selectors)
- Action type (Remove, Add, Redirect, or Hide Element)
- Visual highlight for rules matching the current tab's URL
- Individual enable/disable toggle
- Edit and Delete buttons

#### Adding a New Rule

1. Click the "+ Add New Rule" button
2. Fill in the form:
   - **Domain**: The website domain (e.g., `marmalade-ai.com`)
   - **Action**: Choose from:
     - "Remove Parameter" - Remove a URL parameter
     - "Add/Update Parameter" - Add or modify a URL parameter
     - "Path Redirect" - Redirect from one path to another
     - "Hide Element" - Hide elements using CSS selectors
   
   **For Parameter Actions (Remove/Add):**
   - **Parameter Name**: The URL parameter to modify (e.g., `debug_mode`)
   - **Parameter Value**: (Optional) Specific value to match. Leave empty to match any value
   
   **For Path Redirect:**
   - **From Path**: The path to redirect from (e.g., `/u/0`)
   - **To Path**: The path to redirect to (e.g., `/u/2`)
   
   **For Hide Element:**
   - **CSS Selector**: The selector for elements to hide (e.g., `.ad-banner`, `#popup-modal`)
   - Click "Test Selector" to verify it matches elements on the current page

3. Click "Save Rule"

#### Editing a Rule

1. Click the "Edit" button next to the rule you want to modify
2. Update the fields in the form
3. Click "Save Rule"

#### Deleting a Rule

1. Click the "Delete" button next to the rule you want to remove
2. Confirm the deletion

#### Enabling/Disabling Individual Rules

Use the toggle switch next to each rule to temporarily enable or disable it without deleting.

## Default Rules

The extension comes pre-configured with two rules:

### Rule 1: marmalade-ai.com
- **Domain**: `marmalade-ai.com`
- **Parameter**: `debug_mode`
- **Value**: `true`
- **Action**: Remove

When you visit any URL on `marmalade-ai.com` with `?debug_mode=true` (or `&debug_mode=true`), the parameter will be automatically removed and the page will reload with the clean URL.

### Rule 2: gemini.google.com
- **Domain**: `gemini.google.com`
- **From Path**: `/u/0`
- **To Path**: `/u/2`
- **Action**: Path Redirect

When you visit `https://gemini.google.com/u/0` (or any URL starting with `/u/0`), you will be automatically redirected to `https://gemini.google.com/u/2`.

## Examples

### Example 1: Remove Debug Parameter

To automatically remove `debug_mode=true` from example.com URLs:

- Domain: `example.com`
- Parameter: `debug_mode`
- Value: `true`
- Action: Remove

Before: `https://example.com/page?debug_mode=true&other=param`
After: `https://example.com/page?other=param`

### Example 2: Remove Any Value

To remove a parameter regardless of its value:

- Domain: `example.com`
- Parameter: `tracking_id`
- Value: (leave empty)
- Action: Remove

Before: `https://example.com/page?tracking_id=12345`
After: `https://example.com/page`

### Example 3: Add Parameter

To automatically add a parameter to URLs:

- Domain: `example.com`
- Parameter: `theme`
- Value: `dark`
- Action: Add/Update

Before: `https://example.com/page`
After: `https://example.com/page?theme=dark`

### Example 4: Path Redirect

To redirect users from one path to another:

- Domain: `example.com`
- From Path: `/old-dashboard`
- To Path: `/new-dashboard`
- Action: Path Redirect

Before: `https://example.com/old-dashboard`
After: `https://example.com/new-dashboard`

This also works with sub-paths:
Before: `https://example.com/old-dashboard/settings`
After: `https://example.com/new-dashboard/settings`

### Example 5: Hide Elements

To hide annoying elements on a website:

- Domain: `example.com`
- CSS Selector: `.ad-banner, #popup-modal, div[data-ad]`
- Action: Hide Element

This will hide all elements matching the selector (ads, popups, etc.) on example.com. The extension will:
- Hide elements immediately on page load
- Continue watching for and hiding dynamically added elements
- Work with single-page applications

**Common CSS Selectors:**
- `.class-name` - Hide by class
- `#element-id` - Hide by ID
- `div[data-ad]` - Hide by attribute
- `header .ad-container` - Hide nested elements
- `.ad, .banner` - Hide multiple types (comma-separated)

## How It Works

The extension uses multiple mechanisms to apply rules:

1. **Background Script**: Monitors navigation events and modifies URLs before the page loads
2. **Content Script**: Runs at document start to catch URLs and hide elements
3. **MutationObserver**: Watches for dynamically added content and applies hide rules in real-time

**For URL Modifications:**
When a matching rule is found, the extension:
- Parses the current URL
- Applies the configured modifications (add or remove parameters, path redirects)
- Reloads the page with the modified URL using `location.replace()` to avoid adding entries to browser history

**For Element Hiding:**
When a hideElement rule matches:
- Elements are hidden on page load using `display: none !important`
- MutationObserver continuously watches for new elements
- Dynamically added elements matching the selector are hidden automatically
- Works seamlessly with single-page applications and lazy-loaded content

## Technical Details

### Files

- `manifest.json`: Extension configuration
- `background.js`: Service worker that monitors URL changes
- `content.js`: Content script that runs on page load
- `popup.html`: Settings panel HTML
- `popup.css`: Settings panel styles
- `popup.js`: Settings panel functionality
- `icons/`: Extension icons

### Permissions

- `storage`: To save rules and settings
- `tabs`: To modify URLs in tabs
- `webNavigation`: To detect URL changes
- `scripting`: To test CSS selectors on active tabs
- `<all_urls>`: To apply rules across all websites

### Storage

All settings and rules are stored using `chrome.storage.sync`, which means they sync across your Chrome browsers when you're signed in.

## Troubleshooting

### Rules Not Working

1. Check that the extension is enabled (toggle in settings)
2. Verify the specific rule is enabled (toggle next to the rule)
3. Make sure the domain matches exactly (no `https://` or `www.` prefix)
4. Try reloading the extension: Go to `chrome://extensions/` and click the reload icon

### Page Keeps Reloading

This might happen if:
- Two conflicting rules are set (one adds, another removes the same parameter)
- A rule value doesn't match the actual parameter value

Check your rules for conflicts and verify the parameter values.

## Privacy

This extension:
- Only stores configuration data locally in your browser
- Does not collect or transmit any data to external servers
- Does not track your browsing history
- Only modifies URLs based on rules you configure

## License

MIT License - Feel free to modify and distribute.

## Support

For issues, questions, or feature requests, please create an issue in the repository.
