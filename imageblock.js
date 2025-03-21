/*
 * TODOs:
 * - [ ] Block images in iFrames
 * - [ ] Make background images grayscale
 * - [ ] Handle ::before and ::after pseudo-elements with content urls
 * - [ ] GitHub fails on navigating to new page
 */

const blockStyle =
  "* { background-image: none !important; } img, svg, video { opacity: 0.2 !important; filter: grayscale(100%) blur(50px) !important; }";
const grayscaleStyle =
  "* { background-image: none !important; } img, svg, video { filter: grayscale(100%) !important; }";
const rootBlocker = document.createElement("style");
rootBlocker.textContent = blockStyle;
document.documentElement.insertBefore(
  rootBlocker,
  document.documentElement.firstChild
);

/*
 * @returns {Array<ShadowRoot>} Array of ShadowRoots found below/contained
 * @param {Node} ele - An element that we should search for ShadowRoots within.
 *   within the given node, `ele`.
 */
function findShadowRoots(ele) {
  if (ele.querySelectorAll) {
    return [ele, ...ele.querySelectorAll("*")]
      .filter((e) => !!e.shadowRoot)
      .flatMap((e) => [e.shadowRoot, ...findShadowRoots(e.shadowRoot)]);
  }
  return [];
}

function findIFrames(ele) {
  if (ele.querySelectorAll) {
    return [ele, ...ele.querySelectorAll("iframe")]
      .filter((e) => !!e.contentWindow)
      .flatMap((e) => [e.contentWindow, ...findIFrames(e.contentWindow)]);
  }
  return [];
}

function makeImageBlocker(style) {
  const blocker = document.createElement("style");
  blocker.textContent = style;
  return blocker;
}

const blockers = [];

// add an observer to watch for new elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          for (const root of findShadowRoots(node)) {
            const shadowRootBlocker = makeImageBlocker(blockStyle);
            root.appendChild(shadowRootBlocker);
            blockers.push(shadowRootBlocker);
          }
        }
      }
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

function blockImages() {
  rootBlocker.textContent = blockStyle;
  for (const root of findShadowRoots(document.documentElement)) {
    const shadowRootBlocker = makeImageBlocker(blockStyle);
    root.appendChild(shadowRootBlocker);
    blockers.push(shadowRootBlocker);
  }
  for (const iframe of findIFrames(document.documentElement)) {
    const iframeBlocker = makeImageBlocker(blockStyle);
    iframe.document.documentElement.appendChild(iframeBlocker);
    blockers.push(iframeBlocker);
  }
}

function setGrayscaleFilter() {
  rootBlocker.textContent = grayscaleStyle;
  for (const blocker of blockers) {
    blocker.textContent = grayscaleStyle;
  }
}

function removeFilters() {
  rootBlocker.textContent = "";
  for (const blocker of blockers) {
    blocker.textContent = "";
  }
}

// Apply settings; default to blocking images
function applySettings(settings) {
  const sortedSettings = Object.keys(settings).sort(
    (a, b) => b.length - a.length
  );
  const tabUrl = window.location.href;
  const thisSiteSetting = sortedSettings.find((key) => {
    return tabUrl.startsWith(key);
  });
  const filter = settings[thisSiteSetting]?.filter;
  if (filter === "grayscale") {
    setGrayscaleFilter();
  } else if (filter === "all") {
    removeFilters();
  } else {
    blockImages();
  }
}

// Apply settings on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    browser.storage.sync.get("imageBlock_blockImages").then((setting) => {
      applySettings(JSON.parse(setting.imageBlock_blockImages) ?? {});
    });
  });
}

// Apply settings when receiving a message after change
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "blockImages") {
    applySettings(JSON.parse(message.settings) ?? {});
  } else if (message.type === "blockImagesOverride") {
    if (message.filter === "grayscale") {
      setGrayscaleFilter();
    } else if (message.filter === "all") {
      removeFilters();
    } else {
      blockImages();
    }
  }
});

// document.querySelectorAll("*").forEach((element) => {
//   const beforeStyle = window.getComputedStyle(element, "::before");
//   const afterStyle = window.getComputedStyle(element, "::after");

//   if (beforeStyle.content.startsWith("url(")) {
//     element.style.setProperty("--before-content", "url(none)");
//   }

//   if (afterStyle.content.startsWith("url(")) {
//     element.style.setProperty("--after-content", "url(none)");
//   }
// });

const imageExtensions = [
  "bmp",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "jfif",
  "jxl",
  "pjpeg",
  "pjp",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
  "apng",
  "avif",
];

// Function to find all CSS properties with URLs
function findCSSPropertiesWithURLs() {
  const elements = document.querySelectorAll("*"); // Select all elements
  const urlProperties = new Set(); // Use a Set to avoid duplicates

  for (const element of elements) {
    const computedStyle = window.getComputedStyle(element); // Get computed styles

    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      const value = computedStyle.getPropertyValue(property);

      // Check if the property value contains a URL
      // and an extension that matches an image
      if (
        value.includes("url(") &&
        imageExtensions.some((ext) => value.includes(`.${ext}`))
      ) {
        urlProperties.add(`${property}: ${value}`); // Add to the Set

        // change style to remove the url
        element.style.setProperty(property, "none");
      }
    }
  }
  return Array.from(urlProperties); // Convert Set to Array
}

// Function to find all CSS properties with URLs in stylesheets
// function findCSSPropertiesWithURLs() {
//   const urlProperties = new Set(); // Use a Set to avoid duplicates

//   // Loop through all stylesheets
//   for (const sheet of document.styleSheets) {
//     try {
//       // Loop through all rules in the stylesheet
//       for (const rule of sheet.cssRules) {
//         if (rule.style) {
//           // Loop through all properties in the rule
//           for (let i = 0; i < rule.style.length; i++) {
//             const property = rule.style[i];
//             const value = rule.style.getPropertyValue(property);

//             // Check if the property value contains a URL
//             // and an extension that matches an image
//             if (
//               value.includes("url(") &&
//               imageExtensions.some((ext) => value.includes(`.${ext}`))
//             ) {
//               urlProperties.add(`${property}: ${value}`); // Add to the Set
//             }
//           }
//         }
//       }
//     } catch (e) {
//       // Catch security errors for cross-origin stylesheets
//       console.warn(`Unable to access stylesheet: ${sheet.href}`, e);
//     }
//   }

//   return Array.from(urlProperties); // Convert Set to Array
// }
