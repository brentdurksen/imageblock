let settings = {};
let tabUrl = "";
browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
  tabUrl = tabs[0].url;
});

browser.storage.sync.get("imageBlock_blockImages").then((result) => {
  settings = JSON.parse(result.imageBlock_blockImages) ?? {};
  const sortedSettingsKeys = Object.keys(settings).sort(
    (a, b) => b.length - a.length
  );
  const thisSiteKey = sortedSettingsKeys.find((key) => tabUrl.startsWith(key));
  if (thisSiteKey) {
    // set radio buttons to saved value
    const filters = document.getElementsByName("filter");
    filters.forEach((filter) => {
      if (filter.value === settings[thisSiteKey].filter) {
        filter.checked = true;
      }
    });
    const target = document.getElementsByName("target");
    target.forEach((target) => {
      if (target.value === settings[thisSiteKey].target) {
        target.checked = true;
      }
    });
  }
});

function saveSettings() {
  browser.storage.sync.set({
    imageBlock_blockImages: JSON.stringify(settings),
  });
  browser.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) => {
      browser.tabs.sendMessage(tab.id, {
        type: "blockImages",
        settings: JSON.stringify(settings),
      });
    });
  });
  window.close();
}

const form = document.getElementById("optionsForm");
form.addEventListener("submit", function (event) {
  event.preventDefault();
  const formData = new FormData(form);
  const filter = formData.get("filter");
  const target = formData.get("target");
  const urlTarget = target === "domain" ? new URL(tabUrl).origin : tabUrl;
  settings[urlTarget] = {
    filter,
    target,
  };
  saveSettings();
});

// // set value to saved value
// browser.storage.sync.get("imageBlock_blockImages").then((result) => {
//   blockImageCheckbox.checked = result.imageBlock_blockImages;
// });

// blockImageCheckbox.addEventListener("change", (event) => {
//   browser.storage.sync.set({ imageBlock_blockImages: event.target.checked });
//   console.log("blockImages", event.target.checked);
//   // send message to content script in all tabs
//   browser.tabs.query({}).then((tabs) => {
//     tabs.forEach((tab) => {
//       browser.tabs.sendMessage(tab.id, {
//         type: "blockImages",
//         blockImages: event.target.checked,
//       });
//     });
//   });
// });
