import puppeteer from "puppeteer";
import * as fs from "fs";
import ObjectsToCsv from "objects-to-csv";
import { scrapeProfile } from "./scrapeProfile";
import { Output } from "./types"; //TODO
import { handleError } from "./errorHandling";
import { args } from "./args-parser";

async function main() {
  const keyword = args.search_keyword;
  const searchUrl = args.saved_search;
  const input = args.input;
  const output = args.output;
  const browser = await puppeteer.launch({
    args: ["--window-size=1920,1080"],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    headless: true,
  });
  // const pageForAuthentication = (await browser.pages())[0];

  // for first time authentication only
  // await pageForAuthentication.goto("https://www.linkedin.com/login");
  // await authenticate(pageForAuthentication);

  const page = await browser.newPage();
  // for linkedin authentication

  await page.setCookie({
    name: "li_at",
    value: args.session_id,
    domain: "www.linkedin.com",
    path: "/",
  });

  // normally when browser is open for long time, it will be stop working
  // after some time and become inactive due to OS settings.
  // next three lines of code will make sure that browser is always open and active
  // const session = await page.target().createCDPSession();
  // await session.send("Page.enable");
  // await session.send("Page.setWebLifecycleState", { state: "active" });

  const result: Output[] = [];
  let links: string[] = [];
  if (input) {
    if (!fs.existsSync(input)) {
      console.error(`${input} File not found`);
      await browser.close();
      return;
    } else {
      console.log(`getting links from ${input}`);
      links = fs.readFileSync(input).toString().split("\n");
      console.log(`${links.length} links found in ${input}`);
    }
  } else {
    if (searchUrl) {
      console.log("scraping links from sales navigator");
      links = await extractLinksFromSalesNavigator(page, searchUrl);
      console.log(`saved search has ${links.length} profiles`);
    } else {
      console.error(
        `you have to provide either saved_search or input argument`
      );
      await browser.close();
      return;
    }
  }
  await page.close();
  for (let i = 0; i < links.length; i++) {
    console.log(`processing ${i + 1}: ${links[i]}`);
    const newPage = await browser.newPage();
    await newPage.setCookie({
      name: "li_at",
      value: args.session_id,
      domain: "www.linkedin.com",
      path: "/",
    });
    const data = await scrapeProfile(newPage, keyword, links[i]);
    await newPage.close();
    if (!data.length)
      console.log(`Skipping. Not Found ${keyword} in job history\n`);
    else
      console.log(
        `Success Found ${keyword} ${data.length} times in job history\n`
      );
    result.push(...data);
  }
  // save to json file
  fs.writeFileSync("./profiles.json", JSON.stringify(result));
  let outputPath = "./profiles.csv";
  if (output) outputPath = output;
  // save to csv file
  const csv = new ObjectsToCsv(result);
  await csv.toDisk(outputPath);
  await browser.close();
}

async function authenticate(page: puppeteer.Page) {
  await page.waitForSelector(".login__form");
  await page.type("#username", "contact@railflow.io", { delay: 100 });
  await page.type("#password", "Goliath1!", { delay: 100 });
  await Promise.all([
    await page.click(".login__form_action_container button"),
    await page.waitForNavigation(),
  ]);
  // this wait is for you to grab the code from email and enter it in the input
  await page.waitForTimeout(120000);
  await page.cookies().then((cookies) => {
    console.log(cookies);
    fs.writeFileSync("./linkedin-cookies.json", JSON.stringify(cookies));
  });
}

main();

async function extractLinksFromSalesNavigator(
  page: puppeteer.Page,
  searchUrl: string
) {
  let continueScraping = true;
  let counter = 1;
  let totalLinks = [];
  while (continueScraping) {
    const resourceUrl = `${searchUrl}&page=${counter}`;

    await page.goto(resourceUrl, { timeout: 0 }).catch((e) => {
      handleError(e);
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
    const isToContinueScrapping = await page.evaluate(() => {
      const elements = document.documentElement.innerHTML;

      if (elements.includes("No leads matched your search")) {
        return false;
      }

      return true;
    });

    continueScraping = isToContinueScrapping;

    const profileLinks = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        ".artdeco-entity-lockup__title.ember-view"
      );
      const elementValues = Object.values(elements);
      const values = [];

      for (const value of elementValues) {
        const text = value.outerHTML;
        const cenas = text.match(/\bsales\/lead\/.+\bid/g);

        if (cenas && cenas.length > 0) {
          const parsedValue = `https://www.linkedin.com/${cenas[0].slice(
            0,
            -4
          )}`;
          const salesUrl = parsedValue.split(",")[0];

          values.push(salesUrl.replace("/sales/lead/", "/in/"));
        }
      }
      return values;
    });
    totalLinks.push(...profileLinks);
    counter++;
  }
  return totalLinks;
}
