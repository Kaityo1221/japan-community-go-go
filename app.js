const DATA = window.GO_FEST_DATA;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const state = {
  day: localStorage.getItem("jp-guide-day") || "saturday",
  nearby: "spots",
  app: "wallpaper",
  groupFilter: "all",
  selectedPokemon: new Set(),
  raidData: [...DATA.raids],
  bingoSeed: Number(localStorage.getItem("jp-guide-bingo-seed") || Date.now()),
  bingoMarks: new Set(JSON.parse(localStorage.getItem("jp-guide-bingo-marks") || "[]")),
  huntDone: new Set(JSON.parse(localStorage.getItem("jp-guide-hunt-done") || "[]"))
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
}

function initSettings() {
  const savedTheme = localStorage.getItem("jp-guide-theme") || "dark";
  const savedSize = localStorage.getItem("jp-guide-size") || "normal";
  document.documentElement.dataset.theme = savedTheme;
  document.documentElement.dataset.size = savedSize;
  $$('[data-theme]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === savedTheme);
    btn.addEventListener('click', () => {
      localStorage.setItem("jp-guide-theme", btn.dataset.theme);
      document.documentElement.dataset.theme = btn.dataset.theme;
      $$('[data-theme]').forEach(b => b.classList.toggle('active', b === btn));
      drawWallpaper();
    });
  });
  $$('[data-size]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === savedSize);
    btn.addEventListener('click', () => {
      localStorage.setItem("jp-guide-size", btn.dataset.size);
      document.documentElement.dataset.size = btn.dataset.size;
      $$('[data-size]').forEach(b => b.classList.toggle('active', b === btn));
    });
  });
}

function renderDaySummary() {
  const day = DATA.days[state.day];
  $('#daySummary').innerHTML = `
    <article class="summary-card"><span>今日のテーマ</span><strong>${escapeHtml(day.title)}</strong></article>
    <article class="summary-card"><span>場所</span><strong>${escapeHtml(day.place)}</strong></article>
    <article class="summary-card"><span>運営ポイント</span><strong>${escapeHtml(day.highlight)}</strong></article>
    <article class="summary-card" style="grid-column:1/-1"><span>概要</span><strong>${escapeHtml(day.summary)}</strong></article>
  `;
  $$('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.day === state.day);
    btn.setAttribute('aria-selected', btn.dataset.day === state.day ? 'true' : 'false');
  });
}

function renderQuickStart() {
  const quick = DATA.days[state.day].quickStart;
  $('#quickStartGrid').innerHTML = quick.map(([title, text]) => `
    <article class="info-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>
  `).join('');
}

function renderRaids() {
  $('#raidCards').innerHTML = DATA.raids.map(raid => `
    <article class="raid-card">
      <span class="pill">${escapeHtml(raid.tag)}</span>
      <h3>${escapeHtml(raid.name)}</h3>
      <div class="raid-meta">
        <span class="badge">${escapeHtml(raid.tier)}</span>
        <span class="badge">${raid.day === 'saturday' ? '土曜' : '日曜'}</span>
        <span class="badge">弱点：${raid.weak.map(escapeHtml).join('・')}</span>
      </div>
      <div class="cp-row">
        <div class="cp-box"><span>通常100%CP</span><strong>${escapeHtml(raid.cp)}</strong></div>
        <div class="cp-box"><span>ブースト100%CP</span><strong>${escapeHtml(raid.wb)}</strong></div>
      </div>
      <p>${escapeHtml(raid.counters)}</p>
    </article>
  `).join('');
}

function renderHabitat() {
  const items = DATA.habitats[state.day];
  $('#habitatTimeline').innerHTML = items.map(item => `
    <div class="time-row">
      <div class="time">${escapeHtml(item.time)}</div>
      <article class="time-card">
        <h3>${escapeHtml(item.title)}</h3>
        <span class="badge">${escapeHtml(item.types)}</span>
        <p>${escapeHtml(item.text)}</p>
      </article>
    </div>
  `).join('');
}

function renderBonusesAndTips() {
  $('#bonusGrid').innerHTML = DATA.bonuses.map(([title, text]) => `<article class="bonus-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('');
  $('#tipsGrid').innerHTML = DATA.tips.map(([title, text]) => `<article class="tip-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('');
}

function renderGroups() {
  const areas = ['all', ...new Set(DATA.groups.map(g => g.area))];
  $('#groupFilters').innerHTML = areas.map(area => `<button type="button" data-filter="${escapeHtml(area)}" class="${state.groupFilter === area ? 'active' : ''}">${area === 'all' ? '全て' : escapeHtml(area)}</button>`).join('');
  $$('#groupFilters button').forEach(btn => btn.addEventListener('click', () => { state.groupFilter = btn.dataset.filter; renderGroups(); }));
  const groups = state.groupFilter === 'all' ? DATA.groups : DATA.groups.filter(g => g.area === state.groupFilter);
  $('#groupCards').innerHTML = groups.map(group => `
    <article class="group-card">
      <div class="group-top">
        <div>
          <span class="pill">${escapeHtml(group.area)} / ${escapeHtml(group.city)}</span>
          <h3>${escapeHtml(group.name)}</h3>
        </div>
        <div class="group-code">${escapeHtml(group.code)}</div>
      </div>
      <p><strong>CA：</strong>${escapeHtml(group.ca)}</p>
      <p><strong>活動場所：</strong>${escapeHtml(group.venue)}</p>
      <p>${escapeHtml(group.note)}</p>
      <div class="group-links"><a href="${group.campfire}">Campfire</a><a href="${group.discord}">Discord</a></div>
    </article>
  `).join('') || `<p class="muted">該当グループはありません。</p>`;
}

function renderChecklist() {
  $('#checklistGrid').innerHTML = Object.entries(DATA.checklist).map(([title, items]) => `
    <article class="check-card">
      <h3>${escapeHtml(title)}</h3>
      <div class="check-list">
        ${items.map((item, idx) => {
          const key = `${title}-${idx}`;
          const checked = localStorage.getItem(`jp-check-${key}`) === '1';
          return `<label class="check-item"><input type="checkbox" data-check-key="${escapeHtml(key)}" ${checked ? 'checked' : ''}>${escapeHtml(item)}</label>`
        }).join('')}
      </div>
    </article>
  `).join('');
  $$('[data-check-key]').forEach(input => input.addEventListener('change', () => localStorage.setItem(`jp-check-${input.dataset.checkKey}`, input.checked ? '1' : '0')));
}

function renderNearby() {
  $$('.nearby-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.nearby === state.nearby));
  $('#nearbyList').innerHTML = DATA.nearby[state.nearby].map(item => `
    <article class="nearby-card">
      <span class="pill">${escapeHtml(item.area)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.text)}</p>
      <p class="price">${escapeHtml(item.price)}</p>
    </article>
  `).join('');
}

function switchDay(day) {
  state.day = day;
  localStorage.setItem("jp-guide-day", day);
  renderDaySummary(); renderQuickStart(); renderHabitat();
}

function initTabs() {
  $$('.tab-button').forEach(btn => btn.addEventListener('click', () => switchDay(btn.dataset.day)));
  $$('.nearby-tab').forEach(btn => btn.addEventListener('click', () => { state.nearby = btn.dataset.nearby; renderNearby(); }));
  $$('.app-tab').forEach(btn => btn.addEventListener('click', () => {
    state.app = btn.dataset.app;
    $$('.app-tab').forEach(b => b.classList.toggle('active', b === btn));
    $$('.mini-app').forEach(el => el.classList.remove('active'));
    $(`#${state.app}App`)?.classList.add('active');
    if (state.app === 'wallpaper') drawWallpaper();
  }));
}

function pokemonDayLabel(day) { return day === 'saturday' ? '土曜' : day === 'sunday' ? '日曜' : '全日'; }

function renderPokemonList() {
  const q = ($('#pokemonSearch').value || '').trim().toLowerCase();
  const day = $('#dayFilter').value;
  const filtered = state.raidData.filter(p => {
    const matchDay = day === 'all' || p.day === day || p.day === 'all';
    const matchQ = !q || p.name.toLowerCase().includes(q) || String(p.tier).toLowerCase().includes(q);
    return matchDay && matchQ;
  });
  $('#selectedCount').textContent = `${state.selectedPokemon.size} / 26`;
  $('#pokemonList').innerHTML = filtered.map((p, idx) => {
    const id = `${p.name}-${p.day}-${idx}`;
    const checked = state.selectedPokemon.has(p.name);
    return `<label class="pokemon-item">
      <input type="checkbox" data-pokemon="${escapeHtml(p.name)}" ${checked ? 'checked' : ''}>
      <span><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.tier)} · ${pokemonDayLabel(p.day)} · ${escapeHtml(p.cp)} / ${escapeHtml(p.wb)} WB</span></span>
    </label>`;
  }).join('') || `<p class="muted">該当するポケモンがありません。</p>`;
  $$('#pokemonList input[type="checkbox"]').forEach(input => input.addEventListener('change', () => {
    if (input.checked) {
      if (state.selectedPokemon.size >= 26) { input.checked = false; alert('選択できるのは最大26匹までです。'); return; }
      state.selectedPokemon.add(input.dataset.pokemon);
    } else {
      state.selectedPokemon.delete(input.dataset.pokemon);
    }
    renderPokemonList(); drawWallpaper();
  }));
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWallpaper() {
  const canvas = $('#wallpaperCanvas');
  const ctx = canvas.getContext('2d');
  const light = $('#lightWallpaper').checked;
  const selected = state.raidData.filter(p => state.selectedPokemon.has(p.name));
  const W = canvas.width, H = canvas.height;
  const bg = light ? '#f4fbff' : '#07111f';
  const panel = light ? 'rgba(255,255,255,0.88)' : 'rgba(16,29,50,0.9)';
  const text = light ? '#10243b' : '#f7fbff';
  const muted = light ? '#52667f' : '#b7c5d7';
  ctx.clearRect(0,0,W,H);
  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0, light ? '#e7f7ff' : '#07111f');
  grad.addColorStop(.5, light ? '#fff9ef' : '#0d1b30');
  grad.addColorStop(1, light ? '#edf6ff' : '#081426');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle = light ? 'rgba(0,109,156,0.13)' : 'rgba(105,210,255,0.16)';
  ctx.beginPath(); ctx.arc(1040, 170, 360, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = light ? 'rgba(217,119,6,0.12)' : 'rgba(255,184,107,0.13)';
  ctx.beginPath(); ctx.arc(90, 450, 260, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = text;
  ctx.font = '900 78px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('GO FEST JAPAN', 82, 140);
  ctx.font = '700 34px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = muted;
  ctx.fillText('Raid 100% CP / Weather Boost CP', 86, 196);
  ctx.fillStyle = light ? '#006d9c' : '#69d2ff';
  ctx.font = '900 42px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${selected.length || 0} targets`, 86, 258);
  if (selected.length === 0) {
    ctx.fillStyle = muted;
    ctx.font = '800 44px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('対象ポケモンを選んでください', 86, 460);
    return;
  }
  const cols = selected.length <= 10 ? 2 : 2;
  const cardW = 540, cardH = selected.length <= 14 ? 150 : 126;
  const gapX = 46, gapY = selected.length <= 14 ? 24 : 16;
  const startX = 82, startY = 330;
  selected.slice(0,26).forEach((p, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);
    ctx.fillStyle = panel;
    drawRoundRect(ctx, x, y, cardW, cardH, 30); ctx.fill();
    ctx.strokeStyle = light ? 'rgba(16,36,59,.13)' : 'rgba(255,255,255,.13)'; ctx.lineWidth = 2; ctx.stroke();
    const orbGrad = ctx.createRadialGradient(x+62, y+58, 8, x+62, y+58, 48);
    orbGrad.addColorStop(0, '#fff'); orbGrad.addColorStop(.35, '#69d2ff'); orbGrad.addColorStop(.38, '#10243b'); orbGrad.addColorStop(1, '#07111f');
    ctx.fillStyle = orbGrad; ctx.beginPath(); ctx.arc(x+64, y+cardH/2, 48, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = text; ctx.font = selected.length <= 14 ? '900 34px -apple-system, BlinkMacSystemFont, sans-serif' : '900 29px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(p.name, x + 132, y + 48);
    ctx.fillStyle = muted; ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${p.tier} · ${pokemonDayLabel(p.day)}`, x + 132, y + 82);
    ctx.fillStyle = light ? '#006d9c' : '#69d2ff'; ctx.font = '900 30px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`100% ${p.cp}`, x + 132, y + cardH - 26);
    ctx.fillStyle = light ? '#d97706' : '#ffb86b';
    ctx.fillText(`WB ${p.wb}`, x + 315, y + cardH - 26);
  });
  ctx.fillStyle = muted;
  ctx.font = '700 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('非公式コミュニティガイド・デモ / 公式情報はアプリ内で確認', 82, H - 78);
}

function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean).map(line => {
    const out = []; let cur = ''; let quote = false;
    for (const ch of line) {
      if (ch === '"') quote = !quote;
      else if (ch === ',' && !quote) { out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    out.push(cur.trim()); return out;
  });
  const [, ...dataRows] = rows;
  const parsed = dataRows.map(row => ({
    name: row[0] || '未設定',
    tier: row[1] || 'Raid',
    day: /sun|日/i.test(row[2] || '') ? 'sunday' : /sat|土/i.test(row[2] || '') ? 'saturday' : 'all',
    cp: Number(row[3]) || 0,
    wb: Number(row[4]) || 0,
    weak: ['未設定'],
    counters: 'CSVから読み込み',
    tag: 'CSV'
  }));
  return parsed.filter(p => p.name);
}

function initWallpaper() {
  $('#pokemonSearch').addEventListener('input', renderPokemonList);
  $('#dayFilter').addEventListener('change', renderPokemonList);
  $('#lightWallpaper').addEventListener('change', drawWallpaper);
  $('#clearWallpaper').addEventListener('click', () => { state.selectedPokemon.clear(); renderPokemonList(); drawWallpaper(); });
  $('#generateWallpaper').addEventListener('click', drawWallpaper);
  $('#downloadWallpaper').addEventListener('click', () => {
    drawWallpaper();
    const a = document.createElement('a');
    a.download = 'go-fest-japan-raid-wallpaper.png';
    a.href = $('#wallpaperCanvas').toDataURL('image/png');
    a.click();
  });
  $('#csvInput').addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length) { state.raidData = parsed; state.selectedPokemon.clear(); renderPokemonList(); drawWallpaper(); }
  });
  renderPokemonList(); drawWallpaper();
}

function seededShuffle(arr, seed) {
  const a = [...arr]; let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function saveBingo() {
  localStorage.setItem("jp-guide-bingo-marks", JSON.stringify([...state.bingoMarks]));
}
function renderBingo() {
  const chosen = seededShuffle(DATA.bingo, state.bingoSeed).slice(0, 24);
  const cells = [...chosen.slice(0,12), 'FREE：水分補給', ...chosen.slice(12)];
  $('#bingoBoard').innerHTML = cells.map((text, idx) => `<button type="button" class="bingo-cell ${idx === 12 ? 'free' : ''} ${state.bingoMarks.has(idx) ? 'marked' : ''}" data-bingo="${idx}">${escapeHtml(text)}</button>`).join('');
  $$('.bingo-cell').forEach(cell => cell.addEventListener('click', () => {
    const idx = Number(cell.dataset.bingo);
    if (state.bingoMarks.has(idx)) state.bingoMarks.delete(idx); else state.bingoMarks.add(idx);
    saveBingo(); renderBingo();
  }));
}
function initBingo() {
  $('#newBingo').addEventListener('click', () => {
    state.bingoSeed = Date.now(); state.bingoMarks.clear();
    localStorage.setItem("jp-guide-bingo-seed", String(state.bingoSeed)); saveBingo(); renderBingo();
  });
  $('#resetBingo').addEventListener('click', () => { state.bingoMarks.clear(); saveBingo(); renderBingo(); });
  renderBingo();
}

function saveHunt() {
  localStorage.setItem("jp-guide-hunt-done", JSON.stringify([...state.huntDone]));
}
function renderHunt() {
  $('#huntList').innerHTML = DATA.hunts.map((hunt, idx) => `
    <article class="hunt-card ${state.huntDone.has(idx) ? 'done' : ''}">
      <h3>${escapeHtml(hunt.title)}</h3>
      <p class="muted">${escapeHtml(hunt.text)}</p>
      <img class="hunt-preview" id="hunt-preview-${idx}" alt="写真プレビュー" />
      <div class="hunt-actions">
        <button type="button" data-hunt-done="${idx}">${state.huntDone.has(idx) ? '完了を外す' : '完了'}</button>
        <label>写真を選ぶ<input type="file" accept="image/*" data-hunt-file="${idx}"></label>
      </div>
    </article>
  `).join('');
  $$('[data-hunt-done]').forEach(btn => btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.huntDone);
    if (state.huntDone.has(idx)) state.huntDone.delete(idx); else state.huntDone.add(idx);
    saveHunt(); renderHunt();
  }));
  $$('[data-hunt-file]').forEach(input => input.addEventListener('change', e => {
    const file = e.target.files?.[0]; if (!file) return;
    const idx = input.dataset.huntFile;
    const img = $(`#hunt-preview-${idx}`);
    img.src = URL.createObjectURL(file); img.style.display = 'block';
  }));
}
function initHunt() {
  $('#resetHunt').addEventListener('click', () => { state.huntDone.clear(); saveHunt(); renderHunt(); });
  renderHunt();
}

function initShare() {
  $('#copyShareText').addEventListener('click', async () => {
    const text = $('#shareText').value;
    try { await navigator.clipboard.writeText(text); $('#copyShareText').textContent = 'コピーしました'; setTimeout(() => $('#copyShareText').textContent = '文章をコピー', 1300); }
    catch { $('#shareText').select(); document.execCommand('copy'); }
  });
}

function init() {
  initSettings(); initTabs();
  renderDaySummary(); renderQuickStart(); renderRaids(); renderHabitat(); renderBonusesAndTips(); renderGroups(); renderChecklist(); renderNearby();
  initWallpaper(); initBingo(); initHunt(); initShare();
}

document.addEventListener('DOMContentLoaded', init);
