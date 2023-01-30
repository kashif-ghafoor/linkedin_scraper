import { errors } from "puppeteer";

export function handleError(err: unknown, message?: string) {
  if (err instanceof errors.TimeoutError) {
    console.log(message || "Timeout error", err.message);
  } else if (err instanceof Error) {
    if (err.message === "net::ERR_TOO_MANY_REDIRECTS") {
      console.log(`Bot detected, existing script`);
      throw new Error("Bot detected, existing script");
    }
    console.log(err.name, err.message);
  } else {
    console.log(err);
  }
}
