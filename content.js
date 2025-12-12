// This content script runs at document_start to catch URL changes early
// It works in conjunction with the background script for URL manipulation

(function () {
  "use strict";

  let observer = null;
  let hideElementRules = [];

  // Check if we need to modify the current URL
  function checkAndModifyURL() {
    chrome.storage.sync.get(["rules", "enabled"], (result) => {
      if (!result.enabled) return;

      const rules = result.rules || [];
      const currentUrl = new URL(window.location.href);

      // Find matching rules for this domain
      const matchingRules = rules.filter((rule) => {
        if (!rule.enabled) return false;
        return (
          currentUrl.hostname === rule.domain ||
          currentUrl.hostname.endsWith("." + rule.domain)
        );
      });

      if (matchingRules.length === 0) return;

      let modified = false;
      let paramsModified = false;
      const searchParams = new URLSearchParams(currentUrl.search);

      matchingRules.forEach((rule) => {
        if (rule.action === "remove") {
          // Check if parameter exists and matches value (if specified)
          if (searchParams.has(rule.parameter)) {
            if (
              !rule.value ||
              searchParams.get(rule.parameter) === rule.value
            ) {
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
              currentUrl.pathname === rule.fromPath ||
              currentUrl.pathname.startsWith(rule.fromPath + "/")
            ) {
              // Replace the path
              const remainingPath = currentUrl.pathname.substring(
                rule.fromPath.length,
              );
              currentUrl.pathname = rule.toPath + remainingPath;
              modified = true;
            }
          }
        }
      });

      if (modified) {
        // Only update search params if they were modified
        if (paramsModified) {
          const newSearch = searchParams.toString();
          currentUrl.search = newSearch ? "?" + newSearch : "";
        }

        // Replace current URL without adding to history
        if (currentUrl.href !== window.location.href) {
          window.location.replace(currentUrl.href);
        }
      }
    });
  }

  // Hide elements based on CSS selector
  function hideElements(selector) {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        // Use display: none with !important to ensure it takes precedence
        element.style.setProperty("display", "none", "important");
        // Add a data attribute to track that we've hidden this element
        element.setAttribute("data-url-butler-hidden", "true");
      });
      return elements.length;
    } catch (error) {
      console.error("URL Butler: Invalid selector:", selector, error);
      return 0;
    }
  }

  // Apply all hideElement rules for the current page
  function applyHideElementRules() {
    chrome.storage.sync.get(["rules", "enabled"], (result) => {
      if (!result.enabled) return;

      const rules = result.rules || [];
      const currentUrl = new URL(window.location.href);

      // Find matching hideElement rules for this domain
      hideElementRules = rules.filter((rule) => {
        if (!rule.enabled || rule.action !== "hideElement") return false;
        return (
          currentUrl.hostname === rule.domain ||
          currentUrl.hostname.endsWith("." + rule.domain)
        );
      });

      // Apply each rule
      hideElementRules.forEach((rule) => {
        if (rule.selector) {
          hideElements(rule.selector);
        }
      });

      // Set up MutationObserver if we have active rules
      if (hideElementRules.length > 0 && !observer) {
        setupMutationObserver();
      } else if (hideElementRules.length === 0 && observer) {
        observer.disconnect();
        observer = null;
      }
    });
  }

  // Set up MutationObserver to watch for dynamically added elements
  function setupMutationObserver() {
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check added nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Apply hide rules to new elements
            hideElementRules.forEach((rule) => {
              if (rule.selector) {
                // Check if the node itself matches
                if (node.matches && node.matches(rule.selector)) {
                  node.style.setProperty("display", "none", "important");
                  node.setAttribute("data-url-butler-hidden", "true");
                }
                // Check children of the node
                try {
                  const matchingChildren = node.querySelectorAll(rule.selector);
                  matchingChildren.forEach((element) => {
                    element.style.setProperty("display", "none", "important");
                    element.setAttribute("data-url-butler-hidden", "true");
                  });
                } catch (error) {
                  // Ignore selector errors
                }
              }
            });
          }
        });
      });
    });

    // Start observing the document
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // Run check on page load
  checkAndModifyURL();

  // Wait for DOM to be ready before applying hide rules
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyHideElementRules);
  } else {
    applyHideElementRules();
  }

  // Listen for storage changes to update rules dynamically
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && (changes.rules || changes.enabled)) {
      applyHideElementRules();
    }
  });
})();
