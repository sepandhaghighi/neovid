const form = document.getElementById("video-form");
const videoUrl = document.getElementById("video-url");
const videoFile = document.getElementById("video-file");
const videoLoadSelect = document.getElementById("video-load-type");
const skipButton = document.getElementById("skip-button");
const exportButton = document.getElementById("export-button");
const importButton = document.getElementById("import-button");
const recentFile = document.getElementById("recent-file");


const subtitleUrl = document.getElementById("subtitle-url");
const subtitleFile = document.getElementById("subtitle-file");
const subtitleLoadSelect = document.getElementById("subtitle-load-type");


const player = document.getElementById("video-player");
const recentItems = document.getElementById("recent-items");
const watchTime = document.getElementById("watch-time");
const recentKey = "recentVideos";
const watchTimeKey = "watchTime";
const recentSize = 25;
const skipThreshold = 60;

let currentVideo = null;
let currentType = "url";
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
  if (videoUrlQuery){
    videoUrl.value = videoUrlQuery;
  }
  if (subtitleUrlQuery){
    subtitleUrl.value = subtitleUrlQuery;
  }
}

function truncateTitle(title, maxLength = 24) {
  if (!title) return "";
  return title.length > maxLength ? title.slice(0, maxLength - 3) + "..." : title;
}

function playVideo(src, subtitle = "", title = null, type = "url") {
  if(currentType === "local" && currentVideo) URL.revokeObjectURL(currentVideo);
  player.innerHTML = "";

  const sourceElement = document.createElement("source");
  sourceElement.src = src;
  player.appendChild(sourceElement);

  if(subtitle){
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
  player.play().catch(()=>{});

  currentVideo = src;
  currentType = type;
  currentTitle = title || (type==="url"? src.split("/").pop(): title);
}


function saveRecent(title, video, videoType, subtitle="", subtitleType="url"){
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  let progress = 0;
  const idx = recent.findIndex(item => item.title===title);
  if(idx!==-1){
    progress = recent[idx].progress;
  }

  recent = recent.filter(item => !(item.title===title));

  recent.unshift({title, video, videoType, subtitle, subtitleType, progress});
  if(recent.length>recentSize) recent = recent.slice(0,recentSize);

  localStorage.setItem(recentKey, JSON.stringify(recent));
  renderRecent();
}

function updateProgress(){
  if(!currentVideo || !player.duration) return;
  const percent = Math.min(100, Math.round((player.currentTime/player.duration)*100));
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  const idx = recent.findIndex(item => item.video===currentVideo);
  if(idx!==-1){
    recent[idx].progress = percent;
    localStorage.setItem(recentKey, JSON.stringify(recent));
    renderRecent();
  }
}

function loadPlayerTime(){
  if(!currentVideo || !player.duration) return;
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  const idx = recent.findIndex(item => item.video===currentVideo);
  if(idx!==-1){
    const currentTime = (recent[idx].progress / 100) * player.duration
    player.currentTime = currentTime;
    
  }
}

function renderRecent(){
  const recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  recentItems.innerHTML="";
  let maxLimit = recentItems.offsetWidth  / 11;
  recent.forEach(item=>{
    const li = document.createElement("li");
    const spanTitle = document.createElement("span");
    const spanRemove = document.createElement("span");
    li.style.background = getProgressBackground(item.progress);
    spanTitle.textContent = truncateTitle(item.title, maxLimit);
    spanTitle.className = "recent-title";
    spanRemove.textContent = "🗑️";
    spanRemove.className = "recent-remove";
    if(item.videoType==="url"){
      const tag = document.createElement("span");
      tag.className="url-tag";
      tag.textContent="🌐";
      spanTitle.appendChild(tag);
    }
    if(item.videoType==="local"){
      const tag = document.createElement("span");
      tag.className="local-tag";
      tag.textContent="💾";
      spanTitle.appendChild(tag);
    }
    if(item.subtitle && item.subtitleType==="local"){
      const tag = document.createElement("span");
      tag.className="local-tag";
      tag.textContent="📄";
      spanTitle.appendChild(tag);
    }
    if(item.subtitle && item.subtitleType==="url"){
      const tag = document.createElement("span");
      tag.className="url-tag";
      tag.textContent="💬";
      spanTitle.appendChild(tag);
    }
    const spanProgress = document.createElement("span");
    spanProgress.className="recent-progress";
    spanProgress.textContent = `${item.progress||0}%`;

    if(item.progress>=97){
      spanProgress.textContent = "✔️";
    }

    li.appendChild(spanRemove);
    li.appendChild(spanTitle);
    li.appendChild(spanProgress);

    spanRemove.addEventListener("click", ()=>{
      const userConfirmed = confirm("Are you sure you want to remove this video?");
      if (userConfirmed){
        let newRecent = JSON.parse(localStorage.getItem(recentKey) || "[]");
        newRecent = newRecent.filter(recentItem => !(recentItem.title===item.title));
        localStorage.setItem(recentKey, JSON.stringify(newRecent));
        renderRecent();
      }
    });
    spanTitle.addEventListener("click", ()=>{
      let isDataLoaded = false;
      if(item.videoType==="url"){
        videoUrl.value = item.video;
        isDataLoaded = true;
      }
      else{
        videoUrl.value = "";
        alert("Please reselect the local video.");
      }
      if (item.subtitle){
        if (item.subtitleType==="url"){
          subtitleUrl.value = item.subtitle;
          isDataLoaded = true;   
        }
        else{
          subtitleUrl.value = "";
          alert("Please reselect the local subtitle.");
        }
      }
      if (isDataLoaded){
        form.scrollIntoView({"behavior": "smooth"});
      }
    });

    recentItems.appendChild(li);
  });

  exportButton.style.display = recent.length ? "inline-block" : "none";
}


videoLoadSelect.addEventListener("change", ()=>{
  const isLocal = videoLoadSelect.value === "local";
  videoUrl.style.display = isLocal ? "none" : "block";
  videoFile.style.display = isLocal ? "block" : "none";
});

subtitleLoadSelect.addEventListener("change", ()=>{
  const isLocal = subtitleLoadSelect.value === "local";
  subtitleUrl.style.display = isLocal ? "none" : "block";
  subtitleFile.style.display = isLocal ? "block" : "none";
});


form.addEventListener("submit", function(e){
  e.preventDefault();


  let videoSrc = "", videoTitle = "", videoType = videoLoadSelect.value;
  if(videoType==="url"){
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
  if(subType==="url"){
    subSrc = subtitleUrl.value.trim();
  } else {
    const subFile = subtitleFile.files[0];
    if(subFile) subSrc = URL.createObjectURL(subFile);
  }


  playVideo(videoSrc, subSrc, videoTitle, videoType);


  saveRecent(videoTitle, videoSrc, videoType, subSrc, subType);
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
  const ok = confirm(
    "Importing will REPLACE current recent data.\nThis action is NOT reversible.\n\nContinue?"
  );
  if (ok) recentFile.click();
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