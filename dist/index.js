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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs = __importStar(require("fs"));
const objects_to_csv_1 = __importDefault(require("objects-to-csv"));
const scrapeProfile_1 = require("./scrapeProfile");
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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch({
            devtools: true,
            headless: true,
        });
        // const pageForAuthentication = (await browser.pages())[0];
        // for first time authentication only
        // await pageForAuthentication.goto("https://www.linkedin.com/login");
        // await authenticate(pageForAuthentication);
        const page = (yield browser.pages())[0];
        // for linkedin authentication
        yield page.setCookie(...JSON.parse(fs.readFileSync("./linkedin-cookies.json").toString()));
        let result = [];
        for (const url of urls) {
            const output = yield (0, scrapeProfile_1.scrapeProfile)(page, query, url);
            result.push(...output);
        }
        const csv = new objects_to_csv_1.default(result);
        yield csv.toDisk("./profiles-2.csv");
        fs.writeFileSync("./profiles-2.json", JSON.stringify(result));
        yield browser.close();
    });
}
// const csv = new ObjectsToCsv(finalResult);
//   await csv.toDisk("./profiles.csv");
//   await browser.close();
function authenticate(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.waitForSelector(".login__form");
        yield page.type("#username", "contact@railflow.io", { delay: 100 });
        yield page.type("#password", "Goliath1!", { delay: 100 });
        yield Promise.all([
            yield page.click(".login__form_action_container button"),
            yield page.waitForNavigation(),
        ]);
        // this wait is for you to grab the code from email and enter it in the input
        yield page.waitForTimeout(120000);
        yield page.cookies().then((cookies) => {
            console.log(cookies);
            fs.writeFileSync("./linkedin-cookies.json", JSON.stringify(cookies));
        });
    });
}
main();
