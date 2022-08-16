"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.args = void 0;
const ts_command_line_args_1 = require("ts-command-line-args");
// sometimes cli auto escape the quotes, so we need to unescape them
function parseString(str) {
    return str?.replace(/\\/g, "");
}
exports.args = (0, ts_command_line_args_1.parse)({
    session_id: String,
    sesssion_id_profiles: String,
    search_keyword: String,
    input: { type: String, optional: true },
    output: { type: String, optional: true },
    saved_search: { type: parseString, optional: true },
});
