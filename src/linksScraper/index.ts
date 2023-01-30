import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from "fs";
import { handleError } from "../utils/errorHandling";
import { args } from "./args-parser";
import { changeUserAgent } from "../utils/changeUserAgent";
import { saveToDatabase } from "./database";
//TODO - use logger to save logs.
export async function main() {
  // arguments for puppeteer
  const _args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-sync",
    "--ignore-certificate-errors",
  ];
  // adding stealth plugin to puppeteer
  const browser = await puppeteer.launch({
    args: _args,
    defaultViewport: null,
    headless: true,
  });

  // reading saved_search url from file.
  let savedSearchUrls: string[] = [];
  try {
    savedSearchUrls = fs
      .readFileSync(`./src/linksScraper/saved_searches.txt`, "utf8")
      .split("\n");
    console.log("scraping profiles from sales navigator...");
  } catch (err) {
    handleError(err);
  }

  for (const searchUrl of savedSearchUrls) {
    // function will get all the links of profiles in saved search url
    try {
      await scrapeFromSalesNavigator(browser, searchUrl);
    } catch (err) {
      console.log("get the error");
    }
  }
  await browser.close();
}

async function scrapeFromSalesNavigator(browser: Browser, searchUrl: string) {
  console.log("scraping profile links from: ", searchUrl);
  let continueScraping = true;
  let counter = 1;
  // creating page
  const page = await browser.newPage();
  // changing user agent
  await changeUserAgent(page);
  const links: string[] = [];
  await page.setCookie({
    name: "li_at",
    value: args.session_id,
    domain: "www.linkedin.com",
    path: "/",
  });
  while (continueScraping) {
    console.log("page -> ", counter);
    const resourceUrl = `${searchUrl}&page=${counter}`;

    await page
      .goto(resourceUrl, { timeout: 120000, waitUntil: "networkidle2" })
      .catch((e) => {
        if (e instanceof Error) {
          if (e.message.includes("net::ERR_TOO_MANY_REDIRECTS")) {
            throw new Error(
              "linkedin has detected bot use proxy and different account."
            );
          }
        } else {
          console.log("error while navigating to page: ", e);
        }
      });

    await new Promise(function (resolve) {
      setTimeout(resolve, 5000);
    });

    await page.setViewport({
      width: 1200,
      height: 10_000,
    });

    await page.screenshot({
      fullPage: true,
    });
    // no error expected in this function but add handleError just in case
    continueScraping = await isToContinueScrapping(page).catch((e) => {
      handleError(e, "error in isToContinueScrapping");
      return false;
    });
    try {
      const profileLinks = await getLinks(page);
      console.log(`saving ${profileLinks.length} links to MySQL database...`);
      await saveToDatabase(profileLinks);
      links.push(...profileLinks);
    } catch (err) {
      // saving links for backup.
      console.log("saving links for backup... to backupLinks.json");
      fs.writeFileSync("./backup/backupLinks.json", JSON.stringify(links));
      handleError(err, "error in getLinks()");
    }
    counter++;
    console.log("got ", links.length, " links so far");

    // waiting for 30 seconds.
    await new Promise(function (resolve) {
      setTimeout(resolve, 30000);
    });
  }
  await page.close();
  return links;
}

async function isToContinueScrapping(page: Page) {
  return await page.evaluate(() => {
    const elements = document.documentElement.innerHTML;

    if (elements.includes("No leads matched your search")) {
      return false;
    }

    return true;
  });
}

async function getLinks(page: Page) {
  try {
    await page.waitForSelector(".artdeco-entity-lockup__title.ember-view", {
      timeout: 10000,
    });
  } catch (err) {
    handleError(err);
    return [];
  }
  return await page.evaluate(() => {
    const elements = document.querySelectorAll(
      ".artdeco-entity-lockup__title.ember-view"
    );
    const elementValues = Object.values(elements);
    const values = [];

    for (const value of elementValues) {
      const text = value.outerHTML;
      const cenas = text.match(/\bsales\/lead\/.+\bid/g);

      if (cenas && cenas.length > 0) {
        const parsedValue = `https://www.linkedin.com/${cenas[0].slice(0, -4)}`;
        const salesUrl = parsedValue.split(",")[0];

        values.push(salesUrl.replace("/sales/lead/", "/in/"));
      }
    }
    return values;
  });
}
