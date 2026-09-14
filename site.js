
(() => {
  const toggle = document.getElementById("menu-toggle");
  if (toggle) {
    const nav = document.createElement("nav");
    nav.id = "mobile-nav";
    nav.className = "border-t border-line px-5 py-3 md:hidden";
    nav.hidden = true;
    nav.setAttribute("aria-label", "Mobile");
    nav.innerHTML = `
      <div class="flex flex-col">
        <a href="/" class="flex min-h-11 items-center text-base font-medium text-ink">Home</a>
        <a href="/compatibility" class="flex min-h-11 items-center text-base font-medium text-ink">Compatibility</a>
        <a href="/support" class="flex min-h-11 items-center text-base font-medium text-ink">Support</a>
        <a href="/family" class="flex min-h-11 items-center text-base font-medium text-ink">Family</a>
        <a href="/privacy" class="flex min-h-11 items-center text-base font-medium text-ink">Privacy</a>
        <a href="mailto:hello.nivvi@outlook.com" class="flex min-h-11 items-center text-base font-medium text-moss">Contact</a>
      </div>`;
    toggle.closest("header").appendChild(nav);
    toggle.addEventListener("click", () => {
      const open = nav.hidden;
      nav.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  const devices = [
    { name: "Standard heart-rate strap or band", result: "Live heart rate if it exposes 180D / 2A37.", tone: "yes" },
    { name: "Standard pulse oximeter", result: "Continuous pulse can drive alerts. Spot-checks are events only. No oxygen alarms.", tone: "yes" },
    { name: "Mapped nine-byte adapter", result: "Experimental. Independent checking required. Alarms off until you opt in.", tone: "maybe" },
    { name: "Apple Watch", result: "Not connected. Needs HealthKit / Watch companion work, not a generic BLE scan.", tone: "no" },
    { name: "Oura", result: "Not connected. Needs an authorised Oura API.", tone: "no" },
    { name: "Wi-Fi / 4G baby base station", result: "Not a direct Nivvi peripheral unless the vendor documents a supported GATT path.", tone: "no" },
  ];
  const panel = document.querySelector("p.text-sm.font-semibold");
  if (!panel || panel.textContent.trim() !== "What are you trying to connect?") return;
  const wrap = panel.parentElement;
  const buttons = [...wrap.querySelectorAll("button")];
  const resultBox = wrap.querySelector(".mt-6.flex.items-start");
  if (!resultBox || buttons.length !== devices.length) return;

  const icons = {
    yes: resultBox.querySelector("svg").outerHTML,
    maybe: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide mt-0.5 size-5 text-muted" aria-hidden="true"><path d="M5 12h14"/></svg>`,
    no: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide mt-0.5 size-5 text-coral" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  };

  const paint = (i) => {
    const d = devices[i];
    buttons.forEach((b, idx) => {
      b.className = idx === i
        ? "min-h-11 rounded-md px-4 text-sm font-medium transition-colors bg-moss text-moss-fg"
        : "min-h-11 rounded-md px-4 text-sm font-medium transition-colors bg-paper-2 text-ink-soft hover:text-ink";
    });
    resultBox.innerHTML = `${icons[d.tone]}<div><p class="font-semibold">${d.name}</p><p class="mt-1 text-sm leading-relaxed text-muted">${d.result}</p></div>`;
  };
  buttons.forEach((b, i) => b.addEventListener("click", () => paint(i)));
})();
