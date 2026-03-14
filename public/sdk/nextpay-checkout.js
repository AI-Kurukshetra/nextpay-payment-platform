(function initPayForgeCheckout(global) {
  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === "string") el.textContent = text;
    return el;
  }

  function mount(target, options) {
    if (!target) throw new Error("target_required");
    if (!options || !options.paymentLinkToken) throw new Error("payment_link_token_required");

    const apiBase = (options.apiBase || "").replace(/\/$/, "");
    const root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root) throw new Error("target_not_found");

    root.innerHTML = "";
    const card = createEl("div");
    card.style.border = "1px solid #d6dbe1";
    card.style.borderRadius = "12px";
    card.style.padding = "16px";
    card.style.fontFamily = options.fontFamily || "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
    card.style.background = options.background || "#ffffff";
    card.style.maxWidth = "420px";

    const title = createEl("h3", null, options.title || "Pay with PayForge");
    title.style.margin = "0 0 8px 0";
    title.style.fontSize = "18px";
    card.appendChild(title);

    const email = createEl("input");
    email.type = "email";
    email.placeholder = "Email";
    email.style.width = "100%";
    email.style.padding = "10px";
    email.style.border = "1px solid #d6dbe1";
    email.style.borderRadius = "8px";
    email.style.marginBottom = "8px";
    card.appendChild(email);

    const button = createEl("button", null, options.buttonLabel || "Pay now");
    button.type = "button";
    button.style.width = "100%";
    button.style.padding = "10px";
    button.style.border = "0";
    button.style.borderRadius = "8px";
    button.style.cursor = "pointer";
    button.style.color = "#ffffff";
    button.style.background = options.primaryColor || "#0d9488";
    card.appendChild(button);

    const note = createEl("p");
    note.style.margin = "8px 0 0 0";
    note.style.fontSize = "12px";
    note.style.color = "#64748b";
    card.appendChild(note);

    button.addEventListener("click", async function handleClick() {
      button.disabled = true;
      button.textContent = "Processing...";
      note.textContent = "";
      try {
        const res = await fetch(apiBase + "/api/v1/payment-links/" + options.paymentLinkToken, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ metadata: { customerEmail: email.value || "" } })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "payment_failed");
        }
        note.textContent = "Payment created: " + data.id;
        if (typeof options.onSuccess === "function") options.onSuccess(data);
      } catch (error) {
        note.textContent = "Error: " + error.message;
        if (typeof options.onError === "function") options.onError(error);
      } finally {
        button.disabled = false;
        button.textContent = options.buttonLabel || "Pay now";
      }
    });

    root.appendChild(card);
  }

  global.PayForgeCheckout = { mount: mount };
})(window);
