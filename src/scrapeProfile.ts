import puppeteer from "puppeteer";
import { handleError } from "./errorHandling";
import { Output } from "./types";

export async function scrapeProfile(
  page: puppeteer.Page,
  query: string,
  url: string
) {
  let result: Output[];
  await page.goto(url, { timeout: 0 }).catch((e) => {
    handleError(e);
  });
  const profileUrl = page.url();
  const profileName =
    (await page.$eval("h1", (el) => el.textContent?.trim())) || "";
  console.log(`scraping ${profileName}'s profile `);
  let cases = 1;
  try {
    // case where items are more in job history
    await page.waitForSelector(
      "section #experience + div + div .pvs-list__footer-wrapper",
      { timeout: 2000 }
    );
    await page.click(
      "section #experience + div + div .pvs-list__footer-wrapper a"
    );
    await page.waitForSelector(
      "section .pvs-list__container .artdeco-list__item",
      { timeout: 2000 }
    );
    cases = 2;
  } catch {
    cases = 1;
  }
  if (cases === 1) {
    const selector = "section #experience + div + div .artdeco-list__item";
    result = await getData(page, selector, cases, query);
  } else if (cases === 2) {
    const selector = "section .pvs-list__container .artdeco-list__item";
    result = await getData(page, selector, cases, query);
  } else {
    result = [];
    console.log("no job history");
  }
  return result.map((item) => {
    item.profileName = profileName;
    item.profileUrl = profileUrl;
    return item;
  });
}

async function getData(
  page: puppeteer.Page,
  selector: string,
  cases: number,
  query: string
) {
  const data = await page.$$eval(
    selector,
    (list, query, cases) => {
      const data: Element[] = list.filter((el) => {
        const text = el.textContent?.trim().toLowerCase();
        return text?.includes(query.toLowerCase());
      });
      return data.map((item) => {
        let jobTitle: string, companyName: string;
        const companyLink = item.querySelector("a")?.href || "";
        let items: Element[] = [];
        if (cases === 2) {
          items = Array.from(
            item.querySelectorAll(".pvs-list__paged-list-item")
          );
        } else if (cases === 1) {
          const itemNodes = item
            .querySelector("ul")
            ?.querySelectorAll(":scope > li");
          if (itemNodes) {
            items = Array.from(itemNodes);
          }
        }
        if (items.length > 1) {
          console.log(items);
          console.log("in if block");
          // case 1
          const filteredItems = items.filter((job) =>
            job.textContent?.trim().toLowerCase().includes(query.toLowerCase())
          );
          jobTitle =
            filteredItems[filteredItems.length - 1]
              .querySelector(".mr1 span")
              ?.textContent?.trim() || "";
          companyName =
            item.querySelector(".mr1 span")?.textContent?.trim() || "";
        } else {
          // case 2
          console.log("in else block");
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
    },
    query,
    cases
  );
  return data;
}
