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
    const target = e.target;
    const ruleId = target.getAttribute("data-rule-id");

    if (!ruleId) return;

    if (target.classList.contains("btn-edit")) {
      editRule(parseInt(ruleId));
    } else if (target.classList.contains("btn-danger")) {
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

  if (action === "redirect") {
    parameterGroup.style.display = "none";
    valueGroup.style.display = "none";
    fromPathGroup.style.display = "block";
    toPathGroup.style.display = "block";
    document.getElementById("parameter").removeAttribute("required");
    document.getElementById("fromPath").setAttribute("required", "required");
    document.getElementById("toPath").setAttribute("required", "required");
  } else {
    parameterGroup.style.display = "block";
    valueGroup.style.display = "block";
    fromPathGroup.style.display = "none";
    toPathGroup.style.display = "none";
    document.getElementById("parameter").setAttribute("required", "required");
    document.getElementById("fromPath").removeAttribute("required");
    document.getElementById("toPath").removeAttribute("required");
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
function loadRules() {
  chrome.storage.sync.get(["rules"], (result) => {
    const rules = result.rules || [];
    displayRules(rules);
  });
}

// Display rules in the UI
function displayRules(rules) {
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
      } else {
        ruleDescription = `${rule.action === "remove" ? "Remove" : "Add"} parameter: <strong>${escapeHtml(rule.parameter)}</strong>${rule.value ? ` = ${escapeHtml(rule.value)}` : ""}`;
      }

      return `
        <div class="rule-item" data-rule-id="${rule.id}">
          <div class="rule-info">
            <div class="rule-domain">${escapeHtml(rule.domain)}</div>
            <div class="rule-details">${ruleDescription}</div>
          </div>
          <div class="rule-actions">
            <label class="switch rule-toggle">
              <input type="checkbox" ${rule.enabled ? "checked" : ""} data-rule-id="${rule.id}" class="rule-toggle-input">
              <span class="slider"></span>
            </label>
            <button class="btn btn-edit" data-rule-id="${rule.id}">Edit</button>
            <button class="btn btn-danger" data-rule-id="${rule.id}">Delete</button>
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
      } else {
        document.getElementById("parameter").value = rule.parameter || "";
        document.getElementById("value").value = rule.value || "";
      }

      updateFormFields();
      modal.style.display = "block";
    }
  });
}

// Open modal for new rule
addRuleBtn.addEventListener("click", () => {
  currentEditingRuleId = null;
  modalTitle.textContent = "Add Rule";
  ruleForm.reset();
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
        } else {
          rule.parameter = ruleData.parameter;
          rule.value = ruleData.value;
          delete rule.fromPath;
          delete rule.toPath;
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
