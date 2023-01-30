import puppeteer from "puppeteer";

/**
 * @description change user agent of page
 * @param page puppeteer page
 */

// export async function changeUserAgent(page: puppeteer.Page) {
//   // fake user agent string
//   // const fakeUserAgent =
//   //   "Mozilla/5.0 (Windows NT 10.0; Win64; WOW64; Trident/7.0; rv:11.0) like Gecko";
//   const fakeUserAgent =
//     "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36";
//   /**
//    * if we just change the user agent string, server can detect bot by opening a new window
//    * and checking the user agent string of the new window
//    * so we need to change the user agent string of the new window too
//    *
//    * below script change the user agent string of the new window
//    */
//   await page.evaluateOnNewDocument((fakeUserAgent) => {
//     let open = window.open;
//     window.open = (...args) => {
//       let newPage = open(...args);
//       Object.defineProperty(newPage?.navigator, "userAgent", {
//         get: () => fakeUserAgent,
//       });
//       return newPage;
//     };
//     window.open.toString = () => "function open() { [native code] }";
//     // Object.defineProperty(Navigator.prototype, "webdriver", {
//     //   get: () => undefined,
//     // });
//     const proto = Navigator.prototype;

//     Object.defineProperty(proto, "webdriver", {
//       get: () => false,
//     });

//     // deleting web driver
//     // Object.defineProperty(proto, "webdriver", {
//     //   configurable: true, // defaults to false
//     //   writable: false,
//     //   value: 1,
//     // });
//     // // @ts-ignore
//     // delete proto.webdriver;
//     // Object.defineProperty(navigator, "platform", {
//     //   get: () => "Win32",
//     // });
//   }, fakeUserAgent);

//   await page.setUserAgent(fakeUserAgent);
// }

export async function changeUserAgent(page: puppeteer.Page) {
  // fake user agent string
  /**
   * if we just change the user agent string, server can detect bot by opening a new window
   * and checking the user agent string of the new window
   * so we need to change the user agent string of the new window too
   *
   * below script change the user agent string of the new window
   */
  await page.evaluateOnNewDocument(() => {
    let open = window.open;
    const ua = navigator.userAgent.replace(/HeadlessChrome/, "Chrome");
    window.open = (...args) => {
      let newPage = open(...args);
      Object.defineProperty(newPage?.navigator, "userAgent", {
        get: () => ua,
      });
      return newPage;
    };
    window.open.toString = () => "function open() { [native code] }";
    // Object.defineProperty(Navigator.prototype, "webdriver", {
    //   get: () => undefined,
    // });

    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
    return ua;
    // deleting web driver
    // Object.defineProperty(proto, "webdriver", {
    //   configurable: true, // defaults to false
    //   writable: false,
    //   value: 1,
    // });
    // // @ts-ignore
    // delete proto.webdriver;
    // Object.defineProperty(navigator, "platform", {
    //   get: () => "Win32",
    // });
  });
  const ua = await page.evaluate(() => {
    return navigator.userAgent.replace(/HeadlessChrome/, "Chrome");
  });
  await page.setUserAgent(ua);
}
