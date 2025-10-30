// DOM elements
const extensionToggle = document.getElementById('extensionToggle');
const statusText = document.getElementById('statusText');
const rulesList = document.getElementById('rulesList');
const addRuleBtn = document.getElementById('addRuleBtn');
const modal = document.getElementById('ruleModal');
const modalTitle = document.getElementById('modalTitle');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const ruleForm = document.getElementById('ruleForm');

let currentEditingRuleId = null;

// Load settings on popup open
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadRules();
});

// Load extension enabled state
function loadSettings() {
  chrome.storage.sync.get(['enabled'], (result) => {
    const enabled = result.enabled !== false;
    extensionToggle.checked = enabled;
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
  });
}

// Toggle extension on/off
extensionToggle.addEventListener('change', () => {
  const enabled = extensionToggle.checked;
  chrome.storage.sync.set({ enabled });
  statusText.textContent = enabled ? 'Enabled' : 'Disabled';
});

// Load and display rules
function loadRules() {
  chrome.storage.sync.get(['rules'], (result) => {
    const rules = result.rules || [];
    displayRules(rules);
  });
}

// Display rules in the UI
function displayRules(rules) {
  if (rules.length === 0) {
    rulesList.innerHTML = '<div class="empty-state">No rules configured. Click "Add New Rule" to get started.</div>';
    return;
  }

  rulesList.innerHTML = rules.map(rule => `
    <div class="rule-item">
      <div class="rule-info">
        <div class="rule-domain">${escapeHtml(rule.domain)}</div>
        <div class="rule-details">
          ${rule.action === 'remove' ? 'Remove' : 'Add'} parameter:
          <strong>${escapeHtml(rule.parameter)}</strong>
          ${rule.value ? `= ${escapeHtml(rule.value)}` : ''}
        </div>
      </div>
      <div class="rule-actions">
        <label class="switch rule-toggle">
          <input type="checkbox" ${rule.enabled ? 'checked' : ''}
                 onchange="toggleRule(${rule.id})">
          <span class="slider"></span>
        </label>
        <button class="btn btn-edit" onclick="editRule(${rule.id})">Edit</button>
        <button class="btn btn-danger" onclick="deleteRule(${rule.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Toggle rule enabled state
window.toggleRule = function(ruleId) {
  chrome.storage.sync.get(['rules'], (result) => {
    const rules = result.rules || [];
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      chrome.storage.sync.set({ rules }, () => {
        loadRules();
      });
    }
  });
};

// Delete rule
window.deleteRule = function(ruleId) {
  if (!confirm('Are you sure you want to delete this rule?')) return;

  chrome.storage.sync.get(['rules'], (result) => {
    const rules = result.rules || [];
    const filteredRules = rules.filter(r => r.id !== ruleId);
    chrome.storage.sync.set({ rules: filteredRules }, () => {
      loadRules();
    });
  });
};

// Edit rule
window.editRule = function(ruleId) {
  chrome.storage.sync.get(['rules'], (result) => {
    const rules = result.rules || [];
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      currentEditingRuleId = ruleId;
      modalTitle.textContent = 'Edit Rule';
      document.getElementById('domain').value = rule.domain;
      document.getElementById('parameter').value = rule.parameter;
      document.getElementById('value').value = rule.value || '';
      document.getElementById('action').value = rule.action;
      modal.style.display = 'block';
    }
  });
};

// Open modal for new rule
addRuleBtn.addEventListener('click', () => {
  currentEditingRuleId = null;
  modalTitle.textContent = 'Add Rule';
  ruleForm.reset();
  modal.style.display = 'block';
});

// Close modal
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// Save rule (add or edit)
ruleForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const domain = document.getElementById('domain').value.trim();
  const parameter = document.getElementById('parameter').value.trim();
  const value = document.getElementById('value').value.trim();
  const action = document.getElementById('action').value;

  chrome.storage.sync.get(['rules'], (result) => {
    let rules = result.rules || [];

    if (currentEditingRuleId) {
      // Edit existing rule
      const rule = rules.find(r => r.id === currentEditingRuleId);
      if (rule) {
        rule.domain = domain;
        rule.parameter = parameter;
        rule.value = value;
        rule.action = action;
      }
    } else {
      // Add new rule
      const newRule = {
        id: Date.now(),
        domain,
        parameter,
        value,
        action,
        enabled: true
      };
      rules.push(newRule);
    }

    chrome.storage.sync.set({ rules }, () => {
      loadRules();
      modal.style.display = 'none';
      ruleForm.reset();
    });
  });
});
