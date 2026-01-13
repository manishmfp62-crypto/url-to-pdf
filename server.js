  const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const OUTPUT = path.join(__dirname, "output");
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT);

app.post("/api/url-to-pdf", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success:false });

  const file = `pdf-${Date.now()}.pdf`;
  const filePath = path.join(OUTPUT, file);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox","--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
    });

    await browser.close();

    res.json({
      success: true,
      download: `/download/${file}`
    });
  } catch (e) {
    if (browser) await browser.close();
    res.status(500).json({ success:false });
  }
});

app.use("/download", express.static(OUTPUT));

app.listen(3000, () => {
  console.log("✅ URL to PDF server running on port 3000");
});
