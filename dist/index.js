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
const fingerprint_generator_1 = require("fingerprint-generator");
const fingerprint_injector_1 = require("fingerprint-injector");
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const fs = __importStar(require("fs"));
const objects_to_csv_1 = __importDefault(require("objects-to-csv"));
const scrapeProfile_1 = require("./scrapeProfile");
const errorHandling_1 = require("./errorHandling");
const args_parser_1 = require("./args-parser");
const perf_hooks_1 = require("perf_hooks");
async function main() {
    // taking arguments from command line
    const keyword = args_parser_1.args.search_keyword;
    const searchUrl = args_parser_1.args.saved_search;
    const input = args_parser_1.args.input;
    const output = args_parser_1.args.output;
    let outputPath = "./profiles.csv";
    if (output)
        outputPath = output;
    // arguments for puppeteer
    const puppeteerArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--proxy-server='direct://",
        "--proxy-bypass-list=*",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-features=site-per-process",
        "--enable-features=NetworkService",
        "--allow-running-insecure-content",
        "--enable-automation",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-web-security",
        "--autoplay-policy=user-gesture-required",
        "--disable-background-networking",
        "--disable-breakpad",
        "--disable-client-side-phishing-detection",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-domain-reliability",
        "--disable-extensions",
        "--disable-features=AudioServiceOutOfProcess",
        "--disable-hang-monitor",
        "--disable-ipc-flooding-protection",
        "--disable-notifications",
        "--disable-offer-store-unmasked-wallet-cards",
        "--disable-popup-blocking",
        "--disable-print-preview",
        "--disable-prompt-on-repost",
        "--disable-speech-api",
        "--disable-sync",
        "--disk-cache-size=33554432",
        "--hide-scrollbars",
        "--ignore-gpu-blacklist",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-default-browser-check",
        "--no-first-run",
        "--no-pings",
        "--no-zygote",
        "--password-store=basic",
        "--use-gl=swiftshader",
        "--use-mock-keychain",
        "--window-size=1920,1080",
    ];
    // adding stealth plugin to puppeteer
    puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
    const browser = await puppeteer_extra_1.default.launch({
        args: puppeteerArgs,
        defaultViewport: null,
        headless: true,
    });
    // const pageForAuthentication = (await browser.pages())[0];
    // for first time authentication only
    // await pageForAuthentication.goto("https://www.linkedin.com/login");
    // await authenticate(pageForAuthentication);
    if (input) {
        if (!fs.existsSync(input)) {
            console.error(`${input} File not found`);
            await browser.close();
            return;
        }
        const profilesData = await scrapeFromFile(browser, input, keyword);
        const csv = new objects_to_csv_1.default(profilesData);
        await csv.toDisk(outputPath);
        await browser.close();
        return;
    }
    if (!searchUrl) {
        console.error(`No input or search url provided`);
        await browser.close();
        return;
    }
    console.log("scraping profiles from sales navigator...");
    const profilesData = await scrapeFromSalesNavigator(browser, searchUrl, keyword, outputPath);
    const csv = new objects_to_csv_1.default(profilesData);
    await csv.toDisk(outputPath);
    await browser.close();
    return;
}
async function scrapeFromFile(browser, input, keyword) {
    const page = await browser.newPage();
    // for linkedin authentication
    await page.setCookie({
        name: "li_at",
        value: args_parser_1.args.session_id,
        domain: "www.linkedin.com",
        path: "/",
    });
    console.log(`getting links from ${input}`);
    const links = fs.readFileSync(input).toString().split("\n");
    console.log(`${links.length} links found in ${input}`);
    return await scrapeProfiles(page, links, keyword);
}
async function scrapeFromSalesNavigator(browser, searchUrl, keyword, outputPath) {
    let continueScraping = true;
    let counter = 1;
    let profilesData = [];
    let profilesCounter = 1;
    // creating page
    const page = await browser.newPage();
    while (continueScraping) {
        await page.setCookie({
            name: "li_at",
            value: args_parser_1.args.session_id,
            domain: "www.linkedin.com",
            path: "/",
        });
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
        if (counter === 1) {
            console.log("getting # of available results");
            await page
                .waitForSelector(".ml3.pl3._display-count-spacing_1igybl")
                .catch((e) => {
                (0, errorHandling_1.handleError)(e);
            });
            const results = await page.evaluate(() => {
                return document
                    .querySelector(".ml3.pl3._display-count-spacing_1igybl span")
                    ?.textContent?.trim();
            });
            console.log(`${results} found`);
        }
        console.log("getting profiles from sales navigator");
        continueScraping = await isToContinueScrapping(page);
        const profileLinks = await getLinks(page);
        console.log(`${profileLinks.length} profiles found on page ${counter}`);
        const fingerprintInjector = new fingerprint_injector_1.FingerprintInjector();
        const fingerprintGenerator = new fingerprint_generator_1.FingerprintGenerator({
            devices: ["desktop"],
            browsers: [{ name: "chrome", minVersion: 88 }],
        });
        const fingerprint = fingerprintGenerator.getFingerprint();
        const pageForProfiles = await browser.newPage();
        await pageForProfiles.setCookie({
            name: "li_at",
            value: args_parser_1.args.sesssion_id_profiles,
            domain: "www.linkedin.com",
            path: "/",
        });
        await fingerprintInjector.attachFingerprintToPuppeteer(page, fingerprint);
        const result = [];
        for (let i = 0; i < profileLinks.length; i++) {
            const startTime = perf_hooks_1.performance.now();
            console.log(`processing ${profilesCounter}: ${profileLinks[i]}`);
            const data = await (0, scrapeProfile_1.scrapeProfile)(pageForProfiles, keyword, profileLinks[i]).catch((e) => {
                (0, errorHandling_1.handleError)(e);
                return [];
            });
            const endTime = perf_hooks_1.performance.now();
            console.log(`${profilesCounter} took ${(endTime - startTime) / 1000}s`);
            if (!data?.length)
                console.log(`Skipping: Not Found ${keyword} in job history\n`);
            else
                console.log(`Success: Found ${keyword} ${data.length} times in job history\n`);
            result.push(...data);
            profilesCounter++;
        }
        await pageForProfiles.close();
        profilesData.push(...result);
        const csv = new objects_to_csv_1.default(profilesData);
        await csv
            .toDisk(outputPath)
            .catch((e) => {
            (0, errorHandling_1.handleError)(e, `could not write to file ${outputPath}`);
        })
            .then(() => {
            console.log(`saved ${profilesData.length} profiles to ${outputPath}`);
        });
        counter++;
    }
    await page.close();
    return profilesData;
}
async function isToContinueScrapping(page) {
    return await page.evaluate(() => {
        const elements = document.documentElement.innerHTML;
        if (elements.includes("No leads matched your search")) {
            return false;
        }
        return true;
    });
}
async function scrapeProfiles(page, links, keyword) {
    const result = [];
    for (let i = 0; i < links.length; i++) {
        console.log(`processing ${i + 1}: ${links[i]}`);
        const data = await (0, scrapeProfile_1.scrapeProfile)(page, keyword, links[i]);
        if (!data.length)
            console.log(`Skipping: Not Found ${keyword} in job history\n`);
        else
            console.log(`Success: Found ${keyword} ${data.length} times in job history\n`);
        result.push(...data);
    }
    return result;
}
async function getLinks(page) {
    return await page.evaluate(() => {
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
