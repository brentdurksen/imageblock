let settings = {};
let currentTab;

// Get the current tab URL
browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
  currentTab = tabs[0];
});

// Get saved settings for the current site
browser.storage.sync.get("imageBlock_blockImages").then((result) => {
  settings = JSON.parse(result.imageBlock_blockImages) ?? {};
  const sortedSettingsKeys = Object.keys(settings).sort(
    (a, b) => b.length - a.length
  );
  const thisSiteKey = sortedSettingsKeys.find((key) =>
    currentTab.url.startsWith(key)
  );
  if (thisSiteKey) {
    const filterRadio = document.getElementById(
      `filter_${settings[thisSiteKey].filter}`
    );
    const targetRadio = document.getElementById(
      `target_${settings[thisSiteKey].target}`
    );
    if (filterRadio && targetRadio) {
      filterRadio.checked = true;
      targetRadio.checked = true;
    }
  }
});

// Save the settings to storage and send a message to all tabs to update the settings
function saveSettings() {
  browser.storage.sync.set({
    imageBlock_blockImages: JSON.stringify(settings),
  });
  browser.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      browser.tabs.sendMessage(tab.id, {
        type: "blockImages",
        settings: JSON.stringify(settings),
      });
    }
  });
}

// Handle form submit
function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const filter = formData.get("filter");
  const target = formData.get("target");
  const urlTarget =
    target === "domain" ? new URL(currentTab.url).origin : currentTab.url;
  settings[urlTarget] = {
    filter,
    target,
  };
  saveSettings();
  window.close();
}

// Add event listener to form submit
const form = document.getElementById("optionsForm");
form.addEventListener("submit", handleFormSubmit);

// Listen for override button clicks
for (const override of ["none", "grayscale", "all"]) {
  document
    .getElementById(`override_${override}`)
    .addEventListener("click", () => {
      browser.tabs.sendMessage(currentTab.id, {
        type: "blockImagesOverride",
        filter: override,
      });
      window.close();
    });
}
