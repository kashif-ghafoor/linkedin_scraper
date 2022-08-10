import { errors } from "puppeteer";

export function handleError(err: unknown, message?: string) {
  if (err instanceof errors.TimeoutError) {
    console.log(message || "Timeout error", err.message);
  } else if (err instanceof Error) {
    console.log(err.message);
  } else {
    console.log(err);
  }
}
