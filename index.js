import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Resilient internal function to scrape video caption tracks safely
async function fetchTranscript(videoId) {
    try {
        const { data: html } = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const regexPatterns = [
            /ytInitialPlayerResponse\s*=\s*({.+?});/s,
            /var\s+ytInitialPlayerResponse\s*=\s*({.+?});/s
        ];

        let playerResponse = null;
        for (const pattern of regexPatterns) {
            const match = html.match(pattern);
            if (match) {
                try { playerResponse = JSON.parse(match[1]); break; } catch (e) { continue; }
            }
        }

        if (!playerResponse) throw new Error("Unable to parse video player metadata.");

        const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!tracks || tracks.length === 0) throw new Error("This video does not have available captions.");

        // Prioritize manually created English, then auto-generated English, then any fallback track
        const selectedTrack = tracks.find(t => t.languageCode === 'en' && !t.kind) || 
                              tracks.find(t => t.languageCode === 'en') || 
                              tracks[0];

        const { data: xmlData } = await axios.get(selectedTrack.baseUrl);

        // Strip XML nodes and clean text formatting
        return xmlData
            .replace(/<text[^>]*>/g, ' ')
            .replace(/<\/text>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    } catch (err) {
        throw new Error(err.message || "Failed to extract video text content.");
    }
}

app.post('/api/summarize', async (req, res) => {
    try {
        const { videoUrl } = req.body;
        if (!videoUrl) return res.status(400).json({ error: "Missing YouTube URL parameter." });

        const match = videoUrl.match(/(?:youtu\.be\/|v=|\/)([0-9A-Za-z_-]{11})/);
        if (!match) return res.status(400).json({ error: "Invalid YouTube URL format." });
        const videoId = match[1];

        // 1. Fetch transcript from YouTube securely inside the backend
        const cleanTranscript = await fetchTranscript(videoId);

        // 2. Connect to Gemini AI
        if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API backend key configuration missing.");
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Provide a structured, beautifully formatted markdown summary of the following YouTube video transcript. 
        Start with a brief 2-sentence overview, followed by exactly 5 clear bullet points highlighting key insights, actionable takeaways, or main arguments. 
        Transcript:\n${cleanTranscript}`;

        const result = await model.generateContent(prompt);
        const summaryText = result.response.text();

        res.json({ summary: summaryText });
    } catch (error) {
        console.error("Processing Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server executing successfully on port ${port}`);
});