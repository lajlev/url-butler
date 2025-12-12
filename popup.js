// DOM elements
const extensionToggle = document.getElementById("extensionToggle");
const statusText = document.getElementById("statusText");
const rulesList = document.getElementById("rulesList");
const addRuleBtn = document.getElementById("addRuleBtn");
const modal = document.getElementById("ruleModal");
const modalTitle = document.getElementById("modalTitle");
const closeBtn = document.querySelector(".close");
const cancelBtn = document.getElementById("cancelBtn");
const ruleForm = document.getElementById("ruleForm");
const actionSelect = document.getElementById("action");
const parameterGroup = document.getElementById("parameterGroup");
const valueGroup = document.getElementById("valueGroup");
const fromPathGroup = document.getElementById("fromPathGroup");
const toPathGroup = document.getElementById("toPathGroup");
const selectorGroup = document.getElementById("selectorGroup");
const testSelectorBtn = document.getElementById("testSelectorBtn");
const selectorTestResult = document.getElementById("selectorTestResult");

let currentEditingRuleId = null;

// Load settings on popup open
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  loadRules();
  setupActionToggle();
});

// Setup action dropdown to show/hide relevant fields
function setupActionToggle() {
  actionSelect.addEventListener("change", updateFormFields);

  // Setup event delegation for rule actions
  rulesList.addEventListener("click", (e) => {
    let target = e.target;

    // If clicked on icon, get the button parent
    if (
      target.tagName === "I" ||
      target.tagName === "svg" ||
      target.tagName === "path"
    ) {
      target = target.closest("button");
    }

    if (!target) return;

    const ruleId = target.getAttribute("data-rule-id");

    if (!ruleId) return;

    if (target.classList.contains("btn-edit")) {
      editRule(parseInt(ruleId));
    } else if (target.classList.contains("btn-delete")) {
      deleteRule(parseInt(ruleId));
    }
  });

  // Setup event delegation for toggle switches
  rulesList.addEventListener("change", (e) => {
    if (e.target.classList.contains("rule-toggle-input")) {
      const ruleId = e.target.getAttribute("data-rule-id");
      if (ruleId) {
        toggleRule(parseInt(ruleId));
      }
    }
  });
}

function updateFormFields() {
  const action = actionSelect.value;

  // Hide all conditional groups first
  parameterGroup.style.display = "none";
  valueGroup.style.display = "none";
  fromPathGroup.style.display = "none";
  toPathGroup.style.display = "none";
  selectorGroup.style.display = "none";

  // Remove all conditional required attributes
  document.getElementById("parameter").removeAttribute("required");
  document.getElementById("fromPath").removeAttribute("required");
  document.getElementById("toPath").removeAttribute("required");
  document.getElementById("selector").removeAttribute("required");

  // Clear test result
  selectorTestResult.textContent = "";

  if (action === "redirect") {
    fromPathGroup.style.display = "block";
    toPathGroup.style.display = "block";
    document.getElementById("fromPath").setAttribute("required", "required");
    document.getElementById("toPath").setAttribute("required", "required");
  } else if (action === "hideElement") {
    selectorGroup.style.display = "block";
    document.getElementById("selector").setAttribute("required", "required");
  } else {
    parameterGroup.style.display = "block";
    valueGroup.style.display = "block";
    document.getElementById("parameter").setAttribute("required", "required");
  }
}

// Load extension enabled state
function loadSettings() {
  chrome.storage.sync.get(["enabled"], (result) => {
    const enabled = result.enabled !== false;
    extensionToggle.checked = enabled;
    statusText.textContent = enabled ? "Enabled" : "Disabled";
  });
}

// Toggle extension on/off
extensionToggle.addEventListener("change", () => {
  const enabled = extensionToggle.checked;
  chrome.storage.sync.set({ enabled });
  statusText.textContent = enabled ? "Enabled" : "Disabled";
});

// Load and display rules
async function loadRules() {
  // Get current tab URL
  let currentUrl = null;
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && tab.url) {
      currentUrl = new URL(tab.url);
    }
  } catch (error) {
    // If we can't get the current tab, just continue without highlighting
  }

  chrome.storage.sync.get(["rules"], (result) => {
    const rules = result.rules || [];
    displayRules(rules, currentUrl);
  });
}

// Check if a rule matches the current URL
function isRuleActive(rule, currentUrl) {
  if (!currentUrl || !rule.enabled) return false;

  // Check if domain matches
  const domainMatches =
    currentUrl.hostname === rule.domain ||
    currentUrl.hostname.endsWith("." + rule.domain);

  return domainMatches;
}

// Display rules in the UI
function displayRules(rules, currentUrl = null) {
  if (rules.length === 0) {
    rulesList.innerHTML =
      '<div class="empty-state">No rules configured. Click "Add New Rule" to get started.</div>';
    return;
  }

  rulesList.innerHTML = rules
    .map((rule) => {
      let ruleDescription = "";

      if (rule.action === "redirect") {
        ruleDescription = `Redirect from <strong>${escapeHtml(rule.fromPath || "")}</strong> to <strong>${escapeHtml(rule.toPath || "")}</strong>`;
      } else if (rule.action === "hideElement") {
        ruleDescription = `Hide elements: <strong>${escapeHtml(rule.selector || "")}</strong>`;
      } else {
        ruleDescription = `${rule.action === "remove" ? "Remove" : "Add"} parameter: <strong>${escapeHtml(rule.parameter)}</strong>${rule.value ? ` = ${escapeHtml(rule.value)}` : ""}`;
      }

      const isActive = isRuleActive(rule, currentUrl);
      const activeClass = isActive ? " active" : "";

      return `
        <div class="rule-item${activeClass}" data-rule-id="${rule.id}">
          <div class="rule-info">
            <div class="rule-domain">${escapeHtml(rule.domain)}</div>
            <div class="rule-details">${ruleDescription}</div>
          </div>
          <div class="rule-actions">
            <label class="switch rule-toggle">
              <input type="checkbox" ${rule.enabled ? "checked" : ""} data-rule-id="${rule.id}" class="rule-toggle-input">
              <span class="slider"></span>
            </label>
            <button class="btn btn-icon btn-edit" data-rule-id="${rule.id}" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button class="btn btn-icon btn-delete" data-rule-id="${rule.id}" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Toggle rule enabled state
function toggleRule(ruleId) {
  chrome.storage.sync.get(["rules"], (result) => {
    const rules = result.rules || [];
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      chrome.storage.sync.set({ rules }, () => {
        loadRules();
      });
    }
  });
}

// Delete rule
function deleteRule(ruleId) {
  if (!confirm("Are you sure you want to delete this rule?")) return;

  chrome.storage.sync.get(["rules"], (result) => {
    const rules = result.rules || [];
    const filteredRules = rules.filter((r) => r.id !== ruleId);
    chrome.storage.sync.set({ rules: filteredRules }, () => {
      loadRules();
    });
  });
}

// Edit rule
function editRule(ruleId) {
  chrome.storage.sync.get(["rules"], (result) => {
    const rules = result.rules || [];
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      currentEditingRuleId = ruleId;
      modalTitle.textContent = "Edit Rule";
      document.getElementById("domain").value = rule.domain;
      document.getElementById("action").value = rule.action;

      if (rule.action === "redirect") {
        document.getElementById("fromPath").value = rule.fromPath || "";
        document.getElementById("toPath").value = rule.toPath || "";
      } else if (rule.action === "hideElement") {
        document.getElementById("selector").value = rule.selector || "";
      } else {
        document.getElementById("parameter").value = rule.parameter || "";
        document.getElementById("value").value = rule.value || "";
      }

      updateFormFields();
      modal.style.display = "block";
    }
  });
}

// Test selector on current tab
testSelectorBtn.addEventListener("click", async () => {
  const selector = document.getElementById("selector").value.trim();

  if (!selector) {
    selectorTestResult.textContent = "Please enter a selector";
    selectorTestResult.style.color = "#e74c3c";
    return;
  }

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || !tab.id) {
      selectorTestResult.textContent = "No active tab found";
      selectorTestResult.style.color = "#e74c3c";
      return;
    }

    // Execute script in the active tab to test the selector
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (sel) => {
        try {
          const elements = document.querySelectorAll(sel);
          return {
            success: true,
            count: elements.length,
            examples: Array.from(elements)
              .slice(0, 3)
              .map((el) => {
                return {
                  tag: el.tagName.toLowerCase(),
                  class: el.className || "",
                  id: el.id || "",
                };
              }),
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
          };
        }
      },
      args: [selector],
    });

    const result = results[0].result;

    if (!result.success) {
      selectorTestResult.textContent = `Invalid selector: ${result.error}`;
      selectorTestResult.style.color = "#e74c3c";
    } else if (result.count === 0) {
      selectorTestResult.textContent = "No elements found with this selector";
      selectorTestResult.style.color = "#f39c12";
    } else {
      selectorTestResult.textContent = `Found ${result.count} element${result.count > 1 ? "s" : ""}`;
      selectorTestResult.style.color = "#27ae60";
    }
  } catch (error) {
    selectorTestResult.textContent = `Error: ${error.message}`;
    selectorTestResult.style.color = "#e74c3c";
  }
});

// Open modal for new rule
addRuleBtn.addEventListener("click", () => {
  currentEditingRuleId = null;
  modalTitle.textContent = "Add Rule";
  ruleForm.reset();
  updateFormFields();
  modal.style.display = "block";
});

// Close modal
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Save rule (add or edit)
ruleForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const domain = document.getElementById("domain").value.trim();
  const action = document.getElementById("action").value;

  let ruleData = {
    domain,
    action,
  };

  if (action === "redirect") {
    ruleData.fromPath = document.getElementById("fromPath").value.trim();
    ruleData.toPath = document.getElementById("toPath").value.trim();
  } else if (action === "hideElement") {
    ruleData.selector = document.getElementById("selector").value.trim();
  } else {
    ruleData.parameter = document.getElementById("parameter").value.trim();
    ruleData.value = document.getElementById("value").value.trim();
  }

  chrome.storage.sync.get(["rules"], (result) => {
    let rules = result.rules || [];

    if (currentEditingRuleId) {
      // Edit existing rule
      const rule = rules.find((r) => r.id === currentEditingRuleId);
      if (rule) {
        rule.domain = domain;
        rule.action = action;
        if (action === "redirect") {
          rule.fromPath = ruleData.fromPath;
          rule.toPath = ruleData.toPath;
          delete rule.parameter;
          delete rule.value;
          delete rule.selector;
        } else if (action === "hideElement") {
          rule.selector = ruleData.selector;
          delete rule.parameter;
          delete rule.value;
          delete rule.fromPath;
          delete rule.toPath;
        } else {
          rule.parameter = ruleData.parameter;
          rule.value = ruleData.value;
          delete rule.fromPath;
          delete rule.toPath;
          delete rule.selector;
        }
      }
    } else {
      // Add new rule
      const newRule = {
        id: Date.now(),
        enabled: true,
        ...ruleData,
      };
      rules.push(newRule);
    }

    chrome.storage.sync.set({ rules }, () => {
      loadRules();
      modal.style.display = "none";
      ruleForm.reset();
    });
  });
});
