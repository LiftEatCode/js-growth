import Module from "node:module";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const shimPath = resolve(process.cwd(), "tests/commercial/shims/server-only.cjs");

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "server-only") {
    return require(shimPath);
  }
  return originalLoad.call(this, request, parent, isMain);
};

import { register } from "node:module";

register(
  pathToFileURL(
    resolve(process.cwd(), "tests/commercial/shims/tsx-hooks.mjs"),
  ).href,
);
