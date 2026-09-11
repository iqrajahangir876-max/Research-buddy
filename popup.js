// ==========================================
// RESEARCH BUDDY - POPUP JAVASCRIPT
// ==========================================


// ---------- ELEMENTS ----------

const highlightsContainer =
  document.getElementById("highlightsContainer");

const noteCount =
  document.getElementById("noteCount");

const selectionInfo =
  document.getElementById("selectionInfo");

const pageTitle =
  document.getElementById("pageTitle");

const pageDomain =
  document.getElementById("pageDomain");

const extractPageBtn =
  document.getElementById("extractPageBtn");

const selectAllBtn =
  document.getElementById("selectAllBtn");

const exportBtn =
  document.getElementById("exportBtn");

const clearBtn =
  document.getElementById("clearBtn");


// ---------- MODALS ----------

const aiModal =
  document.getElementById("aiModal");

const exportModal =
  document.getElementById("exportModal");

const settingsModal =
  document.getElementById("settingsModal");

const closeModalBtn =
  document.getElementById("closeModalBtn");

const closeExportBtn =
  document.getElementById("closeExportBtn");

const closeSettingsBtn =
  document.getElementById("closeSettingsBtn");


// ---------- AI ----------

const aiResult =
  document.getElementById("aiResult");

const aiLoading =
  document.getElementById("aiLoading");

const modalTitle =
  document.getElementById("modalTitle");

const copyAiBtn =
  document.getElementById("copyAiBtn");


// ---------- SETTINGS ----------

const settingsBtn =
  document.getElementById("settingsBtn");

const apiKeyInput =
  document.getElementById("apiKeyInput");

const saveApiKeyBtn =
  document.getElementById("saveApiKeyBtn");


// ---------- EXPORT ----------

const exportScope =
  document.getElementById("exportScope");

const doExportBtn =
  document.getElementById("doExportBtn");


// ---------- STATE ----------

let allHighlights = [];

let currentTab = null;

let currentPageText = "";

let selectedFormat = "txt";

let lastAIResult = "";


// ==========================================
// AI BACKEND
// ==========================================

 
 const AI_API_URL =
  "https://research-buddy-sigma.vercel.app/api/ai";



// ==========================================
// INITIALIZE
// ==========================================

init();


async function init() {

  await getCurrentTab();

  loadHighlights();

}



// ==========================================
// GET CURRENT TAB
// ==========================================

async function getCurrentTab() {

  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  currentTab = tabs[0];

  if (!currentTab) {
    return;
  }


  pageTitle.textContent =
    currentTab.title || "Current webpage";


  try {

    const url =
      new URL(currentTab.url);

    pageDomain.textContent =
      url.hostname;

  } catch {

    pageDomain.textContent =
      "Web page";

  }

}



// ==========================================
// LOAD HIGHLIGHTS
// ==========================================

function loadHighlights() {

  chrome.storage.local.get(
    { highlights: [] },

    (data) => {

      allHighlights =
        data.highlights || [];

      displayCurrentTabHighlights();

    }
  );

}



// ==========================================
// CURRENT TAB FILTER
// ==========================================

function displayCurrentTabHighlights() {

  if (!currentTab) {
    displayHighlights([]);
    return;
  }


  const currentUrl =
    currentTab.url;


  const currentNotes =
    allHighlights.filter(note => {

      return note.url === currentUrl;

    });


  displayHighlights(currentNotes);

}



// ==========================================
// DISPLAY NOTES
// ==========================================

function displayHighlights(highlights) {

  highlightsContainer.innerHTML = "";


  noteCount.textContent =
    `${highlights.length} ${
      highlights.length === 1
        ? "note"
        : "notes"
    }`;


  updateSelectionInfo();


  if (highlights.length === 0) {

    highlightsContainer.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          📝
        </div>

        <h4>
          No highlights yet
        </h4>

        <p>
          Select something interesting
          on this page and save it.
        </p>

      </div>

    `;

    return;
  }


  highlights.forEach(note => {

    const card =
      document.createElement("div");

    card.className =
      "note-card";


    const domain =
      getShortDomain(note.url);


    card.innerHTML = `

      <div class="note-top">

        <input
          type="checkbox"
          class="note-checkbox"
          data-id="${note.id}"
        >

        <div class="note-text">
          🟨 ${escapeHtml(note.text)}
        </div>

      </div>


      <div class="note-source">

        <span class="source-icon">
          🔗
        </span>

        <span
          class="source-domain"
          title="${escapeHtml(note.url)}"
        >
          ${escapeHtml(domain)}
        </span>

      </div>


      <div class="note-actions">

        <button
          class="mini-btn ai-note-btn"
          data-id="${note.id}"
        >
          🤖 AI
        </button>

        <button
          class="mini-btn copy-note-btn"
          data-id="${note.id}"
        >
          📋 Copy
        </button>

        <button
          class="mini-btn delete-btn"
          data-id="${note.id}"
        >
          🗑 Delete
        </button>

      </div>

    `;


    highlightsContainer.appendChild(card);

  });


  attachNoteEvents();

}



// ==========================================
// NOTE EVENTS
// ==========================================

function attachNoteEvents() {

  document
    .querySelectorAll(".note-checkbox")
    .forEach(checkbox => {

      checkbox.addEventListener(
        "change",
        updateSelectionInfo
      );

    });


  document
    .querySelectorAll(".ai-note-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            Number(button.dataset.id);

          const note =
            allHighlights.find(
              item => item.id === id
            );

          if (note) {

            runAI(
              "summarize",
              note.text
            );

          }

        }
      );

    });


  document
    .querySelectorAll(".copy-note-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id =
            Number(button.dataset.id);

          const note =
            allHighlights.find(
              item => item.id === id
            );

          if (!note) {
            return;
          }


          await navigator.clipboard.writeText(
            note.text
          );


          button.textContent =
            "✓ Copied";


          setTimeout(() => {

            button.textContent =
              "📋 Copy";

          }, 1200);

        }
      );

    });


  document
    .querySelectorAll(".delete-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            Number(button.dataset.id);

          deleteHighlight(id);

        }
      );

    });

}



// ==========================================
// DELETE
// ==========================================

function deleteHighlight(id) {

  allHighlights =
    allHighlights.filter(
      note => note.id !== id
    );


  chrome.storage.local.set(
    {
      highlights: allHighlights
    },
    () => {

      displayCurrentTabHighlights();

    }
  );

}



// ==========================================
// SELECTED NOTES
// ==========================================

function getSelectedNotes() {

  const checkboxes =
    document.querySelectorAll(
      ".note-checkbox:checked"
    );


  const ids =
    Array.from(checkboxes).map(
      checkbox =>
        Number(checkbox.dataset.id)
    );


  return allHighlights.filter(note =>
    ids.includes(note.id)
  );

}



// ==========================================
// SELECTION COUNT
// ==========================================

function updateSelectionInfo() {

  const selected =
    document.querySelectorAll(
      ".note-checkbox:checked"
    );


  selectionInfo.textContent =
    `${selected.length} ${
      selected.length === 1
        ? "note"
        : "notes"
    } selected`;

}



// ==========================================
// SELECT ALL
// ==========================================

selectAllBtn.addEventListener(
  "click",
  () => {

    const checkboxes =
      document.querySelectorAll(
        ".note-checkbox"
      );


    const shouldSelect =
      Array.from(checkboxes).some(
        checkbox => !checkbox.checked
      );


    checkboxes.forEach(checkbox => {

      checkbox.checked =
        shouldSelect;

    });


    selectAllBtn.textContent =
      shouldSelect
        ? "Unselect all"
        : "Select all";


    updateSelectionInfo();

  }
);



// ==========================================
// EXTRACT CURRENT PAGE
// ==========================================

extractPageBtn.addEventListener(
  "click",
  async () => {

    if (!currentTab?.id) {
      return;
    }


    try {

      const response =
        await chrome.tabs.sendMessage(
          currentTab.id,
          {
            action: "extractPageText"
          }
        );


      currentPageText =
        response?.text || "";


      if (!currentPageText) {

        alert(
          "Could not extract text from this page."
        );

        return;

      }


      extractPageBtn.textContent =
        "✓ Page Ready";


      extractPageBtn.style.background =
        "#e9f9f1";


      extractPageBtn.style.color =
        "#218653";

    } catch (error) {

      alert(
        "This page does not allow text extraction."
      );

    }

  }
);



// ==========================================
// AI BUTTONS
// ==========================================

document
  .querySelectorAll(".ai-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const action =
          button.dataset.action;


        const selected =
          getSelectedNotes();


        let text = "";


        if (selected.length > 0) {

          text =
            selected
              .map(note => note.text)
              .join("\n\n");

        } else if (currentPageText) {

          text =
            currentPageText;

        } else {

          text =
            await getSelectedWebText();

        }


        if (!text) {

          alert(
            "Select a saved note first, or use Extract Page."
          );

          return;

        }


        runAI(action, text);

      }
    );

  });



// ==========================================
// GET SELECTED TEXT FROM WEBPAGE
// ==========================================

async function getSelectedWebText() {

  if (!currentTab?.id) {
    return "";
  }


  try {

    const response =
      await chrome.tabs.sendMessage(
        currentTab.id,
        {
          action: "getSelectedText"
        }
      );


    return response?.text || "";

  } catch {

    return "";

  }

}

// ==========================================
// AI FUNCTION
// ==========================================

async function runAI(action, text) {

  if (!text || !text.trim()) {

    alert(
      "No research text is available."
    );

    return;

  }


  modalTitle.textContent =
    getActionTitle(action);


  aiModal.classList.remove(
    "hidden"
  );


  aiResult.textContent = "";


  aiLoading.classList.remove(
    "hidden"
  );


  copyAiBtn.style.display =
    "none";


  lastAIResult = "";


  try {

    const response =
      await fetch(
        AI_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            action: action,

            text:
              text.slice(
                0,
                25000
              )

          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data?.error ||
        "Gemini AI request failed."
      );

    }


    const result =
      data?.result?.trim();


    lastAIResult =
      result ||
      "No result generated.";


    aiResult.textContent =
      lastAIResult;


    copyAiBtn.style.display =
      "block";


  } catch (error) {

    console.error(
      "Research Buddy AI Error:",
      error
    );


    aiResult.textContent =
      `AI Error:

${error.message}

Please check your Vercel backend, Gemini API key, and internet connection.`;

  } finally {

    aiLoading.classList.add(
      "hidden"
    );

  }

}



// ==========================================
// ACTION TITLES
// ==========================================

function getActionTitle(action) {

  const titles = {

    summarize:
      "✨ AI Summary",

    keypoints:
      "🔑 Key Points",

    explain:
      "🧠 Simple Explanation",

    facts:
      "📌 Important Facts"

  };


  return titles[action] ||
    "🤖 AI Result";

}



// ==========================================
// COPY AI RESULT
// ==========================================

copyAiBtn.addEventListener(
  "click",
  async () => {

    if (!lastAIResult) {
      return;
    }


    await navigator.clipboard.writeText(
      lastAIResult
    );


    copyAiBtn.textContent =
      "✓ Copied";


    setTimeout(() => {

      copyAiBtn.textContent =
        "📋 Copy Result";

    }, 1200);

  }
);



// ==========================================
// AI MODAL CLOSE
// ==========================================

closeModalBtn.addEventListener(
  "click",
  () => {

    aiModal.classList.add(
      "hidden"
    );

  }
);



// ==========================================
// EXPORT MODAL
// ==========================================

exportBtn.addEventListener(
  "click",
  () => {

    exportModal.classList.remove(
      "hidden"
    );

  }
);


closeExportBtn.addEventListener(
  "click",
  () => {

    exportModal.classList.add(
      "hidden"
    );

  }
);



// ==========================================
// FORMAT BUTTONS
// ==========================================

document
  .querySelectorAll(".format-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".format-btn"
          )
          .forEach(btn =>
            btn.classList.remove(
              "active"
            )
          );


        button.classList.add(
          "active"
        );


        selectedFormat =
          button.dataset.format;

      }
    );

  });

  // ==========================================
// EXPORT
// ==========================================

doExportBtn.addEventListener(
  "click",
  () => {

    let notes = [];


    const scope =
      exportScope.value;


    if (scope === "selected") {

      notes =
        getSelectedNotes();


      if (notes.length === 0) {

        alert(
          "Please select at least one note."
        );

        return;

      }

    }


    if (scope === "all") {

      notes =
        allHighlights;

    }


    if (scope === "current") {

      notes =
        allHighlights.filter(
          note =>
            note.url === currentTab?.url
        );

    }


    if (notes.length === 0) {

      alert(
        "There are no notes to export."
      );

      return;

    }


    if (selectedFormat === "txt") {

      exportTXT(notes);

    } else {

      exportMarkdown(notes);

    }


    exportModal.classList.add(
      "hidden"
    );

  }
);



// ==========================================
// TXT EXPORT
// ==========================================

function exportTXT(notes) {

  let content =
    "RESEARCH BUDDY NOTES\n";


  content +=
    "====================\n\n";


  notes.forEach(
    (note, index) => {

      content +=
        `NOTE ${index + 1}\n`;

      content +=
        `${note.text}\n`;

      content +=
        `Source: ${note.url}\n`;

      content +=
        `Saved: ${note.createdAt}\n`;

      content +=
        "--------------------\n\n";

    }
  );


  downloadFile(
    content,
    "research-buddy-notes.txt",
    "text/plain"
  );

}



// ==========================================
// MARKDOWN EXPORT
// ==========================================

function exportMarkdown(notes) {

  let content =
    "# Research Buddy Notes\n\n";


  notes.forEach(
    (note, index) => {

      content +=
        `## Note ${index + 1}\n\n`;

      content +=
        `> ${note.text}\n\n`;

      content +=
        `**Source:** ${note.url}\n\n`;

      content +=
        `**Saved:** ${note.createdAt}\n\n`;

      content +=
        "---\n\n";

    }
  );


  downloadFile(
    content,
    "research-buddy-notes.md",
    "text/markdown"
  );

}



// ==========================================
// DOWNLOAD FILE
// ==========================================

function downloadFile(
  content,
  filename,
  type
) {

  const blob =
    new Blob(
      [content],
      { type }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href =
    url;


  link.download =
    filename;


  document.body.appendChild(link);


  link.click();


  link.remove();


  URL.revokeObjectURL(url);

}



// ==========================================
// CLEAR ALL
// ==========================================

clearBtn.addEventListener(
  "click",
  () => {

    const currentNotes =
      allHighlights.filter(
        note =>
          note.url === currentTab?.url
      );


    if (currentNotes.length === 0) {

      alert(
        "There are no highlights on this page."
      );

      return;

    }


    const confirmDelete =
      confirm(
        "Clear all highlights from this page?"
      );


    if (!confirmDelete) {
      return;
    }


    const currentIds =
      new Set(
        currentNotes.map(
          note => note.id
        )
      );


    allHighlights =
      allHighlights.filter(
        note =>
          !currentIds.has(note.id)
      );


    chrome.storage.local.set(
      {
        highlights: allHighlights
      },
      () => {

        displayCurrentTabHighlights();

      }
    );

  }
);



// ==========================================
// SETTINGS
// ==========================================

settingsBtn.addEventListener(
  "click",
  () => {

    settingsModal.classList.remove(
      "hidden"
    );

  }
);


closeSettingsBtn.addEventListener(
  "click",
  () => {

    settingsModal.classList.add(
      "hidden"
    );

  }
);


// Gemini API key extension ke andar
// store nahi hogi.
// API key Vercel backend par secure rahegi.

if (saveApiKeyBtn) {

  saveApiKeyBtn.addEventListener(
    "click",
    () => {

      alert(
        "AI is securely connected through the backend. You do not need to enter an API key here."
      );


      settingsModal.classList.add(
        "hidden"
      );

    }
  );

}



// ==========================================
// SHORT URL
// ==========================================

function getShortDomain(url) {

  try {

    const parsed =
      new URL(url);


    return parsed.hostname;

  } catch {

    return "Web source";

  }

}



// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(text) {

  const div =
    document.createElement("div");


  div.textContent =
    text || "";


  return div.innerHTML;

}

