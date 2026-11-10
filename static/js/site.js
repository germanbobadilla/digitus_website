// Progressive enhancement only: the site works without this file.
(() => {
  // Reveal on scroll
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((x) => {
        if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); }
      }), { threshold: 0.12 })
    : null;
  const watch = (root) => root.querySelectorAll(".reveal:not(.in)").forEach((el) => io ? io.observe(el) : el.classList.add("in"));
  watch(document);

  // Service detail modal: HTMX loads the partial into #modal-body, then we open the <dialog>.
  const modal = document.getElementById("modal");
  document.body.addEventListener("htmx:afterSwap", (e) => {
    if (e.detail.target.id === "modal-body" && modal && !modal.open) modal.showModal();
    if (e.detail.target.id === "contact-form" || e.detail.elt?.id === "contact-form") {
      document.getElementById("contact-form")?.focus?.();
    }
  });
  modal?.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-close]")) modal.close();
    const pick = e.target.closest("[data-pick-service]");
    if (pick) {
      const sel = document.querySelector("#contact-form select[name=service]");
      if (sel) sel.value = pick.dataset.pickService;
      modal.close();
    }
  });
})();
