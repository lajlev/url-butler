// Initialize default settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["rules", "enabled"], (result) => {
    if (!result.rules) {
      const defaultRules = [
        {
          id: Date.now(),
          domain: "marmalade-ai.com",
          parameter: "debug_mode",
          value: "true",
          action: "remove",
          enabled: true,
        },
        {
          id: Date.now() + 1,
          domain: "gemini.google.com",
          action: "redirect",
          fromPath: "/u/0",
          toPath: "/u/2",
          enabled: true,
        },
      ];
      chrome.storage.sync.set({ rules: defaultRules });
    }
    if (result.enabled === undefined) {
      chrome.storage.sync.set({ enabled: true });
    }
  });
});

// Listen for URL changes and apply rules
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return; // Only handle main frame

  chrome.storage.sync.get(["rules", "enabled"], (result) => {
    if (!result.enabled) return;

    const rules = result.rules || [];
    const url = new URL(details.url);

    // Find matching rules for this domain
    const matchingRules = rules.filter((rule) => {
      if (!rule.enabled) return false;
      return (
        url.hostname === rule.domain || url.hostname.endsWith("." + rule.domain)
      );
    });

    if (matchingRules.length === 0) return;

    let modified = false;
    let paramsModified = false;
    const searchParams = new URLSearchParams(url.search);

    matchingRules.forEach((rule) => {
      if (rule.action === "remove") {
        // Check if parameter exists and matches value (if specified)
        if (searchParams.has(rule.parameter)) {
          if (!rule.value || searchParams.get(rule.parameter) === rule.value) {
            searchParams.delete(rule.parameter);
            modified = true;
            paramsModified = true;
          }
        }
      } else if (rule.action === "add") {
        // Add or update parameter
        if (
          !searchParams.has(rule.parameter) ||
          searchParams.get(rule.parameter) !== rule.value
        ) {
          searchParams.set(rule.parameter, rule.value);
          modified = true;
          paramsModified = true;
        }
      } else if (rule.action === "redirect") {
        // Path-based redirect
        if (rule.fromPath && rule.toPath) {
          // Check if current path matches or starts with fromPath
          if (
            url.pathname === rule.fromPath ||
            url.pathname.startsWith(rule.fromPath + "/")
          ) {
            // Replace the path
            const remainingPath = url.pathname.substring(rule.fromPath.length);
            url.pathname = rule.toPath + remainingPath;
            modified = true;
          }
        }
      }
    });

    if (modified) {
      // Only update search params if they were modified
      if (paramsModified) {
        const newSearch = searchParams.toString();
        url.search = newSearch ? "?" + newSearch : "";
      }

      // Prevent infinite loop by checking if we're redirecting to a different URL
      if (url.href !== details.url) {
        chrome.tabs.update(details.tabId, { url: url.href });
      }
    }
  });
});
