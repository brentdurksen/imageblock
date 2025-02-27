const blockBackgroundImages = document.createElement("style");
blockBackgroundImages.textContent = `* { background-image: none !important; }`;

function applySettings(settings) {
  const sortedSettings = Object.keys(settings).sort(
    (a, b) => b.length - a.length
  );
  const tabUrl = window.location.href;
  const thisSiteSetting = sortedSettings.find((key) => {
    return tabUrl.startsWith(key);
  });
  const docStyle = document.documentElement.style;
  if (settings[thisSiteSetting]?.filter === "grayscale") {
    docStyle.setProperty("--image-block-opacity", "initial");
    blockBackgroundImages.remove();
  } else if (settings[thisSiteSetting]?.filter === "all") {
    docStyle.setProperty("--image-block-opacity", "initial");
    docStyle.setProperty("--image-block-grayscale-filter", "initial");
  } else {
    docStyle.setProperty("--image-block-opacity", "0");
    docStyle.setProperty("--image-block-grayscale-filter", "grayscale(100%)");
    document.head.appendChild(blockBackgroundImages);
  }
}

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "blockImages") {
    applySettings(JSON.parse(message.settings) ?? {});
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", async () => {
    const setting = await browser.storage.sync.get("imageBlock_blockImages");
    applySettings(JSON.parse(setting.imageBlock_blockImages) ?? {});
  });
}
