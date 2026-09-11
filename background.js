// Research Buddy - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log("Research Buddy installed successfully.");

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "save-highlight",
      title: "🟨 Save Highlight",
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-highlight" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "highlightSelectedText"
    });
  }
});