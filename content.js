// Research Buddy - Content Script

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "highlightSelectedText") {
    highlightSelectedText();
  }

});


function highlightSelectedText() {

  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const selectedText = selection.toString().trim();

  if (!selectedText) {
    return;
  }

  const range = selection.getRangeAt(0);

  const highlight = document.createElement("span");

  highlight.style.backgroundColor = "#fff176";
  highlight.style.padding = "2px 3px";
  highlight.style.borderRadius = "4px";

  try {

    const fragment = range.extractContents();

    highlight.appendChild(fragment);

    range.insertNode(highlight);

    selection.removeAllRanges();

    saveHighlight(selectedText);

  } catch (error) {

    console.error("Highlight error:", error);

    saveHighlight(selectedText);

  }

}


function saveHighlight(text) {

  const highlight = {
    id: Date.now(),
    text: text,
    url: window.location.href,
    title: document.title,
    createdAt: new Date().toLocaleString()
  };

  chrome.storage.local.get(
    { highlights: [] },
    (data) => {

      const highlights = data.highlights || [];

      highlights.push(highlight);

      chrome.storage.local.set({
        highlights: highlights
      });

    }
  );

}