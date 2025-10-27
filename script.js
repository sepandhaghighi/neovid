const form = document.getElementById("videoForm");
const videoUrl = document.getElementById("videoUrl");
const videoFile = document.getElementById("videoFile");
const videoLoadSelect = document.getElementById("videoLoadType");


const subtitleUrl = document.getElementById("subtitleUrl");
const subtitleFile = document.getElementById("subtitleFile");
const subtitleLoadSelect = document.getElementById("subtitleLoadType");


const player = document.getElementById("videoPlayer");
const recentItems = document.getElementById("recentItems");
const recentKey = "recentVideos";

let currentVideo = null;
let currentType = "url";
let currentTitle = "";

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


function saveRecent(title, video, videoType, subtitle="", subtitleType="url", progress=0){
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");


  recent = recent.filter(item => !(item.video===video));

  recent.unshift({title, video, videoType, subtitle, subtitleType, progress});
  if(recent.length>5) recent = recent.slice(0,5);

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
    spanTitle.textContent=truncateTitle(item.title, maxLimit);
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
    spanProgress.className="progress";
    spanProgress.textContent = `${item.progress||0}%`;

    li.appendChild(spanTitle);
    li.appendChild(spanProgress);

    li.addEventListener("click", ()=>{
      if(item.videoType==="url" && (!item.subtitle || item.subtitleType==="url")){
        playVideo(item.video, item.subtitle, item.title, item.videoType);
      } else {
        alert("Please reselect the local video/subtitle to play it again.");
      }
    });

    recentItems.appendChild(li);
  });

  document.getElementById("recentList").style.display = recent.length ? "block" : "none";
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


  saveRecent(videoTitle, videoSrc, videoType, subSrc, subType, 0);
});

// ---------- Progress update ----------
player.addEventListener("timeupdate", updateProgress);
player.addEventListener("loadedmetadata", loadPlayerTime);
window.addEventListener("DOMContentLoaded", renderRecent);
