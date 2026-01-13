const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const OUTPUT_DIR = path.join(__dirname, "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

app.post("/api/url-to-pdf", async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL required" });

  const fileName = `webpage-${Date.now()}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 900 });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm"
      }
    });

    await browser.close();

    res.json({
      success: true,
      download: `/download/${fileName}`
    });

  } catch (err) {
    if (browser) await browser.close();
    console.error(err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

app.use("/download", express.static(OUTPUT_DIR));

app.listen(3000, () => {
  console.log("🚀 URL to PDF API running on port 3000");
});
