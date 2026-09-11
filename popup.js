let allHighlights = [];
let currentTab = null;
let selectedFormat = "txt";


init();


async function init() {

  await getCurrentTab();

  loadHighlights();

}


/* GET CURRENT TAB */

async function getCurrentTab() {

  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  currentTab = tabs[0];

  if (!currentTab) {
    return;
  }

  document.getElementById("pageTitle").textContent =
    currentTab.title || "Current Page";

  document.getElementById("pageDomain").textContent =
    currentTab.url || "";

}


/* LOAD HIGHLIGHTS */

function loadHighlights() {

  chrome.storage.local.get(
    { highlights: [] },
    (data) => {

      allHighlights = data.highlights || [];

      displayHighlights();

    }
  );

}


/* DISPLAY */

function displayHighlights() {

  const container =
    document.getElementById("highlightsContainer");

  const currentHighlights =
    allHighlights.filter(note =>
      note.url === currentTab?.url
    );


  document.getElementById("noteCount").textContent =
    currentHighlights.length;


  document.getElementById("selectionInfo").textContent = "0";


  if (currentHighlights.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <h3>No highlights yet</h3>
        <p>
          Select text on this webpage,
          right-click and choose
          <b>🟨 Save Highlight</b>.
        </p>
      </div>
    `;

    return;

  }


  container.innerHTML = "";


  currentHighlights.forEach(note => {

    const card = document.createElement("div");

    card.className = "highlight-card";

    card.innerHTML = `

      <div class="highlight-top">

        <input
          type="checkbox"
          class="highlight-check"
          data-id="${note.id}"
        >

        <div class="highlight-text">
          ${escapeHtml(note.text)}
        </div>

      </div>

      <div class="highlight-meta">
        ${note.createdAt}
      </div>

      <div class="card-actions">

        <button
          class="card-btn copy-btn"
          data-id="${note.id}">
          📋 Copy
        </button>

        <button
          class="card-btn delete-btn"
          data-id="${note.id}">
          🗑 Delete
        </button>

      </div>

    `;


    container.appendChild(card);

  });


  addCardEvents();

}


/* CARD EVENTS */

function addCardEvents() {

  document.querySelectorAll(".highlight-check")
    .forEach(checkbox => {

      checkbox.addEventListener("change", updateSelectionInfo);

    });


  document.querySelectorAll(".copy-btn")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id = Number(button.dataset.id);

        const note = allHighlights.find(
          item => item.id === id
        );

        if (note) {

          navigator.clipboard.writeText(note.text);

          button.textContent = "✓ Copied";

          setTimeout(() => {
            button.textContent = "📋 Copy";
          }, 1000);

        }

      });

    });


  document.querySelectorAll(".delete-btn")
    .forEach(button => {

      button.addEventListener("click", () => {

        deleteHighlight(Number(button.dataset.id));

      });

    });

}


/* SELECTION COUNT */

function updateSelectionInfo() {

  const selected =
    document.querySelectorAll(
      ".highlight-check:checked"
    ).length;

  document.getElementById("selectionInfo").textContent =
    selected;

}


/* SELECT ALL */

document
  .getElementById("selectAllBtn")
  .addEventListener("click", () => {

    const checkboxes =
      document.querySelectorAll(".highlight-check");

    const allSelected =
      checkboxes.length > 0 &&
      [...checkboxes].every(box => box.checked);


    checkboxes.forEach(box => {
      box.checked = !allSelected;
    });


    updateSelectionInfo();

  });


/* DELETE */

function deleteHighlight(id) {

  allHighlights =
    allHighlights.filter(note => note.id !== id);


  chrome.storage.local.set(
    { highlights: allHighlights },
    () => {
      displayHighlights();
    }
  );

}


/* EXPORT BUTTON */

document
  .getElementById("exportBtn")
  .addEventListener("click", () => {

    document
      .getElementById("exportModal")
      .classList.remove("hidden");

  });


/* CLOSE MODAL */

document
  .getElementById("closeModal")
  .addEventListener("click", () => {

    document
      .getElementById("exportModal")
      .classList.add("hidden");

  });


/* FORMAT */

document.querySelectorAll(".format-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".format-btn")
        .forEach(btn =>
          btn.classList.remove("active")
        );

      button.classList.add("active");

      selectedFormat =
        button.dataset.format;

    });

  });


/* DOWNLOAD */

document
  .getElementById("downloadBtn")
  .addEventListener("click", () => {

    const currentHighlights =
      allHighlights.filter(note =>
        note.url === currentTab?.url
      );


    if (currentHighlights.length === 0) {

      alert("No highlights to export.");

      return;

    }


    let content = "";


    if (selectedFormat === "md") {

      content += `# Research Buddy Notes\n\n`;

      content += `**Page:** ${
        currentTab.title || "Web Page"
      }\n\n`;

      content += `**URL:** ${
        currentTab.url
      }\n\n`;

      content += `---\n\n`;


      currentHighlights.forEach((note, index) => {

        content += `## Highlight ${index + 1}\n\n`;

        content += `> ${note.text}\n\n`;

        content += `*Saved: ${note.createdAt}*\n\n`;

        content += `---\n\n`;

      });

    } else {

      content += `RESEARCH BUDDY NOTES\n`;

      content += `====================\n\n`;

      content += `Page: ${
        currentTab.title || "Web Page"
      }\n`;

      content += `URL: ${
        currentTab.url
      }\n\n`;


      currentHighlights.forEach((note, index) => {

        content += `Highlight ${index + 1}\n`;

        content += `${note.text}\n`;

        content += `Saved: ${note.createdAt}\n\n`;

      });

    }


    const extension =
      selectedFormat === "md"
        ? "md"
        : "txt";


    const blob = new Blob(
      [content],
      { type: "text/plain" }
    );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `research-notes.${extension}`;

    link.click();


    URL.revokeObjectURL(url);

  });


/* CLEAR */

document
  .getElementById("clearBtn")
  .addEventListener("click", () => {

    const currentUrl = currentTab?.url;


    if (!currentUrl) {
      return;
    }


    const confirmed =
      confirm(
        "Delete all highlights from this page?"
      );


    if (!confirmed) {
      return;
    }


    allHighlights =
      allHighlights.filter(
        note => note.url !== currentUrl
      );


    chrome.storage.local.set(
      { highlights: allHighlights },
      () => {
        displayHighlights();
      }
    );

  });


/* ESCAPE HTML */

function escapeHtml(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}