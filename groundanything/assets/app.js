"use strict";
document.documentElement.classList.add("js");
const heroVideo = document.querySelector(".hero-media");
const heroPause = document.querySelector(".hero-pause");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let manualPause = false;
let heroInView = true;
const syncHeroControl = () => {
  const paused = heroVideo.paused;
  heroPause.textContent = paused ? "▶" : "Ⅱ";
  heroPause.setAttribute("aria-label", paused ? "Play background video" : "Pause background video");
  heroPause.setAttribute("aria-pressed", String(!paused));
};
heroPause.hidden = false;
heroVideo.addEventListener("play", syncHeroControl);
heroVideo.addEventListener("pause", syncHeroControl);
heroPause.addEventListener("click", () => {
  if (!heroVideo.getAttribute("src")) {
    heroVideo.src = heroVideo.dataset.src;
    heroVideo.load();
  }
  manualPause = !heroVideo.paused;
  if (manualPause) heroVideo.pause();
  else heroVideo.play().catch(syncHeroControl);
});
const loadHero = () => {
  if (!heroVideo.getAttribute("src")) {
    heroVideo.src = heroVideo.dataset.src;
    heroVideo.load();
  }
  if (!motionQuery.matches && !manualPause) heroVideo.play().catch(syncHeroControl);
};
if (!motionQuery.matches && !navigator.connection?.saveData) loadHero();
motionQuery.addEventListener("change", () => { if (motionQuery.matches) heroVideo.pause(); });
new IntersectionObserver(entries => {
  entries.forEach(entry => {
    heroInView = entry.isIntersecting;
    if (!entry.isIntersecting) heroVideo.pause();
    else if (!manualPause && !motionQuery.matches && heroVideo.getAttribute("src")) heroVideo.play().catch(syncHeroControl);
  });
}, {threshold:.05}).observe(heroVideo);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) heroVideo.pause();
  else if (heroInView && !manualPause && !motionQuery.matches && heroVideo.getAttribute("src") && !document.querySelector("dialog[open]")) heroVideo.play().catch(syncHeroControl);
});
syncHeroControl();

const progress = document.querySelector(".scroll-progress");
let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    ticking = false;
  });
  ticking = true;
}, {passive:true});

const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".chapter-links a");
const sectionObserver = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting);
  if (visible.length) {
    const id = visible[0].target.id;
    navLinks.forEach(link => {
      if (link.getAttribute("href") === `#${id}`) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }
}, {rootMargin:"-12% 0px -62% 0px", threshold:0});
sections.forEach(section => sectionObserver.observe(section));

const figureDialog = document.querySelector("#figure-dialog");
const figureImage = figureDialog.querySelector("img");
const figureTitle = figureDialog.querySelector(".dialog-title");
document.querySelectorAll(".figure-trigger").forEach(trigger => {
  trigger.addEventListener("click", () => {
    const source = trigger.querySelector("img");
    figureImage.src = source.currentSrc || source.src;
    figureImage.alt = source.alt;
    figureTitle.textContent = source.alt;
    figureDialog.showModal();
  });
});
const videoDialog = document.querySelector("#video-dialog");
const fullVideo = videoDialog.querySelector("video");
document.querySelectorAll("[data-open-video]").forEach(trigger => {
  trigger.addEventListener("click", () => {
    heroVideo.pause();
    if (!fullVideo.getAttribute("src")) fullVideo.src = fullVideo.dataset.src;
    videoDialog.showModal();
    fullVideo.play().catch(() => {});
  });
});
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    dialog.querySelectorAll("video").forEach(video => video.pause());
  });
});

const lazyVideos = document.querySelectorAll(".inline-video[data-src]");
const videoLoader = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const video = entry.target;
    if (entry.isIntersecting && !video.getAttribute("src")) {
      video.src = video.dataset.src;
      video.load();
    }
    if (!entry.isIntersecting) video.pause();
  });
}, {rootMargin:"250px 0px"});
lazyVideos.forEach(video => videoLoader.observe(video));
document.querySelectorAll("video:not(.hero-media)").forEach(video => {
  video.addEventListener("play", () => document.querySelectorAll("video").forEach(other => {
    if (other !== video) other.pause();
  }));
});

const copyButton = document.querySelector(".copy-button");
copyButton.addEventListener("click", async () => {
  const text = document.querySelector("#citation-text").textContent;
  const status = document.querySelector(".copy-status");
  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = "Copied ✓";
    status.textContent = "BibTeX copied to clipboard.";
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#citation-text"));
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    status.textContent = "Citation selected. Press Ctrl+C or ⌘C to copy.";
  }
});
