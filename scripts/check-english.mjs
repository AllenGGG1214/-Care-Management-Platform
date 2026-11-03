import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Scan versioned project content, including hidden files, docs and lockfiles.
// Dependency directories, build output and Git history are outside this check.
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0").filter(Boolean);
const matches = [];
for (const file of files) {
  const bytes = readFileSync(file);
  if (bytes.includes(0)) continue;
  const text = bytes.toString("utf8").replace(
    /\\u\{([\da-f]+)\}|\\u([\da-f]{4})/gi,
    (_, braced, plain) => String.fromCodePoint(parseInt(braced || plain, 16)),
  );
  if (/\p{Script=Han}/u.test(file) || /\p{Script=Han}/u.test(text)) matches.push(file);
}
if (matches.length) {
  console.error("Chinese text found in:\n" + matches.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`English-content audit passed: ${files.length} tracked files contain no Chinese text.`);
}
