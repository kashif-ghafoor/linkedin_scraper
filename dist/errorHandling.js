"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = void 0;
const puppeteer_1 = require("puppeteer");
function handleError(err, message) {
    if (err instanceof puppeteer_1.errors.TimeoutError) {
        console.log(message || "Timeout error", err.message);
    }
    else if (err instanceof Error) {
        console.log(err.message);
    }
    else {
        console.log(err);
    }
}
exports.handleError = handleError;
