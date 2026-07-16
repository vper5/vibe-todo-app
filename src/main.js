import { createId, defaultContent, deleteItem, loadContent, saveContent, upsertItem } from './contentStore.js';

const state = {
  authenticated: false,
  active: 'dashboard',
  content: loadContent(),
};

const navItems = [
  ['dashboard', 'Dashboard'],
  ['photos', 'Photos'],
  ['videos', 'Videos'],
  ['messages', 'Emails'],
  ['texts', 'Texts'],
];

function setContent(nextContent) {
  state.content = nextContent;
  saveContent(nextContent);
  render();
}

function template(strings, ...values) {
  return strings.reduce((output, string, index) => `${output}${string}${values[index] ?? ''}`, '');
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function renderLogin() {
  return template`
    <main class="login-shell">
      <section class="login-card">
        <div class="brand-mark">EC</div>
        <p class="eyebrow">Expo Consulting</p>
        <h1>Admin portal</h1>
        <p class="muted">Sign in to manage photos, videos, visitor emails, and editable website text. Credentials are intentionally empty until MySQL authentication is connected.</p>
        <form class="login-form" data-action="login">
          <label>Admin username<input name="username" placeholder="Leave empty for now" /></label>
          <label>Admin password<input name="password" placeholder="Leave empty for now" type="password" /></label>
          <button class="primary-button" type="submit">Enter admin panel</button>
        </form>
      </section>
    </main>`;
}

function renderShell() {
  const currentTitle = navItems.find(([id]) => id === state.active)?.[1] ?? 'Dashboard';
  return template`
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-brand"><span>EC</span><strong>Expo Admin</strong></div>
        <nav>${navItems.map(([id, label]) => `<button data-nav="${id}" class="${state.active === id ? 'active' : ''}">${label}</button>`).join('')}</nav>
        <button class="logout" data-action="logout">Log out</button>
      </aside>
      <main class="workspace">
        <header class="topbar"><div><p class="eyebrow">Content management system</p><h1>${currentTitle}</h1></div><button class="secondary-button" data-action="reset">Reset demo data</button></header>
        ${renderActivePanel()}
      </main>
    </div>`;
}

function renderActivePanel() {
  if (state.active === 'dashboard') return renderDashboard();
  if (state.active === 'photos') return renderMedia('photos', ['title', 'url', 'alt', 'status']);
  if (state.active === 'videos') return renderMedia('videos', ['title', 'url', 'status']);
  if (state.active === 'messages') return renderMessages();
  return renderTexts();
}

function renderDashboard() {
  const cards = [['Published photos', state.content.photos.length], ['Videos', state.content.videos.length], ['Visitor emails', state.content.messages.length], ['Editable texts', state.content.textBlocks.length]];
  return `<section class="grid cards">${cards.map(([label, value]) => `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`).join('')}</section>`;
}

function renderMedia(type, fields) {
  return template`<section class="panel"><div class="panel-heading"><h2>${type === 'photos' ? 'Photo library' : 'Video library'}</h2><p>Add or remove website ${type} before database integration.</p></div>
    <form class="editor-form" data-action="add-media" data-type="${type}">${fields.map((field) => `<label>${field}<input name="${field}" ${field === 'status' ? 'value="Draft"' : ''} ${field === 'alt' ? '' : 'required'} /></label>`).join('')}<button class="primary-button">+ Add ${type.slice(0, -1)}</button></form>
    <div class="item-list">${state.content[type].map((item) => `<article class="list-item">${type === 'photos' ? `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.alt || item.title)}" />` : '<div class="video-thumb">▶</div>'}<div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.url)}</p><span>${escapeHtml(item.status)}</span></div><button class="danger-button" data-action="delete" data-type="${type}" data-id="${item.id}">Delete</button></article>`).join('')}</div></section>`;
}

function renderMessages() {
  return `<section class="panel"><div class="panel-heading"><h2>Visitor email inbox</h2><p>Review messages submitted from the website contact form.</p></div><div class="item-list">${state.content.messages.map((message) => `<article class="message-card"><div><h3>${escapeHtml(message.subject)}</h3><p><strong>${escapeHtml(message.name)}</strong> · ${escapeHtml(message.email)} · ${escapeHtml(message.receivedAt)}</p><p>${escapeHtml(message.message)}</p></div><button class="danger-button" data-action="delete" data-type="messages" data-id="${message.id}">Delete</button></article>`).join('')}</div></section>`;
}

function renderTexts() {
  return `<section class="panel"><div class="panel-heading"><h2>Website text editor</h2><p>Change copy for homepage sections, buttons, and future editable text areas.</p></div><div class="item-list">${state.content.textBlocks.map((block) => `<label class="text-block"><span>${escapeHtml(block.label)}<small>${escapeHtml(block.location)}</small></span><textarea data-action="edit-text" data-id="${block.id}">${escapeHtml(block.value)}</textarea><span>💾</span></label>`).join('')}</div></section>`;
}

function render() {
  document.querySelector('#root').innerHTML = state.authenticated ? renderShell() : renderLogin();
}

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (form.dataset.action === 'login') {
    event.preventDefault();
    state.authenticated = true;
    render();
  }
  if (form.dataset.action === 'add-media') {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    setContent(upsertItem(state.content, form.dataset.type, { id: createId(form.dataset.type.slice(0, -1)), ...data }));
  }
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.nav) { state.active = target.dataset.nav; render(); }
  if (target.dataset.action === 'logout') { state.authenticated = false; render(); }
  if (target.dataset.action === 'reset') setContent(defaultContent);
  if (target.dataset.action === 'delete') setContent(deleteItem(state.content, target.dataset.type, target.dataset.id));
});

document.addEventListener('input', (event) => {
  if (event.target.dataset.action !== 'edit-text') return;
  const nextBlocks = state.content.textBlocks.map((block) => block.id === event.target.dataset.id ? { ...block, value: event.target.value } : block);
  setContent({ ...state.content, textBlocks: nextBlocks });
});

render();
