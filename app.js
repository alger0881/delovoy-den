const defaults = {
  morning: { title: 'Утро делового человека', icon: 'У', type: 'day', items: ['Встал вовремя.', 'Выпил воду.', 'Сделал зарядку / разминку.', 'Привел себя в порядок.', 'Проверил календарь.', 'Определил 3 главные задачи дня.', 'Проверил важные встречи и звонки.', 'Запланировал работу с клиентами / сделками.', 'Убрал отвлекающие задачи.', 'Начал день с главного дела.'] },
  evening: { title: 'Вечер делового человека', icon: 'В', type: 'day', items: ['Подвел итоги дня.', 'Отметил выполненные задачи.', 'Перенес незавершенные задачи.', 'Подготовил план на завтра.', 'Проверил сделки / клиентов / обязательства.', 'Проверил финансы за день.', 'Очистил входящие заметки.', 'Зафиксировал главный результат дня.', 'Зафиксировал главный вывод дня.', 'Оценил день по шкале от 1 до 10.'] },
  week: { title: 'Контроль недели', icon: 'Н', type: 'week', items: ['Собрал все входящие задачи.', 'Разобрал заметки, сообщения и напоминания.', 'Проверил календарь прошедшей недели.', 'Проверил календарь следующей недели.', 'Обновил список проектов.', 'Определил главные цели недели.', 'Проверил задачи, которые ожидают ответа от других людей.', 'Закрыл или перенес незавершенные задачи.', 'Проверил финансы недели.', 'Сделал выводы по неделе.', 'Запланировал следующую неделю.', 'Выбрал 3 главных результата на следующую неделю.'] },
  month: { title: 'Контроль месяца', icon: 'М', type: 'month', items: ['Подвел итоги месяца.', 'Проверил цели месяца.', 'Проверил доходы.', 'Проверил расходы.', 'Проверил сделки / проекты / клиентов.', 'Определил лучшие результаты месяца.', 'Определил главные ошибки месяца.', 'Проверил здоровье и энергию.', 'Проверил обучение и развитие.', 'Определил цели на следующий месяц.', 'Определил ключевые финансовые цели.', 'Определил 3 главных приоритета следующего месяца.'] }
};

const state = JSON.parse(localStorage.getItem('delovoyDenState') || 'null') || initState();
ensureState();
let currentTab = 'home';
let currentChecklist = null;

function initState() {
  const checklists = {};
  Object.entries(defaults).forEach(([key, val]) => {
    checklists[key] = { ...val, items: val.items.map((text, idx) => ({ id: `${key}-${idx}-${Date.now()}`, text, done: false })) };
  });
  return {
    checklists,
    history: [],
    notes: {},
    settings: {
      morning: '08:00', evening: '21:30', weekDay: 'sunday', week: '18:00',
      monthDay: 'last', monthReportTime: '19:00', theme: 'dark'
    }
  };
}

function ensureState() {
  state.settings = state.settings || {};
  state.notes = state.notes || {};
  state.history = state.history || [];
  if (!state.settings.theme) state.settings.theme = 'dark';
  if (!state.settings.monthDay) state.settings.monthDay = 'last';
  if (!state.settings.monthReportTime) state.settings.monthReportTime = state.settings.month || '19:00';
  if (!state.settings.weekDay) state.settings.weekDay = 'sunday';
  if (!state.settings.week) state.settings.week = '18:00';
}

function save() { localStorage.setItem('delovoyDenState', JSON.stringify(state)); }
function app() { return document.getElementById('app'); }
function todayKey() { return new Date().toISOString().slice(0,10); }
function currentPeriodKey(key) {
  const d = new Date();
  if (key === 'week') {
    const start = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  if (key === 'month') return d.toISOString().slice(0,7);
  return todayKey();
}
function notesKey(key) { return `${key}:${currentPeriodKey(key)}`; }
function getNote(key, field) { return (state.notes[notesKey(key)] || {})[field] || ''; }
function setNote(key, field, value) {
  const nk = notesKey(key);
  state.notes[nk] = state.notes[nk] || {};
  state.notes[nk][field] = value;
  save();
}
function pct(items) { return items.length ? Math.round(items.filter(i => i.done).length / items.length * 100) : 0; }
function esc(value = '') { return String(value).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }

function applyTheme() {
  document.body.classList.toggle('light-theme', state.settings.theme === 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', state.settings.theme === 'light' ? '#f4f6fa' : '#07111f');
}
function setTheme(theme) { state.settings.theme = theme; save(); applyTheme(); renderSettings(); }

function setTodayLabel() {
  document.getElementById('todayLabel').textContent = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date());
}

function monthDayLabel(value) { return value === 'last' ? 'последний день месяца' : `${value} число каждого месяца`; }
function weekDayLabel(value) {
  return {monday:'понедельник', tuesday:'вторник', wednesday:'среда', thursday:'четверг', friday:'пятница', saturday:'суббота', sunday:'воскресенье'}[value] || 'воскресенье';
}
function monthReportLabel() { return `${monthDayLabel(state.settings.monthDay || 'last')}, ${state.settings.monthReportTime || '19:00'}`; }
function weekReportLabel() { return `${weekDayLabel(state.settings.weekDay)}, ${state.settings.week}`; }
function monthDayOptions() {
  const selected = state.settings.monthDay || 'last';
  const numberOptions = Array.from({ length: 31 }, (_, i) => {
    const value = String(i + 1);
    return `<option value="${value}" ${selected === value ? 'selected' : ''}>${i + 1} число</option>`;
  }).join('');
  return `<option value="last" ${selected === 'last' ? 'selected' : ''}>Последний день месяца</option>${numberOptions}`;
}
function weekDayOptions() {
  const days = [['monday','Понедельник'], ['tuesday','Вторник'], ['wednesday','Среда'], ['thursday','Четверг'], ['friday','Пятница'], ['saturday','Суббота'], ['sunday','Воскресенье']];
  return days.map(([value, label]) => `<option value="${value}" ${state.settings.weekDay === value ? 'selected' : ''}>${label}</option>`).join('');
}

function renderHome() {
  currentChecklist = null;
  const all = Object.values(state.checklists);
  const average = Math.round(all.reduce((sum, c) => sum + pct(c.items), 0) / all.length);
  app().innerHTML = `<div class="grid">
    <section class="hero-card">
      <div><p class="eyebrow">Сегодняшний контроль</p><h2>${average}% общий прогресс</h2><p>Выберите чек-лист и отметьте выполненные пункты. Данные сохраняются в этом браузере.</p></div>
      <div class="big-percent">${average}%</div>
    </section>
    ${Object.entries(state.checklists).map(([key, c]) => cardTpl(key, c)).join('')}
  </div>`;
}
function cardTpl(key, c) {
  const done = c.items.filter(i => i.done).length;
  const percent = pct(c.items);
  const reportLine = key === 'month' ? `<div class="status">Отчёт: ${monthReportLabel()}</div>` : key === 'week' ? `<div class="status">Обзор: ${weekReportLabel()}</div>` : '';
  return `<section class="card check-card" onclick="openChecklist('${key}')">
    <div class="card-row"><div><h3>${c.title}</h3><div class="status">Выполнено: ${done} из ${c.items.length} — ${percent}%</div>${reportLine}</div><div class="icon">${c.icon}</div></div>
    <div class="progress-wrap"><div class="progress" style="width:${percent}%"></div></div>
  </section>`;
}
function openChecklist(key) { currentChecklist = key; renderChecklist(); }

function renderChecklist() {
  const c = state.checklists[currentChecklist];
  app().innerHTML = `<button class="back-btn" onclick="switchTab('home')">← Назад</button>
  <section class="card">
    <h2>${c.title}</h2>
    <p>Период: ${currentPeriodKey(currentChecklist)} • Выполнено: ${c.items.filter(i => i.done).length} из ${c.items.length} — ${pct(c.items)}%</p>
    <div class="progress-wrap"><div class="progress" style="width:${pct(c.items)}%"></div></div>
    <div style="margin-top:12px">${c.items.map(item => `<div class="item"><button class="checkbox ${item.done ? 'done' : ''}" onclick="toggleItem('${item.id}')">${item.done ? '✓' : ''}</button><span>${esc(item.text)}</span><div class="item-actions"><button class="mini" onclick="editItem('${item.id}')">✎</button><button class="mini" onclick="deleteItem('${item.id}')">×</button></div></div>`).join('')}</div>
    ${reflectionFields(currentChecklist)}
    <div class="actions"><button class="secondary-btn" onclick="addItem()">+ Добавить пункт</button><button class="secondary-btn" onclick="resetChecklist()">Сбросить отметки</button><button class="primary-btn" onclick="completeChecklist()">Сохранить результат</button></div>
  </section>`;
}

function textField(label, field, placeholder = '') {
  const value = esc(getNote(currentChecklist, field));
  return `<div class="field"><label>${label}</label><textarea placeholder="${placeholder}" oninput="setNote('${currentChecklist}','${field}',this.value)">${value}</textarea></div>`;
}
function reflectionFields(key) {
  if (key === 'morning') return `${textField('3 главные задачи дня', 'top3_today', '1.\n2.\n3.')}`;
  if (key === 'evening') return `${textField('Главный результат дня', 'main_day_result', 'Что было главным результатом?')}${textField('Главный вывод дня', 'main_day_lesson', 'Какой вывод сделал?')}<div class="field"><label>Оценка дня</label><select onchange="setNote('${key}','day_score',this.value)">${[10,9,8,7,6,5,4,3,2,1].map(n => `<option value="${n}" ${getNote(key,'day_score') == n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>${textField('3 главные задачи на завтра', 'top3_tomorrow', '1.\n2.\n3.')}`;
  if (key === 'week') return `${textField('Главные итоги недели', 'week_results')}${textField('Что улучшить на следующей неделе', 'week_improve')}${textField('3 главные цели следующей недели', 'next_week_goals', '1.\n2.\n3.')}`;
  if (key === 'month') return `${textField('Главные результаты месяца', 'month_results')}${textField('Главные ошибки месяца', 'month_mistakes')}${textField('Что нужно усилить', 'month_focus')}${textField('3 цели следующего месяца', 'next_month_goals', '1.\n2.\n3.')}`;
  return '';
}

function toggleItem(id) { const c = state.checklists[currentChecklist]; const item = c.items.find(i => i.id === id); item.done = !item.done; save(); renderChecklist(); }
function addItem() { const text = prompt('Введите новый пункт чек-листа'); if (!text) return; state.checklists[currentChecklist].items.push({ id: `${currentChecklist}-${Date.now()}`, text, done: false }); save(); renderChecklist(); }
function editItem(id) { const item = state.checklists[currentChecklist].items.find(i => i.id === id); const text = prompt('Изменить пункт', item.text); if (!text) return; item.text = text; save(); renderChecklist(); }
function deleteItem(id) { if (!confirm('Удалить пункт?')) return; const c = state.checklists[currentChecklist]; c.items = c.items.filter(i => i.id !== id); save(); renderChecklist(); }
function resetChecklist() { if (!confirm('Сбросить отметки в этом чек-листе?')) return; state.checklists[currentChecklist].items.forEach(i => i.done = false); save(); renderChecklist(); }
function completeChecklist() {
  const c = state.checklists[currentChecklist];
  state.history.unshift({ date: new Date().toLocaleString('ru-RU'), title: c.title, percent: pct(c.items), period: currentPeriodKey(currentChecklist), notes: state.notes[notesKey(currentChecklist)] || {} });
  save();
  alert('Результат сохранен');
}

function renderStats() {
  const all = Object.values(state.checklists);
  const average = Math.round(all.reduce((sum, c) => sum + pct(c.items), 0) / all.length);
  app().innerHTML = `<div class="grid"><section class="card"><h2>Статистика</h2><p>Средний результат по всем чек-листам</p><div class="stats-number">${average}%</div></section>${all.map(c => `<section class="card"><div class="card-row"><h3>${c.title}</h3><strong>${pct(c.items)}%</strong></div><div class="progress-wrap"><div class="progress" style="width:${pct(c.items)}%"></div></div></section>`).join('')}</div>`;
}
function renderHistory() {
  app().innerHTML = `<section class="card"><h2>История</h2>${state.history.length ? state.history.map(h => `<div class="history-row"><div><strong>${esc(h.title)}</strong><br><span class="muted">${esc(h.period || '')} • ${esc(h.date)}</span></div><strong>${h.percent}%</strong></div>`).join('') : '<p>Пока нет сохраненных результатов.</p>'}</section>`;
}


function notificationsSupported() {
  return 'Notification' in window;
}
function notificationStatusText() {
  if (!notificationsSupported()) return 'Уведомления не поддерживаются этим браузером';
  if (Notification.permission === 'granted') return 'Уведомления разрешены';
  if (Notification.permission === 'denied') return 'Уведомления запрещены в настройках браузера/телефона';
  return 'Разрешение ещё не запрошено';
}
function notificationStatusClass() {
  if (!notificationsSupported()) return 'bad';
  if (Notification.permission === 'granted') return 'good';
  if (Notification.permission === 'denied') return 'bad';
  return 'neutral';
}
async function requestNotifications() {
  if (!notificationsSupported()) {
    alert('Этот браузер не поддерживает уведомления. На Android лучше открыть установленное приложение через Chrome.');
    renderSettings();
    return;
  }
  try {
    const result = await Notification.requestPermission();
    state.settings.notifications = result;
    save();
    renderSettings();
    if (result === 'granted') alert('Уведомления разрешены. Теперь нажми «Отправить тестовое уведомление».');
    if (result === 'denied') alert('Уведомления запрещены. Разрешение можно включить в настройках сайта/приложения в Chrome.');
  } catch (e) {
    alert('Не удалось запросить разрешение на уведомления: ' + e.message);
  }
}
async function sendTestNotification() {
  if (!notificationsSupported()) {
    alert('Уведомления не поддерживаются этим браузером.');
    return;
  }
  if (Notification.permission !== 'granted') {
    alert('Сначала нажми «Разрешить уведомления».');
    return;
  }
  const title = 'Деловой день';
  const options = {
    body: 'Проверка уведомлений работает',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'delovoy-den-test',
    renotify: true
  };
  try {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch (e) {
    alert('Не удалось отправить тестовое уведомление: ' + e.message);
  }
}

function renderSettings() {
  app().innerHTML = `<section class="card"><h2>Настройки</h2>
  <div class="field"><label>Тема оформления</label><div class="theme-toggle"><button class="theme-option ${state.settings.theme === 'dark' ? 'active' : ''}" onclick="setTheme('dark')">Темная</button><button class="theme-option ${state.settings.theme === 'light' ? 'active' : ''}" onclick="setTheme('light')">Светлая</button></div></div>
  <div class="field"><label>Утреннее напоминание</label><input type="time" value="${state.settings.morning}" onchange="state.settings.morning=this.value;save()"></div>
  <div class="field"><label>Вечернее напоминание</label><input type="time" value="${state.settings.evening}" onchange="state.settings.evening=this.value;save()"></div>
  <div class="field"><label>День еженедельного обзора</label><select onchange="state.settings.weekDay=this.value;save();renderSettings()">${weekDayOptions()}</select></div>
  <div class="field"><label>Время еженедельного обзора</label><input type="time" value="${state.settings.week}" onchange="state.settings.week=this.value;save();renderSettings()"></div>
  <div class="field"><label>Когда делать месячный отчёт</label><select onchange="state.settings.monthDay=this.value;save();renderSettings()">${monthDayOptions()}</select></div>
  <div class="field"><label>Время месячного отчёта</label><input type="time" value="${state.settings.monthReportTime || '19:00'}" onchange="state.settings.monthReportTime=this.value; save(); renderSettings()"></div>
  <div class="summary-box"><strong>Еженедельный обзор:</strong><br>${weekReportLabel()}<br><br><strong>Месячный отчёт:</strong><br>${monthReportLabel()}</div>
  <div class="notification-box"><strong>Проверка уведомлений</strong><br><span class="status-pill ${notificationStatusClass()}">${notificationStatusText()}</span><div class="actions inline-actions"><button class="secondary-btn" onclick="requestNotifications()">Разрешить уведомления</button><button class="primary-btn" onclick="sendTestNotification()">Отправить тестовое уведомление</button></div><p>На Android проверяй уведомления из установленного приложения. Если уведомление не пришло, проверь разрешения Chrome/приложения в настройках телефона.</p></div>
  <div class="install-box"><strong>PWA-режим активен.</strong><br>Если приложение уже добавлено на главный экран, после обновления файлов на GitHub Pages открой его заново. Иногда Android берёт новую версию через 1–2 минуты.</div>
  <div class="actions"><button class="secondary-btn" onclick="exportData()">Скачать резервную копию данных</button><button class="danger-btn" onclick="resetApp()">Сбросить прототип</button></div>
  <p>Версия 0.3 добавляет проверку разрешений и тестовое уведомление. Регулярные уведомления по расписанию — следующий отдельный этап.</p></section>`;
}
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `delovoy-den-backup-${todayKey()}.json`; a.click();
  URL.revokeObjectURL(url);
}
function resetApp() { if (!confirm('Сбросить все данные?')) return; localStorage.removeItem('delovoyDenState'); location.reload(); }
function switchTab(tab) { currentTab = tab; document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab)); if (tab === 'home') renderHome(); if (tab === 'stats') renderStats(); if (tab === 'history') renderHistory(); if (tab === 'settings') renderSettings(); }
document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
setTodayLabel(); applyTheme(); renderHome(); save();
