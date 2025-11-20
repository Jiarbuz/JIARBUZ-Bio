import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/api/sendReport", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: "Bot token or chat ID not set in .env" });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: "Markdown"
      })
    });

    const data = await response.json();
    if (!data.ok) throw new Error(JSON.stringify(data));

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Telegram send error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default app;
