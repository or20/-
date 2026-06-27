const APP_VERSION = "0.3.0";
const STORAGE_KEY = "erev10_state_v3";

const initialState = {
  capacity: 50,
  route: "home",
  courierIndex: 0,
  bakeryOrderSent: false,
  cancellationLocked: false,
  selectedCustomerId: "E10-0001",
  daily: {
    date: todayKey(),
    skips: [],
    deliveries: {}
  },
  customers: [
    { id: "E10-0001", name: "משפחת כהן", phone: "050-0000001", street: "ניב דוד", house: "12", floor: "3", apartment: "8", code: "", note: "להניח ליד הדלת", paid: true, active: true, createdAt: todayKey() },
    { id: "E10-0002", name: "משפחת לוי", phone: "050-0000002", street: "ניב דוד", house: "18", floor: "2", apartment: "4", code: "1234", note: "קוד 1234", paid: true, active: true, createdAt: todayKey() },
    { id: "E10-0003", name: "משפחת מזרחי", phone: "050-0000003", street: "ניב דוד", house: "4", floor: "1", apartment: "3", code: "", note: "להתקשר לפני", paid: false, active: true, createdAt: todayKey() }
  ]
};

let state = loadState();
const app = document.querySelector("#app");

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadState() {
  const oldSaved = localStorage.getItem("erev10_state_v2");
  const saved = localStorage.getItem(STORAGE_KEY) || oldSaved;
  if (!saved) return clone(initialState);

  try {
    const parsed = JSON.parse(saved);
    if (!parsed.daily || parsed.daily.date !== todayKey()) {
      parsed.daily = { date: todayKey(), skips: [], deliveries: {} };
      parsed.bakeryOrderSent = false;
      parsed.cancellationLocked = false;
    }
    const merged = { ...clone(initialState), ...parsed };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return clone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatAddress(c) {
  return `${c.street} ${c.house}, קומה ${c.floor || "-"}, דירה ${c.apartment || "-"}`;
}

function activeCustomers() {
  return state.customers.filter(c => c.active);
}

function unpaidCustomers() {
  return activeCustomers().filter(c => !c.paid);
}

function skipsToday() {
  return state.daily.skips.length;
}

function customersForDelivery() {
  return activeCustomers().filter(c => !state.daily.skips.includes(c.id));
}

function bunsToOrder() {
  return customersForDelivery().length * 10;
}

function nextSubscriptionId() {
  const max = state.customers.reduce((highest, c) => {
    const n = Number(String(c.id).replace("E10-", ""));
    return Number.isFinite(n) ? Math.max(highest, n) : highest;
  }, 0);
  return `E10-${String(max + 1).padStart(4, "0")}`;
}

function eveningStatus() {
  if (unpaidCustomers().length > 0) return { icon: "🟠", text: `${unpaidCustomers().length} לקוחות לא שילמו` };
  if (!state.bakeryOrderSent) return { icon: "🔴", text: "עדיין לא נשלחה הזמנה למאפייה" };
  return { icon: "🟢", text: "המערכת מוכנה לערב" };
}

function versionTag() {
  return `<div class="muted" style="font-size:12px;text-align:center;margin-top:18px">גרסה ${APP_VERSION}</div>`;
}

function renderHome() {
  app.innerHTML = `
    <section class="screen hero">
      <div class="pill"><span class="dot"></span>השקה ראשונה · רחוב ניב דוד</div>
      <h1 class="logo"><span class="gold">10</span> <span class="white">ערב</span></h1>
      <div class="subtitle">כל ערב עד הדלת</div>
      <div class="card price-card">
        <div class="badge">${activeCustomers().length} מתוך ${state.capacity} מקומות נתפסו</div>
        <div class="price">₪ 25</div>
        <p class="muted">10 לחמניות טריות בכל ערב עד הדלת</p>
        <div class="divider"></div>
        <p><span class="muted">מודל המנוי:</span> <b style="color: var(--gold)">מגיע אוטומטית כל ערב</b></p>
        <p class="muted">רוצה לדלג על יום? לוחצים "היום לא" עד 12:00.</p>
      </div>
      <button class="cta" onclick="go('signup')">אני רוצה להצטרף</button>
      <h2 class="section-title">למה לבחור בנו?</h2>
      <div class="grid">
        <div class="small-card">לחמניות טריות כל ערב בלי לצאת מהבית.</div>
        <div class="small-card">מנוי פשוט: לא צריך להזמין כל יום מחדש.</div>
        <div class="small-card">כמות מוגבלת כדי לשמור על איכות ושירות.</div>
      </div>
      <h2 class="section-title">שאלות נפוצות</h2>
      <div class="grid">
        <div class="small-card"><b>מה קורה אם לא לחצתי כלום?</b><br><span class="muted">המשלוח מגיע כרגיל.</span></div>
        <div class="small-card"><b>אפשר לבטל יום?</b><br><span class="muted">כן, עד 12:00 בצהריים.</span></div>
      </div>
      ${versionTag()}
    </section>
  `;
}

function renderSignup() {
  app.innerHTML = `
    <section class="screen">
      <h1 class="top-title">הצטרפות לערב 10</h1>
      <div class="card">
        <form class="form" onsubmit="submitSignup(event)">
          <label>שם מלא<input name="name" required placeholder="לדוגמה: משפחת זגזג"></label>
          <label>טלפון<input name="phone" required inputmode="tel" placeholder="050-0000000"></label>
          <label>רחוב<input name="street" required placeholder="רחוב"></label>
          <label>מספר בית<input name="house" required inputmode="numeric"></label>
          <label>קומה<input name="floor"></label>
          <label>דירה<input name="apartment"></label>
          <label>קוד כניסה<input name="code"></label>
          <label>הערה לשליח<textarea name="note" placeholder="להניח ליד הדלת / להתקשר / אחר"></textarea></label>
          <button class="cta" type="submit">שלח בקשת הצטרפות</button>
        </form>
      </div>
      ${versionTag()}
    </section>
  `;
}

function submitSignup(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const id = nextSubscriptionId();
  const isActive = activeCustomers().length < state.capacity;

  state.customers.push({
    id,
    name: data.name,
    phone: data.phone,
    street: data.street,
    house: data.house,
    floor: data.floor,
    apartment: data.apartment,
    code: data.code,
    note: data.note,
    paid: false,
    active: isActive,
    createdAt: todayKey()
  });

  state.selectedCustomerId = id;
  saveState();
  alert(isActive ? `נרשמת בהצלחה. מספר המנוי שלך: ${id}` : `נכנסת לרשימת המתנה. מספר המנוי שלך: ${id}`);
  go("customer");
}

function getSelectedCustomer() {
  return state.customers.find(c => c.id === state.selectedCustomerId) || state.customers[0];
}

function renderCustomer() {
  const c = getSelectedCustomer();
  const skipped = state.daily.skips.includes(c.id);
  const deliveryStatus = skipped ? "בוטל להיום" : (state.daily.deliveries[c.id] || "יגיע כרגיל");

  app.innerHTML = `
    <section class="screen">
      <h1 class="top-title">האזור האישי</h1>
      <div class="card">
        <div class="badge">${c.id}</div>
        <h2>${c.name}</h2>
        <p class="muted">סטטוס מנוי: <b style="color:var(--gold)">${c.active ? "פעיל" : "רשימת המתנה"}</b></p>
        <p>${formatAddress(c)}</p>
        <div class="divider"></div>
        <p class="muted">סטטוס משלוח היום</p>
        <h2 style="color:var(--gold)">${deliveryStatus}</h2>
        <button class="cta secondary" onclick="skipToday()">היום לא</button>
        <button class="cta secondary" onclick="alert('בגרסה הבאה נוסיף עריכת כתובת והערה')">עדכון כתובת / הערה</button>
        <button class="cta" onclick="location.href='tel:${c.phone}'">יצירת קשר</button>
      </div>
      <h2 class="section-title">היסטוריית משלוחים</h2>
      <div class="grid">
        <div class="small-card">היום · ${deliveryStatus}</div>
        <div class="small-card">ברירת מחדל · משלוח מגיע אוטומטית</div>
      </div>
      ${versionTag()}
    </section>
  `;
}

function skipToday() {
  const c = getSelectedCustomer();
  if (state.cancellationLocked) {
    alert("הביטולים להיום כבר ננעלו.");
    return;
  }
  if (!state.daily.skips.includes(c.id)) state.daily.skips.push(c.id);
  saveState();
  alert("סומן: היום לא לשלוח.");
  go("customer");
}

function renderAdmin() {
  const status = eveningStatus();
  app.innerHTML = `
    <section class="screen">
      <h1 class="top-title">הכנת ערב</h1>
      <div class="small-card" style="margin-bottom:16px;font-weight:900">${status.icon} ${status.text}</div>
      <div class="stats">
        <div class="stat"><span>לקוחות פעילים</span><strong>${activeCustomers().length}</strong></div>
        <div class="stat"><span>ביטלו היום</span><strong>${skipsToday()}</strong></div>
        <div class="stat"><span>לא שילמו</span><strong>${unpaidCustomers().length}</strong></div>
        <div class="stat"><span>לחמניות להזמין</span><strong>${bunsToOrder()}</strong></div>
      </div>
      <button class="cta" onclick="bakeryMessage()">הכן הודעה למאפייה</button>
      <button class="cta secondary" onclick="lockCancellations()">נעל ביטולים להיום</button>
      <button class="cta secondary" onclick="checkForUpdates(true)">בדוק עדכון</button>
      <button class="cta secondary" onclick="resetDemoData()">איפוס נתוני בדיקה</button>
      <h2 class="section-title">לקוחות</h2>
      <input placeholder="חיפוש לקוח" oninput="filterClients(this.value)">
      <div id="clients" class="grid" style="margin-top:16px"></div>
      ${versionTag()}
    </section>
  `;
  filterClients("");
}

function filterClients(q) {
  const list = document.querySelector("#clients");
  if (!list) return;
  const search = q.trim();
  const filtered = state.customers.filter(c => c.name.includes(search) || formatAddress(c).includes(search) || c.id.includes(search) || c.phone.includes(search));

  list.innerHTML = filtered.map(c => `
    <button class="small-card client-row" onclick="selectCustomer('${c.id}')" style="width:100%;color:inherit;text-align:right">
      <div>
        <b>${c.name}</b><br>
        <span class="muted">${c.id} · ${formatAddress(c)}</span>
      </div>
      <span class="status ${c.active ? (c.paid ? "ok" : "bad") : "wait"}">${c.active ? (c.paid ? "שולם" : "לא שולם") : "המתנה"}</span>
    </button>
  `).join("");
}

function selectCustomer(id) {
  state.selectedCustomerId = id;
  saveState();
  go("customer");
}

function lockCancellations() {
  state.cancellationLocked = true;
  saveState();
  alert("הביטולים להיום ננעלו. עכשיו אפשר להזמין מהמאפייה.");
  go("admin");
}

function bakeryMessage() {
  const msg = `שלום, להערב צריך להכין ${bunsToOrder()} לחמניות עבור ערב 10.\nלקוחות פעילים: ${activeCustomers().length}\nביטלו היום: ${skipsToday()}\nלא שילמו: ${unpaidCustomers().length}`;
  state.bakeryOrderSent = true;
  saveState();
  navigator.clipboard?.writeText(msg);
  alert(msg + "\n\nההודעה הועתקה.");
  go("admin");
}

function renderCourier() {
  const route = customersForDelivery();
  if (!route.length) {
    app.innerHTML = `<section class="screen"><h1 class="top-title">מצב שליח</h1><div class="card"><h2>אין משלוחים להיום</h2></div>${versionTag()}</section>`;
    return;
  }
  const c = route[state.courierIndex % route.length];
  app.innerHTML = `
    <section class="screen">
      <h1 class="top-title">מצב שליח</h1>
      <div class="card">
        <div class="badge">${c.id}</div>
        <div class="courier-name">${c.name}</div>
        <div class="courier-address">${formatAddress(c)}</div>
        <div class="divider"></div>
        <p class="muted">קוד כניסה</p>
        <h2>${c.code || "אין"}</h2>
        <p class="muted">הערה לשליח</p>
        <h2>${c.note || "אין הערה"}</h2>
        <div class="action-grid">
          <button class="cta" onclick="markDelivery('נמסר')">נמסר</button>
          <button class="cta secondary" onclick="location.href='tel:${c.phone}'">חייג ללקוח</button>
          <button class="cta secondary" onclick="markDelivery('לא בבית')">לא בבית</button>
          <button class="cta secondary" onclick="markDelivery('בעיה')">בעיה</button>
          <button class="cta secondary" onclick="nextClient()">הלקוח הבא</button>
        </div>
      </div>
      ${versionTag()}
    </section>
  `;
}

function markDelivery(status) {
  const route = customersForDelivery();
  const c = route[state.courierIndex % route.length];
  state.daily.deliveries[c.id] = status;
  saveState();
  nextClient();
}

function nextClient() {
  state.courierIndex += 1;
  saveState();
  renderCourier();
}

function resetDemoData() {
  if (!confirm("לאפס את נתוני הבדיקה במכשיר הזה?")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("erev10_state_v2");
  state = loadState();
  go("admin");
}

function go(route) {
  state.route = route;
  saveState();
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.route === route);
  });
  if (route === "home") renderHome();
  if (route === "signup") renderSignup();
  if (route === "customer") renderCustomer();
  if (route === "admin") renderAdmin();
  if (route === "courier") renderCourier();
}

function showUpdateBar(registration) {
  if (document.querySelector(".update-bar")) return;
  const bar = document.createElement("div");
  bar.className = "update-bar";
  bar.style.cssText = "position:fixed;right:14px;left:14px;top:14px;z-index:9999;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:14px 16px;border-radius:20px;background:linear-gradient(135deg,#ffe8a6,#d29120);color:#100d04;font-weight:900;box-shadow:0 18px 38px rgba(0,0,0,.35);direction:rtl";
  bar.innerHTML = `<span>יש גרסה חדשה של ערב 10</span><button style="border:0;border-radius:14px;padding:10px 14px;font:inherit;font-weight:900;background:#100d04;color:#ffe8a6">עדכן</button>`;
  bar.querySelector("button").addEventListener("click", () => {
    const worker = registration.waiting || registration.installing;
    if (worker) worker.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => window.location.reload(), 400);
  });
  document.body.appendChild(bar);
}

async function checkForUpdates(manual = false) {
  if (!("serviceWorker" in navigator)) {
    if (manual) alert("המכשיר לא תומך בבדיקת עדכונים.");
    return;
  }
  const registration = await navigator.serviceWorker.ready;
  await registration.update();
  if (registration.waiting || registration.installing) {
    showUpdateBar(registration);
  } else if (manual) {
    alert(`האפליקציה מעודכנת. גרסה ${APP_VERSION}`);
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const registration = await navigator.serviceWorker.register("./sw.js");
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdateBar(registration);
      });
    });
    setTimeout(() => checkForUpdates(false), 1200);
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => go(btn.dataset.route));
});

go(state.route || "home");
