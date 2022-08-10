"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeProfile = void 0;
const errorHandling_1 = require("./errorHandling");
async function scrapeProfile(page, query, url) {
    let result;
    await page.goto(url, { timeout: 0 }).catch((e) => {
        (0, errorHandling_1.handleError)(e);
    });
    const profileUrl = page.url();
    const profileName = await page
        .$eval("h1", (el) => el.textContent?.trim() || "")
        .catch((e) => {
        (0, errorHandling_1.handleError)(e);
        return "";
    });
    let cases = 1;
    try {
        // case where items are more in job history
        await page.waitForSelector("section #experience + div + div .pvs-list__footer-wrapper", { timeout: 2000 });
        await page.click("section #experience + div + div .pvs-list__footer-wrapper a");
        await page
            .waitForSelector("section .pvs-list__container .artdeco-list__item", {
            timeout: 2000,
        })
            .catch((e) => {
            (0, errorHandling_1.handleError)(e, "on experience page couldn't find element");
        });
        cases = 2;
    }
    catch {
        cases = 1;
    }
    if (cases === 1) {
        const selector = "section #experience + div + div .artdeco-list__item";
        try {
            await page.waitForSelector(selector, { timeout: 2000 });
        }
        catch (err) {
            (0, errorHandling_1.handleError)(err, "in case-1 couldn't find selectors");
            return [];
        }
        result = await getData(page, selector, cases, query);
    }
    else if (cases === 2) {
        const selector = "section .pvs-list__container .artdeco-list__item";
        result = await getData(page, selector, cases, query);
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
}
exports.scrapeProfile = scrapeProfile;
async function getData(page, selector, cases, query) {
    const data = await page.$$eval(selector, (list, query, cases) => {
        const data = list.filter((el) => {
            const text = el.textContent?.trim().toLowerCase();
            return text?.includes(query.toLowerCase());
        });
        return data.map((item) => {
            let jobTitle, companyName;
            const companyLink = item.querySelector("a")?.href || "";
            let items = [];
            if (cases === 2) {
                items = Array.from(item.querySelectorAll(".pvs-list__paged-list-item"));
            }
            else if (cases === 1) {
                const itemNodes = item
                    .querySelector("ul")
                    ?.querySelectorAll(":scope > li");
                if (itemNodes) {
                    items = Array.from(itemNodes);
                }
            }
            if (items.length > 1) {
                // case 1
                const filteredItems = items.filter((job) => job.textContent?.trim().toLowerCase().includes(query.toLowerCase()));
                // adding logic for exceptional case.
                const filteredItem = filteredItems[filteredItems.length - 1];
                if (filteredItem.querySelector(":scope > span")) {
                    // selectect element that have jobTitle contains span child.
                    jobTitle =
                        filteredItem.querySelector(".mr1 span")?.textContent?.trim() ||
                            "";
                    companyName =
                        item.querySelector(".mr1 span")?.textContent?.trim() || "";
                }
                else {
                    // handling the case found in this url https://www.linkedin.com/in/ACwAAAKAu3EBynCDNtwKmuwr6l6QXtDYgQW87dA
                    // where selected element don't have job title and company name.
                    // this type of element don't have span in direct child.
                    jobTitle = item.querySelector(".mr1 span")?.textContent || "";
                    companyName =
                        item
                            .querySelector(".t-14 span")
                            ?.textContent?.split("·")[0]
                            .trim() || "";
                }
            }
            else {
                // case 2
                jobTitle = item.querySelector(".mr1 span")?.textContent || "";
                companyName =
                    item
                        .querySelector(".t-14 span")
                        ?.textContent?.split("·")[0]
                        .trim() || "";
            }
            return {
                jobTitle,
                companyName,
                companyLink,
            };
        });
    }, query, cases);
    return data;
}
