document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");

  const setTheme = (t) => {
    root.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
    btn.innerHTML = `<i id="theme-icon" data-lucide="${
      t === "dark" ? "sun" : "moon"
    }"></i>`;
    lucide.createIcons();
  };

  setTheme(theme);
  btn.onclick = () =>
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
});