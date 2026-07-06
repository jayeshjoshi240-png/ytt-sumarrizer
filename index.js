import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/api/summarize', async (req, res) => {
    try {
        const { transcriptText } = req.body;
        if (!transcriptText) return res.status(400).json({ error: "Missing transcript text." });

        if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing.");
        
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Provide a structured, beautifully formatted markdown summary of the following YouTube video transcript. 
        Start with a brief 2-sentence overview, followed by exactly 5 clear bullet points highlighting key insights, actionable takeaways, or main arguments. 
        Transcript:\n${transcriptText}`;

        const result = await model.generateContent(prompt);
        res.json({ summary: result.response.text() });
    } catch (error) {
        console.error("Gemini Error:", error.message);
        res.status(500).json({ error: "Failed to generate summary with AI." });
    }
});

app.listen(port, () => {
    console.log(`Server executing successfully on port ${port}`);
});