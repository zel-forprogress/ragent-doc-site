const sidebar = document.querySelector("#sidebar");
const menuToggle = document.querySelector("#menuToggle");
const searchInput = document.querySelector("#searchInput");
const progress = document.querySelector("#readingProgress");
const backTop = document.querySelector("#backTop");
const doc = document.querySelector("#doc");
const menuLinks = Array.from(document.querySelectorAll(".menu-link"));
const menuToggles = Array.from(document.querySelectorAll(".menu-toggle"));
const headings = Array.from(document.querySelectorAll(".doc h1, .doc h2, .doc h3"));

function openGroup(group) {
  if (group) group.classList.add("open");
}

function openParents(element) {
  let current = element?.parentElement;
  while (current) {
    if (current.classList?.contains("menu-group")) openGroup(current);
    current = current.parentElement;
  }
}

function setActive(id) {
  let activeElement = null;
  for (const link of menuLinks) {
    const active = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("active", active);
    if (active) activeElement = link;
  }
  for (const button of menuToggles) {
    button.classList.toggle("active", button.dataset.target === id);
    if (button.dataset.target === id) activeElement = button;
  }
  openParents(activeElement);
}

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible[0]) setActive(visible[0].target.id);
  },
  { rootMargin: "-18% 0px -70% 0px", threshold: [0, 1] }
);

for (const heading of headings) observer.observe(heading);

for (const button of menuToggles) {
  button.addEventListener("click", () => {
    const group = button.closest(".menu-group");
    group?.classList.toggle("open");
    if (button.dataset.target) {
      location.hash = button.dataset.target;
    }
  });
}

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = height <= 0 ? 0 : scrollTop / height;
  progress.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  backTop.classList.toggle("visible", scrollTop > 600);
});

backTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

menuToggle?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

sidebar?.addEventListener("click", (event) => {
  if (event.target.closest("a")) sidebar.classList.remove("open");
});

searchInput?.addEventListener("input", () => {
  const keyword = searchInput.value.trim().toLowerCase();
  const allItems = Array.from(document.querySelectorAll(".menu-link, .menu-toggle, .menu-muted"));

  for (const item of allItems) {
    const text = (item.dataset.heading || item.textContent || "").toLowerCase();
    const matched = !keyword || text.includes(keyword);
    item.style.display = matched ? "" : "none";
    if (matched && keyword) openParents(item);
  }
});

doc.addEventListener("click", async (event) => {
  const code = event.target.closest("pre");
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code.innerText);
    code.classList.add("copied");
    setTimeout(() => code.classList.remove("copied"), 900);
  } catch {
    // Local file pages may not have clipboard permission.
  }
});

if (location.hash) {
  const active = document.querySelector(`.menu-link[href="${location.hash}"], .menu-toggle[data-target="${location.hash.slice(1)}"]`);
  openParents(active);
} else {
  openGroup(document.querySelector(".menu-group"));
}
