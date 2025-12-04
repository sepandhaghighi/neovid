const form = document.getElementById("video-form");
const videoUrl = document.getElementById("video-url");
const videoFile = document.getElementById("video-file");
const videoLoadSelect = document.getElementById("video-load-type");


const subtitleUrl = document.getElementById("subtitle-url");
const subtitleFile = document.getElementById("subtitle-file");
const subtitleLoadSelect = document.getElementById("subtitle-load-type");


const player = document.getElementById("video-player");
const recentItems = document.getElementById("recent-items");
const recentKey = "recentVideos";
const recentSize = 10;

let currentVideo = null;
let currentType = "url";
let currentTitle = "";

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
      let newRecent = JSON.parse(localStorage.getItem(recentKey) || "[]");
      newRecent = newRecent.filter(recentItem => !(recentItem.title===item.title));
      localStorage.setItem(recentKey, JSON.stringify(newRecent));
      renderRecent();
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

  document.getElementById("recent-list").style.display = recent.length ? "block" : "none";
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

// ---------- Progress update ----------
player.addEventListener("timeupdate", updateProgress);
player.addEventListener("loadedmetadata", loadPlayerTime);
window.addEventListener("DOMContentLoaded", loadFromQuery);
window.addEventListener("DOMContentLoaded", renderRecent);
