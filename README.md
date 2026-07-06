# 🎥 Smart YouTube Summarizer Pro

An intelligent, full-stack web application that instantly extracts transcripts from YouTube videos and generates structured, 5-point markdown summaries using Google's Gemini AI. 

Built with resilience in mind, this application features a custom proxy-routing engine to bypass standard IP blocks and ad-blocker interference, ensuring maximum uptime on free cloud-hosting tiers.

## ✨ Features

* **Instant AI Summaries:** Leverages `gemini-2.5-flash` to distill hour-long videos into quick, actionable bullet points.
* **Resilient Architecture:** Utilizes smart client-side proxy routing (`allorigins.win`, `corsproxy.io`) to safely extract transcripts without triggering Cloudflare blocks or YouTube 429 (Too Many Requests) server bans.
* **Ad-Blocker Fallback:** Automatically pivots through a network of fallback proxies if user browser shields (like uBlock Origin or Brave) block the initial request.
* **Premium UI/UX:** Features a responsive, glassmorphic dark-mode interface with real-time loading states and clean markdown parsing.
* **Serverless-Ready Backend:** Lightweight Node.js/Express backend strictly designed to secure the AI API key and handle LLM communication.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
* **Backend:** Node.js, Express.js (ES Modules)
* **AI Engine:** Google Generative AI (Gemini API)
* **Deployment:** Render (Web Services)

## 🚀 Local Development Setup

To run this project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git)
   cd YOUR_REPO_NAME
