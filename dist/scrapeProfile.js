"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeProfile = void 0;
const errorHandling_1 = require("./errorHandling");
function scrapeProfile(page, query, url) {
    return __awaiter(this, void 0, void 0, function* () {
        let result;
        yield page.goto(url, { timeout: 0 }).catch((e) => {
            (0, errorHandling_1.handleError)(e);
        });
        const profileUrl = page.url();
        const profileName = (yield page.$eval("h1", (el) => { var _a; return (_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim(); })) || "";
        console.log(`scraping ${profileName}'s profile `);
        let cases = 1;
        try {
            // case where items are more in job history
            yield page.waitForSelector("section #experience + div + div .pvs-list__footer-wrapper", { timeout: 2000 });
            yield page.click("section #experience + div + div .pvs-list__footer-wrapper a");
            yield page.waitForSelector("section .pvs-list__container .artdeco-list__item", { timeout: 2000 });
            cases = 2;
        }
        catch (_a) {
            cases = 1;
        }
        if (cases === 1) {
            const selector = "section #experience + div + div .artdeco-list__item";
            result = yield getData(page, selector, cases, query);
        }
        else if (cases === 2) {
            const selector = "section .pvs-list__container .artdeco-list__item";
            result = yield getData(page, selector, cases, query);
        }
        else {
            result = [];
            console.log("no job history");
        }
        return result.map((item) => {
            item.profileName = profileName;
            item.profileUrl = profileUrl;
            return item;
        });
    });
}
exports.scrapeProfile = scrapeProfile;
function getData(page, selector, cases, query) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield page.$$eval(selector, (list, query, cases) => {
            const data = list.filter((el) => {
                var _a;
                const text = (_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
                return text === null || text === void 0 ? void 0 : text.includes(query.toLowerCase());
            });
            return data.map((item) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                let jobTitle, companyName;
                const companyLink = ((_a = item.querySelector("a")) === null || _a === void 0 ? void 0 : _a.href) || "";
                let items = [];
                if (cases === 2) {
                    items = Array.from(item.querySelectorAll(".pvs-list__paged-list-item"));
                }
                else if (cases === 1) {
                    const itemNodes = (_b = item
                        .querySelector("ul")) === null || _b === void 0 ? void 0 : _b.querySelectorAll(":scope > li");
                    if (itemNodes) {
                        items = Array.from(itemNodes);
                    }
                }
                if (items.length > 1) {
                    console.log(items);
                    console.log("in if block");
                    // case 1
                    const filteredItems = items.filter((job) => { var _a; return (_a = job.textContent) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase().includes(query.toLowerCase()); });
                    jobTitle =
                        ((_d = (_c = filteredItems[filteredItems.length - 1]
                            .querySelector(".mr1 span")) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || "";
                    companyName =
                        ((_f = (_e = item.querySelector(".mr1 span")) === null || _e === void 0 ? void 0 : _e.textContent) === null || _f === void 0 ? void 0 : _f.trim()) || "";
                }
                else {
                    // case 2
                    console.log("in else block");
                    jobTitle = ((_g = item.querySelector(".mr1 span")) === null || _g === void 0 ? void 0 : _g.textContent) || "";
                    companyName =
                        ((_j = (_h = item
                            .querySelector(".t-14 span")) === null || _h === void 0 ? void 0 : _h.textContent) === null || _j === void 0 ? void 0 : _j.split("·")[0].trim()) || "";
                }
                return {
                    jobTitle,
                    companyName,
                    companyLink,
                };
            });
        }, query, cases);
        return data;
    });
}
