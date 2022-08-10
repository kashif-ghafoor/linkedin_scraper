import { parse } from "ts-command-line-args";
import { IArguments } from "./types";

// sometimes cli auto escape the quotes, so we need to unescape them
function parseString(str: string | undefined) {
  return str?.replace(/\\/g, "");
}

export const args = parse<IArguments>({
  session_id: { type: String },
  search_keyword: String,
  input: { type: String, optional: true },
  output: { type: String, optional: true },
  saved_search: { type: parseString, optional: true },
});
