const form = document.getElementById("video-form");
const videoUrl = document.getElementById("video-url");
const videoFile = document.getElementById("video-file");
const videoLoadSelect = document.getElementById("video-load-type");
const watchLaterButton = document.getElementById("watch-later-button");
const downloadVideoButton = document.getElementById("download-video-button");
const downloadSubtitleButton = document.getElementById("download-subtitle-button");
const skipButton = document.getElementById("skip-button");
const exportButton = document.getElementById("export-button");
const importButton = document.getElementById("import-button");
const installButton = document.getElementById("install-button");
const closeInstallButton = document.getElementById("close-install");
const installBanner = document.getElementById("install-banner");
const recentFile = document.getElementById("recent-file");
const recentNotice = document.getElementById("recent-notice");


const subtitleUrl = document.getElementById("subtitle-url");
const subtitleFile = document.getElementById("subtitle-file");
const subtitleLoadSelect = document.getElementById("subtitle-load-type");


const player = document.getElementById("video-player");
const recentItems = document.getElementById("recent-items");
const watchTime = document.getElementById("watch-time");
const recentKey = "recentVideos";
const watchTimeKey = "watchTime";
const recentSize = 30;
const skipThreshold = 60;

const state = {
  currentVideo: null,
  currentType: "url",
  currentSubtitle: "",
  currentSubtitleType: "url"
}



let currentTitle = "";
let videoLastTime = null;
let totalWatchTime = parseInt(localStorage.getItem(watchTimeKey) || "0", 10);
let accumulatedWatchTime = 0;

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
    downloadVideoButton.disabled = true;
  } else {
    downloadVideoButton.disabled = false;
  }

  if (!state.currentSubtitle || state.currentSubtitleType === "local") {
    downloadSubtitleButton.disabled = true;
  } else {
    downloadSubtitleButton.disabled = false;
  }
}

function updateWatchTime() {
  const videoCurrentTime = player.currentTime;
  if (videoLastTime !== null) {
    const diff = videoCurrentTime - videoLastTime;
    if (diff > 0 && diff < 5) {
      accumulatedWatchTime += diff;
      while (accumulatedWatchTime >= 1) {
        totalWatchTime += 1;
        accumulatedWatchTime -= 1;
        localStorage.setItem(watchTimeKey, totalWatchTime);
        watchTime.textContent = formatTime(totalWatchTime);
        
      }
    }
  }
  videoLastTime = videoCurrentTime;
}

function handleSkipButton() {
  if (player.duration && player.currentTime) {
    const remaining = player.duration - player.currentTime;
    if (player.duration > 3 * skipThreshold && remaining <= skipThreshold && !player.ended) {
      skipButton.style.display = "block";
    } else {
      skipButton.style.display = "none";
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
    videoUrl.value = videoUrlQuery;
  }
  if (subtitleUrlQuery) {
    subtitleUrl.value = subtitleUrlQuery;
  }
}

function truncateTitle(title, maxLength = 24) {
  if (!title) return "";
  return title.length > maxLength ? title.slice(0, maxLength - 3) + "..." : title;
}

function playVideo(src, subtitle = "", title = null, type = "url", subtitleType = "url") {
  if(state.currentType === "local" && state.currentVideo) URL.revokeObjectURL(state.currentVideo);
  player.innerHTML = "";

  const sourceElement = document.createElement("source");
  sourceElement.src = src;
  player.appendChild(sourceElement);

  if(subtitle) {
    const track = document.createElement("track");
    track.src = subtitle;
    track.kind = "subtitles";
    track.srclang = "en";
    track.label = "English";
    track.default = true;
    player.appendChild(track);
    player.textTracks[0].mode = "showing";
  }

  player.load();
  player.play().catch(() => {});

  state.currentVideo = src;
  state.currentType = type;
  currentTitle = title || (type==="url"? src.split("/").pop(): title);
  state.currentSubtitle = subtitle;
  state.currentSubtitleType = subtitleType;
  updateDownloadButtons();
}


function saveRecent(title, video, videoType, subtitle="", subtitleType="url") {
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  let progress = 0;
  const idx = recent.findIndex(item => item.title===title);
  if(idx!==-1) {
    progress = recent[idx].progress;
  }

  recent = recent.filter(item => !(item.title===title));

  recent.unshift({title, video, videoType, subtitle, subtitleType, progress});
  if(recent.length>recentSize) recent = recent.slice(0,recentSize);

  localStorage.setItem(recentKey, JSON.stringify(recent));
  renderRecent();
}

function removeRecent(title) {
  const userConfirmed = confirm("Are you sure you want to remove this video?");
  if (userConfirmed) {
    let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
    recent = recent.filter(item => !(item.title===title));
    localStorage.setItem(recentKey, JSON.stringify(recent));
    renderRecent();
  }
}

function updateProgress() {
  if(!state.currentVideo || !player.duration) return;
  const percent = Math.min(100, Math.round((player.currentTime/player.duration)*100));
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  const idx = recent.findIndex(item => item.video===state.currentVideo);
  if(idx!==-1) {
    recent[idx].progress = percent;
    localStorage.setItem(recentKey, JSON.stringify(recent));
    renderRecent();
  }
}

function loadPlayerTime() {
  if(!state.currentVideo || !player.duration) return;
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  const idx = recent.findIndex(item => item.video===state.currentVideo);
  if(idx!==-1) {
    const currentTime = (recent[idx].progress / 100) * player.duration
    player.currentTime = currentTime;
    
  }
}

function renderRecent() {
  const recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  recentItems.innerHTML="";
  let maxLimit = recentItems.offsetWidth  / 11;
  recent.forEach(item => {
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

    spanRemove.addEventListener("click", () => {
      removeRecent(item.title);
    });
    spanTitle.addEventListener("click", () => {
      let isDataLoaded = false;
      if(item.videoType==="url"){
        videoUrl.value = item.video;
        isDataLoaded = true;
      }
      else{
        videoUrl.value = "";
        alert("Please reselect the local video.");
      }
      if (item.subtitle) {
        if (item.subtitleType==="url") {
          subtitleUrl.value = item.subtitle;
          isDataLoaded = true;   
        }
        else{
          subtitleUrl.value = "";
          alert("Please reselect the local subtitle.");
        }
      }
      if (isDataLoaded) {
        form.scrollIntoView({"behavior": "smooth"});
      }
    });

    recentItems.appendChild(li);
  });

  exportButton.style.display = recent.length ? "inline-block" : "none";
  recentNotice.style.display = recent.length ? "block" : "none";
}

function getFormData() {
  let videoSrc = "", videoTitle = "", videoType = videoLoadSelect.value;
  if(videoType==="url") {
    const url = videoUrl.value.trim();
    if(!url) return alert("Please enter a video URL.");
    videoSrc = url;
    videoTitle = url.split("/").pop();
  } else {
    const file = videoFile.files[0];
    if(!file) return alert("Please select a local video file.");
    videoSrc = URL.createObjectURL(file);
    videoTitle = file.name;
  }


  let subSrc = "", subType = subtitleLoadSelect.value;
  if(subType==="url") {
    subSrc = subtitleUrl.value.trim();
  } else {
    const subFile = subtitleFile.files[0];
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



videoLoadSelect.addEventListener("change", () => {
  const isLocal = videoLoadSelect.value === "local";
  videoUrl.style.display = isLocal ? "none" : "block";
  videoFile.style.display = isLocal ? "block" : "none";
});

subtitleLoadSelect.addEventListener("change", () => {
  const isLocal = subtitleLoadSelect.value === "local";
  subtitleUrl.style.display = isLocal ? "none" : "block";
  subtitleFile.style.display = isLocal ? "block" : "none";
});


form.addEventListener("submit", function(e) {
  e.preventDefault();
  const data = getFormData();
  if (!data) return;
  playVideo(data.videoSrc, data.subSrc, data.videoTitle, data.videoType, data.subType);
  saveRecent(data.videoTitle, data.videoSrc, data.videoType, data.subSrc, data.subType);
});

watchLaterButton.addEventListener("click", () => {
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

player.addEventListener("timeupdate", () => {
  updateProgress();
  updateWatchTime();
  handleSkipButton();
});
player.addEventListener("loadedmetadata", loadPlayerTime);
window.addEventListener("DOMContentLoaded", () => {
  watchTime.textContent = formatTime(totalWatchTime);
  loadFromQuery();
  renderRecent();
  updateDownloadButtons();
});
player.addEventListener("ended", () => {
  skipButton.style.display = "none";
});
skipButton.addEventListener("click", () => {
  player.currentTime = Math.max(player.duration - 0.1, 0);
  skipButton.style.display = "none";
});
exportButton.addEventListener("click", () => {
  const data = localStorage.getItem(recentKey);
  if (!data) {
    alert("No recent data to export.");
    return;
  }
  let fileName = prompt("File Name:", "neovid-recent.json").trim();
  fileName = fileName.replaceAll(" ", "-");
  if (!fileName) {
    fileName = "neovid-recent.json";
  }
  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
});
importButton.addEventListener("click", () => {
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  if (recent.length > 0) {
    const ok = confirm(
    "Importing will REPLACE current recent data.\nThis action is NOT reversible.\n\nContinue?"
    );
  if (ok) recentFile.click();
  }
  else {
    recentFile.click();
  }
  
});
recentFile.addEventListener("change", () => {
  const file = recentFile.files[0];
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
      localStorage.setItem(recentKey, JSON.stringify(parsed));
      renderRecent();
      alert("Recent data imported successfully.");
    } catch {
      alert("Invalid recent data file.");
    }
    recentFile.value = "";
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
  installBanner.style.display = "none";
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();

  deferredPrompt = event;

  if (!isInstalled) {
    installBanner.style.display = "block";
  }
});

installButton.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;

  deferredPrompt = null;
  installBanner.style.display = "none";
});

closeInstallButton.addEventListener("click", () => {
  installBanner.style.display = "none";
});

downloadVideoButton.addEventListener("click", () => {
  if (!state.currentVideo || state.currentType !== "url") return;
  downloadFile(state.currentVideo);
});

downloadSubtitleButton.addEventListener("click", () => {
  if (!state.currentSubtitle || state.currentSubtitleType !== "url") return;
  downloadFile(state.currentSubtitle);
});

