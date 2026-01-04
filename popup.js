// Helper for safe DOM selection
const getEl = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const ui = {
    viewHome: getEl('view-home'),
    viewEdit: getEl('view-edit'),
    btnSettings: getEl('btn-settings'),
    btnBack: getEl('btn-back'),
    btnAutofill: getEl('autofill-btn'),
    status: getEl('status-msg'),
    form: getEl('profile-form'),
    inputs: {
      fullName: getEl('fullName'),
      email: getEl('email'),
      phone: getEl('phone'),
      skills: getEl('skills'),
      experience: getEl('experience')
    }
  };

  // Verify critical elements exist
  if (!ui.btnAutofill || !ui.viewHome) {
    console.error("Critical UI elements missing.");
    return;
  }

  // Safe Status Update
  const updateStatus = (msg, type) => {
    if (!ui.status) return;

    ui.status.textContent = msg;
    const colors = {
      success: '#22c55e',
      warning: '#fbbf24',
      error: '#f87171',
      default: '#94a3b8'
    };
    ui.status.style.color = colors[type] || colors.default;

    if (type === 'success') {
      setTimeout(() => {
        if (ui.status) {
          ui.status.textContent = "Ready to fill";
          ui.status.style.color = colors.default;
        }
      }, 3000);
    }
  };

  // Default Data
  const defaultProfile = {
    fullName: "Vivek Developer",
    email: "vivek@example.com",
    phone: "+1-555-0123",
    skills: "JavaScript, TypeScript, React, Node.js",
    experience: "Sender Senior Software Engineer at Tech Corp (2020-Present)."
  };

  let storedData = defaultProfile;

  // --- Initialization with Error Handling ---
  try {
    // Check if storage API is actually available (caught frequent bug where permissions update fails)
    if (chrome && chrome.storage && chrome.storage.local) {
      storedData = await new Promise((resolve) => {
        chrome.storage.local.get(['profile'], (result) => {
          if (chrome.runtime.lastError) {
            console.warn("Storage warning:", chrome.runtime.lastError);
            resolve(defaultProfile);
          } else {
            resolve(result.profile || defaultProfile);
          }
        });
      });

      // Ensure defaults are saved if empty
      if (!storedData || Object.keys(storedData).length === 0) {
        storedData = defaultProfile;
        chrome.storage.local.set({ profile: defaultProfile });
      }
    } else {
      console.warn("Storage API not available. Using in-memory defaults.");
      updateStatus("Storage permission missing. Settings won't save.", 'warning');
    }
  } catch (e) {
    console.error("Init warning:", e);
    // Fallback to default variable, code continues
  }

  // --- Event Listeners ---

  // 1. Settings Button
  if (ui.btnSettings) {
    ui.btnSettings.addEventListener('click', () => {
      populateForm(storedData);
      switchView('edit');
    });
  }

  // 2. Back Button
  if (ui.btnBack) {
    ui.btnBack.addEventListener('click', () => {
      switchView('home');
    });
  }

  // 3. Autofill Button
  if (ui.btnAutofill) {
    ui.btnAutofill.addEventListener('click', async () => {
      try {
        updateStatus("Detecting fields...", 'default');

        // Refresh data from storage before filling (in case user edited it elsewhere)
        if (chrome.storage && chrome.storage.local) {
          const fresh = await new Promise(r => chrome.storage.local.get(['profile'], res => r(res && res.profile)));
          if (fresh) storedData = fresh;
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          updateStatus("No active tab.", 'error');
          return;
        }

        // Send message
        chrome.tabs.sendMessage(tab.id, {
          action: "autofill",
          data: storedData
        }, (response) => {
          // Handle message passing errors (e.g. receiver not ready)
          if (chrome.runtime.lastError) {
            console.warn(chrome.runtime.lastError);
            // Often happens if we try to inject into chrome:// pages or blank tabs
            updateStatus("Refresh page & try again.", 'error');
            return;
          }

          if (response && response.status === 'success') {
            updateStatus(`Filled ${response.count} fields!`, 'success');
          } else if (response && response.status === 'already_filled') {
            updateStatus("Fields already filled.", 'success');
          } else if (response && response.status === 'no_fields') {
            updateStatus("No matching fields found.", 'warning');
          } else {
            // If null response but no error
            updateStatus("No response from page.", 'error');
          }
        });

      } catch (err) {
        console.error(err);
        updateStatus("Error: " + err.message, 'error');
      }
    });
  }

  // 4. Save Form
  if (ui.form) {
    ui.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newProfile = {
        fullName: ui.inputs.fullName.value,
        email: ui.inputs.email.value,
        phone: ui.inputs.phone.value,
        skills: ui.inputs.skills.value,
        experience: ui.inputs.experience.value
      };

      if (chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ profile: newProfile });
      }
      storedData = newProfile;

      // UX Feedback
      const btn = ui.form.querySelector('button');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = "Saved!";
        btn.style.background = "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"; // Hardcoded color to ensure visibility

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = ""; // Reset
          switchView('home');
          updateStatus("Profile updated!", 'success');
        }, 700);
      }
    });
  }

  // --- Helpers ---

  function switchView(viewName) {
    if (!ui.viewHome || !ui.viewEdit) return;

    if (viewName === 'edit') {
      ui.viewHome.classList.add('hidden');
      ui.viewEdit.classList.remove('hidden');
    } else {
      ui.viewEdit.classList.add('hidden');
      ui.viewHome.classList.remove('hidden');
    }
  }

  function populateForm(data) {
    if (!data) return;
    if (ui.inputs.fullName) ui.inputs.fullName.value = data.fullName || '';
    if (ui.inputs.email) ui.inputs.email.value = data.email || '';
    if (ui.inputs.phone) ui.inputs.phone.value = data.phone || '';
    if (ui.inputs.skills) ui.inputs.skills.value = data.skills || '';
    if (ui.inputs.experience) ui.inputs.experience.value = data.experience || '';
  }

});
