import puppeteer from "puppeteer";

let browser = null;

export async function getBrowser() {
  if (!browser || !browser.connected) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    console.log("Launching new Chromium...");

    browser.on("disconnected", () => {
      console.warn("Chromium disconnected");
      browser = null;
    });
  }

  return browser;
}
