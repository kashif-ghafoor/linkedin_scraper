"use strict";
// async function main2() {
//   const browser = await puppeteer.launch({
//     defaultViewport: {
//       width: 1920,
//       height: 1080,
//     },
//     args: args,
//     headless: false,
//   });
//   const page = await browser.newPage();
//   let continueScraping = true;
//   const result = [];
//   let counter = 1;
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
//   // while (continueScraping) {
//   const resourceUrl = `${searchUrl}&page=${counter}`;
//   await page.setCookie({
//     name: "li_at",
//     value: sessionToken,
//     domain: ".www.linkedin.com",
//   });
//   await page.goto(resourceUrl, {
//     waitUntil: "networkidle2",
//     timeout: 0,
//   });
//   await new Promise(function (resolve) {
//     setTimeout(resolve, 5000);
//   });
//   await page.setViewport({
//     width: 1200,
//     height: 10_000,
//   });
//   await page.screenshot({
//     path: "./screenshot.png",
//     fullPage: true,
//   });
//   const isToContinueScrapping = await page.evaluate(() => {
//     const elements = document.documentElement.innerHTML;
//     if (elements.includes("No leads matched your search")) {
//       return false;
//     }
//     return true;
//   });
//   continueScraping = isToContinueScrapping;
//   const profileLinks = await page.evaluate(() => {
//     const elements = document.querySelectorAll(
//       ".artdeco-entity-lockup__title.ember-view"
//     );
//     const elementValues = Object.values(elements);
//     const values = [];
//     for (const value of elementValues) {
//       const text = value.outerHTML;
//       const cenas = text.match(/\bsales\/lead\/.+\bid/g);
//       if (cenas && cenas.length > 0) {
//         const parsedValue = `https://www.linkedin.com/${cenas[0].slice(0, -4)}`;
//         const salesUrl = parsedValue.split(",")[0];
//         values.push(salesUrl.replace("/sales/lead/", "/in/"));
//       }
//     }
//     return values;
//   });
//   console.log(profileLinks);
//   for (const link of profileLinks) {
//     const data = await scrapeProfile(page, query, link);
//     result.push(data);
//   }
//   fs.writeFileSync("./result.json", JSON.stringify(result));
//   counter++;
// }
// }
const fs = __importStar(require("fs"));
const puppeteer = __importStar(require("puppeteer"));
const puppeteer_autoscroll_down_1 = require("puppeteer-autoscroll-down");
const errorHandling_1 = require("./errorHandling");
async function main() {
    const browser = await puppeteer.launch({
        // args: ["--window-size=1920,1080"],
        // defaultViewport: {
        //   width: 1920,
        //   height: 1080,
        // },
        headless: false,
    });
    // const pageForAuthentication = (await browser.pages())[0];
    // for first time authentication only
    // await pageForAuthentication.goto("https://www.linkedin.com/login");
    // await authenticate(pageForAuthentication);
    const page = (await browser.pages())[0];
    // for linkedin authentication
    await page.setCookie(...JSON.parse(fs.readFileSync("./linkedin-cookies.json").toString()));
    await page.$eval("._vertical-scroll-results_1igybl", (el) => (el.scrollTop = el.scrollHeight));
    await page.$$eval("ol .artdeco-list__item", (list) => {
        list[list.length - 1].scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    });
    await page.focus("._vertical-scroll-results_1igybl");
    await (0, puppeteer_autoscroll_down_1.scrollPageToBottom)(page, {
        size: 50,
        delay: 300,
    });
    const wait = async (item) => {
        console.log(item);
    };
    await page.exposeFunction("wait", wait);
    await page.$$eval("ol .artdeco-list__item", (list, page) => {
        console.log("list", list);
        const unlockedProfiles = list.forEach(async (item) => {
            item.scrollIntoView({ block: "end", behavior: "smooth" });
            await page.waitForFunction("item.querySelector('.mt4 ul')?.textContent?.trim()==='Save' || item.querySelector('.mt4 ul')?.textContent?.trim().toLowerCase()==='view profile'", {}, item);
            console.log("content -> ", item.querySelector(".mt4 ul")?.textContent?.trim());
        });
        console.log("unlockedProfiles", unlockedProfiles);
        // const links = unlockedProfiles.map((item) => item.querySelector("a")?.href);
        // console.log(`got ${links.length} unlocked profiles at first page`);
        // return links;
    }, page);
    const urls = [];
    const list = await page.$$("ol .artdeco-list__item");
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        await item.hover(); // this will scroll the element into view
        await page.waitForSelector(".mt4 ul", { timeout: 5000 }).catch((e) => {
            (0, errorHandling_1.handleError)(e);
        });
        const content = await item.$eval(".mt4 ul", (el) => el.textContent?.trim());
        if (content === "Save") {
            const profileLink = await item.$eval(".mt4 ul", (el) => el.querySelector("a")?.href);
            console.log(profileLink);
            if (profileLink) {
                urls.push(profileLink);
            }
        }
    }
    console.log(urls);
    //   list.forEach(async (item) => {});
    //   console.log(links.length);
    //   console.log(`got ${links.length} unlocked profiles at first page`);
    //   let result: Output[] = [];
    //   for (const url of urls) {
    //     const output = await scrapeProfile(page, query, url);
    //     result.push(...output);
    //   }
    //   const csv = new ObjectsToCsv(result);
    //   await csv.toDisk("./profiles-2.csv");
    //   fs.writeFileSync("./profiles-2.json", JSON.stringify(result));
    //   await browser.close();
}
