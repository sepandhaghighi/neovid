const CONFIG = {
  STORAGE_KEYS: {
    RECENT: "recentVideos",
    WATCH_TIME: "watchTime",
  },

  LIMITS: {
    RECENT_SIZE: 30,
    SKIP_THRESHOLD: 60,
    TITLE_MAX_LENGTH: 24,
    RECENT_TITLE_RATIO: 11,
    COMPLETED_PERCENT: 97,
  },

  FILES: {
    EXPORT_DEFAULT_NAME: "neovid-recent.json",
    EXPORT_TYPE: "application/json"
  },

  MESSAGES: {
    CONFIRM_REMOVE: "Are you sure you want to remove this video?",
    EXPORT_EMPTY: "No recent data to export.",
    IMPORT_CONFIRM: "Importing will REPLACE current recent data.\nThis action is NOT reversible.\n\nContinue?",
    IMPORT_SUCCESS: "Recent data imported successfully.",
    IMPORT_ERROR: "Invalid recent data file.",
    WATCH_LATER_ADDED: "Video added to list.",
    SELECT_VIDEO: "Please enter a video URL.",
    SELECT_LOCAL_VIDEO: "Please select a local video file.",
    RESELECT_LOCAL_VIDEO: "Please reselect the local video.",
    RESELECT_LOCAL_SUBTITLE: "Please reselect the local subtitle.",
    UPDATE_AVAILABLE: "🚀 A new version is available. Reload now?"
  },

};


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

function showAlert(text, icon = "info") {
  return Swal.fire({
    icon,
    text,
    confirmButtonText: "OK"
  });
}

function showConfirm(text, options = {}) {
  return Swal.fire({
    icon: options.icon || "warning",
    text,
    showCancelButton: true,
    confirmButtonText: options.confirmText || "OK",
    cancelButtonText: options.cancelText || "Cancel"
  });
}

function showPrompt(title, defaultValue = "", options = {}) {
  return Swal.fire({
    title,
    input: "text",
    inputValue: defaultValue,
    showCancelButton: true,
    confirmButtonText: options.confirmText || "OK",
    cancelButtonText: options.cancelText || "Cancel"
  });
}

function getRecent() {
  return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.RECENT) || "[]");
}

function setRecent(data) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.RECENT, JSON.stringify(data));
}

function getWatchTime() {
  return parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.WATCH_TIME) || "0", 10);
}

function setWatchTime(value) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.WATCH_TIME, value);
}

const state = {
  currentVideo: null,
  currentVideoType: "url",
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
  if (!state.currentVideo || state.currentVideoType === "local") {
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
    if (DOM.player.duration > 3 * CONFIG.LIMITS.SKIP_THRESHOLD && remaining <= CONFIG.LIMITS.SKIP_THRESHOLD && !DOM.player.ended) {
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

function truncateTitle(title, maxLength = CONFIG.LIMITS.TITLE_MAX_LENGTH) {
  if (!title) return "";
  return title.length > maxLength ? title.slice(0, maxLength - 3) + "..." : title;
}

function playVideo(video, subtitle = "", title = null, videoType = "url", subtitleType = "url") {
  if(state.currentVideoType === "local" && state.currentVideo) URL.revokeObjectURL(state.currentVideo);
  if(state.currentSubtitleType === "local" && state.currentSubtitle) URL.revokeObjectURL(state.currentSubtitle);
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
  state.currentVideoType = videoType;
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
  if(recent.length>CONFIG.LIMITS.RECENT_SIZE) recent = recent.slice(0,CONFIG.LIMITS.RECENT_SIZE);

  setRecent(recent);
  renderRecent();
}

function removeRecent(title) {
  showConfirm(CONFIG.MESSAGES.CONFIRM_REMOVE, {
    confirmText: "Remove"
  }).then((result) => {
      if (result.isConfirmed) {
        let recent = getRecent();
        recent = recent.filter(item => !(item.title===title));
        setRecent(recent);
        renderRecent();
      }
    });
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

  if(item.progress>=CONFIG.LIMITS.COMPLETED_PERCENT) {
    spanProgress.textContent = "✔️";
  }

  li.appendChild(spanRemove);
  li.appendChild(spanTitle);
  li.appendChild(spanProgress);

  return { li, spanTitle, spanRemove };
}

function attachRecentEvents(item, spanTitle, spanRemove) {
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
      showAlert(CONFIG.MESSAGES.RESELECT_LOCAL_VIDEO, "info");
    }
    if (item.subtitle) {
      if (item.subtitleType==="url") {
        DOM.subtitleUrl.value = item.subtitle;
        isDataLoaded = true;   
      }
      else{
        DOM.subtitleUrl.value = "";
        showAlert(CONFIG.MESSAGES.RESELECT_LOCAL_SUBTITLE, "info");
      }
    }
    if (isDataLoaded) {
      DOM.form.scrollIntoView({"behavior": "smooth"});
    }
  });
}


function renderRecent() {
  const recent = getRecent();
  DOM.recentItems.innerHTML="";
  let maxLimit = DOM.recentItems.offsetWidth  / CONFIG.LIMITS.RECENT_TITLE_RATIO;
  recent.forEach(item => {
    const { li, spanTitle, spanRemove } = createRecentItem(item, maxLimit);
    attachRecentEvents(item, spanTitle, spanRemove);
    DOM.recentItems.appendChild(li);
  });

  DOM.exportButton.style.display = recent.length ? "inline-block" : "none";
  DOM.recentNotice.style.display = recent.length ? "block" : "none";
}

function getFormData() {
  let videoSrc = "", videoTitle = "", videoType = DOM.videoLoadSelect.value;
  if(videoType==="url") {
    const url = DOM.videoUrl.value.trim();
    if(!url) {
      showAlert(CONFIG.MESSAGES.SELECT_VIDEO, "warning");
      return;
    }
    videoSrc = url;
    videoTitle = url.split("/").pop();
  } else {
    const file = DOM.videoFile.files[0];
    if(!file) {
      showAlert(CONFIG.MESSAGES.SELECT_LOCAL_VIDEO, "warning");
      return;
    }
    videoSrc = URL.createObjectURL(file);
    videoTitle = file.name;
  }


  let subtitleSrc = "", subtitleType = DOM.subtitleLoadSelect.value;
  if(subtitleType==="url") {
    subtitleSrc = DOM.subtitleUrl.value.trim();
  } else {
    const subtitleFile = DOM.subtitleFile.files[0];
    if(subtitleFile) subtitleSrc = URL.createObjectURL(subtitleFile);
  }
  return {
    videoSrc,
    videoTitle,
    videoType,
    subtitleSrc,
    subtitleType
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
  playVideo(data.videoSrc, data.subtitleSrc, data.videoTitle, data.videoType, data.subtitleType);
  saveRecent(data.videoTitle, data.videoSrc, data.videoType, data.subtitleSrc, data.subtitleType);
});

DOM.watchLaterButton.addEventListener("click", () => {
  const data = getFormData();
  if (!data) return;
  saveRecent(
    data.videoTitle,
    data.videoSrc,
    data.videoType,
    data.subtitleSrc,
    data.subtitleType
  );
  showAlert(CONFIG.MESSAGES.WATCH_LATER_ADDED, "success");
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
    alert(CONFIG.MESSAGES.EXPORT_EMPTY);
    return;
  }
  let fileName = prompt("File Name:", CONFIG.FILES.EXPORT_DEFAULT_NAME).trim();
  fileName = fileName.replaceAll(" ", "-");
  if (!fileName) {
    fileName = CONFIG.FILES.EXPORT_DEFAULT_NAME;
  }
  const blob = new Blob([JSON.stringify(data)], { type: CONFIG.FILES.EXPORT_TYPE });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
});
DOM.importButton.addEventListener("click", () => {
  let recent = getRecent();
  if (recent.length > 0) {
    showConfirm(CONFIG.MESSAGES.IMPORT_CONFIRM, {
      confirmText: "Import"
      }).then((result) => {
        if (result.isConfirmed) {
          DOM.recentFile.click();
        }
      });
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
      showAlert(CONFIG.MESSAGES.IMPORT_SUCCESS, "success");
    } catch {
      showAlert(CONFIG.MESSAGES.IMPORT_ERROR, "error");
    }
    DOM.recentFile.value = "";
  };
  reader.readAsText(file);
});
window.addEventListener("resize", () => {
  renderRecent();
});

function showUpdateAlert(registration) {
  showConfirm(CONFIG.MESSAGES.UPDATE_AVAILABLE, {
    icon: "info",
    confirmText: "Reload"
  }).then((result) => {
    if (result.isConfirmed) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  });
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
  if (!state.currentVideo || state.currentVideoType !== "url") return;
  downloadFile(state.currentVideo);
});

DOM.downloadSubtitleButton.addEventListener("click", () => {
  if (!state.currentSubtitle || state.currentSubtitleType !== "url") return;
  downloadFile(state.currentSubtitle);
});

