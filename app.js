const state = {
  capacity: 50,
  customers: [
    { id: "E10-0001", name: "משפחת כהן", phone: "050-0000001", address: "ניב דוד 12, דירה 8", paid: true, active: true, note: "להניח ליד הדלת", delivery: "ממתין" },
    { id: "E10-0002", name: "משפחת לוי", phone: "050-0000002", address: "ניב דוד 18, קומה 2", paid: true, active: true, note: "קוד 1234", delivery: "ממתין" },
    { id: "E10-0003", name: "משפחת מזרחי", phone: "050-0000003", address: "ניב דוד 4, דירה 3", paid: false, active: true, note: "להתקשר לפני", delivery: "ממתין" }
  ],
  skipsToday: 2,
  route: "home",
  courierIndex: 0
};

const app = document.querySelector("#app");

function activeCustomers() {
  return state.customers.filter(c => c.active);
}

function unpaidCustomers() {
  return activeCustomers().filter(c => !c.paid);
}

function bunsToOrder() {
  return Math.max(0, (activeCustomers().length - state.skipsToday) * 10);
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
        <p class="muted">10 לחמניות טריות ופרימיום כל ערב</p>
        <div class="divider"></div>
        <p><span class="muted">אזור ההשקה:</span> <b style="color: var(--gold)">רחוב ניב דוד</b></p>
      </div>

      <button class="cta" onclick="go('signup')">אני רוצה להצטרף</button>

      <h2 class="section-title">למה לבחור בנו?</h2>
      <div class="grid">
        <div class="small-card">לחמניות טריות כל ערב בלי לצאת מהבית.</div>
        <div class="small-card">מסלול מנוי פשוט, ברור וללא כאב ראש.</div>
        <div class="small-card">כמות מוגבלת כדי לשמור על איכות ושירות.</div>
      </div>

      <h2 class="section-title">שאלות נפוצות</h2>
      <div class="grid">
        <div class="small-card"><b>אפשר לבטל יום?</b><br><span class="muted">כן, עד 12:00 בצהריים.</span></div>
        <div class="small-card"><b>כמה מקבלים?</b><br><span class="muted">10 לחמניות בכל ערב.</span></div>
      </div>
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
    </section>
  `;
}

function submitSignup(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const nextNumber = String(state.customers.length + 1).padStart(4, "0");
  state.customers.push({
    id: `E10-${nextNumber}`,
    name: data.name,
    phone: data.phone,
    address: `${data.street} ${data.house}, קומה ${data.floor || "-"}, דירה ${data.apartment || "-"}`,
    paid: false,
    active: state.customers.length < state.capacity,
    note: data.note || data.code || "",
    delivery: "ממתין"
  });
  alert("נרשמת בהצלחה. מספר המנוי שלך נוצר.");
  go("customer");
}

function renderCustomer() {
  const c = state.customers[state.customers.length - 1];
  app.innerHTML = `
    <section class="screen">
      <h1 class="top-title">האזור האישי</h1>
      <div class="card">
        <div class="badge">${c.id}</div>
        <h2>${c.name}</h2>
        <p class="muted">סטטוס מנוי: <b style="color:var(--gold)">${c.active ? "פעיל" : "רשימת המתנה"}</b></p>
        <p>${c.address}</p>
        <div class="divider"></div>
        <p class="muted">סטטוס משלוח היום</p>
        <h2 style="color:var(--gold)">${c.delivery}</h2>
        <button class="cta secondary" onclick="skipToday()">היום לא</button>
        <button class="cta secondary" onclick="alert('בשלב הבא נוסיף עריכת כתובת והערה')">עדכון כתובת / הערה</button>
        <button class="cta" onclick="location.href='tel:0500000000'">יצירת קשר</button>
      </div>

      <h2 class="section-title">היסטוריית משלוחים</h2>
      <div class="grid">
        <div class="small-card">אתמול · נמסר</div>
        <div class="small-card">שלשום · נמסר</div>
      </div>
    </section>
  `;
}

function skipToday() {
  state.skipsToday += 1;
  alert("היום סומן כלא לשלוח. ביטול אפשרי עד 12:00.");
  go("customer");
}

function renderAdmin() {
  app.innerHTML = `
    <section class="screen">
      <h1 class="top-title">הכנת ערב</h1>
      <div class="stats">
        <div class="stat"><span>לקוחות פעילים</span><strong>${activeCustomers().length}</strong></div>
        <div class="stat"><span>ביטלו היום</span><strong>${state.skipsToday}</strong></div>
        <div class="stat"><span>לא שילמו</span><strong>${unpaidCustomers().length}</strong></div>
        <div class="stat"><span>לחמניות להזמין</span><strong>${bunsToOrder()}</strong></div>
      </div>

      <button class="cta" onclick="bakeryMessage()">הכן הודעה למאפייה</button>

      <h2 class="section-title">לקוחות</h2>
      <input placeholder="חיפוש לקוח" oninput="filterClients(this.value)">
      <div id="clients" class="grid" style="margin-top:16px"></div>
    </section>
  `;
  filterClients("");
}

function filterClients(q) {
  const list = document.querySelector("#clients");
  if (!list) return;
  const filtered = state.customers.filter(c => c.name.includes(q) || c.address.includes(q) || c.id.includes(q));
  list.innerHTML = filtered.map(c => `
    <div class="small-card client-row">
      <div>
        <b>${c.name}</b><br>
        <span class="muted">${c.id} · ${c.address}</span>
      </div>
      <span class="status ${c.paid ? "ok" : "bad"}">${c.paid ? "שולם" : "לא שולם"}</span>
    </div>
  `).join("");
}

function bakeryMessage() {
  const msg = `שלום, להערב צריך להכין ${bunsToOrder()} לחמניות עבור ערב 10.`;
  navigator.clipboard?.writeText(msg);
  alert(msg + "\n\nההודעה הועתקה.");
}

function renderCourier() {
  const c = activeCustomers()[state.courierIndex % activeCustomers().length];
  app.innerHTML = `
    <section class="screen">
      <h1 class="top-title">מצב שליח</h1>
      <div class="card">
        <div class="badge">${c.id}</div>
        <div class="courier-name">${c.name}</div>
        <div class="courier-address">${c.address}</div>
        <div class="divider"></div>
        <p class="muted">הערה לשליח</p>
        <h2>${c.note || "אין הערה"}</h2>
        <div class="action-grid">
          <button class="cta" onclick="markDelivery('נמסר')">נמסר</button>
          <button class="cta secondary" onclick="markDelivery('לא בבית')">לא בבית</button>
          <button class="cta secondary" onclick="markDelivery('בעיה')">בעיה</button>
          <button class="cta secondary" onclick="nextClient()">הלקוח הבא</button>
        </div>
      </div>
    </section>
  `;
}

function markDelivery(status) {
  const customers = activeCustomers();
  customers[state.courierIndex % customers.length].delivery = status;
  nextClient();
}

function nextClient() {
  state.courierIndex += 1;
  renderCourier();
}

function go(route) {
  state.route = route;
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.route === route);
  });

  if (route === "home") renderHome();
  if (route === "signup") renderSignup();
  if (route === "customer") renderCustomer();
  if (route === "admin") renderAdmin();
  if (route === "courier") renderCourier();
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => go(btn.dataset.route));
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

go("home");
