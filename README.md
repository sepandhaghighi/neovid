<div align="center">
    <img src="https://github.com/sepandhaghighi/neovid/raw/main/assets/logo.png" alt="Neovid Logo" width="220">
    <h1>🎬 Neovid : Minimal Web Video Player</h1>
    <br/>
    <a href="https://neovid.top"><img src="https://img.shields.io/badge/demo-neovid.top-green.svg"></a>
    <a href="https://github.com/sepandhaghighi/neovid"><img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/sepandhaghighi/neovid"></a>
    <a href="https://github.com/sepandhaghighi/neovid"><img src="https://img.shields.io/github/stars/sepandhaghighi/neovid.svg?style=social&label=Stars"></a>
</div>

## Overview

**Neovid** is a minimal, zero-dependency web-based video player designed to be simple, fast, and mobile-friendly.  
It supports both online and local video playback with optional subtitles.

🌐 **Live Demo:** [https://neovid.top](https://neovid.top)

<table>
	<tr> 
		<td align="center">Code Quality</td>
		<td align="center"><a href="https://www.codefactor.io/repository/github/sepandhaghighi/neovid"><img src="https://www.codefactor.io/repository/github/sepandhaghighi/neovid/badge" alt="CodeFactor"></a></td>
		<td align="center"><a href="https://app.codacy.com/gh/sepandhaghighi/neovid/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade"><img src="https://app.codacy.com/project/badge/Grade/203287198d2a482a9154002565e44cc8"></a></td>
	</tr>
</table>

## Features

- **Zero dependencies**: pure HTML, CSS, and JavaScript  
- **Mobile responsive** design  
- **Play video from URL or local file**  
- **Subtitle support**  
- **Recent plays history** (tracks last 5 videos)  
- **Progress tracking**: remembers last watched percentage per video  

## Usage

### Play a Video
1. In the **Video** section, choose how you want to load your video:
   - **URL** → Paste a direct video link (e.g., `.mp4`, `.webm`)
   - **Local File** → Select a video file from your device
2. In the **Subtitle** section, choose how to load subtitles (optional):
   - **URL** → Enter a `.vtt` or `.srt` subtitle link
   - **Local File** → Select a subtitle file from your device
3. Click **Play Video**

### Recent Plays
- Neovid automatically saves the **last 5 videos** and your **view progress**
- Data is stored locally in your browser (no server involved)