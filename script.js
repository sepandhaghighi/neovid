const form = document.getElementById("videoForm");
const urlInput = document.getElementById("videoUrl");
const subUrlInput = document.getElementById("subtitleUrl");
const videoFileInput = document.getElementById("videoFile");
const subFileInput = document.getElementById("subtitleFile");
const loadTypeSelect = document.getElementById("loadType");
const player = document.getElementById("videoPlayer");
const recentItems = document.getElementById("recentItems");
const recentKey = "recentVideos";

let currentVideo = null;
let currentType = "url";
let currentTitle = "";

function playVideo(src, subtitle = "", title = null, type = "url") {
  player.innerHTML = "";
  const sourceElement = document.createElement("source");
  sourceElement.src = src;
  player.appendChild(sourceElement);

  if (subtitle) {
    const track = document.createElement("track");
    track.src = subtitle;
    track.kind = "subtitles";
    track.srclang = "en";
    track.label = "English";
    track.default = true;
    player.appendChild(track);
  }

  player.load();
  player.play().catch(()=>{});
  currentVideo = src;
  currentType = type;
  currentTitle = title || (type==="url"? src.split("/").pop(): title);
  saveRecent(currentTitle, src, 0, type);
}

function saveRecent(title, video, progress, type) {
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  recent = recent.filter(item => !(item.title===title && item.type===type));
  recent.unshift({title, video, progress, type});
  if (recent.length>5) recent = recent.slice(0,5);
  localStorage.setItem(recentKey, JSON.stringify(recent));
  renderRecent();
}

function updateProgress() {
  if(!currentVideo || !player.duration) return;
  const percent = Math.min(100, Math.round((player.currentTime/player.duration)*100));
  let recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  const idx = recent.findIndex(item => item.title===currentTitle && item.type===currentType);
  if(idx!==-1){
    recent[idx].progress = percent;
    localStorage.setItem(recentKey, JSON.stringify(recent));
    renderRecent();
  }
}

function renderRecent(){
  const recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
  recentItems.innerHTML="";
  recent.forEach(item=>{
    const li=document.createElement("li");
    const spanTitle=document.createElement("span");
    spanTitle.textContent=item.title;
    if(item.type==="local"){
      const tag=document.createElement("span");
      tag.className="local-tag";
      tag.textContent="(local)";
      spanTitle.appendChild(tag);
    }
    const spanProgress=document.createElement("span");
    spanProgress.className="progress";
    spanProgress.textContent=`${item.progress||0}%`;
    li.appendChild(spanTitle);
    li.appendChild(spanProgress);
    li.addEventListener("click", function(){
      if(item.type==="url"){
        playVideo(item.video);
      } else {
        alert("Please reselect the local file to play it again.");
      }
    });
    recentItems.appendChild(li);
  });
  document.getElementById("recentList").style.display=recent.length?"block":"none";
}


loadTypeSelect.addEventListener("change",function(){
  const isLocal = loadTypeSelect.value === "local";
  urlInput.style.display = isLocal ? "none" : "block";
  subUrlInput.style.display = isLocal ? "none" : "block";
  videoFileInput.style.display = isLocal ? "block" : "none";
  subFileInput.style.display = isLocal ? "block" : "none";
});

form.addEventListener("submit", function(e){
  e.preventDefault();
  if(loadTypeSelect.value==="url"){
    const url = urlInput.value.trim();
    const sub = subUrlInput.value.trim();
    if(url) playVideo(url, sub, url.split("/").pop(), "url");
    else alert("Please enter a video URL.");
  } else {
    const file = videoFileInput.files[0];
    const subFile = subFileInput.files[0];
    if(file){
      const videoBlob = URL.createObjectURL(file);
      const subBlob = subFile ? URL.createObjectURL(subFile) : "";
      playVideo(videoBlob, subBlob, file.name, "local");
    } else alert("Please select a local video file.");
  }
});

player.addEventListener("timeupdate", updateProgress);

window.addEventListener("DOMContentLoaded",function(){
  renderRecent();
});