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

app.post('/api/summarize', async (req, res) => {
    try {
        const { videoUrl } = req.body;
        if (!videoUrl) throw new Error("Missing YouTube URL.");

        const match = videoUrl.match(/(?:youtu\.be\/|v=|\/)([0-9A-Za-z_-]{11})/);
        if (!match) throw new Error("Invalid YouTube URL format.");
        const videoId = match[1];

        // 1. Fetch transcript from backend (Bypasses Adblockers and YouTube IP bans!)
        let transcriptText = "";
        try {
            const transcriptRes = await axios.get(`https://youtube-transcript.ai/transcript/${videoId}.txt`);
            transcriptText = transcriptRes.data;
        } catch (err) {
            throw new Error("Captions are disabled or unavailable for this video.");
        }

        if (!transcriptText || transcriptText.includes("<!DOCTYPE html>")) {
            throw new Error("Transcript unavailable.");
        }

        // 2. Call Gemini
        if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing on the server.");
        
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Provide a structured, beautifully formatted markdown summary of the following YouTube video transcript. 
        Start with a brief 2-sentence overview, followed by exactly 5 clear bullet points highlighting key insights, actionable takeaways, or main arguments. 
        Transcript:\n${transcriptText}`;

        const result = await model.generateContent(prompt);
        res.json({ summary: result.response.text() });
    } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server executing successfully on port ${port}`);
});