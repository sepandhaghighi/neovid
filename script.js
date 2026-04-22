const DOM = {
  form: document.getElementById("video-form"),
  videoUrl: document.getElementById("video-url"),
  videoFile: document.getElementById("video-file"),
  videoLoadSelect: document.getElementById("video-load-type"),
  watchLaterButton: document.getElementById("watch-later-button"),
  downloadVideoButton: document.getElementById("download-video-button"),
  downloadSubtitleButton: document.getElementById("download-subtitle-button"),
  skipButton: document.getElementById("skip-button"),
  exportButton: document.getElementById("export-button"),
  importButton: document.getElementById("import-button"),
  installButton: document.getElementById("install-button"),
  closeInstallButton: document.getElementById("close-install"),
  installBanner: document.getElementById("install-banner"),
  recentFile: document.getElementById("recent-file"),
  recentNotice: document.getElementById("recent-notice"),
  subtitleUrl: document.getElementById("subtitle-url"),
  subtitleFile: document.getElementById("subtitle-file"),
  subtitleLoadSelect: document.getElementById("subtitle-load-type"),
  player: document.getElementById("video-player"),
  recentItems: document.getElementById("recent-items"),
  watchTime: document.getElementById("watch-time"),
}

const recentKey = "recentVideos";
const watchTimeKey = "watchTime";
const recentSize = 30;
const skipThreshold = 60;

function getRecent() {
  return JSON.parse(localStorage.getItem(recentKey) || "[]");
}

function setRecent(data) {
  localStorage.setItem(recentKey, JSON.stringify(data));
}

function getWatchTime() {
  return parseInt(localStorage.getItem(watchTimeKey) || "0", 10);
}

function setWatchTime(value) {
  localStorage.setItem(watchTimeKey, value);
}

const state = {
  currentVideo: null,
  currentType: "url",
  currentSubtitle: "",
  currentSubtitleType: "url",
  currentTitle: "",
  videoLastTime: null,
  totalWatchTime: getWatchTime(),
  accumulatedWatchTime: 0
}

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    String(hours).padStart(2, "0") + ":" +
    String(minutes).padStart(2, "0") + ":" +
    String(seconds).padStart(2, "0")
  );
}

function downloadFile(src) {
  const a = document.createElement("a");
  a.href = src;
  a.target = "_blank";
  a.rel = "noopener";
  a.click();
}

function updateDownloadButtons() {
  if (!state.currentVideo || state.currentType === "local") {
    DOM.downloadVideoButton.disabled = true;
  } else {
    DOM.downloadVideoButton.disabled = false;
  }

  if (!state.currentSubtitle || state.currentSubtitleType === "local") {
    DOM.downloadSubtitleButton.disabled = true;
  } else {
    DOM.downloadSubtitleButton.disabled = false;
  }
}

function updateWatchTime() {
  const videoCurrentTime = DOM.player.currentTime;
  if (state.videoLastTime !== null) {
    const diff = videoCurrentTime - state.videoLastTime;
    if (diff > 0 && diff < 5) {
      state.accumulatedWatchTime += diff;
      while (state.accumulatedWatchTime >= 1) {
        state.totalWatchTime += 1;
        state.accumulatedWatchTime -= 1;
        setWatchTime(state.totalWatchTime);
        DOM.watchTime.textContent = formatTime(state.totalWatchTime);
        
      }
    }
  }
  state.videoLastTime = videoCurrentTime;
}

function handleSkipButton() {
  if (DOM.player.duration && DOM.player.currentTime) {
    const remaining = DOM.player.duration - DOM.player.currentTime;
    if (DOM.player.duration > 3 * skipThreshold && remaining <= skipThreshold && !DOM.player.ended) {
      DOM.skipButton.style.display = "block";
    } else {
      DOM.skipButton.style.display = "none";
    }
  }   
}

function getProgressBackground(progress) {
  const p = Math.max(0, Math.min(progress, 100));
  return  `linear-gradient(to right, #c3fcc3, #41fc41) 0 0 / ${p}% 100% no-repeat`;
}

function loadFromQuery() {
  const query = window.location.search.substring(1);
  if (!query) return;
  const videoMatch = query.match(/(?:^|&)video=([^&]*)/);
  const subtitleMatch = query.match(/(?:^|&)subtitle=([^&]*)/);
  const videoUrlQuery = videoMatch ? decodeURIComponent(videoMatch[1]) : null;
  const subtitleUrlQuery = subtitleMatch ? decodeURIComponent(subtitleMatch[1]) : null;
  if (videoUrlQuery) {
    DOM.videoUrl.value = videoUrlQuery;
  }
  if (subtitleUrlQuery) {
    DOM.subtitleUrl.value = subtitleUrlQuery;
  }
}

function truncateTitle(title, maxLength = 24) {
  if (!title) return "";
  return title.length > maxLength ? title.slice(0, maxLength - 3) + "..." : title;
}

function playVideo(video, subtitle = "", title = null, videoType = "url", subtitleType = "url") {
  if(state.currentType === "local" && state.currentVideo) URL.revokeObjectURL(state.currentVideo);
  DOM.player.innerHTML = "";

  const sourceElement = document.createElement("source");
  sourceElement.src = video;
  DOM.player.appendChild(sourceElement);

  if(subtitle) {
    const track = document.createElement("track");
    track.src = subtitle;
    track.kind = "subtitles";
    track.srclang = "en";
    track.label = "English";
    track.default = true;
    DOM.player.appendChild(track);
    DOM.player.textTracks[0].mode = "showing";
  }

  DOM.player.load();
  DOM.player.play().catch(() => {});

  state.currentVideo = video;
  state.currentType = videoType;
  state.currentTitle = title || (videoType==="url"? video.split("/").pop(): title);
  state.currentSubtitle = subtitle;
  state.currentSubtitleType = subtitleType;
  updateDownloadButtons();
}


function saveRecent(title, video, videoType, subtitle="", subtitleType="url") {
  let recent = getRecent();
  let progress = 0;
  const idx = recent.findIndex(item => item.title===title);
  if(idx!==-1) {
    progress = recent[idx].progress;
  }

  recent = recent.filter(item => !(item.title===title));

  recent.unshift({title, video, videoType, subtitle, subtitleType, progress});
  if(recent.length>recentSize) recent = recent.slice(0,recentSize);

  setRecent(recent);
  renderRecent();
}

function removeRecent(title) {
  const userConfirmed = confirm("Are you sure you want to remove this video?");
  if (userConfirmed) {
    let recent = getRecent();
    recent = recent.filter(item => !(item.title===title));
    setRecent(recent);
    renderRecent();
  }
}

function updateProgress() {
  if(!state.currentVideo || !DOM.player.duration) return;
  const percent = Math.min(100, Math.round((DOM.player.currentTime/DOM.player.duration)*100));
  let recent = getRecent();
  const idx = recent.findIndex(item => item.video===state.currentVideo);
  if(idx!==-1) {
    recent[idx].progress = percent;
    setRecent(recent);
    renderRecent();
  }
}

function loadPlayerTime() {
  if(!state.currentVideo || !DOM.player.duration) return;
  let recent = getRecent();
  const idx = recent.findIndex(item => item.video===state.currentVideo);
  if(idx!==-1) {
    const currentTime = (recent[idx].progress / 100) * DOM.player.duration
    DOM.player.currentTime = currentTime;
    
  }
}

function createRecentItem(item, maxLimit) {
  const li = document.createElement("li");
    const spanTitle = document.createElement("span");
    const spanRemove = document.createElement("span");
    li.style.background = getProgressBackground(item.progress);
    spanTitle.textContent = truncateTitle(item.title, maxLimit);
    spanTitle.className = "recent-title";
    spanRemove.textContent = "🗑️";
    spanRemove.className = "recent-remove";
    if(item.videoType==="url") {
      const tag = document.createElement("span");
      tag.className="url-tag";
      tag.textContent="🌐";
      spanTitle.appendChild(tag);
    }
    if(item.videoType==="local") {
      const tag = document.createElement("span");
      tag.className="local-tag";
      tag.textContent="💾";
      spanTitle.appendChild(tag);
    }
    if(item.subtitle && item.subtitleType==="local") {
      const tag = document.createElement("span");
      tag.className="local-tag";
      tag.textContent="📄";
      spanTitle.appendChild(tag);
    }
    if(item.subtitle && item.subtitleType==="url") {
      const tag = document.createElement("span");
      tag.className="url-tag";
      tag.textContent="💬";
      spanTitle.appendChild(tag);
    }
    const spanProgress = document.createElement("span");
    spanProgress.className="recent-progress";
    spanProgress.textContent = `${item.progress||0}%`;

    if(item.progress>=97) {
      spanProgress.textContent = "✔️";
    }

    li.appendChild(spanRemove);
    li.appendChild(spanTitle);
    li.appendChild(spanProgress);

    return { li, spanTitle, spanRemove };
}


function renderRecent() {
  const recent = getRecent();
  DOM.recentItems.innerHTML="";
  let maxLimit = DOM.recentItems.offsetWidth  / 11;
  recent.forEach(item => {
    

    spanRemove.addEventListener("click", () => {
      removeRecent(item.title);
    });
    spanTitle.addEventListener("click", () => {
      let isDataLoaded = false;
      if(item.videoType==="url"){
        DOM.videoUrl.value = item.video;
        isDataLoaded = true;
      }
      else{
        DOM.videoUrl.value = "";
        alert("Please reselect the local video.");
      }
      if (item.subtitle) {
        if (item.subtitleType==="url") {
          DOM.subtitleUrl.value = item.subtitle;
          isDataLoaded = true;   
        }
        else{
          DOM.subtitleUrl.value = "";
          alert("Please reselect the local subtitle.");
        }
      }
      if (isDataLoaded) {
        DOM.form.scrollIntoView({"behavior": "smooth"});
      }
    });

    DOM.recentItems.appendChild(li);
  });

  DOM.exportButton.style.display = recent.length ? "inline-block" : "none";
  DOM.recentNotice.style.display = recent.length ? "block" : "none";
}

function getFormData() {
  let videoSrc = "", videoTitle = "", videoType = DOM.videoLoadSelect.value;
  if(videoType==="url") {
    const url = DOM.videoUrl.value.trim();
    if(!url) return alert("Please enter a video URL.");
    videoSrc = url;
    videoTitle = url.split("/").pop();
  } else {
    const file = DOM.videoFile.files[0];
    if(!file) return alert("Please select a local video file.");
    videoSrc = URL.createObjectURL(file);
    videoTitle = file.name;
  }


  let subSrc = "", subType = DOM.subtitleLoadSelect.value;
  if(subType==="url") {
    subSrc = DOM.subtitleUrl.value.trim();
  } else {
    const subFile = DOM.subtitleFile.files[0];
    if(subFile) subSrc = URL.createObjectURL(subFile);
  }
  return {
    videoSrc,
    videoTitle,
    videoType,
    subSrc,
    subType
  };
}



DOM.videoLoadSelect.addEventListener("change", () => {
  const isLocal = DOM.videoLoadSelect.value === "local";
  DOM.videoUrl.style.display = isLocal ? "none" : "block";
  DOM.videoFile.style.display = isLocal ? "block" : "none";
});

DOM.subtitleLoadSelect.addEventListener("change", () => {
  const isLocal = DOM.subtitleLoadSelect.value === "local";
  DOM.subtitleUrl.style.display = isLocal ? "none" : "block";
  DOM.subtitleFile.style.display = isLocal ? "block" : "none";
});


DOM.form.addEventListener("submit", function(e) {
  e.preventDefault();
  const data = getFormData();
  if (!data) return;
  playVideo(data.videoSrc, data.subSrc, data.videoTitle, data.videoType, data.subType);
  saveRecent(data.videoTitle, data.videoSrc, data.videoType, data.subSrc, data.subType);
});

DOM.watchLaterButton.addEventListener("click", () => {
  const data = getFormData();
  if (!data) return;
  saveRecent(
    data.videoTitle,
    data.videoSrc,
    data.videoType,
    data.subSrc,
    data.subType
  );
  alert("Video added to list.");
});

DOM.player.addEventListener("timeupdate", () => {
  updateProgress();
  updateWatchTime();
  handleSkipButton();
});
DOM.player.addEventListener("loadedmetadata", loadPlayerTime);
window.addEventListener("DOMContentLoaded", () => {
  DOM.watchTime.textContent = formatTime(state.totalWatchTime);
  loadFromQuery();
  renderRecent();
  updateDownloadButtons();
});
DOM.player.addEventListener("ended", () => {
  DOM.skipButton.style.display = "none";
});
DOM.skipButton.addEventListener("click", () => {
  DOM.player.currentTime = Math.max(DOM.player.duration - 0.1, 0);
  DOM.skipButton.style.display = "none";
});
DOM.exportButton.addEventListener("click", () => {
  const data = getRecent();
  if (!data) {
    alert("No recent data to export.");
    return;
  }
  let fileName = prompt("File Name:", "neovid-recent.json").trim();
  fileName = fileName.replaceAll(" ", "-");
  if (!fileName) {
    fileName = "neovid-recent.json";
  }
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
});
DOM.importButton.addEventListener("click", () => {
  let recent = getRecent();
  if (recent.length > 0) {
    const ok = confirm(
    "Importing will REPLACE current recent data.\nThis action is NOT reversible.\n\nContinue?"
    );
  if (ok) DOM.recentFile.click();
  }
  else {
    DOM.recentFile.click();
  }
  
});
DOM.recentFile.addEventListener("change", () => {
  const file = DOM.recentFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error();
      const isValid = parsed.every(item =>
        item &&
        typeof item === "object" &&
        typeof item.title === "string" &&
        typeof item.video === "string" &&
        (item.videoType === "url" || item.videoType === "local") &&
        (item.subtitle === "" || typeof item.subtitle === "string") &&
        (item.subtitleType === "url" || item.subtitleType === "local") &&
        typeof item.progress === "number" &&
        item.progress >= 0 &&
        item.progress <= 100
      );
      if (!isValid) throw new Error();
      setRecent(parsed);
      renderRecent();
      alert("Recent data imported successfully.");
    } catch {
      alert("Invalid recent data file.");
    }
    DOM.recentFile.value = "";
  };
  reader.readAsText(file);
});
window.addEventListener("resize", () => {
  renderRecent();
});

function showUpdateAlert(registration) {
  if (confirm("🚀 A new version is available. Reload now?")) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const reg = await navigator.serviceWorker.register("service-worker.js");

    if (reg.waiting) {
      showUpdateAlert(reg);
    }

    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateAlert(reg);
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  });
}


let deferredPrompt = null;
let isInstalled = false;



window.addEventListener("appinstalled", () => {
  isInstalled = true;
  deferredPrompt = null;
  DOM.installBanner.style.display = "none";
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();

  deferredPrompt = event;

  if (!isInstalled) {
    DOM.installBanner.style.display = "block";
  }
});

DOM.installButton.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;

  deferredPrompt = null;
  DOM.installBanner.style.display = "none";
});

DOM.closeInstallButton.addEventListener("click", () => {
  DOM.installBanner.style.display = "none";
});

DOM.downloadVideoButton.addEventListener("click", () => {
  if (!state.currentVideo || state.currentType !== "url") return;
  downloadFile(state.currentVideo);
});

DOM.downloadSubtitleButton.addEventListener("click", () => {
  if (!state.currentSubtitle || state.currentSubtitleType !== "url") return;
  downloadFile(state.currentSubtitle);
});

