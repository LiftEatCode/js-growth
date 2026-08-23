import { resolve as pathResolve } from "node:path";
import { pathToFileURL } from "node:url";

const shimUrl = pathToFileURL(
  pathResolve(process.cwd(), "tests/commercial/shims/server-only.js"),
).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      shortCircuit: true,
      url: shimUrl,
      format: "module",
    };
  }
  return nextResolve(specifier, context);
}
