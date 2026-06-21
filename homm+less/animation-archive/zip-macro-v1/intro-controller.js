const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro = document.querySelector("[data-diamond-intro]");
const introParam = new URLSearchParams(window.location.search).get("intro");
const forceIntro = introParam === "1";
const skipIntro = introParam === "0";
let introFinished = !intro;

function introWasSeen() {
  try {
    return sessionStorage.getItem("hommless-zip-macro-v1") === "seen";
  } catch {
    return false;
  }
}

function rememberIntro() {
  try {
    sessionStorage.setItem("hommless-zip-macro-v1", "seen");
  } catch {
    // The intro still works when storage is unavailable.
  }
}

function dispatchIntroComplete() {
  document.dispatchEvent(new CustomEvent("hommless:intro-complete"));
}

function finishIntro(immediate = false) {
  if (!intro || introFinished) return;
  introFinished = true;
  rememberIntro();
  document.body.classList.remove("intro-pending");
  document.body.classList.add("intro-complete");
  dispatchIntroComplete();

  if (immediate) {
    intro.remove();
    return;
  }

  intro.classList.add("is-exiting");
  window.setTimeout(() => intro.remove(), 820);
}

if (!intro || reduceMotion || skipIntro || (introWasSeen() && !forceIntro)) {
  intro?.remove();
  document.body.classList.remove("intro-pending");
  document.body.classList.add("intro-complete");
  introFinished = true;
} else {
  intro.classList.add("is-running");
  document.querySelector("[data-intro-skip]")?.addEventListener("click", () => finishIntro(true));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") finishIntro(true);
  }, { once: true });
  window.setTimeout(() => finishIntro(false), 3300);
}



