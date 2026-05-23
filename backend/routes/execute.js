const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

router.post("/", async (req, res) => {
  const { code, language } = req.body;
  
  const extMap = {
    javascript: "js",
    python: "py",
    java: "java",
    cpp: "cpp",
    go: "go",
    rust: "rs"
  };

  const ext = extMap[language];
  if (!ext) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const filename = `code_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
  const filepath = path.join(os.tmpdir(), filename);
  
  // Windows executable paths
  const exePath = filepath.replace(/\.[^/.]+$/, ".exe");

  try {
    await fs.writeFile(filepath, code);
    
    let command;
    if (language === "javascript") command = `node "${filepath}"`;
    else if (language === "python") command = `python "${filepath}"`;
    else if (language === "go") command = `go run "${filepath}"`;
    else if (language === "cpp") command = `g++ "${filepath}" -o "${exePath}" && "${exePath}"`;
    else if (language === "rust") command = `rustc "${filepath}" -o "${exePath}" && "${exePath}"`;
    else if (language === "java") command = `java "${filepath}"`;

    // Execute the code locally
    exec(command, { timeout: 5000 }, async (error, stdout, stderr) => {
      // Clean up the temporary file immediately after execution
      try { await fs.unlink(filepath); } catch(e) {}
      
      if (error) {
         if (error.killed) {
           return res.json({ error: "Execution timed out (5s limit)", status: "Error" });
         }
         return res.json({ error: stderr || error.message, output: stdout, status: "Error" });
      }
      
      res.json({ 
        output: stdout, 
        error: stderr, 
        status: stderr ? "Error" : "Completed" 
      });
    });

  } catch (err) {
    console.error("Local Execution Error:", err);
    res.status(500).json({ error: "Failed to execute code locally." });
  }
});

module.exports = router;
