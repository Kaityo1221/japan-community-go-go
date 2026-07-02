const data = window.APP_DATA;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const storageKey = "jp-community-guide-v1";

const state = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
state.checks ||= {};
state.bingoMarks ||= {};
state.theme ||= "light";

function save() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function toast(message) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 1800);
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  $("#themeToggle").textContent = state.theme === "dark" ? "☀️" : "🌙";
}

function renderEvent() {
  $("#eventTitle").textContent = data.event.title;
  $("#eventDate").textContent = data.event.date;
  $("#eventTime").textContent = data.event.time;
  $("#eventPlace").textContent = data.event.place;
  $("#shareText").textContent = data.event.share;
}

function renderQuickList() {
  $("#quickList").innerHTML = data.quick.map((item) => `
    <div class="info-card">
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </div>
  `).join("");
}

function renderTimeline() {
  $("#timelineList").innerHTML = data.timeline.map((item) => `
    <div class="timeline-item">
      <div class="timeline-time">${item.time}</div>
      <div>
        <div class="timeline-title">${item.title}</div>
        <div class="timeline-desc">${item.desc}</div>
      </div>
    </div>
  `).join("");
}

function renderStrategy() {
  $("#strategyCards").innerHTML = data.strategy.map((item) => `
    <div class="strategy-card">
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </div>
  `).join("");
}

function renderChecklist(targetId, items, prefix) {
  $(targetId).innerHTML = items.map((text, index) => {
    const id = `${prefix}-${index}`;
    const checked = Boolean(state.checks[id]);
    return `
      <label class="check-item ${checked ? "done" : ""}">
        <input type="checkbox" data-check-id="${id}" ${checked ? "checked" : ""} />
        <span>${text}</span>
      </label>
    `;
  }).join("");
}

function bindChecklist() {
  $$('input[data-check-id]').forEach((input) => {
    input.addEventListener("change", (event) => {
      const id = event.currentTarget.dataset.checkId;
      state.checks[id] = event.currentTarget.checked;
      event.currentTarget.closest(".check-item").classList.toggle("done", event.currentTarget.checked);
      save();
    });
  });
}

function renderGroups() {
  const areas = [...new Set(data.groups.map((group) => group.area))];
  $("#areaFilter").innerHTML = `<option value="all">すべて</option>` + areas.map((area) => `<option value="${area}">${area}</option>`).join("");
  updateGroups();
}

function updateGroups() {
  const filter = $("#areaFilter").value;
  const groups = filter === "all" ? data.groups : data.groups.filter((group) => group.area === filter);
  $("#groupGrid").innerHTML = groups.map((group) => `
    <article class="group-card">
      <span class="tag">${group.area}</span>
      <h3>${group.name}</h3>
      <p><strong>CA:</strong> ${group.ca}</p>
      <p><strong>活動エリア:</strong> ${group.location}</p>
      <p>${group.note}</p>
      <div class="group-links">
        <a href="${group.campfireUrl}" aria-label="${group.name}のCampfireリンク">Campfire</a>
        <a href="${group.discordUrl}" aria-label="${group.name}のDiscordリンク">Discord</a>
      </div>
    </article>
  `).join("");
}

function sample(array, count) {
  return [...array].sort(() => Math.random() - 0.5).slice(0, count);
}

function makeBingoItems() {
  const items = sample(data.bingoItems, 24);
  items.splice(12, 0, "FREE\n今日を楽しむ");
  state.bingoItems = items;
  state.bingoMarks = { 12: true };
  save();
}

function renderBingo() {
  if (!state.bingoItems || state.bingoItems.length !== 25) makeBingoItems();
  $("#bingoBoard").innerHTML = state.bingoItems.map((text, index) => {
    const marked = Boolean(state.bingoMarks[index]);
    const free = index === 12;
    return `<button class="bingo-cell ${marked ? "marked" : ""} ${free ? "free" : ""}" data-bingo-index="${index}" type="button">${text.replace(/\n/g, "<br />")}</button>`;
  }).join("");
  $$('[data-bingo-index]').forEach((button) => {
    button.addEventListener("click", () => {
      const index = button.dataset.bingoIndex;
      state.bingoMarks[index] = !state.bingoMarks[index];
      button.classList.toggle("marked", state.bingoMarks[index]);
      save();
    });
  });
}

function renderStaffNotes() {
  $("#staffNotes").innerHTML = data.staffNotes.map((item) => `
    <div class="staff-card">
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </div>
  `).join("");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("コピーしました");
  } catch {
    toast("コピーできませんでした");
  }
}

function bindActions() {
  $("#themeToggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    save();
    applyTheme();
  });
  $("#resetChecks").addEventListener("click", () => {
    state.checks = {};
    save();
    renderChecklist("#beforeChecklist", data.beforeChecklist, "before");
    renderChecklist("#todayChecklist", data.todayChecklist, "today");
    bindChecklist();
    toast("チェックをリセットしました");
  });
  $("#areaFilter").addEventListener("change", updateGroups);
  $("#newBingo").addEventListener("click", () => {
    makeBingoItems();
    renderBingo();
    toast("新しいカードを作りました");
  });
  $("#resetBingo").addEventListener("click", () => {
    state.bingoMarks = { 12: true };
    save();
    renderBingo();
    toast("マークを解除しました");
  });
  $("#copyShare").addEventListener("click", () => copyText(data.event.share));
  $("#copyTimeline").addEventListener("click", () => {
    const text = data.timeline.map((item) => `${item.time} ${item.title}：${item.desc}`).join("\n");
    copyText(text);
  });
}

function boot() {
  applyTheme();
  renderEvent();
  renderQuickList();
  renderTimeline();
  renderStrategy();
  renderChecklist("#beforeChecklist", data.beforeChecklist, "before");
  renderChecklist("#todayChecklist", data.todayChecklist, "today");
  bindChecklist();
  renderGroups();
  renderBingo();
  renderStaffNotes();
  bindActions();
}

boot();
