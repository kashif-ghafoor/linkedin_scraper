import puppeteer from "puppeteer";
import * as fs from "fs";
import ObjectsToCsv from "objects-to-csv";
import { scrapeProfile } from "./scrapeProfile";
import { Output } from "./types";

const query = "testrail";
// const query = "Operational acceptance";

const urls = [
  "https://www.linkedin.com/in/paulinaduran/",
  "https://www.linkedin.com/in/vahe-gemilyan/",
  "https://www.linkedin.com/in/era-verma-8a229290/",
  "https://www.linkedin.com/in/shivam-gulati-9455458a/",
  "https://www.linkedin.com/in/volodymyr-shchelkunov/",
  "https://www.linkedin.com/in/joel-macwilliam-9a7518b4/",
  "https://www.linkedin.com/in/msitnikov/",
  "https://www.linkedin.com/in/craig-bal/",
  "https://www.linkedin.com/in/rashmi-jha-357011173/",
  "https://www.linkedin.com/in/cyndybell/",
  "https://www.linkedin.com/in/arthur-fernandez-70532414/",
];

async function main() {
  const browser = await puppeteer.launch({
    devtools: true,
    headless: true,
  });
  // const pageForAuthentication = (await browser.pages())[0];

  // for first time authentication only
  // await pageForAuthentication.goto("https://www.linkedin.com/login");
  // await authenticate(pageForAuthentication);

  const page = (await browser.pages())[0];
  // for linkedin authentication
  await page.setCookie(
    ...JSON.parse(fs.readFileSync("./linkedin-cookies.json").toString())
  );
  let result: Output[] = [];
  for (const url of urls) {
    const output = await scrapeProfile(page, query, url);
    result.push(...output);
  }
  const csv = new ObjectsToCsv(result);
  await csv.toDisk("./profiles-2.csv");
  fs.writeFileSync("./profiles-2.json", JSON.stringify(result));
  await browser.close();
}

// const csv = new ObjectsToCsv(finalResult);
//   await csv.toDisk("./profiles.csv");
//   await browser.close();

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
