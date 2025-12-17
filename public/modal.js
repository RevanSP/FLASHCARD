const body = document.body;

const openModal = (id) => {
  const m = document.getElementById(id),
    c = document.getElementById(`${id}-container`);
  if (!m || !c) return;
  m.showModal();
  body.style.overflow = "hidden";
  c.classList.replace("animateScaleOut", "animateScaleIn");
};

const closeModal = (id) => {
  const m = document.getElementById(id),
    c = document.getElementById(`${id}-container`);
  if (!m || !c) return;
  body.style.overflow = "";
  c.classList.replace("animateScaleIn", "animateScaleOut");
  c.addEventListener("animationend", () => m.close(), { once: true });
};

const handleBackdropClick = (e, id) => {
  const c = document.getElementById(`${id}-container`);
  if (c && !c.contains(e.target)) closeModal(id);
};