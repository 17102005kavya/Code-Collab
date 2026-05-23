const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

// Fallback to avoid crashing if env vars are missing during early dev
const rawUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseUrl = rawUrl.startsWith("http") ? rawUrl : "https://placeholder.supabase.co";
const supabaseKey = (process.env.SUPABASE_KEY || "placeholder-key").trim();
const supabase = createClient(supabaseUrl, supabaseKey);

router.post("/", async (req, res) => {
  // Generate a random 6-character room ID
  const roomId = Math.random().toString(36).substring(2, 8);
  
  if (process.env.SUPABASE_URL) {
    try {
      await supabase.from("rooms").insert({ room_id: roomId });
    } catch (err) {
      console.error("Failed to insert room to DB:", err.message);
      // We can still proceed even if DB fails for now
    }
  }
  
  res.json({ roomId });
});

module.exports = router;
