"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs = __importStar(require("fs"));
const objects_to_csv_1 = __importDefault(require("objects-to-csv"));
const scrapeProfile_1 = require("./scrapeProfile");
const errorHandling_1 = require("./errorHandling");
const args_parser_1 = require("./args-parser");
async function main() {
    const keyword = args_parser_1.args.search_keyword;
    const searchUrl = args_parser_1.args.saved_search;
    const input = args_parser_1.args.input;
    const output = args_parser_1.args.output;
    const browser = await puppeteer_1.default.launch({
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
        value: args_parser_1.args.session_id,
        domain: "www.linkedin.com",
        path: "/",
    });
    // normally when browser is open for long time, it will be stop working
    // after some time and become inactive due to OS settings.
    // next three lines of code will make sure that browser is always open and active
    // const session = await page.target().createCDPSession();
    // await session.send("Page.enable");
    // await session.send("Page.setWebLifecycleState", { state: "active" });
    const result = [];
    let links = [];
    if (input) {
        if (!fs.existsSync(input)) {
            console.error(`${input} File not found`);
            await browser.close();
            return;
        }
        else {
            console.log(`getting links from ${input}`);
            links = fs.readFileSync(input).toString().split("\n");
            console.log(`${links.length} links found in ${input}`);
        }
    }
    else {
        if (searchUrl) {
            console.log("scraping links from sales navigator");
            links = await extractLinksFromSalesNavigator(page, searchUrl);
            console.log(`saved search has ${links.length} profiles`);
        }
        else {
            console.error(`you have to provide either saved_search or input argument`);
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
            value: args_parser_1.args.session_id,
            domain: "www.linkedin.com",
            path: "/",
        });
        const data = await (0, scrapeProfile_1.scrapeProfile)(newPage, keyword, links[i]);
        await newPage.close();
        if (!data.length)
            console.log(`Skipping. Not Found ${keyword} in job history\n`);
        else
            console.log(`Success Found ${keyword} ${data.length} times in job history\n`);
        result.push(...data);
    }
    // save to json file
    fs.writeFileSync("./profiles.json", JSON.stringify(result));
    let outputPath = "./profiles.csv";
    if (output)
        outputPath = output;
    // save to csv file
    const csv = new objects_to_csv_1.default(result);
    await csv.toDisk(outputPath);
    await browser.close();
}
async function authenticate(page) {
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
async function extractLinksFromSalesNavigator(page, searchUrl) {
    let continueScraping = true;
    let counter = 1;
    let totalLinks = [];
    while (continueScraping) {
        const resourceUrl = `${searchUrl}&page=${counter}`;
        await page.goto(resourceUrl, { timeout: 0 }).catch((e) => {
            (0, errorHandling_1.handleError)(e);
        });
        await new Promise(function (resolve) {
            setTimeout(resolve, 5000);
        });
        await page.setViewport({
            width: 1200,
            height: 10000,
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
            const elements = document.querySelectorAll(".artdeco-entity-lockup__title.ember-view");
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
        totalLinks.push(...profileLinks);
        counter++;
    }
    return totalLinks;
}
