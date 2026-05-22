import express from "express";
import cors from "cors";
import "dotenv/config";
import fetch from "node-fetch";

console.log("GROQ KEY loaded:", process.env.GROQ_KEY ? "YES ✅" : "NO ❌");
console.log("Key value:", process.env.GROQ_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// GROQ KEY HERE -----
const API_KEY = `Bearer ${process.env.GROQ_KEY}`;

app.post("/api/ai", async (req, res) => {
  try {
    const userPrompt = req.body.prompt;

    if (!userPrompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
  "Authorization": API_KEY
},
body: JSON.stringify({
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: userPrompt }]
})

    });

    const data = await response.json();
    console.log("AI response status:", response.status);

    if (data.error) {
      console.error("API error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.choices?.[0]?.message?.content || "No response from AI";
    res.json({ result: text });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
