// ================= CUSTOM CURSOR =================

// Select the small dot of the custom cursor
const cursorDot = document.querySelector(".cursor-dot");

// Select the outline part of the custom cursor
const cursorOutline = document.querySelector(".cursor-outline");

// Run this only if both cursor elements exist
if (cursorDot && cursorOutline) {
  // Track mouse movement on the window
  window.addEventListener("mousemove", (e) => {
    // Get current mouse position
    const { clientX, clientY } = e;

    // Move the cursor dot to mouse position
    cursorDot.style.top = `${clientY}px`;
    cursorDot.style.left = `${clientX}px`;

    // Move the cursor outline to mouse position
    cursorOutline.style.top = `${clientY}px`;
    cursorOutline.style.left = `${clientX}px`;
  });
}

// ================= PRELOADER =================

// Run when the whole page is fully loaded
window.addEventListener("load", () => {
  // Select the preloader element
  const preloader = document.getElementById("preloader");

  // Hide preloader if it exists
  if (preloader) {
    preloader.classList.add("hidden");
  }
});

// ================= FOOTER YEAR =================

// Select the span where year is shown
const yearSpan = document.getElementById("year");

// Insert current year dynamically
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// ================= THEME TOGGLE (DARK / LIGHT) =================

// Select theme toggle button
const themeToggle = document.getElementById("theme-toggle");
const rootEl = document.documentElement;

// Check user's system theme preference
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

// Function to apply selected theme
const applyTheme = (theme) => {
  const isLight = theme === "light";

  // Add "light" class if theme is light
  rootEl.classList.toggle("light", isLight);
  document.body.classList.toggle("light", isLight);
  rootEl.setAttribute("data-theme", theme);

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isLight));
  }

  window.requestAnimationFrame(() => {
    rootEl.classList.add("ready");
  });
};

// Get previously saved theme from localStorage
const savedTheme = localStorage.getItem("theme");

// Apply saved theme if available
if (savedTheme) {
  applyTheme(savedTheme);
}
// Otherwise use system preference
else if (!prefersDark.matches) {
  applyTheme("light");
}
else {
  applyTheme("dark");
}

// Toggle theme on button click
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    // Decide next theme
    const nextTheme = document.body.classList.contains("light")
      ? "dark"
      : "light";

    // Apply new theme
    applyTheme(nextTheme);

    // Save theme in browser storage
    localStorage.setItem("theme", nextTheme);
  });
}

// ================= MOBILE NAVIGATION =================

// Select navigation menu
const nav = document.querySelector(".nav");

// Select navigation toggle button (hamburger)
const navToggle = document.querySelector(".nav-toggle");

// Open/close menu on button click
if (nav && navToggle) {
  navToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

// ================= SCROLL REVEAL ANIMATION =================

// Select all elements that should animate on scroll
const revealEls = document.querySelectorAll(".reveal-up, .reveal-fade");

// Create observer to detect when elements enter viewport
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // If element is visible on screen
      if (entry.isIntersecting) {
        // Add animation class
        entry.target.classList.add("reveal-visible");

        // Stop observing after animation runs once
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15, // Trigger animation when 15% visible
  }
);

// Observe all reveal elements
revealEls.forEach((el) => observer.observe(el));

// ================= ANIMATED STATS =================

// Select all statistic number elements
const statNumbers = document.querySelectorAll(".stat-number");

// Function to animate numbers from 0 to target
const animateStat = (el) => {
  // Final number from data-target attribute
  const target = Number(el.dataset.target || 0);

  let current = 0;
  const duration = 900; // Animation duration in ms
  const start = performance.now(); // Animation start time

  // Animation function
  const tick = (now) => {
    // Calculate animation progress
    const progress = Math.min((now - start) / duration, 1);

    // Update number gradually
    current = Math.floor(progress * target);
    el.textContent = current;

    // Continue animation until complete
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };

  requestAnimationFrame(tick);
};

// Start animation only when stats appear on screen
if (statNumbers.length) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  statNumbers.forEach((el) => statsObserver.observe(el));
}
