const APP_VERSION = "0.5.0";
const STORAGE_KEY = "erev10_state_v5";
const TERMS_VERSION = "2026-06-27-1";

function todayKey() { return new Date().toISOString().slice(0, 10); }
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

const TERMS_TEXT = `
תנאי שירות והסכם מנוי – ערב 10 | טיוטה

1. השירות
ערב 10 מספק שירות מנוי לאספקת 10 לחמניות טריות בכל ערב לכתובת שנמסרה בהרשמה.

2. ברירת מחדל
המשלוח מגיע אוטומטית בכל ערב. הלקוח לא נדרש לאשר הזמנה בכל יום.

3. ביטול יומי
ניתן לבטל משלוח לאותו יום עד השעה 12:00 בלבד. לאחר שעה זו ההזמנה נחשבת סופית.

4. אחריות הלקוח
הלקוח אחראי למסור שם, טלפון, כתובת, קוד כניסה, קומה, דירה והערה לשליח בצורה נכונה ומעודכנת.

5. אי מסירה
אם השליח הגיע ולא ניתן היה למסור את המשלוח עקב כתובת שגויה, קוד לא נכון, אי מענה, חוסר גישה לבניין או כל סיבה התלויה בלקוח – המשלוח ייחשב כמבוצע לאותו יום.

6. איכות המוצר
המוצר מיוצר על ידי ספק חיצוני / מאפייה. כל טענה לגבי איכות המוצר תיבדק מול הספק. העסק יטפל בפנייה מול הלקוח ויבדוק את המקרה מול המאפייה.

7. החזרים וזיכויים
במקרה של תלונה מוצדקת לגבי מוצר שאינו תקין, ובכפוף לבדיקה, העסק רשאי להעניק זיכוי חלקי של עד 10 ₪ או פתרון חלופי, לפי שיקול דעת העסק.

8. דיווח על תקלה
דיווח על מוצר פגום או בעיית משלוח יתבצע באותו יום בלבד, בצירוף תמונה אם תתבקש.

9. כוח עליון
עיכובים או אי אספקה עקב מזג אוויר חריג, חסימות כבישים, תקלות אצל הספק, אירועים ביטחוניים או נסיבות שאינן בשליטת העסק לא ייחשבו כהפרת שירות.

10. פרטיות
המידע שנמסר משמש לצורך ניהול המנוי, יצירת קשר וביצוע משלוחים בלבד.

11. שינוי תנאים
העסק רשאי לעדכן את תנאי השירות מעת לעת. התנאים המעודכנים יהיו זמינים לצפייה באפליקציית הלקוח.

המסמך הוא טיוטה ראשונית וניתן לעדכון בהמשך.
`;

const initialState = {
  capacity: 50,
  route: "admin",
  role: "admin",
  courierIndex: 0,
  bakeryOrderSent: false,
  cancellationLocked: false,
  selectedCustomerId: "E10-0001",
  editingCustomerId: null,
  accessibilityLargeText: false,
  daily: { date: todayKey(), skips: [], deliveries: {} },
  customers: [
    { id: "E10-0001", name: "משפחת כהן", phone: "050-0000001", street: "ניב דוד", house: "12", floor: "3", apartment: "8", code: "", note: "להניח ליד הדלת", adminNote: "", paid: true, active: true, acceptedTerms: true, termsVersion: TERMS_VERSION, termsAcceptedAt: todayKey(), createdAt: todayKey() },
    { id: "E10-0002", name: "משפחת לוי", phone: "050-0000002", street: "ניב דוד", house: "18", floor: "2", apartment: "4", code: "1234", note: "קוד 1234", adminNote: "", paid: true, active: true, acceptedTerms: true, termsVersion: TERMS_VERSION, termsAcceptedAt: todayKey(), createdAt: todayKey() },
    { id: "E10-0003", name: "משפחת מזרחי", phone: "050-0000003", street: "ניב דוד", house: "4", floor: "1", apartment: "3", code: "", note: "להתקשר לפני", adminNote: "חייב 25 ₪", paid: false, active: true, acceptedTerms: true, termsVersion: TERMS_VERSION, termsAcceptedAt: todayKey(), createdAt: todayKey() }
  ]
};

let state = loadState();
const app = document.querySelector("#app");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("erev10_state_v4") || localStorage.getItem("erev10_state_v3") || localStorage.getItem("erev10_state_v2");
  if (!saved) return clone(initialState);
  try {
    const parsed = JSON.parse(saved);
    if (!parsed.daily || parsed.daily.date !== todayKey()) {
      parsed.daily = { date: todayKey(), skips: [], deliveries: {} };
      parsed.bakeryOrderSent = false;
      parsed.cancellationLocked = false;
      parsed.courierIndex = 0;
    }
    const merged = { ...clone(initialState), ...parsed };
    merged.customers = (parsed.customers || initialState.customers).map(c => ({
      adminNote: "",
      acceptedTerms: true,
      termsVersion: TERMS_VERSION,
      ...c
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch { return clone(initialState); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function qs(name) { return new URLSearchParams(location.search).get(name); }
function detectRole() { const r = qs("app") || qs("role"); return ["admin", "customer", "courier"].includes(r) ? r : (state.role || "admin"); }
function setRole(role, route = role) { state.role = role; state.route = route; saveState(); render(); }
function activeCustomers() { return state.customers.filter(c => c.active); }
function waitingCustomers() { return state.customers.filter(c => !c.active); }
function unpaidCustomers() { return activeCustomers().filter(c => !c.paid); }
function customersForDelivery() { return activeCustomers().filter(c => !state.daily.skips.includes(c.id)); }
function bunsToOrder() { return customersForDelivery().length * 10; }
function skipsToday() { return state.daily.skips.length; }
function formatAddress(c) { return `${c.street || ""} ${c.house || ""}, קומה ${c.floor || "-"}, דירה ${c.apartment || "-"}`; }
function getSelectedCustomer() { return state.customers.find(c => c.id === (qs("id") || state.selectedCustomerId)) || state.customers[0]; }
function nextSubscriptionId() { const max = state.customers.reduce((m, c) => Math.max(m, Number(String(c.id).replace("E10-", "")) || 0), 0); return `E10-${String(max + 1).padStart(4, "0")}`; }
function versionTag() { return `<div class="muted" style="font-size:12px;text-align:center;margin-top:18px">גרסה ${APP_VERSION}</div>`; }
function card(title, body) { return `<div class="small-card"><b>${title}</b><br><span class="muted">${body}</span></div>`; }
function customerLink(id) { return `${location.origin}${location.pathname}?app=customer&id=${id}`; }
function courierLink() { return `${location.origin}${location.pathname}?app=courier`; }
function adminLink() { return `${location.origin}${location.pathname}?app=admin`; }

function setupShell() {
  document.body.classList.toggle("large-text", !!state.accessibilityLargeText);
  const nav = document.querySelector(".bottom-nav");
  if (!nav) return;
  nav.style.display = state.role === "admin" ? "grid" : "none";
}

function render() {
  state.role = detectRole();
  setupShell();
  if (state.role === "customer") return renderCustomerApp(false);
  if (state.role === "courier") return renderCourierApp(false);
  const route = state.route || "admin";
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.route === route));
  if (route === "home") return renderHome();
  if (route === "signup") return renderSignup();
  if (route === "customer") return renderCustomerApp(true);
  if (route === "courier") return renderCourierApp(true);
  return renderAdminApp();
}
function go(route) { state.route = route; saveState(); render(); }

function renderHome() {
  app.innerHTML = `<section class="screen hero">
    <div class="pill"><span class="dot"></span>השקה ראשונה · רחוב ניב דוד</div>
    <h1 class="logo"><span class="gold">10</span> <span class="white">ערב</span></h1>
    <div class="subtitle">כל ערב עד הדלת</div>
    <div class="card price-card"><div class="badge">${activeCustomers().length} מתוך ${state.capacity} מקומות נתפסו</div><div class="price">₪ 25</div><p class="muted">10 לחמניות טריות בכל ערב עד הדלת</p><div class="divider"></div><p><span class="muted">מודל המנוי:</span> <b style="color: var(--gold)">מגיע אוטומטית כל ערב</b></p></div>
    <button class="cta" onclick="go('signup')">אני רוצה להצטרף</button>
    <h2 class="section-title">למה לבחור בנו?</h2><div class="grid">${card("פשוט", "לא צריך להזמין כל יום מחדש")}${card("טרי", "לחמניות טריות בכל ערב")}${card("מוגבל", "עד 50 לקוחות בשלב הראשון")}</div>${versionTag()}
  </section>`;
}

function renderSignup() {
  app.innerHTML = `<section class="screen">
    <h1 class="top-title">הצטרפות לערב 10</h1>
    <div class="card"><form class="form" onsubmit="submitSignup(event)">${customerFieldsHTML()}<button class="cta secondary" type="button" onclick="showTerms()">📄 צפייה בתנאי השירות</button><label class="small-card" style="display:flex;gap:12px;align-items:flex-start;color:var(--text)"><input name="terms" type="checkbox" required style="width:26px;height:26px;min-width:26px"><span>קראתי ואני מסכים לתנאי השירות, מדיניות הביטולים והזיכויים.</span></label><button class="cta" type="submit">שלח בקשת הצטרפות</button></form></div>${versionTag()}
  </section>`;
}

function customerFieldsHTML(c = {}) {
  return `<label>שם מלא<input name="name" required value="${c.name || ""}" placeholder="לדוגמה: משפחת זגזג"></label>
  <label>טלפון<input name="phone" required inputmode="tel" value="${c.phone || ""}" placeholder="050-0000000"></label>
  <label>רחוב<input name="street" required value="${c.street || ""}" placeholder="רחוב"></label>
  <label>מספר בית<input name="house" required inputmode="numeric" value="${c.house || ""}"></label>
  <label>קומה<input name="floor" value="${c.floor || ""}"></label>
  <label>דירה<input name="apartment" value="${c.apartment || ""}"></label>
  <label>קוד כניסה<input name="code" value="${c.code || ""}"></label>
  <label>הערה לשליח<textarea name="note" placeholder="להניח ליד הדלת / להתקשר / אחר">${c.note || ""}</textarea></label>`;
}

function submitSignup(event) { event.preventDefault(); createCustomerFromForm(new FormData(event.target), true); }
function createCustomerFromForm(formData, fromPublicSignup = false) {
  const data = Object.fromEntries(formData);
  const id = nextSubscriptionId();
  const isActive = activeCustomers().length < state.capacity;
  state.customers.push({ id, name: data.name, phone: data.phone, street: data.street, house: data.house, floor: data.floor, apartment: data.apartment, code: data.code, note: data.note, adminNote: data.adminNote || "", paid: !!data.paid, active: isActive, acceptedTerms: true, termsVersion: TERMS_VERSION, termsAcceptedAt: new Date().toISOString(), createdAt: todayKey() });
  state.selectedCustomerId = id;
  saveState();
  alert(isActive ? `הלקוח נוסף. מספר מנוי: ${id}` : `הלקוח נוסף לרשימת המתנה. מספר מנוי: ${id}`);
  if (fromPublicSignup) go("customer"); else renderAdminApp();
}

function renderAdminApp() {
  const unpaid = unpaidCustomers().length;
  const status = unpaid ? `🟠 ${unpaid} לקוחות לא שילמו` : state.bakeryOrderSent ? "🟢 המערכת מוכנה לערב" : "🔴 עדיין לא נשלחה הזמנה למאפייה";
  app.innerHTML = `<section class="screen">
    <h1 class="top-title">ניהול ערב 10</h1>
    <div class="small-card" style="margin-bottom:16px;font-weight:900">${status}</div>
    <div class="stats"><div class="stat"><span>פעילים</span><strong>${activeCustomers().length}</strong></div><div class="stat"><span>המתנה</span><strong>${waitingCustomers().length}</strong></div><div class="stat"><span>לא שילמו</span><strong>${unpaid}</strong></div><div class="stat"><span>לחמניות</span><strong>${bunsToOrder()}</strong></div></div>
    <button class="cta" onclick="bakeryMessage()">הכן הודעה למאפייה</button>
    <button class="cta secondary" onclick="lockCancellations()">נעל ביטולים להיום</button>
    <button class="cta secondary" onclick="showCustomerForm()">➕ הוסף לקוח</button>
    <button class="cta secondary" onclick="copyText('${courierLink()}','קישור שליח הועתק')">קישור שליח</button>
    <button class="cta secondary" onclick="setRole('customer','customer')">פתח כאפליקציית לקוח</button>
    <button class="cta secondary" onclick="setRole('courier','courier')">פתח כאפליקציית שליח</button>
    <h2 class="section-title">לקוחות</h2><input placeholder="חיפוש לקוח" oninput="filterClients(this.value)"><div id="clients" class="grid" style="margin-top:16px"></div>${versionTag()}
  </section>`;
  filterClients("");
}

function filterClients(q) {
  const list = document.querySelector("#clients"); if (!list) return;
  const s = q.trim();
  const filtered = state.customers.filter(c => c.name.includes(s) || formatAddress(c).includes(s) || c.id.includes(s) || c.phone.includes(s));
  list.innerHTML = filtered.map(c => `<div class="small-card"><div class="client-row"><div><b>${c.name}</b><br><span class="muted">${c.id} · ${formatAddress(c)}</span><br><span class="muted">הצטרף: ${c.createdAt || "-"}</span>${c.adminNote ? `<br><span style="color:var(--gold)">הערת מנהל: ${c.adminNote}</span>` : ""}</div><span class="status ${c.active ? (c.paid ? "ok" : "bad") : "wait"}">${c.active ? (c.paid ? "שולם" : "לא שולם") : "המתנה"}</span></div><div class="grid" style="grid-template-columns:1fr 1fr;margin-top:12px"><button class="cta secondary" style="font-size:16px;padding:12px;margin:0" onclick="showCustomerForm('${c.id}')">ערוך</button><button class="cta secondary" style="font-size:16px;padding:12px;margin:0" onclick="togglePaid('${c.id}')">${c.paid ? "סמן לא שולם" : "סמן שולם"}</button><button class="cta secondary" style="font-size:16px;padding:12px;margin:0" onclick="toggleActive('${c.id}')">${c.active ? "העבר להמתנה" : "הפעל"}</button><button class="cta secondary" style="font-size:16px;padding:12px;margin:0" onclick="copyText('${customerLink(c.id)}','קישור לקוח הועתק')">קישור</button></div></div>`).join("");
}

function showCustomerForm(id = null) {
  const c = id ? state.customers.find(x => x.id === id) : null;
  const modal = document.createElement("div");
  modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:10000;padding:22px;overflow:auto;direction:rtl";
  modal.innerHTML = `<div class="card" style="max-width:520px;margin:0 auto"><h1 class="top-title">${c ? "עריכת לקוח" : "הוספת לקוח"}</h1><form class="form" onsubmit="saveCustomerForm(event,'${id || ""}')">${customerFieldsHTML(c || {})}<label>הערת מנהל<textarea name="adminNote" placeholder="רק אתה רואה">${c?.adminNote || ""}</textarea></label><label class="small-card" style="display:flex;gap:12px;align-items:center;color:var(--text)"><input type="checkbox" name="paid" ${c?.paid ? "checked" : ""} style="width:26px;height:26px;min-width:26px"> שולם</label><label class="small-card" style="display:flex;gap:12px;align-items:center;color:var(--text)"><input type="checkbox" name="active" ${c ? (c.active ? "checked" : "") : "checked"} style="width:26px;height:26px;min-width:26px"> מנוי פעיל</label><button class="cta" type="submit">שמור</button>${c ? `<button class="cta secondary" type="button" onclick="deleteCustomer('${c.id}')">מחק לקוח</button>` : ""}<button class="cta secondary" type="button" onclick="this.closest('[style*=fixed]').remove()">סגור</button></form></div>`;
  document.body.appendChild(modal);
}

function saveCustomerForm(event, id) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  if (!id) return createCustomerFromForm(new FormData(event.target), false);
  const c = state.customers.find(x => x.id === id); if (!c) return;
  Object.assign(c, { name: data.name, phone: data.phone, street: data.street, house: data.house, floor: data.floor, apartment: data.apartment, code: data.code, note: data.note, adminNote: data.adminNote || "", paid: !!data.paid, active: !!data.active });
  saveState();
  document.querySelector('[style*=fixed]')?.remove();
  renderAdminApp();
}

function deleteCustomer(id) {
  if (!confirm("למחוק את הלקוח?")) return;
  state.customers = state.customers.filter(c => c.id !== id);
  if (state.selectedCustomerId === id) state.selectedCustomerId = state.customers[0]?.id || null;
  saveState();
  document.querySelector('[style*=fixed]')?.remove();
  renderAdminApp();
}
function togglePaid(id) { const c = state.customers.find(x => x.id === id); if (c) c.paid = !c.paid; saveState(); renderAdminApp(); }
function toggleActive(id) { const c = state.customers.find(x => x.id === id); if (c) c.active = !c.active; saveState(); renderAdminApp(); }
function copyText(text, message) { navigator.clipboard?.writeText(text); alert(message); }

function renderCustomerApp(fromAdmin = false) {
  const c = getSelectedCustomer();
  const skipped = state.daily.skips.includes(c.id);
  const deliveryStatus = skipped ? "בוטל להיום" : (state.daily.deliveries[c.id] || "יגיע כרגיל");
  app.innerHTML = `<section class="screen">${fromAdmin ? `<button class="cta secondary" onclick="go('admin')">חזרה לניהול</button>` : ""}<h1 class="top-title">שלום ${c.name}</h1><div class="card"><div class="badge">${c.id}</div><p class="muted">סטטוס מנוי: <b style="color:var(--gold)">${c.active ? "פעיל" : "רשימת המתנה"}</b></p><p>${formatAddress(c)}</p><div class="divider"></div><p class="muted">סטטוס משלוח היום</p><h2 style="color:var(--gold)">${deliveryStatus}</h2><button class="cta" onclick="skipToday()">היום לא</button><button class="cta secondary" onclick="showTerms()">📄 תנאי השירות</button><button class="cta secondary" onclick="toggleLargeText()">♿ הגדלת טקסט</button><button class="cta" onclick="location.href='tel:${c.phone}'">יצירת קשר</button></div>${versionTag()}</section>`;
}
function skipToday() { const c = getSelectedCustomer(); if (state.cancellationLocked) return alert("הביטולים להיום כבר ננעלו."); if (!state.daily.skips.includes(c.id)) state.daily.skips.push(c.id); saveState(); alert("סומן: היום לא לשלוח."); render(); }

function renderCourierApp(fromAdmin = false) {
  const route = customersForDelivery();
  if (!route.length) { app.innerHTML = `<section class="screen">${fromAdmin ? `<button class="cta secondary" onclick="go('admin')">חזרה לניהול</button>` : ""}<h1 class="top-title">מצב שליח</h1><div class="card"><h2>אין משלוחים להיום</h2></div>${versionTag()}</section>`; return; }
  const c = route[state.courierIndex % route.length];
  app.innerHTML = `<section class="screen">${fromAdmin ? `<button class="cta secondary" onclick="go('admin')">חזרה לניהול</button>` : ""}<h1 class="top-title">מצב שליח</h1><div class="card"><div class="badge">${c.id}</div><div class="courier-name">${c.name}</div><div class="courier-address">${formatAddress(c)}</div><div class="divider"></div><p class="muted">קוד כניסה</p><h2>${c.code || "אין"}</h2><p class="muted">הערה לשליח</p><h2>${c.note || "אין הערה"}</h2><div class="action-grid"><button class="cta" onclick="markDelivery('נמסר')">נמסר</button><button class="cta secondary" onclick="location.href='tel:${c.phone}'">חייג ללקוח</button><button class="cta secondary" onclick="markDelivery('לא בבית')">לא בבית</button><button class="cta secondary" onclick="markDelivery('בעיה')">בעיה</button><button class="cta secondary" onclick="nextClient()">הלקוח הבא</button></div></div>${versionTag()}</section>`;
}
function markDelivery(status) { const route = customersForDelivery(); const c = route[state.courierIndex % route.length]; state.daily.deliveries[c.id] = status; saveState(); nextClient(); }
function nextClient() { state.courierIndex += 1; saveState(); renderCourierApp(state.role === "admin"); }
function lockCancellations() { state.cancellationLocked = true; saveState(); alert("הביטולים להיום ננעלו."); render(); }
function bakeryMessage() { const msg = `שלום, להערב צריך להכין ${bunsToOrder()} לחמניות עבור ערב 10.\nלקוחות פעילים: ${activeCustomers().length}\nביטלו היום: ${skipsToday()}\nלא שילמו: ${unpaidCustomers().length}`; state.bakeryOrderSent = true; saveState(); navigator.clipboard?.writeText(msg); alert(msg + "\n\nההודעה הועתקה."); render(); }

function showTerms() { const modal = document.createElement("div"); modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:10000;padding:22px;overflow:auto;direction:rtl"; modal.innerHTML = `<div class="card" style="max-width:520px;margin:0 auto"><h1 class="top-title">תנאי השירות</h1><pre style="white-space:pre-wrap;font-family:inherit;line-height:1.65;color:var(--text)">${TERMS_TEXT}</pre><button class="cta" onclick="this.closest('[style*=fixed]').remove()">סגור</button></div>`; document.body.appendChild(modal); }
function toggleLargeText() { state.accessibilityLargeText = !state.accessibilityLargeText; saveState(); render(); }
async function checkForUpdates(manual = false) { if (!("serviceWorker" in navigator)) return manual && alert("המכשיר לא תומך בבדיקת עדכונים."); const registration = await navigator.serviceWorker.ready; await registration.update(); if (manual) alert(`האפליקציה מעודכנת. גרסה ${APP_VERSION}`); }
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => go(btn.dataset.route)));
state.role = detectRole(); saveState(); render();
