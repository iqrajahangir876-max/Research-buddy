// Research Buddy - Content Script

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Highlight selected text
  if (message.action === "highlightSelectedText") {
    highlightSelectedText();
  }

  // Get selected text
  if (message.action === "getSelectedText") {
    const selectedText = window.getSelection()?.toString().trim() || "";

    sendResponse({
      text: selectedText
    });

    return true;
  }

  // Extract current webpage text
  if (message.action === "extractPageText") {
    const pageText = getPageText();

    sendResponse({
      text: pageText
    });

    return true;
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
  highlight.style.boxShadow = "0 1px 2px rgba(0,0,0,0.08)";

  try {

    const fragment = range.extractContents();

    highlight.appendChild(fragment);

    range.insertNode(highlight);

    selection.removeAllRanges();

    saveHighlight(selectedText);

  } catch (error) {

    console.error("Research Buddy highlighting error:", error);

    // Fallback
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


function getPageText() {

  const clone = document.body.cloneNode(true);

  // Remove unnecessary elements
  clone.querySelectorAll(
    "script, style, noscript, svg, nav, footer, header"
  ).forEach(element => element.remove());

  const text = clone.innerText || "";

  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30000);
}