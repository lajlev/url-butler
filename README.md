# URL Butler

A Chrome extension that allows you to automatically add or remove URL parameters based on configurable rules.

## Features

- Automatically remove or add URL parameters based on domain-specific rules
- Easy-to-use settings panel for managing rules
- Toggle extension on/off globally
- Enable/disable individual rules
- Comes with a default rule for marmalade-ai.com (removes `debug_mode=true` parameter)

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

Click the URL Butler icon in your Chrome toolbar to open the settings panel.

### Global Toggle

Use the toggle switch in the top right of the settings panel to enable or disable the extension entirely.

### Managing Rules

#### Viewing Rules

All configured rules are displayed in the settings panel with:
- Domain name
- Parameter name and value (if specified)
- Action (Remove or Add)
- Individual enable/disable toggle
- Edit and Delete buttons

#### Adding a New Rule

1. Click the "+ Add New Rule" button
2. Fill in the form:
   - **Domain**: The website domain (e.g., `marmalade-ai.com`)
   - **Parameter Name**: The URL parameter to modify (e.g., `debug_mode`)
   - **Parameter Value**: (Optional) Specific value to match. Leave empty to match any value
   - **Action**: Choose "Remove Parameter" or "Add/Update Parameter"
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

## Default Rule

The extension comes pre-configured with one rule:

- **Domain**: `marmalade-ai.com`
- **Parameter**: `debug_mode`
- **Value**: `true`
- **Action**: Remove

This means when you visit any URL on `marmalade-ai.com` with `?debug_mode=true` (or `&debug_mode=true`), the parameter will be automatically removed and the page will reload with the clean URL.

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

## How It Works

The extension uses two mechanisms to modify URLs:

1. **Background Script**: Monitors navigation events and modifies URLs before the page loads
2. **Content Script**: Runs at document start to catch any URLs that might be loaded directly

When a matching rule is found, the extension:
- Parses the current URL
- Applies the configured modifications (add or remove parameters)
- Reloads the page with the modified URL using `location.replace()` to avoid adding entries to browser history

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
