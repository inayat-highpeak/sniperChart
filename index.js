const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const cron = require("node-cron");
const fs = require("fs");

const TELEGRAM_TOKEN = "7054904554:AAGuN9Hlp-aIZLxwDXPX0bkTRi4zP44qM9I";
const bot = new TelegramBot(TELEGRAM_TOKEN);
const CHAT_ID = "1118005241";

const coins = [
  { symbol: "BINANCE:ARBUSDT.P", name: "ARB" },
  { symbol: "BINANCE:SOLUSDT.P", name: "SOL" },
  { symbol: "BINANCE:BTCUSDT.P", name: "BTC" },
  { symbol: "BINANCE:ETHUSDT.P", name: "ETH" }
];

// Custom wait function (replaces waitForTimeout)
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureChart(symbol, name) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"]
  });

  const page = await browser.newPage();
  await page.goto(`https://www.tradingview.com/chart/?symbol=${symbol}`, {
    waitUntil: "networkidle2"
  });

  await wait(5000); // wait for chart load

  // Close right-side panel
  await page.waitForSelector('button[aria-label="Watchlist, details and news"]', { timeout: 10000 });
  await page.click('button[aria-label="Watchlist, details and news"]');
  console.log("✅ Right panel closed.");

  await page.keyboard.type("30");
  await page.keyboard.press("Enter");
  // Zoom in chart
  try {
    const chartArea = await page.$(".chart-container");
    for (let i = 0; i < 7; i++) {
      await chartArea.hover();
      await page.mouse.wheel({ deltaY: -300 });
      await wait(500);
    }
  } catch (e) {
    console.log("❗ Zoom failed:", e.message);
  }

  await wait(2000); // settle before screenshot

  const fileName = `${name}_chart.png`;
  const chartElement = await page.$(".chart-container");
  if (chartElement) {
    await chartElement.screenshot({ path: fileName });
  } else {
    await page.screenshot({ path: fileName });
  }

  await browser.close();

  // Send to Telegram
  await bot.sendPhoto(CHAT_ID, fileName, {
    caption: `📊 ${name} 30m Chart (Zoomed)`
  });
  console.log(`✅ Sent chart for ${name}`);

  fs.unlinkSync(fileName);
  await browser.close();
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

  console.log("📅 Scheduled Capture Started...");
  captureAllCharts();

