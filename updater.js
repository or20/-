function showUpdateBar(registration) {
  if (document.querySelector(".update-bar")) return;

  const bar = document.createElement("div");
  bar.className = "update-bar";
  bar.innerHTML = `
    <span>יש גרסה חדשה של ערב 10</span>
    <button type="button">עדכן עכשיו</button>
  `;

  bar.querySelector("button").addEventListener("click", () => {
    const worker = registration.waiting || registration.installing;
    if (worker) worker.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => window.location.reload(), 350);
  });

  document.body.appendChild(bar);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const registration = await navigator.serviceWorker.ready;

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateBar(registration);
        }
      });
    });

    if (registration.waiting) showUpdateBar(registration);
    registration.update();
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
