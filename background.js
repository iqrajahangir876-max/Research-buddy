// Research Buddy - Background

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-highlight",
    title: "🟨 Save Highlight",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-highlight" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "highlightSelectedText"
    });
  }
});