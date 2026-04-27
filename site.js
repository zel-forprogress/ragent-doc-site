const sidebar = document.querySelector("#sidebar");
const menuToggle = document.querySelector("#menuToggle");
const searchInput = document.querySelector("#searchInput");
const progress = document.querySelector("#readingProgress");
const backTop = document.querySelector("#backTop");
const doc = document.querySelector("#doc");
const menuLinks = Array.from(document.querySelectorAll(".menu-link"));
const menuToggles = Array.from(document.querySelectorAll(".menu-toggle"));
const headings = Array.from(document.querySelectorAll(".doc h1, .doc h2, .doc h3"));

const currentPath = location.pathname.split("/").pop() || "index.html";
const currentPageId = currentPath.replace(".html", "");

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
    const href = link.getAttribute("href");
    const isAnchor = href.startsWith("#");
    const linkPage = isAnchor ? currentPageId : href.replace("./", "").split("#")[0].replace(".html", "");
    const linkId = isAnchor ? href.slice(1) : (href.includes("#") ? href.split("#")[1] : "");
    const active = linkPage === currentPageId && (isAnchor ? linkId === id : true);
    link.classList.toggle("active", active);
    if (active) activeElement = link;
  }
  for (const button of menuToggles) {
    const targetId = button.dataset.target;
    const targetPage = button.dataset.page;
    const active = targetPage === currentPageId && targetId === id;
    button.classList.toggle("active", active);
    if (active) activeElement = button;
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
    const targetPage = button.dataset.page;
    const targetId = button.dataset.target;

    if (targetPage && targetPage !== currentPageId) {
      location.href = `./${targetPage}.html#${targetId}`;
      return;
    }

    group?.classList.toggle("open");
    if (targetId) {
      location.hash = targetId;
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
  const link = event.target.closest("a");
  if (!link) return;
  const href = link.getAttribute("href");
  if (href.startsWith("#")) {
    sidebar.classList.remove("open");
  }
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

// Highlight current page in navigation
for (const link of menuLinks) {
  const href = link.getAttribute("href");
  const isAnchor = href.startsWith("#");
  const linkPage = isAnchor ? currentPageId : href.replace("./", "").split("#")[0].replace(".html", "");
  if (linkPage === currentPageId) {
    link.classList.add("active");
    openParents(link);
  }
}

for (const button of menuToggles) {
  const targetPage = button.dataset.page;
  if (targetPage === currentPageId) {
    button.classList.add("active");
    openParents(button);
  }
}

// Open groups containing current page
if (location.hash) {
  const id = location.hash.slice(1);
  const active = document.querySelector(`.menu-link[href$="#${id}"], .menu-toggle[data-target="${id}"]`);
  openParents(active);
} else {
  const firstGroup = document.querySelector(`.menu-group:has(.menu-link.active)`);
  if (firstGroup) openGroup(firstGroup);
}
