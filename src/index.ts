import puppeteer from "puppeteer";
import * as fs from "fs";
import ObjectsToCsv from "objects-to-csv";
import { scrapeProfile } from "./scrapeProfile";
import { Output } from "./types";
import { handleError } from "./errorHandling";
import { args } from "./args-parser";

async function main() {
  const keyword = args.search_keyword;
  const searchUrl = args.saved_search;
  const input = args.input;
  const output = args.output;
  let outputPath = "./profiles.csv";
  if (output) outputPath = output;
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

  // normally when browser is open for long time, it will be stop working
  // after some time and become inactive due to OS settings.
  // next three lines of code will make sure that browser is always open and active
  // const session = await page.target().createCDPSession();
  // await session.send("Page.enable");
  // await session.send("Page.setWebLifecycleState", { state: "active" });

  if (input) {
    if (!fs.existsSync(input)) {
      console.error(`${input} File not found`);
      await browser.close();
      return;
    }
    const profilesData = await scrapeFromFile(browser, input, keyword);
    const csv = new ObjectsToCsv(profilesData);
    await csv.toDisk(outputPath);
    await browser.close();
    return;
  }
  if (!searchUrl) {
    console.error(`No input or search url provided`);
    await browser.close();
    return;
  }
  console.log("scraping links from sales navigator");
  const profilesData = await scrapeFromSalesNavigator(
    browser,
    searchUrl,
    keyword,
    outputPath
  );
  const csv = new ObjectsToCsv(profilesData);
  await csv.toDisk(outputPath);
  await browser.close();
  return;
}

async function scrapeFromFile(
  browser: puppeteer.Browser,
  input: string,
  keyword: string
) {
  const page = await browser.newPage();
  // for linkedin authentication

  await page.setCookie({
    name: "li_at",
    value: args.session_id,
    domain: "www.linkedin.com",
    path: "/",
  });
  console.log(`getting links from ${input}`);
  const links = fs.readFileSync(input).toString().split("\n");
  console.log(`${links.length} links found in ${input}`);
  return await scrapeProfiles(page, links, keyword);
}

async function scrapeFromSalesNavigator(
  browser: puppeteer.Browser,
  searchUrl: string,
  keyword: string,
  outputPath: string
) {
  let continueScraping = true;
  let counter = 1;
  let profilesData: Output[] = [];
  let profilesCounter = 1;
  while (continueScraping) {
    const resourceUrl = `${searchUrl}&page=${counter}`;
    const page = await browser.newPage();

    await page.setCookie({
      name: "li_at",
      value: args.session_id,
      domain: "www.linkedin.com",
      path: "/",
    });

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
    console.log("getting profiles links");
    continueScraping = await isToContinueScrapping(page);
    const profileLinks = await getLinks(page);
    console.log(
      `${profileLinks.length} profile links found on page ${counter}`
    );
    const result: Output[] = [];
    for (let i = 0; i < profileLinks.length; i++) {
      console.log(`processing ${profilesCounter}: ${profileLinks[i]}`);
      const data = await scrapeProfile(page, keyword, profileLinks[i]);
      if (!data.length)
        console.log(`Skipping: Not Found ${keyword} in job history\n`);
      else
        console.log(
          `Success: Found ${keyword} ${data.length} times in job history\n`
        );
      result.push(...data);
      profilesCounter++;
    }
    profilesData.push(...result);
    const csv = new ObjectsToCsv(profilesData);
    await csv.toDisk(outputPath);
    counter++;
    await page.close();
  }
  return profilesData;
}

async function isToContinueScrapping(page: puppeteer.Page) {
  return await page.evaluate(() => {
    const elements = document.documentElement.innerHTML;

    if (elements.includes("No leads matched your search")) {
      return false;
    }

    return true;
  });
}

async function scrapeProfiles(
  page: puppeteer.Page,
  links: string[],
  keyword: string
) {
  const result: Output[] = [];
  for (let i = 0; i < links.length; i++) {
    console.log(`processing ${i + 1}: ${links[i]}`);
    const data = await scrapeProfile(page, keyword, links[i]);
    if (!data.length)
      console.log(`Skipping: Not Found ${keyword} in job history\n`);
    else
      console.log(
        `Success: Found ${keyword} ${data.length} times in job history\n`
      );
    result.push(...data);
  }
  return result;
}

async function getLinks(page: puppeteer.Page) {
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
