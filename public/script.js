// Flashcard Manager
class FlashcardManager {
  constructor() {
    this.storageKey = "flashcards";
    this.currentEditId = null;
    this.selectedIds = new Set();
    this.init();
  }

  init() {
    this.loadFlashcards();
    this.setupEventListeners();
    this.setupSelectionControls();
    lucide.createIcons();
  }

  generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2);

  getFlashcards = () =>
    JSON.parse(localStorage.getItem(this.storageKey) || "[]");

  getFlashcard = (id) => this.getFlashcards().find((fc) => fc.id === id);

  saveFlashcards = (data) =>
    localStorage.setItem(this.storageKey, JSON.stringify(data));

  createFlashcard(title, fields) {
    const all = this.getFlashcards();
    const card = {
      id: this.generateId(),
      title,
      fields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.push(card);
    this.saveFlashcards(all);
    this.loadFlashcards();
    showToast("Flashcard created successfully!");
  }

  updateFlashcard(id, title, fields) {
    const all = this.getFlashcards();
    const i = all.findIndex((f) => f.id === id);
    if (i < 0) return;
    all[i] = { ...all[i], title, fields, updatedAt: new Date().toISOString() };
    this.saveFlashcards(all);
    this.loadFlashcards();
    showToast("Flashcard updated successfully!");
  }

  deleteFlashcard(id) {
    this.saveFlashcards(this.getFlashcards().filter((f) => f.id !== id));
    this.loadFlashcards();
    showToast("Flashcard deleted successfully!");
  }

  searchFlashcards = (q) => {
    const s = q.toLowerCase();
    return this.getFlashcards().filter(
      (fc) =>
        fc.title?.toLowerCase().includes(s) ||
        fc.fields?.some(
          (f) =>
            f.content?.toLowerCase().includes(s) ||
            f.explanation?.toLowerCase().includes(s)
        )
    );
  };

  loadFlashcards(search = "") {
    const data = search ? this.searchFlashcards(search) : this.getFlashcards(),
      container = document.querySelector(".max-w-6xl.mx-auto.space-y-2"),
      alertBox = document.getElementById("search-alert"),
      tutorial = document.getElementById("tutorial-card");

    container
      .querySelectorAll(".card.w-full:not(#tutorial-card)")
      .forEach((c) => c.remove());
    tutorial?.classList.toggle("hidden", !(data.length === 0 && !search));
    if (alertBox) {
      alertBox.querySelector("span").textContent = search
        ? `Found ${data.length} flashcard(s) matching "${search}"`
        : "";
      alertBox.classList.toggle("hidden", !search);
    }

    data.forEach((fc) =>
      container.insertAdjacentHTML("beforeend", this.createCardHTML(fc))
    );

    container.querySelectorAll(".card.w-full").forEach((card) =>
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".dropdown"))
          this.openPreviewModal(card.dataset.id);
      })
    );

    const selectAllBtn = document.getElementById("selectAllBtn");
    if (selectAllBtn) {
      const hasData = data.length > 0;
      selectAllBtn.disabled = !hasData;
      selectAllBtn.classList.toggle("opacity-60", !hasData);
      selectAllBtn.classList.toggle("cursor-not-allowed", !hasData);
    }

    lucide.createIcons();
  }

  toggleSelection(id, checked) {
    checked ? this.selectedIds.add(id) : this.selectedIds.delete(id);
    this.updateDeleteButtonState();
  }

  createCardHTML(fc) {
    const count = Array.isArray(fc.fields) ? fc.fields.length : 0;
    const html = `
      <div class="card w-full bg-base-100 cursor-pointer shadow-md rounded-lg" data-id="${
        fc.id
      }">
        <div class="card-body">
          <div class="flex items-center justify-between gap-2 w-full">
            <div class="flex-1 min-w-0 overflow-hidden">
              <h2 class="block text-sm font-semibold truncate w-full max-w-full">${
                fc.title || "Untitled"
              }</h2>
            </div>
            <div class="flex items-center gap-2 shrink-0 ml-1" onclick="event.stopPropagation()">
              <input 
                type="checkbox"
                class="checkbox bg-base-300 border-none rounded-sm checkbox-lg cursor-pointer"
                onclick="event.stopPropagation(); flashcardManager.toggleSelection('${
                  fc.id
                }', this.checked)"
              />
              <div class="dropdown dropdown-end" onclick="event.stopPropagation()">
                <div tabindex="0" role="button" class="btn btn-square btn-sm bg-base-300 border-none">
                  <i data-lucide="ellipsis-vertical" class="w-4"></i>
                </div>
                <ul tabindex="-1" class="text-xs dropdown-content menu bg-base-100 mt-1 menu-xs rounded-box z-10 w-40 p-2 shadow-sm">
                  <li>
                    <button onclick="event.stopPropagation(); flashcardManager.exportToJSON();">
                      <i data-lucide="file-braces-corner" class="w-4"></i> EXPORT TO JSON
                    </button>
                  </li>
                  <li>
                    <button onclick="event.stopPropagation(); flashcardManager.openUpdateModal('${
                      fc.id
                    }')">
                      <i data-lucide="pen" class="w-4"></i> UPDATE
                    </button>
                  </li>
                  <li>
                    <button onclick="event.stopPropagation(); flashcardManager.openDeleteModal('${
                      fc.id
                    }')">
                      <i data-lucide="trash" class="w-4"></i> DELETE
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="badge badge-neutral badge-dash mt-1">
            <p class="italic text-xs text-gray-600">${count} FLASHCARD</p>
          </div>
        </div>
      </div>
      `;
    return html;
  }

  setupEventListeners() {
    document
      .querySelector('input[type="search"]')
      ?.addEventListener("input", (e) => this.loadFlashcards(e.target.value));
    this.setupAddFlashcardModal();
    this.setupUpdateFlashcardModal();
  }

  setupAddFlashcardModal() {
    const m = document.getElementById("add-flashcard"),
      add = m.querySelector(".bg-base-200.p-3 button:first-child"),
      save = m.querySelector(".bg-base-200.p-3 button:last-child"),
      box =
        m.querySelector(".flex-1.overflow-auto") || m.querySelector(".flex-1");

    save.disabled = true;
    save.classList.add("btn-disabled", "opacity-60", "cursor-not-allowed");

    const validateFields = () => {
      const title = m.querySelector('input[placeholder="TITLE"]').value.trim();
      const fields = this.getFieldsFromModal(box);
      const allFilled =
        title &&
        fields.length > 0 &&
        fields.every((f) => f.content.trim() && f.explanation.trim());
      save.disabled = !allFilled;
      save.classList.toggle("btn-disabled", !allFilled);
      save.classList.toggle("opacity-60", !allFilled);
      save.classList.toggle("cursor-not-allowed", !allFilled);
    };

    m.addEventListener("input", validateFields);

    add.addEventListener("click", () => {
      this.addFieldToModal(box);
      validateFields();
    });

    save.addEventListener("click", () => {
      const title = m.querySelector('input[placeholder="TITLE"]').value,
        fields = this.getFieldsFromModal(box);
      if (
        !title.trim() ||
        fields.some((f) => !f.content.trim() || !f.explanation.trim())
      )
        return;
      this.createFlashcard(title, fields);
      this.resetModal(m);
      closeModal("add-flashcard");
      validateFields();
    });
  }

  setupUpdateFlashcardModal() {
    const m = document.getElementById("update-modal"),
      add = m.querySelector(".bg-base-200.p-3 button:first-child"),
      save = m.querySelector(".bg-base-200.p-3 button:last-child"),
      box =
        m.querySelector(".flex-1.overflow-auto") || m.querySelector(".flex-1");

    save.disabled = true;
    save.classList.add("btn-disabled", "opacity-60", "cursor-not-allowed");

    const validateFields = () => {
      const title = m.querySelector('input[placeholder="TITLE"]').value.trim();
      const fields = this.getFieldsFromModal(box);
      const allFilled =
        title &&
        fields.length > 0 &&
        fields.every((f) => f.content.trim() && f.explanation.trim());
      save.disabled = !allFilled;
      save.classList.toggle("btn-disabled", !allFilled);
      save.classList.toggle("opacity-60", !allFilled);
      save.classList.toggle("cursor-not-allowed", !allFilled);
    };

    m.addEventListener("input", validateFields);

    add.addEventListener("click", () => {
      this.addFieldToModal(box);
      validateFields();
    });

    save.addEventListener("click", () => {
      if (!this.currentEditId) return;
      const title = m.querySelector('input[placeholder="TITLE"]').value,
        fields = this.getFieldsFromModal(box);
      if (
        !title.trim() ||
        fields.some((f) => !f.content.trim() || !f.explanation.trim())
      )
        return;
      this.updateFlashcard(this.currentEditId, title, fields);
      this.resetModal(m);
      closeModal("update-modal");
      this.currentEditId = null;
      validateFields();
    });
  }

  setupSelectionControls() {
    const delBtn = document.getElementById("deleteSelectedBtn"),
      allBtn = document.getElementById("selectAllBtn");

    delBtn.addEventListener("click", () => {
      if (this.selectedIds.size < 2) return;
      const modal = document.getElementById("delete_modal");
      modal.showModal();
      const confirm = modal.querySelector(".btn-sm.bg-base-100");
      confirm.replaceWith(confirm.cloneNode(true));
      modal
        .querySelector(".btn-sm.bg-base-100")
        .addEventListener("click", () => {
          const rest = this.getFlashcards().filter(
            (fc) => !this.selectedIds.has(fc.id)
          );
          this.saveFlashcards(rest);
          this.selectedIds.clear();
          this.loadFlashcards();
          this.updateDeleteButtonState();
          modal.close();
          showToast("Selected flashcards deleted!");
        });
    });

    allBtn.addEventListener("click", () => {
      const cards = document.querySelectorAll(".card[data-id]");
      const allSelected = this.selectedIds.size === cards.length;
      this.selectedIds = allSelected
        ? new Set()
        : new Set([...cards].map((c) => c.dataset.id));
      this.syncCheckboxes();
      this.updateDeleteButtonState();
    });
  }

  updateDeleteButtonState() {
    const btn = document.getElementById("deleteSelectedBtn"),
      active = this.selectedIds.size >= 2;
    btn.disabled = !active;
    btn.classList.toggle("opacity-60", !active);
    btn.classList.toggle("cursor-not-allowed", !active);
  }

  syncCheckboxes() {
    document
      .querySelectorAll('.card input[type="checkbox"]')
      .forEach(
        (chk) =>
          (chk.checked = this.selectedIds.has(chk.closest(".card").dataset.id))
      );
  }

  addFieldToModal(c) {
    c.insertAdjacentHTML(
      "beforeend",
      `
        <div class="join w-full mt-4 field-group">
          <div class="w-full"><input class="w-full text-xs input join-item bg-base-100 shadow-md border-y-0 border-base-300 input-sm border-l-0 border-r-2" placeholder="Content ..." /></div>
          <input class="input w-full text-xs join-item bg-base-100 shadow-md border-y-0 border-base-300 input-sm border-r-0 border-l-2" placeholder="Explanation ..." />
          <button class="btn join-item bg-base-200 shadow-md border-none btn-square btn-sm remove-field-btn"><i data-lucide="x"></i></button>
        </div>`
    );
    const rm = c.querySelector(".field-group:last-child .remove-field-btn");
    rm.addEventListener("click", () => {
      rm.closest(".field-group").remove();
      const modal = rm.closest("dialog");
      modal.dispatchEvent(new Event("input"));
    });
    lucide.createIcons();
  }

  getFieldsFromModal(c) {
    const fields = [];
    c.querySelectorAll(".join.w-full").forEach((g) => {
      const i = g.querySelectorAll("input");
      if (i.length >= 2)
        fields.push({ content: i[0].value, explanation: i[1].value });
    });
    return fields;
  }

  resetModal(m) {
    m.querySelector('input[placeholder="TITLE"]').value = "";
    m.querySelectorAll(".join.w-full").forEach((g, i) => {
      i >= 1
        ? g.remove()
        : g.querySelectorAll("input").forEach((x) => (x.value = ""));
    });
  }

  openUpdateModal(id) {
    this.currentEditId = id;
    const fc = this.getFlashcard(id),
      m = document.getElementById("update-modal"),
      t = m?.querySelector('input[placeholder="TITLE"]'),
      c =
        m?.querySelector(".flex-1.overflow-auto") ||
        m?.querySelector(".flex-1");

    if (!fc || !c) {
      console.warn("⚠️ Update modal container not found.");
      return;
    }

    t.value = fc.title || "";
    c.querySelectorAll(".join.w-full").forEach((f) => f.remove());
    (fc.fields?.length
      ? fc.fields
      : [{ content: "", explanation: "" }]
    ).forEach((f, i) => {
      c.insertAdjacentHTML(
        "beforeend",
        `
          <div class="join w-full mt-4 field-group">
            <input class="w-full input join-item text-xs bg-base-100 shadow-md border-y-0 border-base-300 input-sm border-l-0 border-r-2" value="${
              f.content
            }" placeholder="Content ..." />
            <input class="input w-full text-xs join-item bg-base-100 shadow-md border-y-0 border-base-300 input-sm border-r-0 border-l-2" value="${
              f.explanation
            }" placeholder="Explanation ..." />
            ${
              i > 0
                ? '<button class="btn join-item bg-base-200 shadow-md border-none btn-square btn-sm remove-field-btn"><i data-lucide="x"></i></button>'
                : ""
            }
          </div>`
      );
    });
    c.querySelectorAll(".remove-field-btn").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.target.closest(".field-group").remove();
        m.dispatchEvent(new Event("input"));
      })
    );
    lucide.createIcons();
    openModal("update-modal", { name: "UPDATE FLASHCARD" });
  }

  openDeleteModal(id) {
    this.currentEditId = id;
    const m = document.getElementById("delete_modal"),
      s = m.querySelector(".btn-sm.bg-base-100"),
      n = s.cloneNode(true);
    s.replaceWith(n);
    n.addEventListener("click", () => {
      this.deleteFlashcard(id);
      m.close();
    });
    m.showModal();
  }

  openPreviewModal(id) {
    const fc = this.getFlashcard(id);
    if (!fc || !Array.isArray(fc.fields)) return;

    const shuffleArray = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const getFontSizeClass = (text, isExplanation = false) => {
      const len = text?.length || 0;
      if (isExplanation) {
        if (len <= 10) return "!text-4xl";
        if (len <= 25) return "!text-3xl";
        if (len <= 40) return "!text-2xl";
        return "!text-xl";
      } else {
        if (len <= 4) return "!text-9xl";
        if (len <= 8) return "!text-7xl";
        if (len <= 16) return "!text-5xl";
        if (len <= 25) return "!text-4xl";
        return "!text-3xl";
      }
    };

    let randomizedFields = shuffleArray(fc.fields);

    const modal = document.getElementById("preview-flashcard");
    const container = modal.querySelector(".flex-1");

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full overflow-hidden">
          <div class="swiper mySwiper aspect-square w-full max-w-md mx-auto flex items-center justify-center">
            <div class="swiper-wrapper"></div>
          </div>
          <div id="flashcard-counter" class="mt-3 text-xs text-gray-500 font-semibold text-center"></div>
          <button id="restart-btn" class="btn btn-sm mt-4 bg-base-100 border-none shadow-md hidden">
            <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Restart
          </button>
        </div>
      `;

    lucide.createIcons();

    const wrapper = container.querySelector(".swiper-wrapper");
    const counter = container.querySelector("#flashcard-counter");
    const restartBtn = container.querySelector("#restart-btn");

    const renderSlides = () => {
      wrapper.innerHTML = randomizedFields
        .map((f) => {
          const frontSize = getFontSizeClass(f.content, false);
          const backSize = getFontSizeClass(f.explanation, true);

          return `
            <div class="swiper-slide aspect-square bg-base-100 rounded-2xl shadow-lg p-6 relative">
              <div class="h-full flex flex-col justify-center items-center text-center">
                <p class="font-bold mb-4 flashcard-front ${frontSize}">${f.content}</p>
                <p class="text-gray-500 flashcard-back hidden ${backSize}">${f.explanation}</p>
                <button class="btn absolute bottom-3 right-3 bg-base-300 border-none shadow-md flip-btn">
                  <i data-lucide="refresh-ccw" class="w-4 h-4"></i> Flip
                </button>
              </div>
            </div>
          `;
        })
        .join("");

      lucide.createIcons();
    };

    openModal("preview-flashcard", { name: "PREVIEW FLASHCARD" });

    const setupSwiper = () => {
      renderSlides();

      setTimeout(() => {
        const swiper = new Swiper(".mySwiper", {
          effect: "cards",
          grabCursor: true,
          allowSlidePrev: false,
          cardsEffect: {
            perSlideOffset: 8,
            perSlideRotate: 2,
            rotate: true,
            slideShadows: true,
          },
        });

        const total = randomizedFields.length;
        let current = 1;
        counter.textContent = `${current} / ${total}`;
        restartBtn.classList.add("hidden");

        swiper.on("slideChange", () => {
          current = swiper.activeIndex + 1;
          counter.textContent = `${current} / ${total}`;

          if (current === total) {
            showToast("You've reached the end of this flashcard set!");
            restartBtn.classList.remove("hidden");
          }
        });

        modal.querySelectorAll(".flip-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const slide = e.target.closest(".swiper-slide");
            const front = slide.querySelector(".flashcard-front");
            const back = slide.querySelector(".flashcard-back");
            front.classList.toggle("hidden");
            back.classList.toggle("hidden");
          });
        });

        restartBtn.onclick = () => {
          randomizedFields = shuffleArray(fc.fields);
          swiper.destroy(true, true);
          setupSwiper();
        };
      }, 200);
    };

    setupSwiper();
  }

  exportToJSON() {
    const data = this.getFlashcards();
    if (!data.length) return showToast("No flashcards to export.");
    const blob = new Blob(
      [
        JSON.stringify(
          data.map((x) => ({ title: x.title, fields: x.fields })),
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "flashcards.json",
    });
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Flashcards exported successfully!");
  }
}

const flashcardManager = new FlashcardManager();

// Import Handler
const fileInput = document.getElementById("jsonInput"),
  importModal = document.getElementById("import_modal"),
  importSubmitBtn = document.getElementById("importSubmit"),
  importStatus = document.getElementById("importStatus");

let importedFile = null;
let isValidJSON = false;

function updateImportStatus(icon, text, color = "text-gray-500") {
  importStatus.innerHTML = `
          <i data-lucide="${icon}" class="w-12 h-12 mb-3 ${color}"></i>
          <p class="${color} text-sm">${text}</p>
        `;
  lucide.createIcons();
}

importModal.addEventListener("close", () => {
  importedFile = null;
  isValidJSON = false;
  fileInput.value = "";
  importSubmitBtn.disabled = true;
  importSubmitBtn.classList.add("opacity-60", "cursor-not-allowed");
  updateImportStatus("file-braces", "Click to import <code>.json</code> file");
});

function validateJSONStructure(data) {
  return (
    Array.isArray(data) &&
    data.every(
      (fc) =>
        typeof fc.title === "string" &&
        Array.isArray(fc.fields) &&
        fc.fields.every(
          (f) =>
            typeof f.content === "string" && typeof f.explanation === "string"
        )
    )
  );
}

fileInput.addEventListener("change", (e) => {
  importedFile = e.target.files[0];
  if (!importedFile) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!validateJSONStructure(data)) {
        updateImportStatus(
          "x-circle",
          "Invalid structure — please check your JSON file",
          "text-error"
        );
        importSubmitBtn.disabled = true;
        importSubmitBtn.classList.add("opacity-60", "cursor-not-allowed");
        isValidJSON = false;
      } else {
        updateImportStatus(
          "check-circle",
          `File "${importedFile.name}" is valid`,
          "text-success"
        );
        importSubmitBtn.disabled = false;
        importSubmitBtn.classList.remove("opacity-60", "cursor-not-allowed");
        isValidJSON = true;
      }
    } catch {
      updateImportStatus("x-circle", "Failed to parse JSON file", "text-error");
      importSubmitBtn.disabled = true;
      importSubmitBtn.classList.add("opacity-60", "cursor-not-allowed");
      isValidJSON = false;
    }
  };
  reader.readAsText(importedFile);
});

importSubmitBtn.addEventListener("click", () => {
  if (!importedFile || !isValidJSON) {
    alert("Please select a valid JSON file first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!validateJSONStructure(data)) {
        showToast("Invalid structure — please check your JSON file.");
        return;
      }

      const merged = [
        ...flashcardManager.getFlashcards(),
        ...data.map((x) => ({
          id: flashcardManager.generateId(),
          title: x.title,
          fields: x.fields,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      ];

      flashcardManager.saveFlashcards(merged);
      flashcardManager.loadFlashcards();
      importModal.close();
      showToast("JSON imported successfully!");
    } catch {
      showToast("Failed to import JSON file.");
    }
  };
  reader.readAsText(importedFile);
});

// Toast Function
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");
let toastTimeout;

function showToast(message) {
  clearTimeout(toastTimeout);
  toastMessage.textContent = message;
  toast.classList.remove("opacity-0", "pointer-events-none");
  toast.classList.add("opacity-100");

  toastTimeout = setTimeout(() => {
    toast.classList.remove("opacity-100");
    toast.classList.add("opacity-0", "pointer-events-none");
  }, 3000);
}

lucide.createIcons();