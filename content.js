// This content script runs at document_start to catch URL changes early
// It works in conjunction with the background script for URL manipulation

(function() {
  'use strict';

  // Check if we need to modify the current URL
  function checkAndModifyURL() {
    chrome.storage.sync.get(['rules', 'enabled'], (result) => {
      if (!result.enabled) return;

      const rules = result.rules || [];
      const currentUrl = new URL(window.location.href);

      // Find matching rules for this domain
      const matchingRules = rules.filter(rule => {
        if (!rule.enabled) return false;
        return currentUrl.hostname === rule.domain ||
               currentUrl.hostname.endsWith('.' + rule.domain);
      });

      if (matchingRules.length === 0) return;

      let modified = false;
      const searchParams = new URLSearchParams(currentUrl.search);

      matchingRules.forEach(rule => {
        if (rule.action === 'remove') {
          // Check if parameter exists and matches value (if specified)
          if (searchParams.has(rule.parameter)) {
            if (!rule.value || searchParams.get(rule.parameter) === rule.value) {
              searchParams.delete(rule.parameter);
              modified = true;
            }
          }
        } else if (rule.action === 'add') {
          // Add or update parameter
          if (!searchParams.has(rule.parameter) ||
              searchParams.get(rule.parameter) !== rule.value) {
            searchParams.set(rule.parameter, rule.value);
            modified = true;
          }
        }
      });

      if (modified) {
        // Construct new URL
        const newSearch = searchParams.toString();
        currentUrl.search = newSearch ? '?' + newSearch : '';

        // Replace current URL without adding to history
        if (currentUrl.href !== window.location.href) {
          window.location.replace(currentUrl.href);
        }
      }
    });
  }

  // Run check on page load
  checkAndModifyURL();
})();
