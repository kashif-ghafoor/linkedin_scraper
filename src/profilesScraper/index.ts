import puppeteer from "puppeteer";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";
// import puppeteerExtraPluginAnonymizeUa from "puppeteer-extra-plugin-anonymize-ua";
import { scrapeProfile } from "./scrapeProfile";
import { Output } from "./types";
import { handleError } from "../utils/errorHandling";
import { args } from "./args-parser";
import {
  saveScrapedDatatoDatabase,
  getUnscrapedLinksFromDatabase,
  updateTableForFailedProfiles,
} from "./database";
import { changeUserAgent } from "../utils/changeUserAgent";
import { waitForTimeOut } from "../utils/waitForTimeOut";

async function main() {
  // taking arguments from command line
  const keyword = args.search_keyword;
  const session_id = args.session_id;
  // arguments for puppeteer
  const _args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-sync",
    "--ignore-certificate-errors",
  ];
  // adding stealth plugin to puppeteer
  // puppeteer.use(StealthPlugin());
  // get links from master_profiles table from MYsQL database
  let counter = 1;
  while (true) {
    const browser = await puppeteer.launch({
      args: _args,
      defaultViewport: null,
      headless: true,
    });

    // const page = await browser.newPage();
    const page = (await browser.pages())[0];
    // const page = await browser.newPage();

    await changeUserAgent(page);

    await page.setCookie({
      name: "li_at",
      value: session_id,
      domain: "www.linkedin.com",
      path: "/",
    });

    let passedProfilesData: Output[] = [];
    let passedProfilLinks: string[] = []; // to update master_profiles table
    let failedProfiles: string[] = []; // saving only urls of failed profiles
    // get 10 unscraped links from database
    try {
      console.log("Fetching unscraped links from database");
      const links = await getUnscrapedLinksFromDatabase();
      console.log(`Fetched ${links.length} links`);
      if (links.length === 0) {
        console.log("No unscraped links in database");
        console.log("going in sleep mode for 10 minutes");
        await browser.close();
        console.log("sleeping ...");
        await waitForTimeOut(60000);
        continue;
      }
      // scrape data from links
      for (let i = 0; i < links.length; i++) {
        console.log(`processing ${counter}: ${links[i]}`);
        const data = await scrapeProfile(page, keyword, links[i]);
        if (data.length !== 0) {
          console.log(
            `Success: Found ${keyword} ${data.length} times in job history\n`
          );
          passedProfilesData.push(...data);
          passedProfilLinks.push(links[i]);
        } else {
          console.log(`Skipping: Not Found ${keyword} in job history\n`);
          failedProfiles.push(links[i]);
        }
        counter++;
      }

      // save profile that have keyword in job history to database
      console.log("Saving scraped data to database");
      await saveScrapedDatatoDatabase(
        passedProfilesData,
        keyword,
        passedProfilLinks
      );
      console.log("Updating master_profiles table");
      // update master_profiles table with failed profiles
      await updateTableForFailedProfiles(failedProfiles, keyword);
      console.log("\n\n");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("net::ERR_TOO_MANY_REDIRECTS")) {
          console.log("Bot detected, existing script");
          process.exit(1);
        }
      }
    } finally {
      await browser.close();
    }
  }
}

main();
