const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

const TELEGRAM_TOKEN = "7054904554:AAGuN9Hlp-aIZLxwDXPX0bkTRi4zP44qM9I";
const bot = new TelegramBot(TELEGRAM_TOKEN);
const CHAT_ID = "1118005241";

const coins = [
  { symbol: "BINANCE:ARBUSDT.P", name: "ARB" },
  { symbol: "BINANCE:SOLUSDT.P", name: "SOL" },
  { symbol: "BINANCE:BTCUSDT.P", name: "BTC" },
  { symbol: "BINANCE:ETHUSDT.P", name: "ETH" }
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureChart(symbol, name) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(`https://www.tradingview.com/chart/?symbol=${symbol}`, {
    waitUntil: "networkidle2"
  });

  await wait(5000);
  const fileName = `${name}_chart.png`;
  await page.screenshot({ path: fileName });
  await browser.close();

  await bot.sendPhoto(CHAT_ID, fileName, { caption: `📊 ${name} Chart` });
  console.log(`✅ Sent chart for ${name}`);

  fs.unlinkSync(fileName);
}

async function captureAllCharts() {
  for (let coin of coins) {
    try {
      await captureChart(coin.symbol, coin.name);
    } catch (err) {
      console.error(`❌ Error with ${coin.name}:`, err.message);
    }
  }
}

// **👨‍💻 HTTP Endpoint for Cloud Run**
app.get("/", (req, res) => {
  res.send("✅ Sniper Chart Service Running...");
});

app.get("/capture", async (req, res) => {
  await captureAllCharts();
  res.send("📊 Charts Captured & Sent to Telegram");
});

// **🚀 Start Express Server**
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
