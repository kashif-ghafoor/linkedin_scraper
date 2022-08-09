import { errors } from "puppeteer";

export function handleError(err: unknown) {
  if (err instanceof errors.TimeoutError) {
    console.log("TimeoutError", err.message);
  } else if (err instanceof Error) {
    console.log(err.message);
  } else {
    console.log(err);
  }
}
