import { handleError } from "../utils/errorHandling";
import { Output } from "./types";
import puppeteer from "puppeteer";

export async function scrapeProfile(
  page: puppeteer.Page,
  query: string,
  url: string
) {
  let result: Output[] = [];
  await page.goto(url, { timeout: 0 });
  await new Promise(function (resolve) {
    setTimeout(resolve, 30000);
  });
  const profileUrl = page.url();

  const profileName = await page.evaluate(() => {
    return document.querySelector("h1")?.innerText || "";
  });

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
    await page.waitForTimeout(2000);
    await page
      .waitForSelector("section .pvs-list__container .artdeco-list__item", {
        timeout: 2000,
      })
      .catch((e) => {
        handleError(e, "on experience page couldn't find element");
      });
    cases = 2;
  } catch {
    cases = 1;
  }
  let data: {
    jobTitle: string;
    companyName: string;
    companyLink: string;
  }[];
  if (cases === 1) {
    const selector = "section #experience + div + div .artdeco-list__item";
    try {
      await page.waitForSelector(selector, { timeout: 2000 });
    } catch (err) {
      handleError(err, "in case-1 couldn't find selector");
      return [];
    }
    data = await getData(page, selector, cases, query);
  } else if (cases === 2) {
    const selector = "section .pvs-list__container .artdeco-list__item";
    data = await getData(page, selector, cases, query);
  } else {
    data = [];
    console.log("no job history");
  }
  data.forEach((item) => {
    result.push({
      profileName,
      profileUrl,
      jobTitle: item.jobTitle,
      companyName: item.companyName,
      companyLink: item.companyLink,
    });
  });
  return result;
}

async function getData(
  page: puppeteer.Page,
  selector: string,
  cases: number,
  query: string
) {
  const data = await page.evaluate(
    (selector, query, cases) => {
      const list = Array.from(document.querySelectorAll(selector));
      const data = list.filter((el) => {
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
          // case 1
          const filteredItems = items.filter((job) =>
            job.textContent?.trim().toLowerCase().includes(query.toLowerCase())
          );

          // adding logic for exceptional case.
          if (!filteredItems.length) {
            // it means the keywork is in title.
            jobTitle = item.querySelector(".mr1 span")?.textContent || "";
            companyName =
              item
                .querySelector(".t-14 span")
                ?.textContent?.split("·")[0]
                .trim() || "";
            return {
              jobTitle,
              companyName,
              companyLink,
            };
          }
          const filteredItem = filteredItems[filteredItems.length - 1];
          if (filteredItem.querySelector(":scope > span")) {
            // select element that have jobTitle contains span child.
            jobTitle =
              filteredItem.querySelector(".mr1 span")?.textContent?.trim() ||
              "";
            companyName =
              item.querySelector(".mr1 span")?.textContent?.trim() || "";
          } else {
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
        } else {
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
    },
    selector,
    query,
    cases
  );

  return data;
}
