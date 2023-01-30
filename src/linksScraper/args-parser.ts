import { parse } from "ts-command-line-args";
import { IArguments } from "./types";

export const args = parse<IArguments>({
  session_id: String,
});
