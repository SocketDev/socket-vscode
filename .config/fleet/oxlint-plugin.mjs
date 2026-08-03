import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/constants/runtime.js
var require_runtime = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	/**
	* @file Runtime environment detection constants. All checks use only
	*   `typeof`-safe global probes so this module is safe to import in browser,
	*   Node.js, Deno, Bun, and bundled contexts alike.
	*/
	/**
	* True when running inside a Node.js process. Detected via
	* `process.versions.node` — present in Node, absent in browsers and Deno/Bun
	* which expose a different `process.versions` shape (or no `process` at all).
	*/
	const IS_NODE = typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node === "string";
	/**
	* True when running in a browser context (window + document both defined).
	* Note: Chrome extensions have `window` in popup contexts but not in service
	* workers — check `IS_SERVICE_WORKER` for that case.
	*/
	const IS_BROWSER = typeof window !== "undefined" && typeof document !== "undefined";
	/**
	* True when running inside a Web Worker / Chrome MV3 service worker. `self` is
	* defined without `window` in worker contexts.
	*/
	const IS_WORKER = typeof self !== "undefined" && typeof window === "undefined" && typeof document === "undefined";
	exports.IS_BROWSER = IS_BROWSER;
	exports.IS_NODE = IS_NODE;
	exports.IS_WORKER = IS_WORKER;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/node/module.js
var require_module = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_constants_runtime = require_runtime();
	let module$1 = __require("module");
	/**
	* @file Accessors for `node:module` that work across runtimes. Ambient
	*   `require` is bound in CommonJS but unbound in ESM and inside
	*   ahead-of-time-compiled package modules (e.g. Perry), where reading it
	*   throws. And Perry's `require('module')` value omits `isBuiltin`. So instead
	*   of the ambient `require('module')` lazy-loader, `isBuiltin`/`createRequire`
	*   are imported as named values from the bare `module` specifier — which
	*   resolves on Node and Perry, and which browser bundlers can stub via
	*   resolve.fallback (a `node:` prefix would throw UnhandledSchemeError
	*   there).
	*   `require` is DIRECTORY-SPECIFIC: `createRequire(base)` resolves relative
	*   specifiers (`./x`, `../y`) from `base`'s directory. For builtins and bare
	*   packages that's irrelevant since they resolve the same anywhere, so the
	*   cached `getRequire` / `requireBuiltin` bind to THIS file. A RELATIVE
	*   specifier must resolve from the CALLER's directory, so use `requireFrom`
	*   with the caller's `import.meta.url` — binding such a load to this file
	*   would resolve it against `src/node/` instead. Bundled, every module
	*   collapses to one base and either works; unbundled (e.g. AOT-compiled from
	*   source), each module sits at its own nested path and the base matters.
	*/
	let cachedModule;
	let cachedRequire;
	/**
	* Bind a working `require`. Ambient `require` exists in CommonJS; in ESM and
	* ahead-of-time-compiled package modules it is unbound (reading it throws or
	* yields undefined), so fall back to `createRequire`. Returns undefined off
	* Node and in browsers, where neither is available.
	*
	* `fromUrl` sets the resolution base — pass a caller's `import.meta.url` to
	* resolve that caller's RELATIVE specifiers. When omitted, the base is this
	* file, which is correct only for builtins / bare packages (dir-independent).
	* With `fromUrl` the ambient `require` is skipped: it is bound to THIS file, so
	* it would resolve a relative specifier from the wrong directory.
	*/
	function bindRequire(fromUrl) {
		if (!require_constants_runtime.IS_NODE) return;
		if (!fromUrl && typeof __require === "function") return __require;
		if (typeof module$1.createRequire === "function") try {
			return (0, module$1.createRequire)(fromUrl ?? __require("url").pathToFileURL(__filename).href);
		} catch {
			return;
		}
	}
	/**
	* Returns `node:module` loaded through the bound `require`, or undefined off
	* Node. Cached across calls.
	*/
	function getNodeModule() {
		return cachedModule ??= requireBuiltin("module");
	}
	/**
	* Returns a working `require` bound to THIS file, binding one on first call
	* (see bindRequire). Cached across calls; undefined off Node / in browsers.
	*
	* For builtins and bare packages only — the resolution base is this file, so a
	* relative specifier would resolve from `src/node/`. Use `requireFrom` for
	* relative loads.
	*/
	function getRequire() {
		if (cachedRequire === void 0) cachedRequire = bindRequire();
		return cachedRequire;
	}
	/**
	* Is `name` a Node built-in module? Resolved from the statically-imported
	* `isBuiltin`, so it works on Node and on ahead-of-time-compiled binaries
	* (Perry), where ambient `require('module')` would lack `isBuiltin`. Returns
	* false in browsers, where the bare `module` import is stubbed away.
	*
	* Single source of truth for "is this a Node builtin?" probes across socket-lib
	* (used by the smol-binding loaders to gate their `node:smol-*` loads).
	*/
	function isNodeBuiltin(name) {
		if (!require_constants_runtime.IS_NODE || typeof module$1.isBuiltin !== "function") return false;
		return (0, module$1.isBuiltin)(name);
	}
	/**
	* Load a built-in module by *computed* specifier through the bound `require`
	* (see getRequire). The specifier is a parameter — never a literal at the call
	* site — so browser bundlers neither walk nor bundle it. Returns undefined
	* where no `require` can be bound.
	*
	* Builtins / bare packages only (dir-independent); for a relative specifier use
	* `requireFrom`. Used by `getNodeModule` for `node:module`, and by the
	* smol-binding loaders for the optional `node:smol-*` native bindings (gated
	* behind `isNodeBuiltin`, true only on socket-btm's smol Node binary).
	*/
	function requireBuiltin(specifier) {
		const req = getRequire();
		if (req) return req(specifier);
	}
	/**
	* Load a module by specifier from a CALLER-supplied base (its
	* `import.meta.url`). Use this for RELATIVE specifiers (`./x`, `../y`), whose
	* resolution depends on the caller's directory — `requireBuiltin` binds to this
	* file and would resolve them from `src/node/`. Not cached: the binding is
	* per-caller. Returns undefined where no `require` can be bound.
	*/
	function requireFrom(fromUrl, specifier) {
		const req = bindRequire(fromUrl);
		if (req) return req(specifier);
	}
	exports.bindRequire = bindRequire;
	exports.getNodeModule = getNodeModule;
	exports.getRequire = getRequire;
	exports.isNodeBuiltin = isNodeBuiltin;
	exports.requireBuiltin = requireBuiltin;
	exports.requireFrom = requireFrom;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/smol/detect.js
var require_detect = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_node_module = require_module();
	/**
	* @file Smol detection + lazy-loader for `node:smol-util`. Two
	*   responsibilities:
	*
	*   1. `isSmol()` — memoized boolean detector for socket-btm's smol Node binary.
	*      Mirrors `isSeaBinary()` from `src/sea.ts`. Probes via
	*      `node:module.isBuiltin('node:smol-util')` since only the smol binary
	*      registers any `node:smol-*` builtins.
	*   2. `getSmolUtil()` — lazy-loader for the `node:smol-util` binding, which
	*      provides native `uncurryThis` and `applyBind` (single V8 dispatch via
	*      `args.Data()` + `v8::Function::Call`, skipping the BoundFunction adapter
	*      + `Function.prototype.call` trampoline that the JS form
	*      `bind.bind(call)(fn)` hits twice per invocation). ~2x faster on hot
	*      uncurried-call sites. `getSmolUtil()` returns `undefined` on stock Node
	*      + non-Node runtimes. Result is cached across calls; the lazy-loader
	*      follows the same shape as `src/node/fs.ts` etc.
	*
	* @see https://github.com/SocketDev/socket-btm — socket-btm builds
	*   the smol binary that exposes the `node:smol-util` binding.
	*/
	/**
	* Cached smol-binary detection result.
	*/
	let isSmolCache;
	/**
	* Cached `node:smol-util` binding. `null` = probed and unavailable; `undefined`
	* = not yet probed. JS truthiness collapses both to "no binding" at the call
	* site.
	*/
	let smolUtilCache;
	let smolUtilProbed = false;
	/**
	* Returns `node:smol-util` when running on the smol Node binary, otherwise
	* `undefined`. Result is cached across calls.
	*/
	function getSmolUtil() {
		if (!smolUtilProbed) {
			smolUtilProbed = true;
			/* c8 ignore start - smol Node binary only. */
			if (require_node_module.isNodeBuiltin("node:smol-util")) smolUtilCache = require_node_module.requireBuiltin("node:smol-util");
		}
		return smolUtilCache;
	}
	/**
	* Detect if the current process is running on socket-btm's smol Node binary.
	* Memoized on first call.
	*
	* Defensive across runtimes: returns `false` on stock Node, browsers (no
	* `node:module`), Deno and Bun, whose module resolution differs, and worker
	* threads, each of which has its own builtin table.
	*
	* @example
	*   ;```ts
	*   import { isSmol } from '@socketsecurity/lib/smol/detect'
	*
	*   if (isSmol()) {
	*     // running on the smol binary; native fast paths available
	*   }
	*   ```
	*/
	function isSmol() {
		if (isSmolCache === void 0) isSmolCache = require_node_module.isNodeBuiltin("node:smol-util");
		return isSmolCache;
	}
	exports.getSmolUtil = getSmolUtil;
	exports.isSmol = isSmol;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/primordials/uncurry.js
var require_uncurry = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	/**
	* @file `uncurryThis` and the cluster of helpers built atop it. Mirrors
	*   Node.js's internal/per_context/primordials.js. Every other primordials leaf
	*   depends on `uncurryThis` to expose prototype-method primordials, so this
	*   file must be import-safe before any of them. Smol fast paths
	*   (`node:smol-util`) replace the JS forms when running on socket-btm's smol
	*   Node binary; stock Node and other runtimes fall back to the standard
	*   `bind.bind(call)` shape. **IMPORTANT**: do not destructure on `globalThis`
	*   or `Reflect` here. tsgo has a bug that mis-transpiles destructured exports.
	*   See: https://github.com/SocketDev/socket-packageurl-js/issues/3.
	*/
	const smolUtil = require_detect().getSmolUtil();
	const { apply, bind, call } = Function.prototype;
	const uncurryThis = smolUtil?.uncurryThis ?? bind.bind(call);
	const applyBind = smolUtil?.applyBind ?? bind.bind(apply);
	const applyBoundForSafe = applyBind;
	const applySafe = smolUtil?.applySafe ?? ((fn) => {
		const apply2 = applyBoundForSafe(fn);
		return (self, args) => {
			try {
				return apply2(self, args);
			} catch {
				return;
			}
		};
	});
	const bindCallFallback = ((fn, thisArg, ...presetArgs) => Function.prototype.bind.apply(fn, [thisArg, ...presetArgs]));
	const bindCall = smolUtil?.bindCall ?? bindCallFallback;
	const weakRefSafe = smolUtil?.weakRefSafe ?? ((target) => {
		try {
			return new WeakRef(target);
		} catch {
			return;
		}
	});
	exports.applyBind = applyBind;
	exports.applySafe = applySafe;
	exports.bindCall = bindCall;
	exports.uncurryThis = uncurryThis;
	exports.weakRefSafe = weakRefSafe;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/smol/primordial.js
var require_primordial = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_node_module = require_module();
	/**
	* @file Lazy-loader for socket-btm's `node:smol-primordial` binding.
	*   `node:smol-primordial` provides V8 Fast API typed implementations of Math.*
	*   and Number.is* primordials, registered with `CFunction::Make()` so TurboFan
	*   inlines them directly into JIT- compiled JS callers. Bypasses the
	*   FunctionCallbackInfo trampoline entirely — ~30-50% gain on hot loops where
	*   V8 doesn't already auto-inline. Returns `undefined` on stock Node +
	*   non-Node runtimes. Result is cached across calls.
	*
	* @internal — used by `src/primordials.ts` to resolve smol-aware
	*   Math.* / Number.is* fast paths. Most callers should use the
	*   standard `primordials` exports, which already route through this
	*   when smol is present.
	*
	* @see https://v8.dev/blog/v8-release-99 — V8 Fast API Calls overview
	*/
	let smolPrimordial;
	let smolPrimordialProbed = false;
	/**
	* Returns `node:smol-primordial` when running on the smol Node binary,
	* otherwise `undefined`. Result is cached across calls.
	*/
	function getSmolPrimordial() {
		if (!smolPrimordialProbed) {
			smolPrimordialProbed = true;
			/* c8 ignore start - smol Node binary only. */
			if (require_node_module.isNodeBuiltin("node:smol-primordial")) smolPrimordial = require_node_module.requireBuiltin("node:smol-primordial");
		}
		return smolPrimordial;
	}
	exports.getSmolPrimordial = getSmolPrimordial;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/primordials/string.js
var require_string = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_uncurry = require_uncurry();
	/**
	* @file Safe references to `String` static methods and prototype methods.
	*   `StringPrototypeCharCodeAt` prefers the smol Fast API binding for ASCII
	*   inputs, which reduces to a single byte load, and translates the `-1` Fast
	*   API sentinel back to `NaN` to preserve spec parity. Two-byte strings fall
	*   back to the uncurried `String.prototype.charCodeAt`.
	*
	*   ## Fast API surface — and why it's small
	*
	*   Mirrors the design rationale from socket-btm's `primordial_binding.cc`
	*   (lines 41-72). The smol Fast API exposes exactly one string op
	*   (`stringCharCodeAt`) because that's the one shape where the C++ trampoline
	*   genuinely beats V8's existing hot path: a single ASCII byte load, no
	*   encoding dispatch, no HandleScope, returns a primitive. String **searches**
	*   (`startsWith` / `endsWith` / `includes` / `indexOf` / `lastIndexOf`) are
	*   intentionally NOT exposed. V8's existing hot path dispatches on encoding
	*   and runs native SIMD memcmp — a Fast API binding would add overhead without
	*   winning. Same for `Map.has` / `Set.has` / `Array.includes`. Fast API also
	*   has a hard constraint: a fast-path function cannot return a new V8 object —
	*   only primitives, Local<Value/Object/Array>, or FastOneByteString. That
	*   rules out anything that produces a new string (`slice`, `substring`,
	*   `toUpperCase`, `concat`, `repeat`, `padStart`/`padEnd`, formatted-number)
	*   from ever being a Fast API win on the return path. Net: the current surface
	*   is approximately the ceiling. Adding more Fast API string ops without a
	*   flamegraph showing the cost is a regression risk, not a perf win. See
	*   `socket-btm/packages/node-smol-builder/additions/source-patched/`
	*   `src/socketsecurity/primordial/primordial_binding.cc:41-72` for the
	*   canonical design statement.
	*/
	const smolPrimordial = require_primordial().getSmolPrimordial();
	const StringCtor = String;
	const StringFromCharCode = String.fromCharCode;
	const StringFromCodePoint = String.fromCodePoint;
	const StringRaw = String.raw;
	const StringPrototypeAt = require_primordials_uncurry.uncurryThis(String.prototype.at);
	const StringPrototypeCharAt = require_primordials_uncurry.uncurryThis(String.prototype.charAt);
	const smolCharCodeAt = smolPrimordial?.stringCharCodeAt;
	/* c8 ignore start - smol Node fast path unreachable on stock Node test runner */
	const StringPrototypeCharCodeAt = smolCharCodeAt ? (s, i) => {
		const code = smolCharCodeAt(s, i);
		return code === -1 ? NaN : code;
	} : require_primordials_uncurry.uncurryThis(String.prototype.charCodeAt);
	/* c8 ignore stop */
	const StringPrototypeCodePointAt = require_primordials_uncurry.uncurryThis(String.prototype.codePointAt);
	const StringPrototypeConcat = require_primordials_uncurry.uncurryThis(String.prototype.concat);
	const StringPrototypeEndsWith = require_primordials_uncurry.uncurryThis(String.prototype.endsWith);
	const StringPrototypeIncludes = require_primordials_uncurry.uncurryThis(String.prototype.includes);
	const StringPrototypeIndexOf = require_primordials_uncurry.uncurryThis(String.prototype.indexOf);
	const StringPrototypeIsWellFormed = smolPrimordial?.stringIsWellFormed ?? require_primordials_uncurry.uncurryThis(String.prototype.isWellFormed);
	const StringPrototypeLastIndexOf = require_primordials_uncurry.uncurryThis(String.prototype.lastIndexOf);
	const StringPrototypeLocaleCompare = require_primordials_uncurry.uncurryThis(String.prototype.localeCompare);
	const StringPrototypeMatch = require_primordials_uncurry.uncurryThis(String.prototype.match);
	const StringPrototypeMatchAll = require_primordials_uncurry.uncurryThis(String.prototype.matchAll);
	const StringPrototypeNormalize = require_primordials_uncurry.uncurryThis(String.prototype.normalize);
	const StringPrototypePadEnd = require_primordials_uncurry.uncurryThis(String.prototype.padEnd);
	const StringPrototypePadStart = require_primordials_uncurry.uncurryThis(String.prototype.padStart);
	const StringPrototypeRepeat = require_primordials_uncurry.uncurryThis(String.prototype.repeat);
	const StringPrototypeReplace = require_primordials_uncurry.uncurryThis(String.prototype.replace);
	const StringPrototypeReplaceAll = require_primordials_uncurry.uncurryThis(String.prototype.replaceAll);
	const StringPrototypeSearch = require_primordials_uncurry.uncurryThis(String.prototype.search);
	const StringPrototypeSlice = require_primordials_uncurry.uncurryThis(String.prototype.slice);
	const StringPrototypeSplit = require_primordials_uncurry.uncurryThis(String.prototype.split);
	const StringPrototypeStartsWith = require_primordials_uncurry.uncurryThis(String.prototype.startsWith);
	const StringPrototypeSubstring = require_primordials_uncurry.uncurryThis(String.prototype.substring);
	const StringPrototypeToLocaleLowerCase = require_primordials_uncurry.uncurryThis(String.prototype.toLocaleLowerCase);
	const StringPrototypeToLocaleUpperCase = require_primordials_uncurry.uncurryThis(String.prototype.toLocaleUpperCase);
	const StringPrototypeToLowerCase = require_primordials_uncurry.uncurryThis(String.prototype.toLowerCase);
	const StringPrototypeToString = require_primordials_uncurry.uncurryThis(String.prototype.toString);
	const StringPrototypeToUpperCase = require_primordials_uncurry.uncurryThis(String.prototype.toUpperCase);
	const StringPrototypeToWellFormed = require_primordials_uncurry.uncurryThis(String.prototype.toWellFormed);
	const StringPrototypeTrim = require_primordials_uncurry.uncurryThis(String.prototype.trim);
	const StringPrototypeTrimEnd = require_primordials_uncurry.uncurryThis(String.prototype.trimEnd);
	const StringPrototypeTrimStart = require_primordials_uncurry.uncurryThis(String.prototype.trimStart);
	const StringPrototypeValueOf = require_primordials_uncurry.uncurryThis(String.prototype.valueOf);
	exports.StringCtor = StringCtor;
	exports.StringFromCharCode = StringFromCharCode;
	exports.StringFromCodePoint = StringFromCodePoint;
	exports.StringPrototypeAt = StringPrototypeAt;
	exports.StringPrototypeCharAt = StringPrototypeCharAt;
	exports.StringPrototypeCharCodeAt = StringPrototypeCharCodeAt;
	exports.StringPrototypeCodePointAt = StringPrototypeCodePointAt;
	exports.StringPrototypeConcat = StringPrototypeConcat;
	exports.StringPrototypeEndsWith = StringPrototypeEndsWith;
	exports.StringPrototypeIncludes = StringPrototypeIncludes;
	exports.StringPrototypeIndexOf = StringPrototypeIndexOf;
	exports.StringPrototypeIsWellFormed = StringPrototypeIsWellFormed;
	exports.StringPrototypeLastIndexOf = StringPrototypeLastIndexOf;
	exports.StringPrototypeLocaleCompare = StringPrototypeLocaleCompare;
	exports.StringPrototypeMatch = StringPrototypeMatch;
	exports.StringPrototypeMatchAll = StringPrototypeMatchAll;
	exports.StringPrototypeNormalize = StringPrototypeNormalize;
	exports.StringPrototypePadEnd = StringPrototypePadEnd;
	exports.StringPrototypePadStart = StringPrototypePadStart;
	exports.StringPrototypeRepeat = StringPrototypeRepeat;
	exports.StringPrototypeReplace = StringPrototypeReplace;
	exports.StringPrototypeReplaceAll = StringPrototypeReplaceAll;
	exports.StringPrototypeSearch = StringPrototypeSearch;
	exports.StringPrototypeSlice = StringPrototypeSlice;
	exports.StringPrototypeSplit = StringPrototypeSplit;
	exports.StringPrototypeStartsWith = StringPrototypeStartsWith;
	exports.StringPrototypeSubstring = StringPrototypeSubstring;
	exports.StringPrototypeToLocaleLowerCase = StringPrototypeToLocaleLowerCase;
	exports.StringPrototypeToLocaleUpperCase = StringPrototypeToLocaleUpperCase;
	exports.StringPrototypeToLowerCase = StringPrototypeToLowerCase;
	exports.StringPrototypeToString = StringPrototypeToString;
	exports.StringPrototypeToUpperCase = StringPrototypeToUpperCase;
	exports.StringPrototypeToWellFormed = StringPrototypeToWellFormed;
	exports.StringPrototypeTrim = StringPrototypeTrim;
	exports.StringPrototypeTrimEnd = StringPrototypeTrimEnd;
	exports.StringPrototypeTrimStart = StringPrototypeTrimStart;
	exports.StringPrototypeValueOf = StringPrototypeValueOf;
	exports.StringRaw = StringRaw;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/node/os.js
var require_os = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const nodeOs = require_runtime().IS_NODE ? /*@__PURE__*/ __require("os") : void 0;
	function getNodeOs() {
		return nodeOs;
	}
	const osArch = nodeOs?.arch;
	const osHomedir = nodeOs?.homedir;
	const osPlatform = nodeOs?.platform;
	const osTmpdir = nodeOs?.tmpdir;
	exports.getNodeOs = getNodeOs;
	exports.osArch = osArch;
	exports.osHomedir = osHomedir;
	exports.osPlatform = osPlatform;
	exports.osTmpdir = osTmpdir;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/constants/platform.js
var require_platform = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_node_os = require_os();
	let node_fs = __require("node:fs");
	/**
	* @file Platform detection and OS-specific constants.
	*/
	let memoizedArch;
	/**
	* Get the current CPU architecture (memoized), e.g. `x64`, `arm64`.
	*/
	function getArch() {
		if (memoizedArch === void 0) memoizedArch = require_node_os.getNodeOs().arch();
		return memoizedArch;
	}
	const MUSL_LINKERS = [
		"/lib/ld-musl-x86_64.so.1",
		"/lib/ld-musl-aarch64.so.1",
		"/usr/lib/ld-musl-x86_64.so.1",
		"/usr/lib/ld-musl-aarch64.so.1"
	];
	let memoizedLibc;
	let memoizedLibcProbed = false;
	/**
	* Get the host libc variant (memoized): `'musl'` on Alpine-and-similar,
	* `'glibc'` on other Linux, `undefined` off-Linux. Detected by probing for the
	* musl dynamic linker. The single source of truth for libc detection —
	* tool-specific resolvers (`getPythonArch`, `getJreArch`) call this rather than
	* re-probing.
	*/
	function getLibc() {
		if (!memoizedLibcProbed) {
			memoizedLibcProbed = true;
			/* c8 ignore start - Linux-only filesystem probe. */
			if (getOs() !== "linux") memoizedLibc = void 0;
			else {
				memoizedLibc = "glibc";
				for (let i = 0, { length } = MUSL_LINKERS; i < length; i += 1) if ((0, node_fs.existsSync)(MUSL_LINKERS[i])) {
					memoizedLibc = "musl";
					break;
				}
			}
		}
		return memoizedLibc;
	}
	let memoizedOs;
	/**
	* Get the current OS (memoized), e.g. `darwin`, `linux`, `win32` — the raw
	* `process.platform` value.
	*/
	function getOs() {
		if (memoizedOs === void 0) memoizedOs = require_node_os.getNodeOs().platform();
		return memoizedOs;
	}
	let memoizedTarget;
	/**
	* Get the current host **target** in the pnpm `pack-app` vocabulary (memoized):
	* `<os>-<arch>[-<libc>]`, e.g. `darwin-arm64`, `linux-x64`, `win32-x64`,
	* `linux-x64-musl`. Raw Node `process.platform`/`process.arch` joined with `-`,
	* plus a `-musl` suffix on Alpine. This is the Socket-wide naming for
	* non-python / non-JRE tools (matches pnpm's release assets,
	* `pnpm-<os>-<arch>[-<libc>].{tar.gz,zip}`). Tool-specific resolvers that need
	* a different vocabulary own their own helper — see `getPythonArch` for
	* python-build-standalone and `getJreArch` for Adoptium.
	*/
	function getTarget() {
		if (memoizedTarget === void 0) {
			const libcSuffix = getLibc() === "musl" ? "-musl" : "";
			memoizedTarget = `${getOs()}-${getArch()}${libcSuffix}`;
		}
		return memoizedTarget;
	}
	const DARWIN = getOs() === "darwin";
	const WIN32 = getOs() === "win32";
	/**
	* True when this process was launched as a Chrome or Chromium native
	* messaging host. Chrome passes the extension origin URL
	* (`chrome-extension://<id>/`) as `process.argv[2]`; no other invocation shape
	* produces that prefix.
	*/
	const NATIVE_MESSAGING_HOST = typeof process !== "undefined" && typeof process.argv[2] === "string" && process.argv[2].startsWith("chrome-extension://");
	const S_IXUSR = 64;
	const S_IXGRP = 8;
	const S_IXOTH = 1;
	exports.DARWIN = DARWIN;
	exports.NATIVE_MESSAGING_HOST = NATIVE_MESSAGING_HOST;
	exports.S_IXGRP = S_IXGRP;
	exports.S_IXOTH = S_IXOTH;
	exports.S_IXUSR = S_IXUSR;
	exports.WIN32 = WIN32;
	exports.getArch = getArch;
	exports.getLibc = getLibc;
	exports.getOs = getOs;
	exports.getTarget = getTarget;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/primordials/buffer.js
var require_buffer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_uncurry = require_uncurry();
	/**
	* @file Safe references to Node's `Buffer` global. `Buffer` is a Node-only
	*   global; in browsers and in Deno without a compatibility shim the captured
	*   references are `undefined`. Cross- env consumers must null-check before
	*   calling.
	*/
	const BufferCtor = globalThis.Buffer;
	const BufferAlloc = BufferCtor?.alloc;
	const BufferAllocUnsafe = BufferCtor?.allocUnsafe;
	const BufferAllocUnsafeSlow = BufferCtor?.allocUnsafeSlow;
	const BufferByteLength = BufferCtor?.byteLength;
	const BufferConcat = BufferCtor?.concat;
	const BufferFrom = BufferCtor?.from;
	const BufferIsBuffer = BufferCtor?.isBuffer;
	const BufferIsEncoding = BufferCtor?.isEncoding;
	/* c8 ignore start */
	const BufferPrototypeSlice = BufferCtor ? require_primordials_uncurry.uncurryThis(BufferCtor.prototype.slice) : void 0;
	const BufferPrototypeToString = BufferCtor ? require_primordials_uncurry.uncurryThis(BufferCtor.prototype.toString) : void 0;
	/* c8 ignore stop */
	exports.BufferAlloc = BufferAlloc;
	exports.BufferAllocUnsafe = BufferAllocUnsafe;
	exports.BufferAllocUnsafeSlow = BufferAllocUnsafeSlow;
	exports.BufferByteLength = BufferByteLength;
	exports.BufferConcat = BufferConcat;
	exports.BufferCtor = BufferCtor;
	exports.BufferFrom = BufferFrom;
	exports.BufferIsBuffer = BufferIsBuffer;
	exports.BufferIsEncoding = BufferIsEncoding;
	exports.BufferPrototypeSlice = BufferPrototypeSlice;
	exports.BufferPrototypeToString = BufferPrototypeToString;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/constants/encoding.js
var require_encoding = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	/**
	* @file Character encoding and character code constants. Exports the default
	*   UTF-8 encoding name and numeric char codes for common ASCII characters used
	*   by path and parsing utilities.
	*/
	const UTF8 = "utf8";
	const CHAR_BACKWARD_SLASH = 92;
	const CHAR_COLON = 58;
	const CHAR_FORWARD_SLASH = 47;
	const CHAR_LOWERCASE_A = 97;
	const CHAR_LOWERCASE_Z = 122;
	const CHAR_UPPERCASE_A = 65;
	const CHAR_UPPERCASE_Z = 90;
	exports.CHAR_BACKWARD_SLASH = CHAR_BACKWARD_SLASH;
	exports.CHAR_COLON = CHAR_COLON;
	exports.CHAR_FORWARD_SLASH = CHAR_FORWARD_SLASH;
	exports.CHAR_LOWERCASE_A = CHAR_LOWERCASE_A;
	exports.CHAR_LOWERCASE_Z = CHAR_LOWERCASE_Z;
	exports.CHAR_UPPERCASE_A = CHAR_UPPERCASE_A;
	exports.CHAR_UPPERCASE_Z = CHAR_UPPERCASE_Z;
	exports.UTF8 = UTF8;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/paths/_internal.js
var require__internal$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_buffer = require_buffer();
	const require_primordials_string = require_string();
	const require_constants_platform = require_platform();
	const require_constants_encoding = require_encoding();
	const msysDriveRegExp = /^\/([a-zA-Z])($|\/)/;
	const nodeModulesPathRegExp = /(?:[/\\]|^)node_modules(?:$|[/\\])/;
	const slashRegExp = /[/\\]/;
	let cachedUrl;
	/**
	* Lazily load the url module.
	*
	* Performs on-demand loading of Node.js url module to avoid initialization
	* overhead and potential Webpack bundling errors.
	*
	* @private
	*/
	function getUrl() {
		if (cachedUrl === void 0) cachedUrl = /*@__PURE__*/ __require("node:url");
		return cachedUrl;
	}
	/**
	* Find the next path separator at or after an index.
	*
	* Scans char codes for `/` (47) and `\` (92) — the same two characters
	* `slashRegExp` matches — and allocates nothing. Reaching the same answer
	* through `search` costs a substring, an options bag, and a regex match per
	* lookup, which a segment walk pays once per segment.
	*
	* @example
	*   ;```typescript
	*   indexOfPathSeparator('a/b', 0) // 1
	*   indexOfPathSeparator('a/b', 2) // -1
	*   indexOfPathSeparator('a\\b', 0) // 1
	*   ```
	*
	* @param {string} filepath - The path to scan.
	* @param {number} fromIndex - The index to start scanning at.
	*
	* @returns {number} The index of the first separator at or after `fromIndex`,
	*   or -1 when there is none.
	*/
	function indexOfPathSeparator(filepath, fromIndex) {
		const { length } = filepath;
		for (let i = fromIndex; i < length; i += 1) {
			const code = require_primordials_string.StringPrototypeCharCodeAt(filepath, i);
			if (code === 47 || code === 92) return i;
		}
		return -1;
	}
	/**
	* Convert a path-like value to a string.
	*
	* Converts various path-like types (string, Buffer, URL) into a normalized
	* string representation. Handles different input formats and provides
	* consistent string output for path operations.
	*
	* @example
	*   ;```typescript
	*   pathLikeToString('/home/user') // '/home/user'
	*   pathLikeToString(Buffer.from('/tmp/file')) // '/tmp/file'
	*   pathLikeToString(new URL('file:///home/user')) // '/home/user'
	*   pathLikeToString(null) // ''
	*   ```
	*
	* @param {string | Buffer | URL | null | undefined} pathLike - The value to
	*   convert.
	*
	* @returns {string} The string representation, or empty string for
	*   null/undefined.
	*/
	function pathLikeToString(pathLike) {
		if (pathLike === null || pathLike === void 0) return "";
		if (typeof pathLike === "string") return pathLike;
		if (require_primordials_buffer.BufferIsBuffer(pathLike)) return pathLike.toString("utf8");
		const url = getUrl();
		if (pathLike instanceof URL) try {
			return url.fileURLToPath(pathLike);
		} catch {
			const pathname = pathLike.pathname;
			const decodedPathname = decodeURIComponent(pathname);
			/* c8 ignore start - Windows-only URL drive-letter handling. */
			if (require_constants_platform.WIN32 && require_primordials_string.StringPrototypeStartsWith(decodedPathname, "/")) {
				const letter = require_primordials_string.StringPrototypeCharCodeAt(decodedPathname, 1) | 32;
				if (!(decodedPathname.length >= 3 && letter >= 97 && letter <= 122 && require_primordials_string.StringPrototypeCharAt(decodedPathname, 2) === ":")) return decodedPathname;
			}
			/* c8 ignore stop */
			return decodedPathname;
		}
		return String(pathLike);
	}
	exports.CHAR_BACKWARD_SLASH = require_constants_encoding.CHAR_BACKWARD_SLASH;
	exports.CHAR_COLON = require_constants_encoding.CHAR_COLON;
	exports.CHAR_FORWARD_SLASH = require_constants_encoding.CHAR_FORWARD_SLASH;
	exports.CHAR_LOWERCASE_A = require_constants_encoding.CHAR_LOWERCASE_A;
	exports.CHAR_LOWERCASE_Z = require_constants_encoding.CHAR_LOWERCASE_Z;
	exports.CHAR_UPPERCASE_A = require_constants_encoding.CHAR_UPPERCASE_A;
	exports.CHAR_UPPERCASE_Z = require_constants_encoding.CHAR_UPPERCASE_Z;
	exports.getUrl = getUrl;
	exports.indexOfPathSeparator = indexOfPathSeparator;
	exports.msysDriveRegExp = msysDriveRegExp;
	exports.nodeModulesPathRegExp = nodeModulesPathRegExp;
	exports.pathLikeToString = pathLikeToString;
	exports.slashRegExp = slashRegExp;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/paths/conversion.js
var require_conversion = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_string = require_string();
	const require_constants_platform = require_platform();
	const require_paths__internal = require__internal$1();
	const require_paths_normalize = require_normalize();
	/**
	* @file Path conversion utilities — MSYS↔native bridging and string-shape
	*   helpers. Split out of `paths/normalize.ts` for size hygiene.
	*
	*   - `fromUnixPath` / `toUnixPath` — MSYS↔native conversion
	*   - `splitPath` — segment-array view of a path
	*   - `trimLeadingDotSlash` — strip a single `./` / `.\` prefix
	*/
	/**
	* Convert Unix-style POSIX paths to native Windows paths.
	*
	* This is the inverse of {@link toUnixPath}. On Windows, MSYS-style paths use
	* `/c/` notation for drive letters and forward slashes, which PowerShell and
	* cmd.exe cannot resolve. This function converts them to native Windows format
	* with backslashes and proper drive letters.
	*
	* @example
	*   ;```typescript
	*   fromUnixPath('/c/projects/app/file.txt') // 'C:\\projects\\app\\file.txt' on Windows
	*   fromUnixPath('/tmp/build/output') // '/tmp/build/output'
	*   ```
	*
	* @param {string | Buffer | URL} pathLike - The MSYS/Unix-style path to
	*   convert.
	*
	* @returns {string} Native Windows path or normalized Unix path
	*/
	function fromUnixPath(pathLike) {
		const normalized = require_paths_normalize.normalizePath(pathLike);
		/* c8 ignore start */
		if (require_constants_platform.WIN32) return normalized.replace(/\//g, "\\");
		/* c8 ignore stop */
		return normalized;
	}
	/**
	* Split a path into an array of segments.
	*
	* Divides a path into individual components by splitting on both forward-slash
	* and backslash path separators.
	*
	* @example
	*   ;```typescript
	*   splitPath('/home/user/file.txt') // ['', 'home', 'user', 'file.txt']
	*   splitPath('C:\\Users\\John') // ['C:', 'Users', 'John']
	*   splitPath('') // []
	*   ```
	*
	* @param {string | Buffer | URL} pathLike - The path to split.
	*
	* @returns {string[]} Array of path segments, or empty array for empty paths
	*/
	function splitPath(pathLike) {
		const filepath = require_paths__internal.pathLikeToString(pathLike);
		if (filepath === "") return [];
		return filepath.split(require_paths__internal.slashRegExp);
	}
	/**
	* Convert Windows paths to MSYS/Unix-style POSIX paths for Git Bash tools.
	*
	* Git for Windows and MSYS2 tools expect POSIX-style paths with forward slashes
	* and Unix drive letter notation (`/c/` instead of `C:\`).
	*
	* This is the inverse of {@link fromUnixPath}.
	*
	* @example
	*   ;```typescript
	*   toUnixPath('C:\\path\\to\\file.txt') // '/c/path/to/file.txt' on Windows
	*   toUnixPath('/home/user/file') // '/home/user/file'
	*   ```
	*
	* @param {string | Buffer | URL} pathLike - The path to convert.
	*
	* @returns {string} Unix-style POSIX path
	*/
	function toUnixPath(pathLike) {
		const normalized = require_paths_normalize.normalizePath(pathLike);
		/* c8 ignore start */
		if (require_constants_platform.WIN32) return normalized.replace(/^([A-Z]):/i, (_, letter) => `/${letter.toLowerCase()}`);
		/* c8 ignore stop */
		return normalized;
	}
	/**
	* Remove a leading `./` or `.\` prefix from a path.
	*
	* Only removes a single leading `./` or `.\`. Does not touch `../` prefixes.
	*
	* @example
	*   ;```typescript
	*   trimLeadingDotSlash('./src/index.js') // 'src/index.js'
	*   trimLeadingDotSlash('../lib/util.js') // '../lib/util.js'
	*   trimLeadingDotSlash('/absolute/path') // '/absolute/path'
	*   ```
	*
	* @param {string | Buffer | URL} pathLike - The path to process.
	*
	* @returns {string} The path without leading `./` / `.\`, or unchanged
	*/
	function trimLeadingDotSlash(pathLike) {
		const filepath = require_paths__internal.pathLikeToString(pathLike);
		if (require_primordials_string.StringPrototypeStartsWith(filepath, "./") || require_primordials_string.StringPrototypeStartsWith(filepath, ".\\")) return filepath.slice(2);
		return filepath;
	}
	exports.fromUnixPath = fromUnixPath;
	exports.splitPath = splitPath;
	exports.toUnixPath = toUnixPath;
	exports.trimLeadingDotSlash = trimLeadingDotSlash;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/primordials/regexp.js
var require_regexp = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_uncurry = require_uncurry();
	/**
	* @file Safe references to `RegExp` and its prototype methods. `RegExp.escape`
	*   is ES2025; the primordial is typed `Function | undefined` so older runtimes
	*   still load. The Symbol-keyed `[Symbol.match]` / `[Symbol.replace]` slots
	*   are exposed alongside the named methods because some callers use them via
	*   dynamic dispatch (e.g. `String.prototype.match` invokes
	*   `RegExp.prototype[Symbol.match]` internally).
	*/
	const RegExpCtor = RegExp;
	const RegExpEscape = RegExp.escape;
	const RegExpPrototypeExec = require_primordials_uncurry.uncurryThis(RegExp.prototype.exec);
	const RegExpPrototypeTest = require_primordials_uncurry.uncurryThis(RegExp.prototype.test);
	const RegExpPrototypeSymbolMatch = require_primordials_uncurry.uncurryThis(RegExp.prototype[Symbol.match]);
	const RegExpPrototypeSymbolReplace = require_primordials_uncurry.uncurryThis(RegExp.prototype[Symbol.replace]);
	exports.RegExpCtor = RegExpCtor;
	exports.RegExpEscape = RegExpEscape;
	exports.RegExpPrototypeExec = RegExpPrototypeExec;
	exports.RegExpPrototypeSymbolMatch = RegExpPrototypeSymbolMatch;
	exports.RegExpPrototypeSymbolReplace = RegExpPrototypeSymbolReplace;
	exports.RegExpPrototypeTest = RegExpPrototypeTest;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/paths/predicates.js
var require_predicates = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_string = require_string();
	const require_constants_platform = require_platform();
	require_encoding();
	const require_paths__internal = require__internal$1();
	const require_primordials_regexp = require_regexp();
	/**
	* @file Path predicates — `is*` checks for path shape and kind. Split out of
	*   `paths/normalize.ts` for file-size hygiene. Pure boolean predicates over
	*   paths and character codes.
	*
	*   - `isAbsolute`, `isRelative` — root-anchoring shape
	*   - `isPath` — file-path vs package-spec vs URL discriminator
	*   - `isNodeModules`, `isUnixPath` — content-pattern checks
	*   - `isPathSeparator`, `isWindowsDeviceRoot` — char-code primitives
	*/
	/**
	* Check if a path is absolute.
	*
	* Handles both POSIX (`/...`) and Windows (drive-letter, UNC, device) absolute
	* path shapes.
	*
	* @example
	*   ;```typescript
	*   isAbsolute('/home/user') // true
	*   isAbsolute('C:\\Windows') // true on Windows
	*   isAbsolute('../relative') // false
	*   ```
	*
	* @param {string | Buffer | URL} pathLike - The path to check.
	*
	* @returns {boolean} `true` if absolute, `false` otherwise
	*/
	function isAbsolute(pathLike) {
		const filepath = require_paths__internal.pathLikeToString(pathLike);
		const { length } = filepath;
		if (length === 0) return false;
		const code = require_primordials_string.StringPrototypeCharCodeAt(filepath, 0);
		if (code === 47) return true;
		if (code === 92) return true;
		/* c8 ignore start - Windows drive-letter detection. */
		if (require_constants_platform.WIN32 && length > 2) {
			if (isWindowsDeviceRoot(code) && require_primordials_string.StringPrototypeCharCodeAt(filepath, 1) === 58 && isPathSeparator(require_primordials_string.StringPrototypeCharCodeAt(filepath, 2))) return true;
		}
		/* c8 ignore stop */
		return false;
	}
	/**
	* Check if a path contains a `node_modules` directory segment.
	*
	* Matches `node_modules` only as a complete path segment.
	*
	* @example
	*   ;```typescript
	*   isNodeModules('/project/node_modules/package') // true
	*   isNodeModules('/src/my_node_modules_backup') // false
	*   ```
	*
	* @param {string | Buffer | URL} pathLike - The path to check.
	*
	* @returns {boolean} `true` if the path contains `node_modules`
	*/
	function isNodeModules(pathLike) {
		return require_primordials_regexp.RegExpPrototypeTest(require_paths__internal.nodeModulesPathRegExp, require_paths__internal.pathLikeToString(pathLike));
	}
	/**
	* Check if a value is a valid absolute or relative file path.
	*
	* Distinguishes between file paths and other string formats like package names,
	* URLs, or bare module specifiers.
	*
	* @example
	*   ;```typescript
	*   isPath('/absolute/path') // true
	*   isPath('./relative/path') // true
	*   isPath('@scope/name/subpath') // true
	*   isPath('lodash') // false
	*   isPath('http://example.com') // false
	*   ```
	*
	* @param {string | Buffer | URL} pathLike - The value to check.
	*
	* @returns {boolean} `true` if the value is a valid file path
	*/
	function isPath(pathLike) {
		const filepath = require_paths__internal.pathLikeToString(pathLike);
		if (typeof filepath !== "string" || filepath.length === 0) return false;
		if (/^[a-z][a-z0-9+.-]+:/i.test(filepath)) return false;
		if (filepath === "." || filepath === "..") return true;
		if (isAbsolute(filepath)) return true;
		if (filepath.includes("/") || filepath.includes("\\")) {
			if (require_primordials_string.StringPrototypeStartsWith(filepath, "@") && !require_primordials_string.StringPrototypeStartsWith(filepath, "@/")) {
				const parts = filepath.split("/");
				if (parts.length <= 2 && !parts[1]?.includes("\\")) return false;
			}
			return true;
		}
		return false;
	}
	/**
	* Check if a character code is a path separator (`/` or `\`).
	*
	* @example
	*   ;```typescript
	*   isPathSeparator(47) // true — '/'
	*   isPathSeparator(92) // true — '\'
	*   isPathSeparator(65) // false — 'A'
	*   ```
	*
	* @param {number} code - The character code to check.
	*
	* @returns {boolean} `true` if separator
	*/
	function isPathSeparator(code) {
		return code === 47 || code === 92;
	}
	/**
	* Check if a path is relative (i.e., not absolute).
	*
	* Empty strings are treated as relative.
	*
	* @example
	*   ;```typescript
	*   isRelative('./src/index.js') // true
	*   isRelative('src/file.js') // true
	*   isRelative('/home/user') // false
	*   ```
	*
	* @param {string | Buffer | URL} pathLike - The path to check.
	*
	* @returns {boolean} `true` if the path is relative
	*/
	function isRelative(pathLike) {
		const filepath = require_paths__internal.pathLikeToString(pathLike);
		/* c8 ignore start */
		if (typeof filepath !== "string") return false;
		/* c8 ignore stop */
		if (filepath.length === 0) return true;
		return !isAbsolute(filepath);
	}
	/**
	* Check if a path uses MSYS/Git Bash Unix-style drive letter notation.
	*
	* Detects paths in the format `/c/...` where a single letter after the leading
	* slash represents a Windows drive letter.
	*
	* @example
	*   ;```typescript
	*   isUnixPath('/c/tools/bin') // true
	*   isUnixPath('/tmp/build') // false
	*   isUnixPath('C:/Windows') // false
	*   ```
	*
	* @param {string | Buffer | URL} pathLike - The path to check.
	*
	* @returns {boolean} `true` if the path uses MSYS drive letter notation
	*/
	function isUnixPath(pathLike) {
		const filepath = require_paths__internal.pathLikeToString(pathLike);
		return typeof filepath === "string" && require_primordials_regexp.RegExpPrototypeTest(require_paths__internal.msysDriveRegExp, filepath);
	}
	/**
	* Check if a character code is a Windows device root letter (A-Z / a-z).
	*
	* @example
	*   ;```typescript
	*   isWindowsDeviceRoot(67) // true  — 'C'
	*   isWindowsDeviceRoot(99) // true  — 'c'
	*   isWindowsDeviceRoot(58) // false — ':'
	*   ```
	*
	* @param {number} code - The character code to check.
	*
	* @returns {boolean} `true` if valid drive-letter code
	*/
	/* c8 ignore start - Only called from Windows-only branches. */
	function isWindowsDeviceRoot(code) {
		return code >= 65 && code <= 90 || code >= 97 && code <= 122;
	}
	/* c8 ignore stop */
	exports.isAbsolute = isAbsolute;
	exports.isNodeModules = isNodeModules;
	exports.isPath = isPath;
	exports.isPathSeparator = isPathSeparator;
	exports.isRelative = isRelative;
	exports.isUnixPath = isUnixPath;
	exports.isWindowsDeviceRoot = isWindowsDeviceRoot;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/paths/resolve.js
var require_resolve = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_string = require_string();
	const require_constants_platform = require_platform();
	require_encoding();
	const require_paths_predicates = require_predicates();
	const require_paths_normalize = require_normalize();
	/**
	* @file Path resolution utilities — `resolve`, `relative`, `relativeResolve`.
	*   Split out of `paths/normalize.ts` for size hygiene.
	*
	*   - `resolve` — Node-style `path.resolve()` over absolute-path semantics
	*   - `relative` — relative path from one absolute to another
	*   - `relativeResolve` — `relative` + `normalizePath` convenience wrapper
	*/
	/**
	* Calculate the relative path from one path to another.
	*
	* Both inputs are resolved to absolute paths first, then compared to find the
	* longest common base, and finally a relative path is constructed using `../`
	* for parent-directory traversal.
	*
	* Windows file systems are case-insensitive; the comparison reflects that.
	*
	* @example
	*   ;```typescript
	*   relative('/foo/bar', '/foo/baz') // '../baz'
	*   relative('/foo/bar/baz', '/foo') // '../..'
	*   relative('/foo', '/foo/bar') // 'bar'
	*   relative('/foo/bar', '/foo/bar') // ''
	*   ```
	*
	* @param {string} from - Source path.
	* @param {string} to - Destination path.
	*
	* @returns {string} Relative path from `from` to `to`, or empty string if equal
	*/
	function relative(from, to) {
		if (from === to) return "";
		const actualFrom = resolve(from);
		const actualTo = resolve(to);
		if (actualFrom === actualTo) return "";
		/* c8 ignore start - Windows-only case-insensitive comparison. */
		if (require_constants_platform.WIN32) {
			if (actualFrom.toLowerCase() === actualTo.toLowerCase()) return "";
		}
		/* c8 ignore stop */
		const fromStart = 1;
		const fromEnd = actualFrom.length;
		const fromLen = fromEnd - fromStart;
		const toStart = 1;
		const toLen = actualTo.length - toStart;
		const length = fromLen < toLen ? fromLen : toLen;
		let lastCommonSep = -1;
		let i = 0;
		for (; i < length; i += 1) {
			let fromCode = require_primordials_string.StringPrototypeCharCodeAt(actualFrom, fromStart + i);
			let toCode = require_primordials_string.StringPrototypeCharCodeAt(actualTo, toStart + i);
			/* c8 ignore start - Windows-only case folding. */
			if (require_constants_platform.WIN32) {
				if (fromCode >= 65 && fromCode <= 90) fromCode += 32;
				if (toCode >= 65 && toCode <= 90) toCode += 32;
			}
			/* c8 ignore stop */
			if (fromCode !== toCode) break;
			if (require_paths_predicates.isPathSeparator(require_primordials_string.StringPrototypeCharCodeAt(actualFrom, fromStart + i))) lastCommonSep = i;
		}
		/* c8 ignore start */
		if (i === length) {
			if (toLen > length) {
				if (require_paths_predicates.isPathSeparator(require_primordials_string.StringPrototypeCharCodeAt(actualTo, toStart + i))) return actualTo.slice(toStart + i + 1);
				if (i === 0) return actualTo.slice(toStart + i);
			} else if (fromLen > length) {
				if (require_paths_predicates.isPathSeparator(require_primordials_string.StringPrototypeCharCodeAt(actualFrom, fromStart + i))) lastCommonSep = i;
				else if (i === 0) lastCommonSep = 0;
			}
		}
		/* c8 ignore stop */
		let out = "";
		for (i = fromStart + lastCommonSep + 1; i <= fromEnd; i += 1) {
			const code = require_primordials_string.StringPrototypeCharCodeAt(actualFrom, i);
			if (i === fromEnd || require_paths_predicates.isPathSeparator(code)) out += out.length === 0 ? ".." : "/..";
		}
		return out + actualTo.slice(toStart + lastCommonSep);
	}
	/**
	* Get the normalized relative path from one path to another.
	*
	* Computes the relative path using `relative()` then runs the result through
	* `normalizePath()`. An empty string, meaning the same path, is preserved
	* verbatim rather than collapsed to `.`.
	*
	* @example
	*   ;```typescript
	*   relativeResolve('/foo/bar', '/foo/baz') // '../baz'
	*   relativeResolve('/foo/bar', '/foo/bar') // ''
	*   relativeResolve('/foo/./bar', '/foo/baz') // '../baz'
	*   ```
	*
	* @param {string} from - Source path.
	* @param {string} to - Destination path.
	*
	* @returns {string} Normalized relative path, or empty string if equal
	*/
	function relativeResolve(from, to) {
		const rel = relative(from, to);
		if (rel === "") return "";
		return require_paths_normalize.normalizePath(rel);
	}
	/**
	* Resolve an absolute path from path segments.
	*
	* Mimics Node.js `path.resolve()`: processes segments right-to-left, stops at
	* the first absolute segment, and prepends the cwd if no absolute segment is
	* found. The final path is normalized.
	*
	* @example
	*   ;```typescript
	*   resolve('foo', 'bar', 'baz') // '/cwd/foo/bar/baz'
	*   resolve('/foo', 'bar', 'baz') // '/foo/bar/baz'
	*   resolve('foo', '/bar', 'baz') // '/bar/baz'
	*   resolve() // '/cwd'
	*   ```
	*
	* @param {...string} segments - Path segments to resolve.
	*
	* @returns {string} The resolved absolute path
	*/
	function resolve(...segments) {
		let resolvedPath = "";
		let resolvedAbsolute = false;
		for (let i = segments.length - 1; i >= 0 && !resolvedAbsolute; i -= 1) {
			const segment = segments[i];
			/* c8 ignore start */
			if (typeof segment !== "string" || segment.length === 0) continue;
			resolvedPath = segment + (resolvedPath.length === 0 ? "" : `/${resolvedPath}`);
			resolvedAbsolute = require_paths_predicates.isAbsolute(segment);
		}
		if (!resolvedAbsolute) resolvedPath = /* @__PURE__ */ __require("node:process").cwd() + (resolvedPath.length === 0 ? "" : `/${resolvedPath}`);
		/* c8 ignore stop */
		return require_paths_normalize.normalizePath(resolvedPath);
	}
	exports.relative = relative;
	exports.relativeResolve = relativeResolve;
	exports.resolve = resolve;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/paths/normalize.js
var require_normalize = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_string = require_string();
	const require_constants_platform = require_platform();
	const require_paths__internal = require__internal$1();
	const require_paths_conversion = require_conversion();
	const require_paths_predicates = require_predicates();
	const require_paths_resolve = require_resolve();
	/**
	* @file Path normalization — the core `normalizePath` and its MSYS drive-letter
	*   helper. The rest of the path module's surface (predicates, conversion,
	*   resolution) lives in sibling leaves and is re-exported here so existing
	*   `paths/normalize` importers keep working.
	*
	*   - `normalizePath` — backslash → forward-slash, segment collapse, UNC +
	*     namespace preservation
	*   - `msysDriveToNative` — `/c/path` → `C:/path` on Windows
	*/
	const DRIVE_LETTER_REGEXP = /^[A-Za-z]:$/;
	function msysDriveToNative(normalized) {
		/* c8 ignore start - Windows-only branch. */
		if (require_constants_platform.WIN32) return normalized.replace(require_paths__internal.msysDriveRegExp, (_, letter, sep) => `${letter.toUpperCase()}:${sep || "/"}`);
		/* c8 ignore stop */
		return normalized;
	}
	/**
	* Normalize a path by converting backslashes to forward slashes and collapsing
	* segments.
	*
	* - Converts all backslashes (`\`) to forward slashes (`/`)
	* - Collapses repeated slashes
	* - Resolves `.` and `..` segments
	* - Preserves UNC path prefixes (`//server/share`)
	* - Preserves Windows namespace prefixes (`//./`, `//?/`)
	* - Returns `.` for empty or collapsed paths
	* - On Windows: MSYS drive letters `/c/path` become `C:/path`
	*
	* @example
	*   ;```typescript
	*   normalizePath('foo/bar//baz') // 'foo/bar/baz'
	*   normalizePath('foo/./bar') // 'foo/bar'
	*   normalizePath('foo/bar/../baz') // 'foo/baz'
	*   normalizePath('C:\\Users\\u\\file.txt') // 'C:/Users/u/file.txt'
	*   normalizePath('\\\\server\\share\\file') // '//server/share/file'
	*   normalizePath('') // '.'
	*   ```
	*
	* @param {string | Buffer | URL} pathLike - The path to normalize.
	*
	* @returns {string} The normalized path
	*
	* @security
	* **WARNING**: This function resolves `..` patterns as part of normalization, which means
	* paths like `/../etc/passwd` become `/etc/passwd`. When processing untrusted user input
	* (HTTP requests, file uploads, URL parameters), you MUST validate for path traversal
	* attacks BEFORE calling this function.
	*/
	function normalizePath(pathLike) {
		const filepath = require_paths__internal.pathLikeToString(pathLike);
		const { length } = filepath;
		if (length === 0) return ".";
		if (length < 2) return length === 1 && require_primordials_string.StringPrototypeCharCodeAt(filepath, 0) === 92 ? "/" : filepath;
		let code = 0;
		let start = 0;
		let prefix = "";
		if (length > 4 && require_primordials_string.StringPrototypeCharCodeAt(filepath, 3) === 92) {
			const code2 = require_primordials_string.StringPrototypeCharCodeAt(filepath, 2);
			if ((code2 === 63 || code2 === 46) && require_primordials_string.StringPrototypeCharCodeAt(filepath, 0) === 92 && require_primordials_string.StringPrototypeCharCodeAt(filepath, 1) === 92) {
				start = 2;
				prefix = "//";
			}
		}
		if (start === 0)
 /* c8 ignore start - UNC path detection (\\server\share). Rare
		input; not exercised by typical test fixtures. */
		if (length > 2 && (require_primordials_string.StringPrototypeCharCodeAt(filepath, 0) === 92 && require_primordials_string.StringPrototypeCharCodeAt(filepath, 1) === 92 && require_primordials_string.StringPrototypeCharCodeAt(filepath, 2) !== 92 || require_primordials_string.StringPrototypeCharCodeAt(filepath, 0) === 47 && require_primordials_string.StringPrototypeCharCodeAt(filepath, 1) === 47 && require_primordials_string.StringPrototypeCharCodeAt(filepath, 2) !== 47)) {
			let firstSegmentEnd = -1;
			let hasSecondSegment = false;
			let i = 2;
			while (i < length && (require_primordials_string.StringPrototypeCharCodeAt(filepath, i) === 47 || require_primordials_string.StringPrototypeCharCodeAt(filepath, i) === 92)) i++;
			while (i < length) {
				const char = require_primordials_string.StringPrototypeCharCodeAt(filepath, i);
				if (char === 47 || char === 92) {
					firstSegmentEnd = i;
					break;
				}
				i++;
			}
			if (firstSegmentEnd > 2) {
				i = firstSegmentEnd;
				while (i < length && (require_primordials_string.StringPrototypeCharCodeAt(filepath, i) === 47 || require_primordials_string.StringPrototypeCharCodeAt(filepath, i) === 92)) i++;
				if (i < length) hasSecondSegment = true;
			}
			if (firstSegmentEnd > 2 && hasSecondSegment) {
				start = 2;
				prefix = "//";
			} else {
				code = require_primordials_string.StringPrototypeCharCodeAt(filepath, start);
				while (code === 47 || code === 92) {
					start += 1;
					code = require_primordials_string.StringPrototypeCharCodeAt(filepath, start);
				}
				if (start) prefix = "/";
			}
		} else {
			code = require_primordials_string.StringPrototypeCharCodeAt(filepath, start);
			while (code === 47 || code === 92) {
				start += 1;
				code = require_primordials_string.StringPrototypeCharCodeAt(filepath, start);
			}
			if (start) prefix = "/";
		}
		let nextIndex = require_paths__internal.indexOfPathSeparator(filepath, start);
		/* c8 ignore start */
		if (nextIndex === -1) {
			const segment = filepath.slice(start);
			if (segment === "." || segment.length === 0) return prefix || ".";
			if (segment === "..") return prefix ? require_primordials_string.StringPrototypeSlice(prefix, 0, -1) || "/" : "..";
			return msysDriveToNative(prefix + segment);
		}
		/* c8 ignore stop */
		/* c8 ignore start */
		let collapsed = "";
		let segmentCount = 0;
		let leadingDotDots = 0;
		while (nextIndex !== -1) {
			const segment = filepath.slice(start, nextIndex);
			if (segment.length > 0 && segment !== ".") if (segment === "..") {
				if (segmentCount > 0) {
					const lastSeparatorIndex = collapsed.lastIndexOf("/");
					if (lastSeparatorIndex === -1) {
						collapsed = "";
						segmentCount = 0;
						if (leadingDotDots > 0 && !prefix) {
							collapsed = "..";
							leadingDotDots = 1;
						}
					} else {
						const lastSegmentStart = lastSeparatorIndex + 1;
						if (collapsed.slice(lastSegmentStart) === "..") {
							collapsed = `${collapsed}/${segment}`;
							leadingDotDots += 1;
						} else {
							collapsed = collapsed.slice(0, lastSeparatorIndex);
							segmentCount -= 1;
						}
					}
				} else if (!prefix) {
					collapsed = collapsed + (collapsed.length === 0 ? "" : "/") + segment;
					leadingDotDots += 1;
				}
			} else {
				collapsed = collapsed + (collapsed.length === 0 ? "" : "/") + segment;
				segmentCount += 1;
			}
			start = nextIndex + 1;
			code = require_primordials_string.StringPrototypeCharCodeAt(filepath, start);
			while (code === 47 || code === 92) {
				start += 1;
				code = require_primordials_string.StringPrototypeCharCodeAt(filepath, start);
			}
			nextIndex = require_paths__internal.indexOfPathSeparator(filepath, start);
		}
		const lastSegment = filepath.slice(start);
		if (lastSegment.length > 0 && lastSegment !== ".") if (lastSegment === "..") {
			if (segmentCount > 0) {
				const lastSeparatorIndex = collapsed.lastIndexOf("/");
				if (lastSeparatorIndex === -1) {
					collapsed = "";
					segmentCount = 0;
					if (leadingDotDots > 0 && !prefix) {
						collapsed = "..";
						leadingDotDots = 1;
					}
				} else {
					const lastSegmentStart = lastSeparatorIndex + 1;
					if (collapsed.slice(lastSegmentStart) === "..") {
						collapsed = `${collapsed}/${lastSegment}`;
						leadingDotDots += 1;
					} else {
						collapsed = collapsed.slice(0, lastSeparatorIndex);
						segmentCount -= 1;
					}
				}
			} else if (!prefix) {
				collapsed = collapsed + (collapsed.length === 0 ? "" : "/") + lastSegment;
				leadingDotDots += 1;
			}
		} else {
			collapsed = collapsed + (collapsed.length === 0 ? "" : "/") + lastSegment;
			segmentCount += 1;
		}
		/* c8 ignore stop */
		if (collapsed.length === 0) return prefix || ".";
		if (DRIVE_LETTER_REGEXP.test(collapsed) && (require_primordials_string.StringPrototypeCharCodeAt(filepath, 2) === 47 || require_primordials_string.StringPrototypeCharCodeAt(filepath, 2) === 92)) return msysDriveToNative(`${prefix}${collapsed}/`);
		return msysDriveToNative(prefix + collapsed);
	}
	exports.fromUnixPath = require_paths_conversion.fromUnixPath;
	exports.getUrl = require_paths__internal.getUrl;
	exports.isAbsolute = require_paths_predicates.isAbsolute;
	exports.isNodeModules = require_paths_predicates.isNodeModules;
	exports.isPath = require_paths_predicates.isPath;
	exports.isPathSeparator = require_paths_predicates.isPathSeparator;
	exports.isRelative = require_paths_predicates.isRelative;
	exports.isUnixPath = require_paths_predicates.isUnixPath;
	exports.isWindowsDeviceRoot = require_paths_predicates.isWindowsDeviceRoot;
	exports.msysDriveToNative = msysDriveToNative;
	exports.normalizePath = normalizePath;
	exports.pathLikeToString = require_paths__internal.pathLikeToString;
	exports.relative = require_paths_resolve.relative;
	exports.relativeResolve = require_paths_resolve.relativeResolve;
	exports.resolve = require_paths_resolve.resolve;
	exports.splitPath = require_paths_conversion.splitPath;
	exports.toUnixPath = require_paths_conversion.toUnixPath;
	exports.trimLeadingDotSlash = require_paths_conversion.trimLeadingDotSlash;
}));

//#endregion
//#region .config/fleet/oxlint-plugin/lib/comment-markers.mts
var import_normalize = require_normalize();
const MAX_LEADING_COMMENT_LINES = 12;
const COMMENT_LINE_RE = /^\s*(?:\*|\/\*|\/\/)/;
const SOCKET_LINT_ALLOW_PREFIX_RE = /socket-lint\s*:\s*allow\b/;
const SOCKET_LINT_ALLOW_WELL_FORMED_RE = /socket-lint\s*:\s*allow\s+[a-z0-9][a-z0-9-]*/;
/**
* Build a rule's `socket-lint: allow <id>` bypass regex from the canonical
* grammar. Pass the result to `makeBypassChecker` so every rule's opt-out
* marker shares one definition.
*/
function socketLintAllowRe(id) {
	return new RegExp(`socket-lint\\s*:\\s*allow\\s+${id}`);
}
/**
* The socket-lint-owned bypass checker: build a `hasBypassComment(node)` for a
* rule's `socket-lint: allow <id>` opt-out by `id` alone — no hand-written
* regex at the call site. This is the ONE place the `socket-lint:` opt-out is
* matched, so a rule can't mis-spell the grammar; `makeBypassChecker` stays the
* generic primitive for other marker namespaces (e.g. `socket-api-token-getter:
* allow <id>`). A rule does: `const allowed = makeBypassCommentChecker(context,
* 'my-opt-out-id')`.
*/
function makeBypassCommentChecker(context, id) {
	return makeBypassChecker(context, socketLintAllowRe(id));
}
/**
* The raw source text for the file being linted, across the context shapes the
* oxlint plugin engine exposes (`getSourceCode().getText()` vs a `sourceCode`
* with `getText()` or a `.text` field).
*/
function sourceTextOf(context) {
	const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
	if (typeof sourceCode?.getText === "function") return sourceCode.getText();
	return sourceCode?.text ?? "";
}
/**
* 1-based start line of a node, derived from `loc` when present, else by
* counting newlines up to the node's start offset in `sourceText`. Returns -1
* when neither is available.
*/
function nodeStartLine(node, sourceText) {
	const locLine = node?.loc?.start?.line;
	if (typeof locLine === "number") return locLine;
	const start = node.range?.[0];
	if (typeof start !== "number") return -1;
	let line = 1;
	for (let i = 0; i < start && i < sourceText.length; i += 1) if (sourceText[i] === "\n") line += 1;
	return line;
}
/**
* Build a `hasBypassComment(node)` predicate for `bypassRe`, reading the source
* once. True when the marker is on the node's own line or in the contiguous
* comment block immediately above it.
*/
function makeBypassChecker(context, bypassRe) {
	const sourceText = sourceTextOf(context);
	const sourceLines = sourceText.split("\n");
	return function hasBypassComment(node) {
		const line = nodeStartLine(node, sourceText);
		if (line < 1) return false;
		const ownIdx = line - 1;
		if (ownIdx >= 0 && ownIdx < sourceLines.length && bypassRe.test(sourceLines[ownIdx])) return true;
		for (let idx = ownIdx - 1; idx >= 0 && idx >= ownIdx - 12; idx -= 1) {
			const text = sourceLines[idx] ?? "";
			if (bypassRe.test(text)) return true;
			if (text.trim() !== "" && !COMMENT_LINE_RE.test(text)) break;
		}
		return false;
	};
}
const LOCKSTEP_MIRROR_MARKER_RE = /@lockstep-mirror\s+(\S+)\s+@\s+([0-9a-f]{40})/;
/**
* Parse the `@lockstep-mirror <upstream-path> @ <sha>` header marker from a
* file's source text. The marker must live in the leading comment block —
* before the first non-comment statement, the same first-lines header window
* `max-file-lines` scans — so a stray match deep in the file (a doc example, a
* fixture string) can't turn an arbitrary file into a declared mirror. Returns
* the parsed `{ upstreamPath, sha }`, or undefined when no well-formed marker
* is present in the header. A raw-line scan, engine-version-independent,
* exactly like `makeBypassChecker`.
*/
function parseLockstepMirrorMarker(sourceText) {
	const lines = sourceText.split("\n");
	for (let i = 0, { length } = lines; i < length; i += 1) {
		const line = lines[i];
		const trimmed = line.trim();
		if (trimmed === "" || trimmed.startsWith("#!")) continue;
		if (!COMMENT_LINE_RE.test(line)) break;
		const m = LOCKSTEP_MIRROR_MARKER_RE.exec(line);
		if (m) return {
			upstreamPath: m[1],
			sha: m[2]
		};
	}
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/bag-param-optionality-naming/index.mts
const BYPASS_RE$24 = /socket-lint:\s*allow\s+bag-param-optionality-naming/;
function paramName(param) {
	if (!param || typeof param !== "object") return;
	if (param.type === "AssignmentPattern") {
		const left = param.left;
		if (left?.type === "Identifier" && typeof left.name === "string") return {
			node: left,
			name: left.name,
			optional: true
		};
		return;
	}
	if (param.type === "Identifier" && typeof param.name === "string") return {
		node: param,
		name: param.name,
		optional: param.optional === true
	};
}
const rule$106 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Name an object-bag param by optionality: optional → `options`, required → `config`.",
			category: "Stylistic Issues",
			recommended: true
		},
		schema: [],
		messages: {
			requiredShouldBeConfig: "a REQUIRED options-bag param must be named `config` (normalized local `cfg`), not `options` — `options` is reserved for an OPTIONAL bag. Bypass: add a `socket-lint: allow bag-param-optionality-naming` comment.",
			optionalShouldBeOptions: "an OPTIONAL options-bag param must be named `options` (normalized local `opts`), not `config` — `config` is reserved for a REQUIRED bag. Bypass: add a `socket-lint: allow bag-param-optionality-naming` comment."
		}
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$24);
		const filename = (0, import_normalize.normalizePath)(context.filename ?? context.getFilename?.() ?? "");
		if (/\.d\.[cm]?ts$/.test(filename) || /\.test\.[cm]?[jt]sx?$/.test(filename) || filename.includes("/test/") || filename.startsWith("test/")) return {};
		function check(node) {
			const params = node.params;
			if (!Array.isArray(params)) return;
			for (let i = 0, { length } = params; i < length; i += 1) {
				const info = paramName(params[i]);
				if (!info) continue;
				if (info.name === "options" && !info.optional) {
					if (!hasBypassComment(node)) context.report({
						node: info.node,
						messageId: "requiredShouldBeConfig"
					});
				} else if (info.name === "config" && info.optional) {
					if (!hasBypassComment(node)) context.report({
						node: info.node,
						messageId: "optionalShouldBeOptions"
					});
				}
			}
		}
		return {
			ArrowFunctionExpression: check,
			FunctionDeclaration: check,
			FunctionExpression: check
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/lib/detect-source-type.mts
const CJS_EXTENSIONS = /* @__PURE__ */ new Set([".cjs", ".cts"]);
const ESM_EXTENSIONS = /* @__PURE__ */ new Set([".mjs", ".mts"]);
const FAST_REJECT_RE = /\b(?:__dirname|__filename|await|export|exports|import|module|require)\b/;
const CHAR_TAB = 9;
const CHAR_LF = 10;
const CHAR_CR = 13;
const CHAR_SPACE = 32;
const CHAR_BANG = 33;
const CHAR_DQUOTE = 34;
const CHAR_HASH = 35;
const CHAR_DOLLAR = 36;
const CHAR_PERCENT = 37;
const CHAR_AMP = 38;
const CHAR_SQUOTE = 39;
const CHAR_LPAREN = 40;
const CHAR_RPAREN = 41;
const CHAR_STAR = 42;
const CHAR_PLUS = 43;
const CHAR_COMMA = 44;
const CHAR_MINUS = 45;
const CHAR_DOT = 46;
const CHAR_SLASH = 47;
const CHAR_0 = 48;
const CHAR_9 = 57;
const CHAR_COLON = 58;
const CHAR_SEMI = 59;
const CHAR_LT = 60;
const CHAR_EQ = 61;
const CHAR_GT = 62;
const CHAR_QUEST = 63;
const CHAR_A = 65;
const CHAR_Z = 90;
const CHAR_LBRACKET = 91;
const CHAR_BSLASH = 92;
const CHAR_RBRACKET = 93;
const CHAR_CARET = 94;
const CHAR_UNDERSCORE = 95;
const CHAR_BACKTICK = 96;
const CHAR_a = 97;
const CHAR_z = 122;
const CHAR_LBRACE = 123;
const CHAR_PIPE = 124;
const CHAR_RBRACE = 125;
const CHAR_TILDE = 126;
function isIdentStart(ch) {
	return ch >= CHAR_a && ch <= CHAR_z || ch >= CHAR_A && ch <= CHAR_Z || ch === CHAR_UNDERSCORE || ch === CHAR_DOLLAR;
}
function isIdentPart(ch) {
	return ch >= CHAR_a && ch <= CHAR_z || ch >= CHAR_A && ch <= CHAR_Z || ch >= CHAR_0 && ch <= CHAR_9 || ch === CHAR_UNDERSCORE || ch === CHAR_DOLLAR;
}
function startsRegex(prevMeaningful) {
	if (prevMeaningful === 0) return true;
	return prevMeaningful === CHAR_LPAREN || prevMeaningful === CHAR_COMMA || prevMeaningful === CHAR_EQ || prevMeaningful === CHAR_SEMI || prevMeaningful === CHAR_LBRACE || prevMeaningful === CHAR_RBRACE || prevMeaningful === CHAR_COLON || prevMeaningful === CHAR_LBRACKET || prevMeaningful === CHAR_BANG || prevMeaningful === CHAR_QUEST || prevMeaningful === CHAR_AMP || prevMeaningful === CHAR_PIPE || prevMeaningful === CHAR_CARET || prevMeaningful === CHAR_TILDE || prevMeaningful === CHAR_LT || prevMeaningful === CHAR_GT || prevMeaningful === CHAR_PLUS || prevMeaningful === CHAR_MINUS || prevMeaningful === CHAR_STAR || prevMeaningful === CHAR_PERCENT || prevMeaningful === CHAR_SLASH;
}
function matchAt(source, start, end, keyword) {
	const klen = keyword.length;
	if (end - start !== klen) return false;
	for (let i = 0; i < klen; i += 1) if (source.charCodeAt(start + i) !== keyword.charCodeAt(i)) return false;
	return true;
}
function continuesStatement(last) {
	return last === CHAR_COMMA || last === CHAR_LBRACE || last === CHAR_LBRACKET || last === CHAR_LPAREN || last === CHAR_EQ || last === CHAR_PLUS || last === CHAR_MINUS || last === CHAR_STAR || last === CHAR_SLASH || last === CHAR_PERCENT || last === CHAR_LT || last === CHAR_GT || last === CHAR_AMP || last === CHAR_PIPE || last === CHAR_CARET || last === CHAR_TILDE || last === CHAR_QUEST || last === CHAR_COLON || last === CHAR_BANG || last === CHAR_DOT;
}
function isWrapperName(source, start, end) {
	return matchAt(source, start, end, "module") || matchAt(source, start, end, "exports") || matchAt(source, start, end, "require") || matchAt(source, start, end, "__filename") || matchAt(source, start, end, "__dirname");
}
function declarationDeclaresWrapper(source, after, length) {
	let i = after;
	let depth = 0;
	let inInitializer = false;
	let last = 0;
	while (i < length) {
		const ch = source.charCodeAt(i);
		if (ch === CHAR_SPACE || ch === CHAR_TAB || ch === CHAR_CR) {
			i += 1;
			continue;
		}
		if (ch === CHAR_LF) {
			if (depth === 0 && last !== 0 && !continuesStatement(last)) return false;
			i += 1;
			continue;
		}
		if (ch === CHAR_SLASH && source.charCodeAt(i + 1) === CHAR_SLASH) {
			i += 2;
			while (i < length && source.charCodeAt(i) !== CHAR_LF) i += 1;
			continue;
		}
		if (ch === CHAR_SLASH && source.charCodeAt(i + 1) === CHAR_STAR) {
			i += 2;
			while (i < length) {
				if (source.charCodeAt(i) === CHAR_STAR && source.charCodeAt(i + 1) === CHAR_SLASH) {
					i += 2;
					break;
				}
				i += 1;
			}
			continue;
		}
		if (ch === CHAR_DQUOTE || ch === CHAR_SQUOTE) {
			const quote = ch;
			i += 1;
			while (i < length) {
				const c = source.charCodeAt(i);
				if (c === CHAR_BSLASH) {
					i += 2;
					continue;
				}
				if (c === quote) {
					i += 1;
					break;
				}
				if (c === CHAR_LF) break;
				i += 1;
			}
			last = quote;
			continue;
		}
		if (ch === CHAR_BACKTICK) {
			i += 1;
			while (i < length) {
				const c = source.charCodeAt(i);
				if (c === CHAR_BSLASH) {
					i += 2;
					continue;
				}
				if (c === CHAR_BACKTICK) {
					i += 1;
					break;
				}
				i += 1;
			}
			last = CHAR_BACKTICK;
			continue;
		}
		if (ch === CHAR_SEMI && depth === 0) return false;
		if (ch === CHAR_EQ && depth === 0) {
			inInitializer = true;
			last = ch;
			i += 1;
			continue;
		}
		if (ch === CHAR_COMMA && depth === 0) {
			inInitializer = false;
			last = ch;
			i += 1;
			continue;
		}
		if (ch === CHAR_LBRACE || ch === CHAR_LBRACKET || ch === CHAR_LPAREN) {
			depth += 1;
			last = ch;
			i += 1;
			continue;
		}
		if (ch === CHAR_RBRACE || ch === CHAR_RBRACKET || ch === CHAR_RPAREN) {
			if (depth > 0) depth -= 1;
			last = ch;
			i += 1;
			continue;
		}
		if (isIdentStart(ch)) {
			const start = i;
			i += 1;
			while (i < length && isIdentPart(source.charCodeAt(i))) i += 1;
			let isKey = false;
			if (depth > 0) {
				const lookahead = skipWhitespace(source, i);
				if (lookahead < length && source.charCodeAt(lookahead) === CHAR_COLON) isKey = true;
			}
			if (!inInitializer && !isKey && isWrapperName(source, start, i)) return true;
			last = source.charCodeAt(i - 1);
			continue;
		}
		last = ch;
		i += 1;
	}
	return false;
}
function matchKeyword(source, pos, keyword) {
	const { length } = source;
	const klen = keyword.length;
	if (pos + klen > length) return -1;
	for (let i = 0; i < klen; i += 1) if (source.charCodeAt(pos + i) !== keyword.charCodeAt(i)) return -1;
	const after = pos + klen;
	if (after < length && isIdentPart(source.charCodeAt(after))) return -1;
	return after;
}
function skipWhitespace(source, pos) {
	const { length } = source;
	let i = pos;
	while (i < length) {
		const c = source.charCodeAt(i);
		if (c === CHAR_SPACE || c === CHAR_TAB || c === CHAR_LF || c === CHAR_CR) {
			i += 1;
			continue;
		}
		break;
	}
	return i;
}
const ESM_ONLY_REMAINDER_RE_WH = /\b(?:__dirname|__filename|await|export|import)\b/g;
function couldHaveEsmMarkerAfter(source, pos) {
	ESM_ONLY_REMAINDER_RE_WH.lastIndex = pos;
	if (ESM_ONLY_REMAINDER_RE_WH.exec(source) !== null) return true;
	if (!(source.indexOf("const", pos) !== -1 || source.indexOf("let", pos) !== -1 || source.indexOf("var", pos) !== -1)) return false;
	return source.indexOf("module", pos) !== -1 || source.indexOf("exports", pos) !== -1 || source.indexOf("require", pos) !== -1;
}
function scanTopLevelMarker(source) {
	let i = 0;
	const { length } = source;
	let depth = 0;
	let prevMeaningful = 0;
	let sawCjs = false;
	let cjsShortCircuitChecked = false;
	while (i < length) {
		const ch = source.charCodeAt(i);
		if (ch === CHAR_SPACE || ch === CHAR_TAB || ch === CHAR_LF || ch === CHAR_CR) {
			i += 1;
			continue;
		}
		if (ch === CHAR_SLASH && source.charCodeAt(i + 1) === CHAR_SLASH) {
			const nl = source.indexOf("\n", i + 2);
			i = nl === -1 ? length : nl;
			continue;
		}
		if (ch === CHAR_SLASH && source.charCodeAt(i + 1) === CHAR_STAR) {
			const end = source.indexOf("*/", i + 2);
			i = end === -1 ? length : end + 2;
			continue;
		}
		if (ch === CHAR_HASH && i === 0 && source.charCodeAt(i + 1) === CHAR_BANG) {
			const nl = source.indexOf("\n", 2);
			i = nl === -1 ? length : nl;
			continue;
		}
		if (ch === CHAR_DQUOTE || ch === CHAR_SQUOTE) {
			const quote = ch;
			const quoteStr = quote === CHAR_DQUOTE ? "\"" : "'";
			let pos = i + 1;
			while (pos < length) {
				const next = source.indexOf(quoteStr, pos);
				if (next === -1) {
					pos = length;
					break;
				}
				let bs = 0;
				let j = next - 1;
				while (j >= i + 1 && source.charCodeAt(j) === CHAR_BSLASH) {
					bs += 1;
					j -= 1;
				}
				if ((bs & 1) === 0) {
					pos = next + 1;
					break;
				}
				pos = next + 1;
			}
			i = pos;
			prevMeaningful = quote;
			continue;
		}
		if (ch === CHAR_BACKTICK) {
			i += 1;
			while (i < length) {
				const c = source.charCodeAt(i);
				if (c === CHAR_BSLASH) {
					i += 2;
					continue;
				}
				if (c === CHAR_BACKTICK) {
					i += 1;
					break;
				}
				if (c === CHAR_DOLLAR && source.charCodeAt(i + 1) === CHAR_LBRACE) {
					i += 2;
					let tplDepth = 1;
					while (i < length && tplDepth > 0) {
						const cc = source.charCodeAt(i);
						if (cc === CHAR_LBRACE) tplDepth += 1;
						else if (cc === CHAR_RBRACE) tplDepth -= 1;
						else if (cc === CHAR_DQUOTE || cc === CHAR_SQUOTE) {
							const innerQuote = cc;
							i += 1;
							while (i < length) {
								const ccc = source.charCodeAt(i);
								if (ccc === CHAR_BSLASH) {
									i += 2;
									continue;
								}
								if (ccc === innerQuote) {
									i += 1;
									break;
								}
								if (ccc === CHAR_LF) break;
								i += 1;
							}
							continue;
						}
						i += 1;
					}
					continue;
				}
				i += 1;
			}
			prevMeaningful = CHAR_BACKTICK;
			continue;
		}
		if (ch === CHAR_SLASH && startsRegex(prevMeaningful)) {
			i += 1;
			let inClass = false;
			while (i < length) {
				const c = source.charCodeAt(i);
				if (c === CHAR_BSLASH) {
					i += 2;
					continue;
				}
				if (c === CHAR_LBRACKET) inClass = true;
				else if (c === CHAR_RBRACKET) inClass = false;
				else if (c === CHAR_SLASH && !inClass) {
					i += 1;
					break;
				} else if (c === CHAR_LF) break;
				i += 1;
			}
			while (i < length && isIdentPart(source.charCodeAt(i))) i += 1;
			prevMeaningful = CHAR_SLASH;
			continue;
		}
		if (ch === CHAR_LBRACE || ch === CHAR_LPAREN || ch === CHAR_LBRACKET) {
			depth += 1;
			prevMeaningful = ch;
			i += 1;
			continue;
		}
		if (ch === CHAR_RBRACE || ch === CHAR_RPAREN || ch === CHAR_RBRACKET) {
			if (depth > 0) depth -= 1;
			prevMeaningful = ch;
			i += 1;
			continue;
		}
		if (isIdentStart(ch)) {
			const start = i;
			i += 1;
			while (i < length && isIdentPart(source.charCodeAt(i))) i += 1;
			if (depth === 0) {
				const word = source.slice(start, i);
				if (word === "import") {
					const after = skipWhitespace(source, i);
					if (after < length) {
						const c = source.charCodeAt(after);
						if (c === CHAR_LPAREN) {
							prevMeaningful = ch;
							continue;
						}
						if (c === CHAR_DOT) {
							if (matchKeyword(source, skipWhitespace(source, after + 1), "meta") !== -1) return "esm";
							prevMeaningful = ch;
							continue;
						}
					}
					return "esm";
				}
				if (word === "export") return "esm";
				if (word === "await") return "esm";
				if (word === "const" || word === "let" || word === "var") {
					if (declarationDeclaresWrapper(source, i, length)) return "esm";
				}
				if (word === "require") {
					const after = skipWhitespace(source, i);
					if (after < length && source.charCodeAt(after) === CHAR_LPAREN) sawCjs = true;
				} else if (word === "module") {
					const after = skipWhitespace(source, i);
					if (after < length && source.charCodeAt(after) === CHAR_DOT) {
						if (matchKeyword(source, skipWhitespace(source, after + 1), "exports") !== -1) sawCjs = true;
					}
				} else if (word === "exports") {
					if (prevMeaningful !== CHAR_DOT) {
						const after = skipWhitespace(source, i);
						if (after < length && source.charCodeAt(after) === CHAR_DOT) sawCjs = true;
					}
				}
			}
			if (sawCjs && !cjsShortCircuitChecked) {
				cjsShortCircuitChecked = true;
				if (!couldHaveEsmMarkerAfter(source, i)) return "cjs";
			}
			prevMeaningful = ch;
			continue;
		}
		if (ch >= CHAR_0 && ch <= CHAR_9) {
			i += 1;
			while (i < length) {
				const c = source.charCodeAt(i);
				if (c >= CHAR_0 && c <= CHAR_9 || c === CHAR_DOT || c >= CHAR_a && c <= CHAR_z || c >= CHAR_A && c <= CHAR_Z || c === CHAR_UNDERSCORE) {
					i += 1;
					continue;
				}
				break;
			}
			prevMeaningful = ch;
			continue;
		}
		prevMeaningful = ch;
		i += 1;
	}
	return sawCjs ? "cjs" : "none";
}
function detectSourceType(source, hint) {
	if (hint?.extension) {
		const ext = hint.extension.toLowerCase();
		if (CJS_EXTENSIONS.has(ext)) return "cjs";
		if (ESM_EXTENSIONS.has(ext)) return "esm";
	}
	if (hint?.packageType === "module") return "esm";
	if (hint?.packageType === "commonjs") return "cjs";
	if (!source) return "unknown";
	if (!FAST_REJECT_RE.test(source)) return "unknown";
	const marker = scanTopLevelMarker(source);
	if (marker === "esm") return "esm";
	if (marker === "cjs") return "cjs";
	return "unknown";
}

//#endregion
//#region .config/fleet/oxlint-plugin/lib/lockstep-mirror.mts
/**
* The rules a declared `@lockstep-mirror` file is exempt from — the single
* source of truth. socket/* entries are the fidelity rules that self-exempt via
* `isLockstepMirror`; `curly`, and any future non-socket core rule, is exempt
* only through a marker-gated file-scope disable that
* `no-file-scope-oxlint-disable` allows. Keep this list in sync with the
* per-rule guards; the validation check asserts a file-scope disable on a
* mirror names nothing outside it.
*/
const LOCKSTEP_MIRROR_EXEMPT_RULES = [
	"curly",
	"socket/export-top-level-functions",
	"socket/max-file-lines",
	"socket/no-default-export",
	"socket/no-file-scope-oxlint-disable",
	"socket/prefer-function-declaration",
	"socket/prefer-node-builtin-imports",
	"socket/prefer-undefined-over-null",
	"socket/sort-array-literals",
	"socket/sort-boolean-chains",
	"socket/sort-equality-disjunctions",
	"socket/sort-named-imports",
	"socket/sort-object-literal-properties",
	"socket/sort-regex-alternations",
	"socket/sort-set-args",
	"socket/sort-source-methods"
];
const EXEMPT_RULE_SET = new Set(LOCKSTEP_MIRROR_EXEMPT_RULES);
/**
* True when the file currently being linted carries a well-formed
* `@lockstep-mirror` header marker. Reads the raw source text (engine-version-
* independent, exactly like `makeBypassChecker`) and delegates grammar to
* `parseLockstepMirrorMarker` so the marker is recognized identically by rules,
* the validator, and the format-deriver. Rules guard with
* `if (isLockstepMirror(context)) return {}`.
*/
function isLockstepMirror(context) {
	return parseLockstepMirrorMarker(sourceTextOf(context)) !== void 0;
}
/**
* True when the rule named by an `oxlint-disable <rule>` directive is one a
* declared lockstep mirror may exempt via a file-scope disable. Bare oxlint
* core names (`curly`) and `socket/<id>` names are matched as authored.
*/
function isLockstepMirrorExemptRule(ruleName) {
	return EXEMPT_RULE_SET.has(ruleName.trim());
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/export-top-level-functions/index.mts
const SCRIPT_ENTRY_NAMES$1 = /* @__PURE__ */ new Set(["main"]);
/**
* Walk Program body once and collect names exported via: - `export { foo, bar
* }` - `export { foo as bar }` (the local-name `foo` counts) - `export default
* foo`
*
* Function declarations that already say `export function foo` won't reach this
* rule's visitor (the visitor matches bare function declarations only via
* `Program > FunctionDeclaration`; an `ExportNamedDeclaration` wraps them in a
* different shape).
*/
function collectExportedNames(program) {
	const exported = /* @__PURE__ */ new Set();
	for (const stmt of program.body) {
		if (stmt.type === "ExportNamedDeclaration" && !stmt.declaration) {
			for (const spec of stmt.specifiers) if (spec.local && spec.local.type === "Identifier") exported.add(spec.local.name);
		}
		if (stmt.type === "ExportDefaultDeclaration" && stmt.declaration && stmt.declaration.type === "Identifier") exported.add(stmt.declaration.name);
	}
	return exported;
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$105 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require top-level function declarations to be exported (testability).",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: {
			missing: "Top-level {{kind}} `{{name}}` should be exported (`export {{kind}} {{name}}`). Exporting the top-level surface makes it directly importable + testable; privacy is handled by not importing, not by leaving it unexported.",
			missingAlreadyReExported: "Top-level {{kind}} `{{name}}` is named in a separate `export {{ }}` statement; collapse to inline `export {{kind}} {{name}}` for clarity (autofix skipped to avoid creating a duplicate export)."
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const filename = typeof context.filename === "string" ? context.filename : typeof context.getFilename === "function" ? context.getFilename() : "";
		const extension = filename ? path.extname(filename) : "";
		if (detectSourceType(typeof sourceCode.getText === "function" ? sourceCode.getText() : typeof sourceCode.text === "string" ? sourceCode.text : "", { extension }) === "cjs") return {};
		let exportedNames;
		function check(node, kindLabel, { allowMain }) {
			if (!node.id || node.id.type !== "Identifier") return;
			const name = node.id.name;
			if (allowMain && SCRIPT_ENTRY_NAMES$1.has(name)) return;
			if (!exportedNames) exportedNames = collectExportedNames(sourceCode.ast);
			if (exportedNames.has(name)) {
				context.report({
					node: node.id,
					messageId: "missingAlreadyReExported",
					data: {
						kind: kindLabel,
						name
					}
				});
				return;
			}
			context.report({
				node: node.id,
				messageId: "missing",
				data: {
					kind: kindLabel,
					name
				},
				fix(fixer) {
					return fixer.insertTextBefore(node, "export ");
				}
			});
		}
		return {
			"Program > FunctionDeclaration"(node) {
				check(node, "function", { allowMain: true });
			},
			"Program > TSInterfaceDeclaration"(node) {
				check(node, "interface", { allowMain: false });
			},
			"Program > TSTypeAliasDeclaration"(node) {
				check(node, "type", { allowMain: false });
			},
			"Program > ClassDeclaration"(node) {
				check(node, "class", { allowMain: false });
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/lib/generic-name-tokens.mts
/**
* Generic tokens that carry no domain signal. Lowercased; the predicate
* lowercases the candidate before lookup. Verbs of pure mechanism plus the
* classic filler nouns — the words that, standing alone as an export, tell a
* reader, or a grepping agent, nothing about WHAT domain the symbol serves.
*/
const GENERIC_NAME_TOKENS = /* @__PURE__ */ new Set([
	"add",
	"apply",
	"build",
	"calculate",
	"clear",
	"close",
	"compare",
	"compute",
	"connect",
	"convert",
	"create",
	"data",
	"delete",
	"diff",
	"emit",
	"equals",
	"exec",
	"execute",
	"fetch",
	"filter",
	"find",
	"format",
	"get",
	"handle",
	"helper",
	"init",
	"initialize",
	"item",
	"load",
	"make",
	"manager",
	"map",
	"match",
	"matches",
	"merge",
	"obj",
	"open",
	"parse",
	"process",
	"read",
	"reduce",
	"remove",
	"render",
	"reset",
	"resolve",
	"result",
	"send",
	"set",
	"sort",
	"start",
	"stop",
	"temp",
	"thing",
	"tmp",
	"transform",
	"update",
	"util",
	"utils",
	"validate",
	"value",
	"write"
]);
/**
* Structural entry-point / contract names the fleet SANCTIONS — a reader (and a
* grepping agent) recognizes these as the wiring, not domain logic, so they are
* exempt even though they read as single generic tokens. `check` is the fleet
* hook contract (the dispatcher calls the exported `check`); `main` is the CLI
* entry (`isMainModule()` → `main`); `run` is the runner/skill-action idiom;
* `handler` is the event-handler convention; the VS Code extension lifecycle
* uses `activate`/`deactivate`; `setup`/`teardown`/`register`/`index` are
* test/module wiring. Renaming any of these would break the contract that calls
* them by name, so they are never flagged.
*/
const SANCTIONED_CONVENTION_NAMES = /* @__PURE__ */ new Set([
	"activate",
	"check",
	"deactivate",
	"handler",
	"index",
	"main",
	"register",
	"run",
	"setup",
	"teardown"
]);
/**
* Split an identifier into its constituent words. Handles camelCase,
* PascalCase, snake_case, SCREAMING_CASE, `$`/digit boundaries, and acronym
* runs (`HTTPServer` → `HTTP`, `Server`; `parseURL` → `parse`, `URL`). Returns
* the words verbatim (no case-folding — the caller folds for denylist lookup).
*/
function splitNameWords(name) {
	return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").split(/[_$ ]|(?<=[A-Za-z])(?=\d)|(?<=\d)(?=[A-Za-z])/).filter(Boolean);
}
/**
* True when `name` is a single-word export whose one word is a generic token —
* the shape this pass flags. Multi-word names and single non-generic words
* return false.
*/
function isGenericExportName(name) {
	const words = splitNameWords(name);
	if (words.length !== 1) return false;
	const lower = words[0].toLowerCase();
	return GENERIC_NAME_TOKENS.has(lower) && !SANCTIONED_CONVENTION_NAMES.has(lower);
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/exported-name-has-domain-word/index.mts
function reportIfGeneric(context, idNode) {
	if (!idNode || idNode.type !== "Identifier" || !idNode.name) return;
	if (isGenericExportName(idNode.name)) context.report({
		node: idNode,
		messageId: "exportedNameHasDomainWord",
		data: { name: idNode.name }
	});
}
const rule$104 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require an exported name to carry a domain word — a single generic token (create/parse/get/…) is a grep-noise magnet for agents and readers.",
			category: "Stylistic Issues",
			recommended: true
		},
		messages: { exportedNameHasDomainWord: "Exported '{{name}}' is a single generic token — a grep-noise magnet (one-word names are ~61% unique). Qualify it with a domain word (e.g. `create` → `createStripeClient`) so agents and readers can find it without reading unrelated files." },
		schema: []
	},
	create(context) {
		return { ExportNamedDeclaration(node) {
			const decl = node.declaration;
			if (!decl) return;
			if (decl.type === "VariableDeclaration") {
				const declarators = decl.declarations ?? [];
				for (let i = 0, { length } = declarators; i < length; i += 1) reportIfGeneric(context, declarators[i]?.id);
				return;
			}
			reportIfGeneric(context, decl.id);
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/guard-contract/index.mts
function isProcessMember(node, name) {
	return node?.type === "MemberExpression" && !node.computed && node.object?.type === "Identifier" && node.object.name === "process" && node.property?.type === "Identifier" && node.property.name === name;
}
const rule$103 = {
	meta: {
		type: "problem",
		docs: {
			description: "A guard using the _shared/guard.mts contract must not call process.exit or gate on process.argv[1] — both break the per-event dispatcher.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: {
			processExit: "A contract guard must not call `process.exit()` — in the shared dispatcher a hard exit silently skips every later guard. Return `block(message)` / `notify(message)` / `undefined` instead.",
			argvGate: "A contract guard must not gate on `process.argv[1]` — it misfires when the dispatcher imports the module. End the file with `await runGuard(check, import.meta.url)`, which handles the standalone-vs-dispatched decision."
		},
		schema: []
	},
	create(context) {
		const normalized = (0, import_normalize.normalizePath)(context.filename ?? context.getFilename?.() ?? "");
		if (!/(?:^|\/)\.claude\/hooks\/.+\/index\.mts$/.test(normalized) || /\/_shared\//.test(normalized) || /\/test\//.test(normalized) || /\.test\.[mc]?[jt]s$/.test(normalized)) return {};
		let importsContract = false;
		return {
			ImportDeclaration(node) {
				const source = node.source?.value;
				if (typeof source === "string" && /(?:^|\/)guard\.mts$/.test(source)) importsContract = true;
			},
			CallExpression(node) {
				if (importsContract && isProcessMember(node.callee, "exit")) context.report({
					node,
					messageId: "processExit"
				});
			},
			MemberExpression(node) {
				if (importsContract && node.computed && node.property?.type === "Literal" && node.property.value === 1 && isProcessMember(node.object, "argv")) context.report({
					node,
					messageId: "argvGate"
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/inclusive-language/index.mts
const SUBSTITUTIONS = [
	["whitelist", "allowlist"],
	["blacklist", "denylist"],
	["grandfathered", "legacy"],
	["sanity", "quick"],
	["dummy", "placeholder"]
];
const REPORT_ONLY = /* @__PURE__ */ new Set(["master", "slave"]);
const REPORT_ONLY_TERMS = ["master", "slave"];
const BYPASS_RE$23 = /inclusive-language:\s*external-api/;
/**
* Build a regex matching any legacy stem with word boundaries.
*
* Stems are sorted alphabetically before being joined so the regex alternation
* has a deterministic, stable form. Two reasons: 1. The fleet ships a
* `sort-regex-alternations` rule that flags unsorted `(a|b|c)`-style
* alternations; this regex would trip its own sibling rule without the sort. 2.
* Regex engines treat `|` as "first match wins" when alternatives have shared
* prefixes — sorting keeps the precedence visible in source rather than
* depending on declaration order.
*/
function buildDetectorRegex() {
	const stems = [...SUBSTITUTIONS.map(([legacy]) => legacy), ...REPORT_ONLY_TERMS].toSorted();
	return new RegExp(`\\b(${stems.join("|")})\\w*`, "gi");
}
const DETECTOR_RE = buildDetectorRegex();
/**
* Replace a single hit `match` (e.g. `Whitelist`, `WHITELIST`, `whitelisted`,
* `whitelistEntry`) with the case-preserving form of the new stem. Returns
* undefined when there's no autofix-able substitution (master/slave).
*/
function rewriteHit(match) {
	const lower = match.toLowerCase();
	for (const [legacy, replacement] of SUBSTITUTIONS) {
		/* c8 ignore start - defensive guard; SUBSTITUTIONS table always has non-empty pairs */
		if (!legacy || !replacement) continue;
		/* c8 ignore stop */
		if (!lower.startsWith(legacy)) continue;
		const tail = match.slice(legacy.length);
		const original = match.slice(0, legacy.length);
		let rebuilt;
		if (original === original.toUpperCase()) rebuilt = replacement.toUpperCase();
		else if (original[0] === original[0].toUpperCase()) rebuilt = replacement[0].toUpperCase() + replacement.slice(1);
		else rebuilt = replacement;
		return rebuilt + tail;
	}
	/* c8 ignore stop */
}
function findHits(text) {
	const hits = [];
	DETECTOR_RE.lastIndex = 0;
	let m;
	while ((m = DETECTOR_RE.exec(text)) !== null) {
		const stem = m[1].toLowerCase();
		hits.push({
			start: m.index,
			end: m.index + m[0].length,
			match: m[0],
			stem
		});
	}
	return hits;
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$102 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Use inclusive language. Replace whitelist/blacklist/master/slave/grandfathered/sanity/dummy per the fleet substitution table.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: {
			legacy: "`{{match}}` — replace with the inclusive-language equivalent. See docs/agents.md/fleet/inclusive-language.md.",
			legacyMaster: "`{{match}}` — replace with `main` (branch), `primary` / `controller` (process). Manual rewrite — context decides which fits.",
			legacySlave: "`{{match}}` — replace with `replica` / `worker` / `secondary` / `follower`. Manual rewrite — context decides which fits."
		},
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		function hasBypassComment(node) {
			const before = sourceCode.getCommentsBefore(node);
			const after = sourceCode.getCommentsAfter(node);
			for (const c of [...before, ...after]) if (BYPASS_RE$23.test(c.value)) return true;
			const loc = node.loc;
			if (loc && loc.start.line === loc.end.line) {
				const lineText = sourceCode.lines?.[loc.start.line - 1];
				if (lineText && BYPASS_RE$23.test(lineText)) return true;
			}
			return false;
		}
		function checkIdentifier(node) {
			if (!node.name) return;
			const parent = node.parent;
			if (parent) {
				if (parent.type === "ExportSpecifier" || parent.type === "ImportDefaultSpecifier" || parent.type === "ImportNamespaceSpecifier" || parent.type === "ImportSpecifier") return;
				if (parent.type === "MemberExpression" && parent.property === node && !parent.computed) return;
				if (parent.type === "Property" && parent.key === node && !parent.computed) return;
			}
			const hits = findHits(node.name);
			if (hits.length === 0) return;
			if (hasBypassComment(node)) return;
			let rebuilt = "";
			let cursor = 0;
			let mutated = false;
			for (let i = 0, { length } = hits; i < length; i += 1) {
				const h = hits[i];
				rebuilt += node.name.slice(cursor, h.start);
				const replacement = REPORT_ONLY.has(h.stem) ? void 0 : rewriteHit(h.match);
				if (replacement) {
					rebuilt += replacement;
					mutated = true;
				} else rebuilt += h.match;
				cursor = h.end;
			}
			rebuilt += node.name.slice(cursor);
			if (!mutated) {
				for (let i = 0, { length } = hits; i < length; i += 1) {
					const h = hits[i];
					let messageId = "legacy";
					if (h.stem === "master") messageId = "legacyMaster";
					else if (h.stem === "slave") messageId = "legacySlave";
					/* c8 ignore stop */
					context.report({
						node,
						messageId,
						data: { match: h.match }
					});
				}
				return;
			}
			const firstHit = hits[0];
			let messageId = "legacy";
			/* c8 ignore start - JS identifiers have no non-word chars, so master/slave cannot be a distinct first hit before a fixable term */
			if (firstHit.stem === "master") messageId = "legacyMaster";
			else if (firstHit.stem === "slave") messageId = "legacySlave";
			/* c8 ignore stop */
			context.report({
				node,
				messageId,
				data: { match: firstHit.match },
				fix(fixer) {
					return fixer.replaceText(node, rebuilt);
				}
			});
		}
		return {
			Identifier: checkIdentifier,
			Literal(node) {
				if (typeof node.value !== "string") return;
				const hits = findHits(node.value);
				if (hits.length === 0) return;
				if (hasBypassComment(node)) return;
				let rebuilt = "";
				let cursor = 0;
				let mutated = false;
				for (let i = 0, { length } = hits; i < length; i += 1) {
					const h = hits[i];
					rebuilt += node.value.slice(cursor, h.start);
					const replacement = REPORT_ONLY.has(h.stem) ? void 0 : rewriteHit(h.match);
					if (replacement) {
						rebuilt += replacement;
						mutated = true;
					} else rebuilt += h.match;
					cursor = h.end;
				}
				rebuilt += node.value.slice(cursor);
				if (!mutated) {
					for (let i = 0, { length } = hits; i < length; i += 1) {
						const h = hits[i];
						let messageId = "legacy";
						if (h.stem === "master") messageId = "legacyMaster";
						else if (h.stem === "slave") messageId = "legacySlave";
						/* c8 ignore stop */
						context.report({
							node,
							messageId,
							data: { match: h.match }
						});
					}
					return;
				}
				const firstHit = hits[0];
				let messageId = "legacy";
				if (firstHit.stem === "master") messageId = "legacyMaster";
				else if (firstHit.stem === "slave") messageId = "legacySlave";
				context.report({
					node,
					messageId,
					data: { match: firstHit.match },
					fix(fixer) {
						const quote = sourceCode.getText(node)[0];
						if (quote === "`") return fixer.replaceText(node, "`" + rebuilt + "`");
						const escaped = rebuilt.replace(new RegExp(`\\\\|${quote}`, "g"), (ch) => "\\" + ch);
						return fixer.replaceText(node, quote + escaped + quote);
					}
				});
			},
			Program() {
				const comments = sourceCode.getAllComments();
				for (let i = 0, { length } = comments; i < length; i += 1) {
					const comment = comments[i];
					if (BYPASS_RE$23.test(comment.value)) continue;
					const hits = findHits(comment.value);
					if (hits.length === 0) continue;
					let rebuilt = "";
					let cursor = 0;
					let mutated = false;
					for (let j = 0, hitsLength = hits.length; j < hitsLength; j += 1) {
						const h = hits[j];
						rebuilt += comment.value.slice(cursor, h.start);
						const replacement = REPORT_ONLY.has(h.stem) ? void 0 : rewriteHit(h.match);
						if (replacement) {
							rebuilt += replacement;
							mutated = true;
						} else rebuilt += h.match;
						cursor = h.end;
					}
					rebuilt += comment.value.slice(cursor);
					if (!mutated) {
						for (let j = 0, hitsLength = hits.length; j < hitsLength; j += 1) {
							const h = hits[j];
							let messageId = "legacy";
							if (h.stem === "master") messageId = "legacyMaster";
							else if (h.stem === "slave") messageId = "legacySlave";
							/* c8 ignore stop */
							context.report({
								node: comment,
								messageId,
								data: { match: h.match }
							});
						}
						continue;
					}
					const firstHit = hits[0];
					let messageId = "legacy";
					if (firstHit.stem === "master") messageId = "legacyMaster";
					else if (firstHit.stem === "slave") messageId = "legacySlave";
					context.report({
						node: comment,
						messageId,
						data: { match: firstHit.match },
						fix(fixer) {
							const prefix = comment.type === "Line" ? "//" : "/*";
							const suffix = comment.type === "Line" ? "" : "*/";
							return fixer.replaceTextRange(comment.range, prefix + rebuilt + suffix);
						}
					});
				}
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/max-comment-block-lines/index.mts
const ALLOW_ID$1 = "long-comment-block";
/**
* Group comments into contiguous blocks. Adjacent line comments (`//` on
* consecutive lines) form one block; a single `/* *\/` comment is already a
* block of its own however many lines it spans. A blank line between two
* comments ends the block, matching how a reader sees them.
*/
function groupCommentBlocks(comments) {
	const sorted = comments.filter((c) => typeof c?.loc?.start?.line === "number").toSorted((a, b) => a.loc.start.line - b.loc.start.line);
	const blocks = [];
	let first;
	let endLine = 0;
	for (let i = 0, { length } = sorted; i < length; i += 1) {
		const c = sorted[i];
		const start = c.loc.start.line;
		const end = c.loc.end?.line ?? start;
		if (first && start === endLine + 1) {
			endLine = end;
			continue;
		}
		if (first) blocks.push({
			startLine: first.loc.start.line,
			endLine,
			lines: endLine - first.loc.start.line + 1,
			first
		});
		first = c;
		endLine = end;
	}
	if (first) blocks.push({
		startLine: first.loc.start.line,
		endLine,
		lines: endLine - first.loc.start.line + 1,
		first
	});
	return blocks;
}
const rule$101 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "An inline comment block must not out-run the file-header budget. Long prose belongs in docs/agents.md, linked from a short comment.",
			category: "Best Practices",
			recommended: true
		},
		messages: { tooLong: "Comment block runs {{lines}} lines, over the {{limit}}-line cap — past this a reader skips it. Keep the constraint or invariant here and move the discussion into `docs/agents.md/**`, linked from a one-line pointer. Bypass: add a `socket-lint: allow long-comment-block` comment." },
		schema: [{
			type: "object",
			properties: { limit: {
				type: "integer",
				minimum: 5
			} },
			additionalProperties: false
		}]
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const hasBypassComment = makeBypassCommentChecker(context, ALLOW_ID$1);
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const configured = context.options?.[0]?.limit;
		const limit = typeof configured === "number" && configured >= 5 ? configured : 20;
		return { Program(_node) {
			const blocks = groupCommentBlocks(sourceCode.getAllComments && sourceCode.getAllComments() || []);
			for (let i = 0, { length } = blocks; i < length; i += 1) {
				const b = blocks[i];
				if (b.startLine <= 20) continue;
				if (b.lines <= limit) continue;
				if (hasBypassComment(b.first)) continue;
				context.report({
					node: b.first,
					messageId: "tooLong",
					data: {
						lines: String(b.lines),
						limit: String(limit)
					}
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/max-file-lines/index.mts
const SOFT_CAP = 500;
const HARD_CAP = 1e3;
const BYPASS_RE$22 = /max-file-lines:\s*(?!legitimate\b)[a-z][a-z-]*\s*[—:-]\s*\S/i;
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$100 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Files have a soft cap of 500 lines (warn) and a hard cap of 1000 lines (error). Split along natural seams.",
			category: "Best Practices",
			recommended: true
		},
		messages: {
			soft: "{{lines}} lines — past the 500-line soft cap. Consider splitting along natural seams (one tool / domain / phase per file). See CLAUDE.md \"File size\".",
			hard: "{{lines}} lines — past the 1000-line hard cap. Split this file. See CLAUDE.md \"File size\"."
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { Program(node) {
			const lines = node.loc.end.line;
			if (lines <= SOFT_CAP) return;
			if (lines > HARD_CAP) {
				const leadingComments = sourceCode.getAllComments().filter((c) => c.loc.start.line <= 20);
				for (let i = 0, { length } = leadingComments; i < length; i += 1) {
					const c = leadingComments[i];
					if (BYPASS_RE$22.test(c.value)) return;
				}
			}
			const messageId = lines > HARD_CAP ? "hard" : "soft";
			context.report({
				loc: {
					line: 1,
					column: 0
				},
				messageId,
				data: { lines: String(lines) }
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-agent-brand-assumption/index.mts
const GENERIC_CLAUDE_PATTERNS = [
	/\bClaude\s+(?:blocks?|can|chooses?|loads?|must|needs?|reads?|reports?|runs?|sees|should|uses?|will|writes?)\b/i,
	/\bClaude(?:'s)?\s+(?:agent|assistant|context|output|response|session|tool|tools|turn|workflow)\b/i,
	/\bthe\s+Claude\s+agent\b/i
];
const PRODUCT_SPECIFIC_RE = /\b(?:@anthropic-ai\/claude|CLAUDE\.md|CLAUDE_PROJECT_DIR|Claude Code|claude\s+(?:--print|-p|CLI|SDK))\b/i;
function genericClaudePhrase(text) {
	if (PRODUCT_SPECIFIC_RE.test(text)) return;
	for (let i = 0, { length } = GENERIC_CLAUDE_PATTERNS; i < length; i += 1) {
		const match = GENERIC_CLAUDE_PATTERNS[i].exec(text);
		if (match) return match[0];
	}
}
function literalText(node) {
	if (typeof node.value === "string") return node.value;
}
function templateText(node) {
	const cooked = node.value?.cooked;
	return typeof cooked === "string" ? cooked : void 0;
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$99 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Keep generic agent guidance cross-agent: say \"the agent\" unless the text names a real Claude-specific integration.",
			category: "Best Practices",
			recommended: true
		},
		messages: { brandAssumption: "Generic agent guidance says \"{{phrase}}\". Use \"the agent\" / \"agents\" unless this is a real Claude-specific integration." },
		schema: []
	},
	create(context) {
		function reportIfGeneric(node, text) {
			const phrase = genericClaudePhrase(text);
			if (!phrase) return;
			context.report({
				node,
				messageId: "brandAssumption",
				data: { phrase }
			});
		}
		return {
			Program(node) {
				const comments = (context.getSourceCode ? context.getSourceCode() : context.sourceCode)?.getAllComments?.() ?? [];
				for (let i = 0, { length } = comments; i < length; i += 1) {
					const comment = comments[i];
					reportIfGeneric(node, comment.value);
				}
			},
			Literal(node) {
				const text = literalText(node);
				if (text) reportIfGeneric(node, text);
			},
			TemplateElement(node) {
				const text = templateText(node);
				if (text) reportIfGeneric(node, text);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-bare-crypto-named-usage/index.mts
const CRYPTO_NAMED_EXPORTS = /* @__PURE__ */ new Set([
	"createCipher",
	"createCipheriv",
	"createDecipher",
	"createDecipheriv",
	"createDiffieHellman",
	"createECDH",
	"createHash",
	"createHmac",
	"createPrivateKey",
	"createPublicKey",
	"createSecretKey",
	"createSign",
	"createVerify",
	"diffieHellman",
	"generateKeyPair",
	"generateKeyPairSync",
	"getCiphers",
	"getCurves",
	"getDiffieHellman",
	"getHashes",
	"hash",
	"hkdf",
	"hkdfSync",
	"pbkdf2",
	"pbkdf2Sync",
	"privateDecrypt",
	"privateEncrypt",
	"publicDecrypt",
	"publicEncrypt",
	"randomBytes",
	"randomFillSync",
	"randomInt",
	"randomUUID",
	"scrypt",
	"scryptSync",
	"sign",
	"subtle",
	"timingSafeEqual",
	"verify",
	"webcrypto"
]);
/**
* Collect the names bound by a single statement-list element, a declaration.
* Covers the forms that can shadow a crypto export name in practice: `const` /
* `let` / `var` declarators (incl. simple destructuring), function + class
* declarations. Not exhaustive ESTree binding analysis — just enough to tell a
* local variable named `hash` apart from a bare `node:crypto` export
* reference.
*/
function collectDeclaredNames(stmt, out) {
	if (!stmt || typeof stmt.type !== "string") return;
	if ((stmt.type === "ExportDefaultDeclaration" || stmt.type === "ExportNamedDeclaration") && stmt.declaration) {
		collectDeclaredNames(stmt.declaration, out);
		return;
	}
	if (stmt.type === "VariableDeclaration") {
		const decls = Array.isArray(stmt.declarations) ? stmt.declarations : [];
		for (let i = 0, { length } = decls; i < length; i += 1) {
			const id = decls[i]?.id;
			if (id?.type === "Identifier" && typeof id.name === "string") out.add(id.name);
			else if (id?.type === "ObjectPattern") {
				const props = Array.isArray(id.properties) ? id.properties : [];
				for (let j = 0, plen = props.length; j < plen; j += 1) {
					const val = props[j]?.value;
					if (val?.type === "Identifier" && typeof val.name === "string") out.add(val.name);
				}
			} else if (id?.type === "ArrayPattern") {
				const els = Array.isArray(id.elements) ? id.elements : [];
				for (let j = 0, elen = els.length; j < elen; j += 1) {
					const el = els[j];
					if (el?.type === "Identifier" && typeof el.name === "string") out.add(el.name);
				}
			}
		}
		return;
	}
	if ((stmt.type === "ClassDeclaration" || stmt.type === "FunctionDeclaration") && stmt.id?.type === "Identifier" && typeof stmt.id.name === "string") out.add(stmt.id.name);
}
/**
* Add the parameter names of a function-like node to `out`. Handles plain
* identifier params and the common `{ a }` / `[a]` / `a = default` / `...rest`
* wrappers — enough to recognize a param shadowing a crypto export name.
*/
function collectParamNames(fn, out) {
	const params = Array.isArray(fn?.params) ? fn.params : [];
	for (let i = 0, { length } = params; i < length; i += 1) {
		let p = params[i];
		if (p?.type === "AssignmentPattern") p = p.left;
		if (p?.type === "RestElement") p = p.argument;
		if (p?.type === "Identifier" && typeof p.name === "string") out.add(p.name);
	}
}
/**
* Walk the ancestor chain from `node` and return true if `name` resolves to a
* binding declared in an enclosing scope (a local variable, function/class
* name, or function parameter) rather than to the bare `node:crypto` export.
* This is what stops the rule flagging a `const hash = ...; hash.update()`
* local as if `hash` were the crypto `hash` export.
*/
function resolvesToLocalBinding(node, name) {
	let current = node;
	while (current) {
		const parent = current.parent;
		if (!parent) break;
		if (parent.type === "BlockStatement" || parent.type === "Program" || parent.type === "StaticBlock") {
			const body = Array.isArray(parent.body) ? parent.body : [];
			const declared = /* @__PURE__ */ new Set();
			for (let i = 0, { length } = body; i < length; i += 1) collectDeclaredNames(body[i], declared);
			if (declared.has(name)) return true;
		}
		if (parent.type === "ArrowFunctionExpression" || parent.type === "FunctionDeclaration" || parent.type === "FunctionExpression") {
			const declared = /* @__PURE__ */ new Set();
			collectParamNames(parent, declared);
			if (declared.has(name)) return true;
		}
		current = parent;
	}
	return false;
}
const rule$98 = {
	meta: {
		type: "problem",
		docs: {
			description: "Bare reference to a node:crypto named export with `import crypto from 'node:crypto'` in scope — runtime ReferenceError. Use `crypto.<name>(...)`.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: "code",
		messages: { bareNamed: "`{{name}}` is a node:crypto named export but the file imports `crypto` as a default. Either reference as `crypto.{{name}}` (fleet style; auto-fixable) or change the import to a named form." },
		schema: []
	},
	create(context) {
		let hasDefaultCryptoImport = false;
		return {
			ImportDeclaration(node) {
				if (node.source?.value !== "node:crypto") return;
				const specs = node.specifiers ?? [];
				for (let i = 0, { length } = specs; i < length; i += 1) {
					const spec = specs[i];
					if (spec.type === "ImportDefaultSpecifier" && spec.local?.name === "crypto") {
						hasDefaultCryptoImport = true;
						return;
					}
				}
			},
			Identifier(node) {
				if (!hasDefaultCryptoImport) return;
				const name = node.name;
				if (!name || !CRYPTO_NAMED_EXPORTS.has(name)) return;
				const parent = node.parent;
				if (!parent) return;
				if (parent.type === "ImportSpecifier") return;
				if (parent.type === "MemberExpression" && parent.property === node && !parent.computed) return;
				if (parent.type === "Property" && parent.key === node && !parent.computed) return;
				if ((parent.type === "AccessorProperty" || parent.type === "MethodDefinition" || parent.type === "PropertyDefinition" || parent.type === "TSMethodSignature" || parent.type === "TSPropertySignature") && parent.key === node && !parent.computed) return;
				if (parent.type === "TSEnumMember" && parent.id === node) return;
				if (parent.type === "VariableDeclarator" && parent.id === node) return;
				if ((parent.type === "ArrowFunctionExpression" || parent.type === "FunctionDeclaration" || parent.type === "FunctionExpression") && Array.isArray(parent.params) && parent.params.includes(node)) return;
				if (resolvesToLocalBinding(node, name)) return;
				context.report({
					node,
					messageId: "bareNamed",
					data: { name },
					fix(fixer) {
						return fixer.replaceText(node, `crypto.${name}`);
					}
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-bare-spawn-childproc-access/index.mts
const CHILDPROC_MEMBERS = /* @__PURE__ */ new Set([
	"connected",
	"disconnect",
	"exitCode",
	"kill",
	"killed",
	"on",
	"once",
	"pid",
	"ref",
	"send",
	"stderr",
	"stdin",
	"stdio",
	"stdout",
	"unref"
]);
const ALLOW_RE$2 = /socket-lint:\s*allow\s+bare-spawn-access/;
function isSpawnCall$1(node) {
	if (!node || node.type !== "CallExpression") return false;
	const callee = node.callee;
	if (!callee) return false;
	if (callee.type === "Identifier") return callee.name === "spawn";
	if (callee.type === "MemberExpression" && !callee.computed && callee.property?.type === "Identifier") return callee.property.name === "spawn";
	return false;
}
const rule$97 = {
	meta: {
		type: "problem",
		docs: {
			description: "The fleet spawn returns `{ process } & Promise`, not a bare ChildProcess — access streams/events via `.process` (or `await` for `.code`/`.stdout`), never directly.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: { bareSpawnAccess: "`{{name}}` is the fleet spawn return (`process` + Promise), so `.{{member}}` is undefined — it lives on `{{name}}.process`. Destructure `const { process: child } = spawn(...)` for streams/events, or `await spawn(...)` (try/catch — it rejects on non-zero) for `.code`/`.stdout`/`.stderr`." },
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, ALLOW_RE$2);
		const bareSpawnNames = /* @__PURE__ */ new Set();
		return {
			VariableDeclarator(node) {
				const id = node.id;
				const init = node.init;
				if (!id || id.type !== "Identifier" || !init) return;
				if (isSpawnCall$1(init)) bareSpawnNames.add(id.name);
			},
			MemberExpression(node) {
				if (node.computed) return;
				const obj = node.object;
				const prop = node.property;
				if (!obj || obj.type !== "Identifier" || !bareSpawnNames.has(obj.name) || !prop || prop.type !== "Identifier" || !CHILDPROC_MEMBERS.has(prop.name)) return;
				if (hasBypassComment(node)) return;
				context.report({
					node,
					messageId: "bareSpawnAccess",
					data: {
						name: obj.name,
						member: prop.name
					}
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-boolean-trap-param/index.mts
const BYPASS_RE$21 = /socket-lint:\s*allow\s+boolean-trap/;
function isBooleanTyped(param) {
	const ann = param?.typeAnnotation?.typeAnnotation;
	if (!ann) return false;
	if (ann.type === "TSBooleanKeyword") return true;
	if (ann.type === "TSUnionType" && Array.isArray(ann.types)) return ann.types.some((t) => t?.type === "TSBooleanKeyword");
	return false;
}
const rule$96 = {
	meta: {
		type: "problem",
		docs: {
			description: "No boolean-trap params — a boolean positional in a 2+-param signature should be an options object. Per CLAUDE.md \"Function declarations\".",
			category: "Best Practices",
			recommended: true
		},
		messages: { banned: "boolean positional param `{{name}}` — callers write `foo(x, true)` where the flag is meaningless at the call site. Use an options object: `foo(x, { {{name}}: true })`. Bypass: add a `socket-lint: allow boolean-trap` comment." },
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$21);
		function check(node) {
			if (node.body == null) return;
			const params = node.params;
			if (!Array.isArray(params) || params.length < 2) return;
			if (hasBypassComment(node)) return;
			for (let i = 0, { length } = params; i < length; i += 1) {
				const p = params[i];
				if (isBooleanTyped(p)) {
					const name = p.type === "Identifier" ? p.name : "flag";
					context.report({
						node: p,
						messageId: "banned",
						data: { name }
					});
				}
			}
		}
		return {
			FunctionDeclaration: check,
			FunctionExpression: check,
			ArrowFunctionExpression: check
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/lib/iterable-kind.mts
const SET_TYPE_NAMES = /* @__PURE__ */ new Set([
	"ReadonlySet",
	"Set",
	"WeakSet"
]);
const MAP_TYPE_NAMES = /* @__PURE__ */ new Set([
	"Map",
	"ReadonlyMap",
	"WeakMap"
]);
const ITERABLE_TYPE_NAMES = /* @__PURE__ */ new Set([
	"AsyncIterable",
	"Iterable",
	"IterableIterator"
]);
const ARRAY_TYPE_NAMES = /* @__PURE__ */ new Set(["Array", "ReadonlyArray"]);
const ARRAY_PRODUCING_METHODS = /* @__PURE__ */ new Set([
	"concat",
	"filter",
	"flat",
	"flatMap",
	"map",
	"slice",
	"split",
	"toReversed",
	"toSorted",
	"toSpliced"
]);
const FLAGGED_KINDS = /* @__PURE__ */ new Set([
	"iterable",
	"map",
	"set"
]);
const SCOPE_NODE_TYPES = /* @__PURE__ */ new Set([
	"ArrowFunctionExpression",
	"BlockStatement",
	"CatchClause",
	"ClassDeclaration",
	"ClassExpression",
	"ForInStatement",
	"ForOfStatement",
	"ForStatement",
	"FunctionDeclaration",
	"FunctionExpression",
	"Program",
	"TSDeclareFunction"
]);
const FUNCTION_NODE_TYPES = /* @__PURE__ */ new Set([
	"ArrowFunctionExpression",
	"FunctionDeclaration",
	"FunctionExpression",
	"TSDeclareFunction"
]);
/**
* Classify a TS type-annotation AST node (the `: T` part of a binding). Returns
* the kind, or `'unknown'` if the annotation is absent or doesn't match a
* recognized shape. Shallow-only — does NOT unwrap `Promise<Set<…>>` (returns
* unknown, which is safe).
*/
function classifyTypeAnnotation(annotation) {
	if (!annotation || !annotation.typeAnnotation) return "unknown";
	const t = annotation.typeAnnotation;
	if (t.type === "TSArrayType") return "array";
	if (t.type === "TSTypeReference") {
		const name = t.typeName && t.typeName.type === "Identifier" ? t.typeName.name : void 0;
		if (!name) return "unknown";
		if (SET_TYPE_NAMES.has(name)) return "set";
		if (MAP_TYPE_NAMES.has(name)) return "map";
		if (ITERABLE_TYPE_NAMES.has(name)) return "iterable";
		if (ARRAY_TYPE_NAMES.has(name)) return "array";
	}
	return "unknown";
}
/**
* Classify the initializer expression a VariableDeclarator is bound to.
* Recognizes `new Set(...)` / `new Map(...)` and a handful of
* array-materializing calls (`Array.from`, `Object.keys`, etc.) so the rule
* doesn't fire on post-fix `const arr = Array.from(set)` shapes.
*/
function classifyInit(init) {
	if (!init) return "unknown";
	if (init.type === "ArrayExpression") return "array";
	if (init.type === "NewExpression" && init.callee.type === "Identifier") {
		const name = init.callee.name;
		if (SET_TYPE_NAMES.has(name)) return "set";
		if (MAP_TYPE_NAMES.has(name)) return "map";
		if (ARRAY_TYPE_NAMES.has(name)) return "array";
	}
	if (init.type === "CallExpression" && init.callee.type === "MemberExpression" && init.callee.object.type === "Identifier" && !init.callee.computed && init.callee.property.type === "Identifier") {
		const objName = init.callee.object.name;
		const propName = init.callee.property.name;
		if (objName === "Array" && (propName === "from" || propName === "of")) return "array";
		if (objName === "Object" && (propName === "entries" || propName === "keys" || propName === "values")) return "array";
	}
	if (init.type === "CallExpression" && init.callee.type === "MemberExpression" && !init.callee.computed && init.callee.property.type === "Identifier" && ARRAY_PRODUCING_METHODS.has(init.callee.property.name)) return "array";
	return "unknown";
}
/**
* Classify a single VariableDeclarator AST node. Type annotation wins over
* inferred init kind (explicit > implicit).
*/
function classifyVariableDeclarator(declarator) {
	if (!declarator || !declarator.id || declarator.id.type !== "Identifier") return "unknown";
	const annotated = classifyTypeAnnotation(declarator.id.typeAnnotation);
	if (annotated !== "unknown") return annotated;
	return classifyInit(declarator.init);
}
/**
* Find a binding for `name` declared _directly_ in the given scope node (does
* not recurse into nested scopes). Returns the classified Kind, or undefined if
* no such binding exists in this scope.
*
* Each scope-node type stores its declarations differently:
*
* - `Program` / `BlockStatement`: scan `body` for top-level `VariableDeclaration`
*   and `FunctionDeclaration` nodes.
* - `Function*`: check the function's `params` for an Identifier param named
*   `name`. The body BlockStatement is a separate scope (visited on the way
*   up).
* - `ForStatement`: check the `init` (a VariableDeclaration whose declarators are
*   scoped to the loop).
* - `ForOfStatement` / `ForInStatement`: check the `left` (a VariableDeclaration
*   declaring the loop var, scoped to the loop).
* - `CatchClause`: check the `param` Identifier.
*/
function findInScope(scope, name) {
	if (!scope) return;
	if (FUNCTION_NODE_TYPES.has(scope.type)) {
		const params = scope.params;
		if (params) for (let i = 0, { length } = params; i < length; i += 1) {
			const p = params[i];
			if (p && p.type === "Identifier" && p.name === name) return classifyTypeAnnotation(p.typeAnnotation);
		}
		return;
	}
	if (scope.type === "CatchClause") {
		const p = scope.param;
		if (p && p.type === "Identifier" && p.name === name) return classifyTypeAnnotation(p.typeAnnotation);
		return;
	}
	if (scope.type === "ForStatement") {
		const init = scope.init;
		if (init && init.type === "VariableDeclaration") {
			const k = findInVariableDeclaration(init, name);
			if (k !== void 0) return k;
		}
		return;
	}
	if (scope.type === "ForInStatement" || scope.type === "ForOfStatement") {
		const left = scope.left;
		if (left && left.type === "VariableDeclaration") {
			const k = findInVariableDeclaration(left, name);
			if (k !== void 0) return k;
		}
		return;
	}
	if (scope.type === "BlockStatement" || scope.type === "Program") {
		const body = scope.body;
		if (!body) return;
		for (let i = 0, { length } = body; i < length; i += 1) {
			const stmt = body[i];
			if (!stmt) continue;
			if (stmt.type === "VariableDeclaration") {
				const k = findInVariableDeclaration(stmt, name);
				if (k !== void 0) return k;
			} else if (stmt.type === "ExportNamedDeclaration" && stmt.declaration && stmt.declaration.type === "VariableDeclaration") {
				const k = findInVariableDeclaration(stmt.declaration, name);
				if (k !== void 0) return k;
			}
		}
		return;
	}
}
/**
* Scan a VariableDeclaration node's declarators for one whose id is
* `Identifier(name)`. Returns the classified Kind if found, else undefined.
*/
function findInVariableDeclaration(decl, name) {
	const decls = decl.declarations;
	if (!decls) return;
	for (let i = 0, { length } = decls; i < length; i += 1) {
		const d = decls[i];
		if (d?.id && d.id.type === "Identifier" && d.id.name === name) return classifyVariableDeclarator(d);
	}
}
/**
* Resolve `name` as seen from the use-site `useNode`. Walks the AST parent
* chain, checking each scope-creating ancestor for a direct declaration of
* `name`. Returns the nearest enclosing scope's classification, or `'unknown'`
* if no declaration is found.
*
* The walk stops on the first declaring scope (JS lookup semantics): a
* function-local `const closure = new Map()` shadows an outer `const closure =
* await fn()` even if the inner is declared "later" in source order, because
* they live in different scopes and the use-site picks the nearest declaring
* scope on its parent chain.
*/
function resolveKind(useNode, name) {
	let cur = useNode;
	while (cur) {
		if (SCOPE_NODE_TYPES.has(cur.type)) {
			const k = findInScope(cur, name);
			if (k !== void 0) return k;
		}
		cur = cur.parent;
	}
	return "unknown";
}
/**
* Wire the scope-aware kind resolver into a rule. Returns `resolveKind(useNode,
* name)` for the rule to call from its use-site visitors (e.g. ForStatement /
* MemberExpression).
*
* Unlike the older `trackKinds()` API, this returns no visitors: the resolver
* walks the AST on-demand instead of building a pre-populated map. The
* trade-off is one parent-chain walk per lookup vs. an O(file-size) population
* pass at create() time. Lookups are scoped to rule call sites (ForStatement,
* MemberExpression with a Set/Map LHS), so the per-lookup cost is bounded.
*
* Usage:
*
* Const resolveKind = createKindResolver() return { ForStatement(node) { const
* kind = resolveKind(node, 'someName') … }, }
*/
function createKindResolver() {
	return resolveKind;
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-cached-for-on-iterable/index.mts
/**
* The cached-for-loop init shape we're looking for:
*
* Let i = 0, { length } = X.
*
* Returns the identifier `X` if the shape matches and `X` is a bare Identifier,
* otherwise undefined.
*/
function matchCachedForInit(init) {
	if (!init || init.type !== "VariableDeclaration") return;
	const decls = init.declarations;
	if (!decls || decls.length < 2) return;
	for (let i = 0, { length: declsLen } = decls; i < declsLen; i += 1) {
		const d = decls[i];
		if (d.id && d.id.type === "ObjectPattern" && d.id.properties && d.id.properties.length === 1 && d.id.properties[0].type === "Property" && d.id.properties[0].key && d.id.properties[0].key.type === "Identifier" && d.id.properties[0].key.name === "length" && d.init && d.init.type === "Identifier") return d.init.name;
	}
}
const rule$95 = {
	meta: {
		type: "problem",
		docs: {
			description: "Don't apply the cached-length `for (let i = 0, { length } = X; …)` pattern to Sets, Maps, or generic Iterables — it silently no-ops (X has no `.length` and isn't integer-indexable).",
			category: "Correctness",
			recommended: true
		},
		fixable: void 0,
		messages: {
			noCachedForOnIterable: "`{{name}}` is a {{kind}} — cached-length `for` is a silent no-op (no `.length`, not integer-indexable). Use `for (const item of {{name}}) { … }` instead. (Do NOT materialize with `Array.from({{name}})` just to keep the cached-length shape — that adds a wasted allocation. `for...of` is the canonical fix for sets / maps / iterables.)",
			lengthOnIterable: "`{{name}}.length` reads `undefined` — {{kind}} has `.size`, not `.length`. Either rename to `.size`, or convert `{{name}}` to an array first if the semantics demand `.length`.",
			indexedAccessOnIterable: "`{{name}}[…]` returns `undefined` — {{kind}} isn't integer-indexable. Use `for (const item of {{name}})` (or one of the entries / keys / values iterators) to read elements."
		},
		schema: []
	},
	create(context) {
		const resolveKind = createKindResolver();
		const flaggedLoops = /* @__PURE__ */ new Map();
		function insideFlaggedLoopFor(useNode, iterName) {
			let cur = useNode.parent;
			while (cur) {
				if (cur.type === "ForStatement") {
					if (flaggedLoops.get(cur) === iterName) return true;
				}
				cur = cur.parent;
			}
			return false;
		}
		return {
			ForStatement(node) {
				const iterName = matchCachedForInit(node.init);
				if (!iterName) return;
				const kind = resolveKind(node, iterName);
				if (!FLAGGED_KINDS.has(kind)) return;
				flaggedLoops.set(node, iterName);
				context.report({
					node: node.init,
					messageId: "noCachedForOnIterable",
					data: {
						name: iterName,
						kind
					}
				});
			},
			MemberExpression(node) {
				if (!node.object || node.object.type !== "Identifier") return;
				const name = node.object.name;
				const kind = resolveKind(node, name);
				if (!FLAGGED_KINDS.has(kind)) return;
				if (insideFlaggedLoopFor(node, name)) return;
				if (!node.computed && node.property && node.property.type === "Identifier" && node.property.name === "length") {
					if (node.parent && node.parent.type === "AssignmentPattern" && node.parent.left === node) return;
					context.report({
						node,
						messageId: "lengthOnIterable",
						data: {
							name,
							kind
						}
					});
					return;
				}
				if (node.computed && node.property) {
					const p = node.property;
					if (p.type === "Literal" && typeof p.value === "number" || p.type === "NumericLiteral" && typeof p.value === "number" || p.type === "Identifier" && typeof p.name === "string" && /^(?:cur|cursor|i|idx|index|j|k|n|pos)$/.test(p.name)) context.report({
						node,
						messageId: "indexedAccessOnIterable",
						data: {
							name,
							kind
						}
					});
				}
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-comment-glob-star-slash/index.mts
function backtickSplitGlobs(value) {
	let out = "";
	let inTick = false;
	for (let i = 0, { length } = value; i < length; i += 1) {
		const c = value[i];
		if (c === "`") {
			inTick = !inTick;
			out += c;
			continue;
		}
		if (!inTick && c === "*") {
			let j = i;
			while (value[j] === "*") j += 1;
			let k = j;
			if (value[k] === "\\") k += 1;
			if (value[k] === "/") {
				const stars = value.slice(i, j);
				let m = k + 1;
				while (m < length && !/\s/.test(value[m]) && value[m] !== "`") m += 1;
				out += `\`${stars}\`/\`${value.slice(k + 1, m)}\``;
				i = m - 1;
				continue;
			}
		}
		out += c;
	}
	return out;
}
function bodyHasGlobStarSlash(value) {
	return backtickSplitGlobs(value) !== value;
}
const rule$94 = {
	meta: {
		type: "problem",
		docs: {
			description: "Forbid a `*/`-forming glob sequence in a block comment; oxfmt's jsdoc reflow turns it into a comment-closing token and corrupts the file. Backtick-split the glob instead.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: "code",
		messages: { globStarSlash: "Block comment contains `{{snippet}}` — a `*`-before-`/` glob that oxfmt's jsdoc reflow rewrites into a comment-closing `*/`, breaking the file. Backtick-split it so no literal `*/` survives (e.g. `**`/`*.yml` becomes `` `**`/`*.yml` ``)." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { Program() {
			const comments = sourceCode.getAllComments ? sourceCode.getAllComments() : [];
			for (let i = 0, { length } = comments; i < length; i += 1) {
				const comment = comments[i];
				if (comment.type !== "Block") continue;
				if (!bodyHasGlobStarSlash(comment.value)) continue;
				const m = /\*+\\?\/\S*/.exec(comment.value);
				/* c8 ignore start - bodyHasGlobStarSlash true guarantees m is non-null; the else arm is unreachable */
				const snippet = m ? m[0].replace(/\\\//, "/") : "*/";
				/* c8 ignore stop */
				context.report({
					node: comment,
					messageId: "globStarSlash",
					data: { snippet },
					fix(fixer) {
						const fixedBody = backtickSplitGlobs(comment.value);
						return fixer.replaceText(comment, `/*${fixedBody}*/`);
					}
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/_shared/inject-import.mts
/**
* Walk a Program node body once and figure out: - the last top-level
* ImportDeclaration node, or undefined - whether `importName` is already
* imported (from ANY source) - whether a top-level `localName` identifier
* already exists (any const/let/var or import-as-local with that name)
*
* Import detection ignores the specifier path: a file inside the lib package
* itself imports `getDefaultLogger` from `'../logger'`, while a downstream repo
* imports the same name from `'@socketsecurity/lib-stable/logger/default'`.
* Both resolve to the same identifier; either should count as "already
* imported" so the autofix doesn't inject a duplicate (and broken — see issue
* #64). The match is by `importName` + `localName`, so the specifier path is
* not a parameter.
*/
function summarizeImportTarget(program, importName, localName) {
	let lastImport;
	let hasImport = false;
	let hasLocal = false;
	for (const stmt of program.body) {
		if (stmt.type === "ImportDeclaration") {
			lastImport = stmt;
			for (const spec of stmt.specifiers) {
				if (spec.type === "ImportSpecifier" && spec.imported && spec.imported.name === importName) hasImport = true;
				if (localName && spec.local && spec.local.name === localName && (spec.type === "ImportDefaultSpecifier" || spec.type === "ImportNamespaceSpecifier" || spec.type === "ImportSpecifier")) hasLocal = true;
			}
			continue;
		}
		if (!localName) continue;
		const declNode = stmt.type === "ExportDefaultDeclaration" || stmt.type === "ExportNamedDeclaration" ? stmt.declaration ?? stmt : stmt;
		if ((declNode.type === "ClassDeclaration" || declNode.type === "FunctionDeclaration") && declNode.id && declNode.id.type === "Identifier" && declNode.id.name === localName) {
			hasLocal = true;
			continue;
		}
		const varDecl = stmt.type === "VariableDeclaration" ? stmt : stmt.type === "ExportNamedDeclaration" && stmt.declaration && stmt.declaration.type === "VariableDeclaration" ? stmt.declaration : void 0;
		if (!varDecl) continue;
		for (const decl of varDecl.declarations) if (decl.id && decl.id.type === "Identifier" && decl.id.name === localName) hasLocal = true;
	}
	return {
		hasImport,
		hasLocal,
		lastImport
	};
}
/**
* Build the fixer-side inserts for missing import + optional hoist. Returns an
* array of fixer operations the caller appends to its own fix() return value.
*
* Summary — output of summarizeImportTarget() fixer — the fixer passed to
* context.report({ fix }) importLine — the literal `import { ... } from '...'`
* text hoistLine — optional; the literal `const x = ...()` text.
*/
function appendImportFixes(summary, fixer, importLine, hoistLine) {
	const ops = [];
	if (!summary.hasImport) if (summary.lastImport) ops.push(fixer.insertTextAfter(summary.lastImport, `\n${importLine}`));
	else ops.push(fixer.insertTextBeforeRange([0, 0], `${importLine}\n`));
	if (hoistLine && !summary.hasLocal) if (summary.lastImport) ops.push(fixer.insertTextAfter(summary.lastImport, `\n\n${hoistLine}`));
	else ops.push(fixer.insertTextBeforeRange([0, 0], `${hoistLine}\n\n`));
	return ops;
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-console-prefer-logger/index.mts
const CONSOLE_TO_LOGGER = {
	debug: "log",
	error: "fail",
	info: "info",
	log: "log",
	trace: "log",
	warn: "warn"
};
const LOGGER_IMPORT_LINE$1 = "import { getDefaultLogger } from '@socketsecurity/lib-stable/logger/default'";
const LOGGER_HOIST_LINE$1 = "const logger = getDefaultLogger()";
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$93 = {
	meta: {
		type: "problem",
		docs: {
			description: "Ban console.* calls; use logger from @socketsecurity/lib-stable/logger/default.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: { banned: "console.{{method}}() — use logger.{{loggerMethod}}() from @socketsecurity/lib-stable/logger/default." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		let summary;
		function ensureSummary() {
			if (summary) return summary;
			summary = summarizeImportTarget(sourceCode.ast, "getDefaultLogger", "logger");
			return summary;
		}
		return { MemberExpression(node) {
			if (node.object.type !== "Identifier" || node.object.name !== "console" || node.property.type !== "Identifier") return;
			const method = node.property.name;
			const loggerMethod = CONSOLE_TO_LOGGER[method];
			if (!loggerMethod) return;
			const parent = node.parent;
			if (!parent || parent.type !== "CallExpression" || parent.callee !== node) return;
			const s = ensureSummary();
			context.report({
				node,
				messageId: "banned",
				data: {
					method,
					loggerMethod
				},
				fix(fixer) {
					return [fixer.replaceText(node, `logger.${loggerMethod}`), ...appendImportFixes(s, fixer, LOGGER_IMPORT_LINE$1, LOGGER_HOIST_LINE$1)];
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-default-export/index.mts
/**
* @type {import('eslint').Rule.RuleModule}
*/
const CONFIG_ENTRYPOINT_RE = /\.config\.[cm]?[jt]s$/;
function isConfigEntrypoint(filename) {
	return CONFIG_ENTRYPOINT_RE.test((0, import_normalize.normalizePath)(filename));
}
const rule$92 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Forbid `export default` — use named exports so the export name is stable across import sites.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: void 0,
		hasSuggestions: true,
		messages: {
			noDefaultExport: "Avoid `export default` — use a named export so the export name is stable across imports, greppable, and composable with `export * from`.",
			noDefaultExportNoFix: "Avoid `export default` — the default-exported value is anonymous or a complex expression. Give it a name and switch to `export { <name> }`."
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		if (isConfigEntrypoint(context.filename ?? context.getFilename?.() ?? "")) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { ExportDefaultDeclaration(node) {
			const decl = node.declaration;
			if (!decl) return;
			if ((decl.type === "ClassDeclaration" || decl.type === "FunctionDeclaration") && decl.id && decl.id.type === "Identifier") {
				context.report({
					node,
					messageId: "noDefaultExport",
					suggest: [{
						messageId: "noDefaultExport",
						fix(fixer) {
							const declText = sourceCode.getText(decl);
							return fixer.replaceText(node, `export ${declText}`);
						}
					}]
				});
				return;
			}
			if (decl.type === "Identifier") {
				context.report({
					node,
					messageId: "noDefaultExport",
					suggest: [{
						messageId: "noDefaultExport",
						fix(fixer) {
							return fixer.replaceText(node, `export { ${decl.name} }`);
						}
					}]
				});
				return;
			}
			context.report({
				node,
				messageId: "noDefaultExportNoFix"
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/lib/test-file.mts
/**
* @file Shared `*.test.*` filename matcher for rules scoped to test files.
*   Extracted from the 7 rules that each hand-rolled the identical regex
*   (no-vitest-* family, no-src-import-in-test-expect). Matches `.test.mts` /
*   `.test.ts` / `.test.cts` / `.test.mjs` / `.test.js`.
*/
const TEST_FILE_RE$2 = /\.test\.(?:[mc]?[jt]s)$/;
function isTestFile$2(filePath) {
	return TEST_FILE_RE$2.test(filePath);
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-deprecation/index.mts
const DEPRECATION_ANNOTATION_RE = /^\s*(?:\*|\/\*\*?|\/\/)\s*@(?:deprecated|obsolete)\b/;
const BYPASS_RE$20 = /socket-lint:\s*allow\s+deprecated-marker/;
const rule$91 = {
	meta: {
		type: "problem",
		docs: {
			description: "Ban `@deprecated` / `@obsolete` markers — the fleet deletes rather than deprecates.",
			category: "Best Practices",
			recommended: true
		},
		messages: { banned: "`@deprecated` marker — the fleet deletes, it does not deprecate. Remove the code and its call sites in this change; there are no legacy fallbacks or back-compat aliases kept 'until consumers migrate'. If you are quoting an upstream API's own tag, append `// socket-lint: allow deprecated-marker`." },
		schema: []
	},
	create(context) {
		if (isTestFile$2(context.getFilename?.() ?? context.physicalFilename ?? "")) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { Program() {
			const rawText = typeof sourceCode?.getText === "function" ? sourceCode.getText() : sourceCode?.text ?? "";
			const lines = Array.isArray(sourceCode?.lines) ? sourceCode.lines : String(rawText).split("\n");
			for (let i = 0; i < lines.length; i += 1) {
				const line = lines[i];
				if (!DEPRECATION_ANNOTATION_RE.test(line) || BYPASS_RE$20.test(line)) continue;
				const column = line.length - line.trimStart().length;
				context.report({
					loc: {
						line: i + 1,
						column
					},
					messageId: "banned"
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-dynamic-import-outside-bundle/index.mts
/**
* @file Ban dynamic `import()` (ImportExpression) in code that isn't bundled.
*   The fleet favors static ES6 imports — dynamic import is only meaningful
*   when a bundler resolves it statically at build time. Scripts under
*   `scripts/` run directly via `node`; nothing bundles them, so a dynamic
*   import only adds a runtime async hop for no resolution win. Allowed paths:
*   `src/**`, `.config/**` (bundler configs themselves may load tools
*   dynamically via the bundler's API). No autofix: converting `await
*   import('foo')` to `import 'foo'` requires moving the statement to the top
*   of the file and removing `await`/destructuring — the bundler-aware AST
*   rewrite is non-trivial to do safely. Reporting only.
*/
const DEFAULT_BUNDLED_ROOTS = [
	"src/",
	".config/",
	"packages/"
];
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$90 = {
	meta: {
		type: "problem",
		docs: {
			description: "Ban dynamic import() outside bundled trees (src/, .config/, packages/).",
			category: "Best Practices",
			recommended: true
		},
		messages: { dynamic: "Dynamic import() in {{file}} — favor a static `import` statement at the top of the file. Dynamic import is only valid in bundled code (src/, .config/, packages/). If lazy resolution is required, justify it explicitly." },
		schema: [{
			type: "object",
			properties: { bundledRoots: {
				type: "array",
				items: { type: "string" },
				description: "Path prefixes (relative to repo root) where dynamic import() is allowed."
			} },
			additionalProperties: false
		}]
	},
	create(context) {
		const bundledRoots = (context.options[0] || {}).bundledRoots || DEFAULT_BUNDLED_ROOTS;
		const filename = context.physicalFilename || context.filename;
		const cwd = context.cwd || process.cwd();
		const relative = path.relative(cwd, filename).split(path.sep).join("/");
		if (bundledRoots.some((root) => relative.startsWith(root))) return {};
		return { ImportExpression(node) {
			context.report({
				node,
				messageId: "dynamic",
				data: { file: relative }
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/lib/fleet-paths.mts
/**
* The fleet's "1 path, 1 reference" source-of-truth file. Each fleet repo has
* one. Its exports are ordered by path-resolution flow (REPO_ROOT → primary
* roots → build paths → helpers) — deliberately not alphabetical, and the order
* is load-bearing for code review. Anything keyed on per-file behavior that
* recognizes `paths.mts` should match by suffix.
*/
const PATHS_FILE = "scripts/fleet/paths.mts";
/**
* Plugin-internal rule directories. Each rule lives at
* `.config/fleet/oxlint-plugin/{fleet,repo}/<id>/` with its `index.mts` and a
* co-located `test/` (mirrors `.claude/hooks/`). A rule's own files often
* contain the banned shape they ban as lookup-table data (e.g.
* `no-status-emoji` literally contains the emoji it bans) and its tests
* intentionally exercise that shape — so the whole plugin subtree is
* self-exempt. Matching the plugin-dir prefix covers every rule's index.mts,
* its test/, and the shared lib/ + _shared/ helpers.
*/
const PLUGIN_FLEET_DIR = ".config/fleet/oxlint-plugin/fleet/";
const PLUGIN_REPO_DIR = ".config/repo/oxlint-plugin/";
/**
* True when `filename` is inside the plugin's own rule subtree, either tier.
*/
function isPluginInternalPath(filename) {
	const normalized = (0, import_normalize.normalizePath)(filename);
	return normalized.includes(".config/fleet/oxlint-plugin/fleet/") || normalized.includes(".config/repo/oxlint-plugin/");
}
/**
* True when `filename` points at the fleet-canonical `scripts/fleet/paths.mts`.
*/
function isPathsModule(filename) {
	return (0, import_normalize.normalizePath)(filename).endsWith(PATHS_FILE);
}
/**
* Context-aware wrapper around `isPluginInternalPath`: true when the file
* currently being linted is one of the plugin's own rule / test files. Rules
* call this to exempt their own rule-data + fixtures (where the patterns they
* detect appear as literal strings, not real violations). Takes the rule
* `context` so call sites read as `isPluginSelfFile(context)`.
*/
function isPluginSelfFile(context) {
	return isPluginInternalPath(context.filename ?? context.getFilename?.() ?? "");
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-eslint-biome-config-ref/index.mts
/**
* @file Per fleet "Code style" rule: the fleet has migrated to oxlint / oxfmt.
*   References to `.eslintrc`, `eslint-config-*`, `biome.json`, or `@biomejs/*`
*   in scripts / package.json / docs are stale — they'd mis-fire (point at a
*   config that doesn't exist) or signal an incomplete migration. Detects:
*   string literals naming the legacy configs / packages. The rule fires on
*   TS/JS source — package.json + workflow YAML are caught by other tooling
*   (the SBOM / dep scanners flag the package refs at install time). No
*   autofix: the right replacement varies (drop the line, swap to
*   `oxlint`/`oxfmt`, or rewrite a script invocation). Reporting only. **Test
*   fixtures:** if a pattern-matching test reaches for a real package name that
*   happens to start with `eslint-` / `biome` / `@biomejs/`, the rule fires on
*   the test fixture even though it isn't a config ref. Use the documented
*   neutral placeholder family `acme-*` (`acme-plugin-react`, `acme-foo`,
*   `@acme/widget`) — same convention as `Acme Inc` for customer-name
*   placeholders in [`fleet/public-surface-hygiene`]. They keep wildcard
*   semantics intact without tripping the rule. Reserve the bypass comment for
*   genuinely irreplaceable cases (e.g. testing the rule itself).
*/
const BYPASS_RE$19 = /socket-lint:\s*allow\s+eslint-biome-ref/;
const FORBIDDEN_REFS = [
	".eslintrc",
	".eslintrc.js",
	".eslintrc.json",
	".eslintrc.cjs",
	".eslintrc.yml",
	".eslintrc.yaml",
	"eslint.config.js",
	"eslint.config.mjs",
	"eslint.config.cjs",
	"biome.json",
	"biome.jsonc"
];
const FORBIDDEN_PACKAGE_RES = [
	/^eslint(?:-|$)/,
	/^@eslint\//,
	/^@biomejs\//,
	/^biome$/
];
function isForbiddenString(s) {
	if (FORBIDDEN_REFS.includes(s)) return s;
	for (let i = 0, { length } = FORBIDDEN_PACKAGE_RES; i < length; i += 1) if (FORBIDDEN_PACKAGE_RES[i].test(s)) return s;
}
const rule$89 = {
	meta: {
		type: "problem",
		docs: {
			description: "ESLint / Biome config references are stale — the fleet runs oxlint + oxfmt. Drop the reference or swap to the oxlint/oxfmt equivalent.",
			category: "Best Practices",
			recommended: true
		},
		messages: { staleConfig: "`{{ref}}` is a stale ESLint/Biome reference — the fleet runs oxlint + oxfmt. Drop the line or swap to the oxlint/oxfmt equivalent. (See `template/.config/oxlintrc.json` / `oxfmtrc.json` for the canonical configs.) If this is a test fixture, rename to the neutral placeholder family `acme-*` (mirrors the `Acme Inc` convention from `fleet/public-surface-hygiene`)." },
		schema: []
	},
	create(context) {
		if (isPluginSelfFile(context)) return {};
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$19);
		return {
			Literal(node) {
				const v = node.value;
				if (typeof v !== "string") return;
				const hit = isForbiddenString(v);
				if (!hit || hasBypassComment(node)) return;
				context.report({
					node,
					messageId: "staleConfig",
					data: { ref: hit }
				});
			},
			TemplateElement(node) {
				const cooked = node.value?.cooked;
				if (typeof cooked !== "string") return;
				const hit = isForbiddenString(cooked);
				if (!hit || hasBypassComment(node)) return;
				context.report({
					node,
					messageId: "staleConfig",
					data: { ref: hit }
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-fetch-prefer-http-request/index.mts
/**
* @type {import('eslint').Rule.RuleModule}
*/
const BYPASS_RE$18 = /socket-lint:\s*allow\s+global-fetch/;
const rule$88 = {
	meta: {
		type: "problem",
		docs: {
			description: "Use httpJson / httpText / httpRequest from @socketsecurity/lib-stable/http-request instead of global fetch().",
			category: "Best Practices",
			recommended: true
		},
		messages: { banned: "global fetch() — use httpJson / httpText / httpRequest from @socketsecurity/lib-stable/http-request. The right replacement depends on what you do with the response; the lib helpers ship consistent error shapes (HttpError) and JSON/text decoding." },
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$18);
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "Identifier" || callee.name !== "fetch") return;
			if (hasBypassComment(node)) return;
			const scope = context.getScope ? context.getScope() : void 0;
			if (scope) {
				const variable = scope.references.find((ref) => ref.identifier === callee)?.resolved;
				if (variable && variable.scope.type !== "global") return;
			}
			context.report({
				node,
				messageId: "banned"
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-file-scope-oxlint-disable/index.mts
const FILE_SCOPE_DISABLE_RE = /^\s*(?:\/\*|\/\/)\s*oxlint-disable(?!-next-line)\s+/;
const rule$87 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Forbid file-scope `oxlint-disable` comments; require `oxlint-disable-next-line` per call site so each exemption is independently justified.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: void 0,
		messages: { fileScopeDisable: "File-scope `oxlint-disable {{rule}}` silently exempts the whole file from a fleet rule. Move the disable to `oxlint-disable-next-line {{rule}} -- <reason>` on the specific line that needs it. If the entire file legitimately can't comply, the file probably needs a refactor instead." },
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (isPluginInternalPath(filename) || isPathsModule(filename)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const mirror = isLockstepMirror(context);
		return { Program(_node) {
			const comments = sourceCode.getAllComments && sourceCode.getAllComments() || [];
			for (let i = 0, { length } = comments; i < length; i += 1) {
				const c = comments[i];
				const raw = c.value || "";
				if (c.type === "Block" && raw.startsWith("*")) continue;
				const reconstructed = `${c.type === "Block" ? "/*" : "//"}${raw}`;
				if (!FILE_SCOPE_DISABLE_RE.test(reconstructed)) continue;
				const m = /oxlint-disable\s+([^\s*]+(?:\s+[^\s*]+)*)/.exec(reconstructed);
				const ruleName = m?.[1] ? m[1].trim() : "<rule>";
				if (mirror && ruleName !== "<rule>") {
					if (ruleName.split(/\s+/).filter(Boolean).every(isLockstepMirrorExemptRule)) continue;
				}
				context.report({
					node: c,
					messageId: "fileScopeDisable",
					data: { rule: ruleName }
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-fileoverview-prefer-file/index.mts
const FILEOVERVIEW_TAG_RE = /@fileoverview\b/;
const rule$86 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Use `@file` instead of `@fileoverview` in the leading file-doc block comment.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: { preferFile: "File-doc tag is `@fileoverview` — rename it to `@file`. Doc generators recognise `@file`; `@fileoverview` is a non-standard alias that can produce empty descriptions in generated API output." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { Program(node) {
			const comments = sourceCode.getAllComments ? sourceCode.getAllComments() : [];
			let fileDoc;
			const bodyNodes = node.body ?? [];
			const firstCodeStart = bodyNodes.length > 0 ? bodyNodes[0].range?.[0] ?? Infinity : Infinity;
			for (let i = 0, { length } = comments; i < length; i += 1) {
				const c = comments[i];
				if (c.type !== "Block") continue;
				if (!(c.value ?? "").startsWith("*")) continue;
				if ((c.range?.[0] ?? Infinity) < firstCodeStart) fileDoc = c;
				break;
			}
			if (!fileDoc) return;
			/* c8 ignore start - fileDoc.value is always a string: the same value passed startsWith('*') at line 69 */
			const body = fileDoc.value ?? "";
			/* c8 ignore stop */
			if (!FILEOVERVIEW_TAG_RE.test(body)) return;
			context.report({
				node: fileDoc,
				messageId: "preferFile",
				fix(fixer) {
					const fixedBody = body.replace(FILEOVERVIEW_TAG_RE, "@file");
					return fixer.replaceText(fileDoc, `/*${fixedBody}*/`);
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-inline-defer-async/index.mts
/**
* @file Per fleet "Code style" rule: `<script defer>` / `<script async>` on
*   inline (no-src) `<script>` tags is a spec no-op — the script runs
*   immediately. The author intent (wait for DOMContentLoaded) is silently
*   ignored. Past incident: same shape bit a fleet project twice; rendered
*   pages went silently broken when the script tried to operate on DOM nodes
*   that didn't exist yet. Sibling:
*   `.claude/hooks/fleet/inline-script-defer-guard/` catches this at edit time.
*   This lint rule catches it at commit time when edits happened outside
*   Claude. Detects: string literals (single-quoted, double-quoted, or
*   template) containing `<script ...defer...>` or `<script ...async...>`
*   lacking `src=`. The rule applies to TS/JS source — HTML / template files
*   aren't lint-target by oxlint. Autofix: remove the `defer` / `async`
*   attribute. The DOMContentLoaded wrap is a manual fix surfaced in the error
*   message.
*/
const SCRIPT_OPENER_RE = /<script\b(?<attrs>[^>]*)>/gi;
const BYPASS_RE$17 = /socket-lint:\s*allow\s+inline-defer/;
function findInlineDeferOrAsync(text) {
	SCRIPT_OPENER_RE.lastIndex = 0;
	let m;
	while ((m = SCRIPT_OPENER_RE.exec(text)) !== null) {
		/* c8 ignore next - named capture groups always present when regex matches */
		const attrs = m.groups?.["attrs"] ?? "";
		const attrMatch = /\b(?<attr>async|defer)\b/i.exec(attrs);
		if (!attrMatch) continue;
		if (/\bsrc\s*=/.test(attrs)) continue;
		/* c8 ignore start - named capture groups always present when regex matches */
		return {
			opener: m[0],
			attr: (attrMatch.groups?.["attr"] ?? "").toLowerCase(),
			offset: m.index
		};
	}
}
const rule$85 = {
	meta: {
		type: "problem",
		docs: {
			description: "`<script defer>` / `<script async>` on inline (no-src) scripts is a spec no-op. Wrap in DOMContentLoaded or move to an external file.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: "code",
		messages: { inlineDeferAsync: "`<script {{attr}}>` lacks `src=` — `{{attr}}` is a no-op on inline scripts (spec says ignore). The script runs IMMEDIATELY, not on DOMContentLoaded. Wrap the body in `document.addEventListener(\"DOMContentLoaded\", () => {...})`, or move to an external file with `<script {{attr}} src=\"...\">`." },
		schema: []
	},
	create(context) {
		if (isPluginSelfFile(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$17);
		function checkLiteralText(node, text, innerStart) {
			const found = findInlineDeferOrAsync(text);
			if (!found) return;
			if (hasBypassComment(node)) return;
			context.report({
				node,
				messageId: "inlineDeferAsync",
				data: { attr: found.attr },
				fix(fixer) {
					const openerStart = innerStart + found.offset;
					const openerSrcEnd = openerStart + found.opener.length;
					const openerSrc = sourceCode.getText().slice(openerStart, openerSrcEnd);
					const m = new RegExp(`\\s+${found.attr}\\b|\\b${found.attr}\\s+`, "i").exec(openerSrc);
					if (!m) return;
					const removeStart = openerStart + m.index;
					const removeEnd = removeStart + m[0].length;
					return fixer.replaceTextRange([removeStart, removeEnd], "");
				}
			});
		}
		return {
			Literal(node) {
				const v = node.value;
				if (typeof v !== "string") return;
				if (!v.includes("<script")) return;
				const range = node.range;
				if (!range) return;
				checkLiteralText(node, v, range[0] + 1);
			},
			TemplateElement(node) {
				const v = node.value;
				const cooked = v?.cooked ?? v?.raw ?? "";
				if (!cooked.includes("<script")) return;
				const range = node.range;
				if (!range) return;
				checkLiteralText(node, cooked, range[0]);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-inline-logger/index.mts
const LOGGER_IMPORT_LINE = "import { getDefaultLogger } from '@socketsecurity/lib-stable/logger/default'";
const LOGGER_HOIST_LINE = "const logger = getDefaultLogger()";
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$84 = {
	meta: {
		type: "problem",
		docs: {
			description: "Hoist getDefaultLogger() to a const at the top of the file; do not call it inline.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: { inline: "getDefaultLogger() must be hoisted: add `const logger = getDefaultLogger()` near the top of the file and use `logger.{{method}}(...)`." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		let summary;
		function ensureSummary() {
			if (summary) return summary;
			summary = summarizeImportTarget(sourceCode.ast, "getDefaultLogger", "logger");
			return summary;
		}
		return { MemberExpression(node) {
			if (node.property.type !== "Identifier") return;
			const obj = node.object;
			if (obj.type !== "CallExpression" || obj.callee.type !== "Identifier" || obj.callee.name !== "getDefaultLogger" || obj.arguments.length !== 0) return;
			const s = ensureSummary();
			context.report({
				node,
				messageId: "inline",
				data: { method: node.property.name },
				fix(fixer) {
					return [fixer.replaceText(obj, "logger"), ...appendImportFixes(s, fixer, LOGGER_IMPORT_LINE, LOGGER_HOIST_LINE)];
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-lib-barrel-import/index.mts
const OWNED = {
	__proto__: null,
	"@socketregistry/packageurl-js": {
		allowed: ["exists"],
		barrels: {}
	},
	"@socketsecurity/lib": {
		allowed: [
			"http-request",
			"integrity",
			"logger",
			"native-messaging"
		],
		barrels: { errors: "errors/message" }
	},
	"@socketsecurity/sdk": {
		allowed: ["testing"],
		barrels: {}
	}
};
const SPECIFIER_RE = /^(?<scope>@[^/]+)\/(?<name>[^/]+?)(?<stable>-stable)?(?:\/(?<rest>.+))?$/;
const rule$83 = {
	meta: {
		type: "problem",
		docs: {
			category: "Best Practices",
			description: "Import a Socket package's real submodule leaf, not a bare area barrel (these packages are cherry-picked — no aggregation barrels).",
			recommended: true
		},
		fixable: "code",
		messages: { barrelImport: "`{{specifier}}` imports the bare `{{pkg}}` area `{{area}}`, which is not a fine-grained export ({{reason}}). Import a specific submodule leaf (e.g. `{{pkg}}/{{area}}/<name>`). Allowed bare areas for this package: {{allowed}}." },
		schema: []
	},
	create(context) {
		function check(node) {
			const source = node.source;
			if (!source || typeof source.value !== "string") return;
			const specifier = source.value;
			const match = SPECIFIER_RE.exec(specifier);
			if (!match?.groups) return;
			const { name, rest, scope } = match.groups;
			const canonical = `${scope}/${name}`;
			const policy = OWNED[canonical];
			if (!policy) return;
			if (!rest || rest.includes("/")) return;
			const area = rest;
			if (policy.allowed.includes(area)) return;
			const leaf = policy.barrels[area];
			context.report({
				node: source,
				messageId: "barrelImport",
				data: {
					allowed: policy.allowed.join(", ") || "(none)",
					area,
					pkg: canonical,
					reason: leaf ? "a convenience barrel being retired" : "no such single-segment export",
					specifier
				},
				...leaf ? { fix(fixer) {
					return fixer.replaceText(source, `'${specifier.replace(new RegExp(`/${area}$`), `/${leaf}`)}'`);
				} } : {}
			});
		}
		return {
			ExportAllDeclaration: check,
			ExportNamedDeclaration: check,
			ImportDeclaration: check
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-logger-newline-literal/index.mts
const STDERR_METHODS = /* @__PURE__ */ new Set([
	"error",
	"fail",
	"info",
	"progress",
	"skip",
	"step",
	"substep",
	"success",
	"warn"
]);
const LOGGER_METHODS = /* @__PURE__ */ new Set([
	"error",
	"fail",
	"info",
	"log",
	"progress",
	"skip",
	"step",
	"substep",
	"success",
	"warn"
]);
const UNAMBIGUOUS_EMOJI = {
	"‼": "warn",
	"×": "fail",
	"√": "success",
	"☑": "success",
	"☑️": "success",
	"⚠": "warn",
	"⚠️": "warn",
	"⛔": "warn",
	"✅": "success",
	"✓": "success",
	"✔": "success",
	"✔️": "success",
	"✖": "fail",
	"✖️": "fail",
	"✗": "fail",
	"✘": "fail",
	"❌": "fail",
	"❎": "fail",
	"❕": "warn",
	"❗": "warn",
	"🚨": "warn",
	ℹ: "info",
	ℹ️: "info"
};
const ANCHORED_FALLBACK = {
	":.": "progress",
	"@": "skip",
	"→": "step",
	"↻": "skip",
	">": "step",
	"∴": "progress",
	i: "info"
};
const ANCHORED_FALLBACK_PREFIX_RE = new RegExp(`^(${Object.keys(ANCHORED_FALLBACK).map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s`);
const UNAMBIGUOUS_LIST = Object.keys(UNAMBIGUOUS_EMOJI);
/**
* Return the first known status emoji + its method, or undefined.
*
* Two passes: unambiguous shapes match anywhere in the string;
* ANCHORED_FALLBACK shapes only match at the start followed by whitespace.
*/
function findStatusEmoji(value) {
	const trimmed = value.replace(/^[\n\r\t ]+/, "");
	const anchored = ANCHORED_FALLBACK_PREFIX_RE.exec(trimmed);
	if (anchored?.[1]) return {
		emoji: anchored[1],
		method: ANCHORED_FALLBACK[anchored[1]]
	};
	for (let i = 0, { length } = UNAMBIGUOUS_LIST; i < length; i += 1) {
		const emoji = UNAMBIGUOUS_LIST[i];
		if (value.includes(emoji)) return {
			emoji,
			method: UNAMBIGUOUS_EMOJI[emoji]
		};
	}
}
/**
* Return the blank-line logger call for a given message method.
*/
function blankCallFor(method) {
	return STDERR_METHODS.has(method) ? "logger.error('')" : "logger.log('')";
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$82 = {
	meta: {
		type: "problem",
		docs: {
			description: "Ban \\n in string literals passed to logger.<method>(); split into a stream-matched blank-line call + an emoji-matched semantic call.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: {
			leadingNewline: "String literal passed to logger.{{origMethod}}() starts with \\n. Replace with {{blankCall}} then logger.{{semanticMethod}}('...') (emoji {{emoji}} → .{{semanticMethod}}).",
			leadingNewlineNoEmoji: "String literal passed to logger.{{origMethod}}() starts with \\n. Replace with {{blankCall}} then logger.{{origMethod}}('...').",
			trailingNewline: "String literal passed to logger.{{origMethod}}() ends with \\n. Replace with logger.{{semanticMethod}}('...') then {{blankCall}} (emoji {{emoji}} → .{{semanticMethod}}).",
			trailingNewlineNoEmoji: "String literal passed to logger.{{origMethod}}() ends with \\n. Replace with logger.{{origMethod}}('...') then {{blankCall}}.",
			embeddedNewline: "String literal passed to logger.{{origMethod}}() contains an embedded \\n. Split into multiple logger calls so each line gets the right prefix."
		},
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		/**
		* Walk up from a node to its enclosing ExpressionStatement. Returns
		* undefined if the call isn't a top-level statement (e.g. it's inside a
		* conditional expression or assignment) — those shapes are too contextual
		* to autofix.
		*/
		function enclosingStatement(node) {
			let cur = node.parent;
			while (cur) {
				if (cur.type === "ExpressionStatement") return cur;
				if (cur.type === "ArrowFunctionExpression" || cur.type === "BlockStatement" || cur.type === "FunctionDeclaration" || cur.type === "FunctionExpression" || cur.type === "Program") return;
				cur = cur.parent;
			}
		}
		/**
		* Find the indentation, leading whitespace on its line, of `node`.
		*/
		function indentOf(node) {
			const text = sourceCode.getText();
			const start = node.range?.[0] ?? node.start;
			if (typeof start !== "number") return "";
			let lineStart = start;
			while (lineStart > 0 && text[lineStart - 1] !== "\n") lineStart -= 1;
			let i = lineStart;
			while (i < start && (text[i] === "	" || text[i] === " ")) i += 1;
			return text.slice(lineStart, i);
		}
		/**
		* Quote a string for source output. Uses single quotes by default; if the
		* value contains a single quote, falls back to double quotes.
		*/
		function quoteString(value) {
			if (!value.includes("'")) return `'${value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n")}'`;
			return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n")}"`;
		}
		/**
		* If `node` is an argument of a call to `logger.<method>(...)`, return that
		* method name. Otherwise return undefined.
		*/
		function loggerMethodForArg(node) {
			const parent = node.parent;
			if (!parent || parent.type !== "CallExpression") return;
			if (!parent.arguments.includes(node)) return;
			const callee = parent.callee;
			if (callee.type !== "MemberExpression") return;
			const objectName = callee.object.type === "Identifier" ? callee.object.name : void 0;
			const propName = callee.property.type === "Identifier" ? callee.property.name : void 0;
			if (objectName !== "logger" || !propName) return;
			if (!LOGGER_METHODS.has(propName)) return;
			return propName;
		}
		function classifyNewline(value) {
			if (value.startsWith("\n")) return "leading";
			if (value.endsWith("\n")) return "trailing";
			/* c8 ignore start - callers always pre-check value.includes('\n') before calling; embedded + return-undefined arms are never reached with a no-\n string */
			if (value.includes("\n")) return "embedded";
			/* c8 ignore stop */
		}
		/**
		* Build the report payload for a literal value bound to a
		* logger.<origMethod>(...) call. Emits an autofix only when the call is
		* `logger.X('<value>')` with exactly one Literal arg, lives in a plain
		* ExpressionStatement, and the newline placement is leading or trailing
		* not embedded. Multi-arg + embedded shapes stay unfixed — the rewrite
		* needs author judgment.
		*/
		function reportFor(node, value, origMethod) {
			const placement = classifyNewline(value);
			/* c8 ignore start - callers always pass strings that include '\n'; classifyNewline never returns undefined here */
			if (!placement) return;
			/* c8 ignore stop */
			if (placement === "embedded") {
				context.report({
					node,
					messageId: "embeddedNewline",
					data: { origMethod }
				});
				return;
			}
			const found = findStatusEmoji(value);
			const semanticMethod = found?.method;
			const emoji = found?.emoji;
			const messageMethod = semanticMethod ?? origMethod;
			const blankCall = blankCallFor(messageMethod);
			const messageId = `${placement}${semanticMethod ? "Newline" : "NewlineNoEmoji"}`;
			let fixFn;
			const call = node.parent;
			const stmt = call ? enclosingStatement(call) : void 0;
			if (node.type === "Literal" && typeof node.value === "string" && call && call.type === "CallExpression" && call.arguments.length === 1 && call.arguments[0] === node && stmt) {
				const stripped = placement === "leading" ? value.replace(/^\n+/, "") : value.replace(/\n+$/, "");
				const indent = indentOf(stmt);
				const messageCall = `logger.${messageMethod}(${quoteString(stripped)})`;
				const replacement = placement === "leading" ? `${blankCall}\n${indent}${messageCall}` : `${messageCall}\n${indent}${blankCall}`;
				fixFn = (fixer) => fixer.replaceText(call, replacement);
			}
			context.report({
				node,
				messageId,
				data: {
					origMethod,
					semanticMethod: semanticMethod ?? origMethod,
					emoji: emoji ?? "",
					blankCall
				},
				...fixFn ? { fix: fixFn } : {}
			});
		}
		return {
			Literal(node) {
				const value = typeof node.value === "string" ? node.value : void 0;
				if (!value || !value.includes("\n")) return;
				const origMethod = loggerMethodForArg(node);
				if (!origMethod) return;
				reportFor(node, value, origMethod);
			},
			TemplateLiteral(node) {
				const origMethod = loggerMethodForArg(node);
				if (!origMethod) return;
				const firstQuasi = node.quasis[0];
				const lastQuasi = node.quasis[node.quasis.length - 1];
				const firstCooked = firstQuasi?.value?.cooked;
				const lastCooked = lastQuasi?.value?.cooked;
				const call = node.parent;
				/* c8 ignore start - `call` is always truthy here: loggerMethodForArg pre-checked node.parent.type === 'CallExpression' so the ternary false-arm (undefined) is unreachable */
				const stmt = call ? enclosingStatement(call) : void 0;
				/* c8 ignore stop */
				const isSingleArgCall = call && call.type === "CallExpression" && call.arguments.length === 1 && call.arguments[0] === node && stmt;
				let handled = false;
				if (isSingleArgCall && typeof firstCooked === "string" && firstCooked.startsWith("\n") && node.quasis.every((q, i) => {
					const c = q.value?.cooked;
					if (typeof c !== "string") return false;
					if (i === 0) return c.lastIndexOf("\n") === 0;
					return !c.includes("\n");
				})) {
					handled = true;
					const indent = indentOf(stmt);
					const src = sourceCode.getText();
					const start = node.range?.[0] ?? node.start;
					const end = node.range?.[1] ?? node.end;
					if (typeof start === "number" && typeof end === "number") {
						const newTpl = "`" + src.slice(start, end).slice(1).replace(/^(?:\\n)+/, "").replace(/^\n+/, "");
						const found = findStatusEmoji(firstCooked);
						const semanticMethod = found?.method ?? origMethod;
						const blankCall = blankCallFor(semanticMethod);
						const replacement = `${blankCall}\n${indent}${`logger.${semanticMethod}(${newTpl})`}`;
						context.report({
							node: firstQuasi,
							messageId: found ? "leadingNewline" : "leadingNewlineNoEmoji",
							data: {
								origMethod,
								semanticMethod,
								emoji: found?.emoji ?? "",
								blankCall
							},
							fix(fixer) {
								return fixer.replaceText(call, replacement);
							}
						});
						return;
					}
				}
				if (isSingleArgCall && !handled && typeof lastCooked === "string" && lastCooked.endsWith("\n") && node.quasis.every((q, i, arr) => {
					const c = q.value?.cooked;
					if (typeof c !== "string") return false;
					if (i === arr.length - 1) return !c.replace(/\n+$/, "").includes("\n");
					return !c.includes("\n");
				})) {
					handled = true;
					const indent = indentOf(stmt);
					const src = sourceCode.getText();
					const start = node.range?.[0] ?? node.start;
					const end = node.range?.[1] ?? node.end;
					if (typeof start === "number" && typeof end === "number") {
						const newTpl = src.slice(start, end).slice(0, -1).replace(/(?:\\n|\n)+$/, "") + "`";
						const found = findStatusEmoji(lastCooked);
						const semanticMethod = found?.method ?? origMethod;
						const blankCall = blankCallFor(semanticMethod);
						const replacement = `${`logger.${semanticMethod}(${newTpl})`}\n${indent}${blankCall}`;
						context.report({
							node: lastQuasi,
							messageId: found ? "trailingNewline" : "trailingNewlineNoEmoji",
							data: {
								origMethod,
								semanticMethod,
								emoji: found?.emoji ?? "",
								blankCall
							},
							fix(fixer) {
								return fixer.replaceText(call, replacement);
							}
						});
						return;
					}
				}
				for (const quasi of node.quasis) {
					const cooked = quasi.value?.cooked;
					if (typeof cooked !== "string" || !cooked.includes("\n")) continue;
					reportFor(quasi, cooked, origMethod);
					return;
				}
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-malformed-bypass-marker/index.mts
const PERSITE_DISABLE_RE = /^oxlint-disable-(?:line|next-line)\b/;
const WELL_FORMED_DISABLE_RE = /^oxlint-disable-(?:line|next-line)\s+\S.*?\s--\s+\S/;
const SOCKET_LINT_ALLOW_RE = new RegExp(`^${SOCKET_LINT_ALLOW_PREFIX_RE.source}`);
const WELL_FORMED_SOCKET_LINT_RE = new RegExp(`^${SOCKET_LINT_ALLOW_WELL_FORMED_RE.source}`);
const ALLOW_ID = "malformed-bypass-marker";
const COMMENT_ONLY_RE = /^\s*(?:\*|\/\*|\/\/)/;
/**
* Lines between a marker comment and the first code line below it. `0` means
* the marker shares a line with code (a trailing marker, always in range).
* `Infinity` means there is no code below it at all — nothing to exempt.
*/
function markerDistanceToCode(sourceLines, comment) {
	const startLine = comment?.loc?.start?.line;
	if (typeof startLine !== "number" || startLine < 1) return 0;
	const ownIdx = startLine - 1;
	const own = sourceLines[ownIdx] ?? "";
	if (own.trim() !== "" && !COMMENT_ONLY_RE.test(own)) return 0;
	for (let idx = ownIdx + 1; idx < sourceLines.length; idx += 1) {
		const text = sourceLines[idx] ?? "";
		if (text.trim() === "" || COMMENT_ONLY_RE.test(text)) continue;
		return idx - ownIdx;
	}
	return Number.POSITIVE_INFINITY;
}
const rule$81 = {
	meta: {
		type: "problem",
		docs: {
			description: "In-source bypass markers must match the canonical grammar — `oxlint-disable-next-line <rule> -- <reason>` and `socket-lint: allow <id>` — so a reviewer can see what is waived and why.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: {
			missingDisableReason: "Malformed oxlint disable: `{{body}}`. Use `oxlint-disable-next-line <rule> -- <reason>` — name the rule(s) being disabled AND a `-- <reason>` so the waiver is justified.",
			malformedSocketLintAllow: "Malformed bypass marker: `{{body}}`. Use `socket-lint: allow <id>` — name the opt-out token; a bare `socket-lint: allow` never matches the rule’s bypass checker, so the rule still fires.",
			outOfRangeSocketLintAllow: "Out-of-range bypass marker: `{{body}}` sits {{distance}} lines above the code it should exempt, past the {{limit}}-line lookback, so no rule will ever see it and the error stays. Move the marker to within {{limit}} lines of the code (put a long justification ABOVE the marker line, not between it and the code)."
		},
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassCommentChecker(context, ALLOW_ID);
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { Program(_node) {
			const sourceText = sourceTextOf(context);
			const hasSource = sourceText.trim() !== "";
			const sourceLines = sourceText.split("\n");
			const comments = sourceCode.getAllComments && sourceCode.getAllComments() || [];
			for (let i = 0, { length } = comments; i < length; i += 1) {
				const c = comments[i];
				const raw = c.value || "";
				if (c.type === "Block" && raw.trimStart().startsWith("*")) continue;
				const body = raw.trim();
				let messageId;
				let distance = "";
				if (PERSITE_DISABLE_RE.test(body)) {
					if (!WELL_FORMED_DISABLE_RE.test(body)) messageId = "missingDisableReason";
				} else if (SOCKET_LINT_ALLOW_RE.test(body)) {
					if (!WELL_FORMED_SOCKET_LINT_RE.test(body)) messageId = "malformedSocketLintAllow";
					else if (hasSource && markerDistanceToCode(sourceLines, c) > 12) {
						messageId = "outOfRangeSocketLintAllow";
						distance = String(markerDistanceToCode(sourceLines, c));
					}
				}
				if (!messageId) continue;
				if (hasBypassComment(c)) continue;
				context.report({
					node: c,
					messageId,
					data: {
						body,
						distance,
						limit: String(12)
					}
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-minified-bundler-output/index.mts
const BUNDLER_PACKAGES = [
	"esbuild",
	"rolldown",
	"rollup",
	"vite",
	"webpack"
];
const BUNDLER_CONFIG_FILENAME_RE = /(?:^|\/)(?:esbuild|rolldown|rollup|vite|webpack)[.-][^/]*config[^/]*\.[cm]?[jt]sx?$/i;
const ROLLDOWN_DIR_RE = /\/rolldown\//;
function isBundlerImportSource(source) {
	for (let i = 0, { length } = BUNDLER_PACKAGES; i < length; i += 1) {
		const pkg = BUNDLER_PACKAGES[i];
		if (source === pkg || source.startsWith(`${pkg}/`)) return true;
	}
	return false;
}
function keyName(node) {
	const key = node.key;
	if (!key) return;
	if (key.type === "Identifier") return key.name;
	if (key.type === "Literal" && typeof key.value === "string") return key.value;
}
function isMinifying(valueNode) {
	if (!valueNode) return false;
	if (valueNode.type === "ObjectExpression") return true;
	if (valueNode.type === "Literal") {
		if (valueNode.value === true) return true;
		return typeof valueNode.value === "string" && valueNode.value !== "";
	}
	return false;
}
function isSourcemapEnabled(valueNode) {
	if (!valueNode) return false;
	if (valueNode.type === "ObjectExpression") return true;
	if (valueNode.type === "Literal") {
		if (valueNode.value === true) return true;
		return typeof valueNode.value === "string" && valueNode.value !== "" && valueNode.value !== "none";
	}
	return false;
}
function isDevtoolEnabled(valueNode) {
	if (!valueNode || valueNode.type !== "Literal") return false;
	if (valueNode.value === false) return false;
	if (valueNode.value === true) return true;
	return typeof valueNode.value === "string" && valueNode.value !== "" && valueNode.value !== "none";
}
const rule$80 = {
	meta: {
		type: "problem",
		docs: {
			description: "Bundler output must not be minified and must not emit source maps (fleet hard rule). Applies to rolldown / esbuild / rollup / vite / webpack configs.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: "code",
		messages: {
			noMinify: "Bundler output must not be minified (fleet hard rule). Set this option to `false` — a minified bundle is unauditable (you cannot read what runs) and rolldown’s minifier is young.",
			noSourcemap: "Bundler output must not emit source maps (fleet hard rule). Set this option to `false` — source maps leak the original sources and bloat the artifact."
		},
		schema: []
	},
	create(context) {
		const filename = (0, import_normalize.normalizePath)(context.filename ?? context.getFilename?.() ?? "");
		let hasBundlerSignal = BUNDLER_CONFIG_FILENAME_RE.test(filename) || ROLLDOWN_DIR_RE.test(filename);
		const violations = [];
		function consider(node) {
			const name = keyName(node);
			if (name === "minify" && isMinifying(node.value)) violations.push({
				node: node.value,
				messageId: "noMinify"
			});
			else if (name === "minimize" && node.value?.type === "Literal" && node.value.value === true) violations.push({
				node: node.value,
				messageId: "noMinify"
			});
			else if (name === "sourcemap" && isSourcemapEnabled(node.value)) violations.push({
				node: node.value,
				messageId: "noSourcemap"
			});
			else if (name === "devtool" && isDevtoolEnabled(node.value)) violations.push({
				node: node.value,
				messageId: "noSourcemap"
			});
		}
		return {
			ImportDeclaration(node) {
				const source = node.source;
				if (source?.type === "Literal" && typeof source.value === "string" && isBundlerImportSource(source.value)) hasBundlerSignal = true;
			},
			Property(node) {
				consider(node);
			},
			"Program:exit"() {
				if (!hasBundlerSignal) return;
				for (let i = 0, { length } = violations; i < length; i += 1) {
					const v = violations[i];
					context.report({
						node: v.node,
						messageId: v.messageId,
						fix(fixer) {
							return fixer.replaceText(v.node, "false");
						}
					});
				}
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-module-eval-side-effects/index.mts
const TLA_BYPASS_RE = /socket-lint:\s*allow\s+top-level-await/;
const DENYLISTED_CONSTRUCTORS = /* @__PURE__ */ new Set([
	"AsyncLocalStorage",
	"Comparator",
	"SharedArrayBuffer",
	"SignalExit",
	"SocketSdk"
]);
const DENYLISTED_FACTORIES = /* @__PURE__ */ new Set([
	"getAbortSignal",
	"getDefaultSpinner",
	"yoctoSpinner"
]);
const WEBASSEMBLY_MEMBERS = /* @__PURE__ */ new Set([
	"compile",
	"Instance",
	"instantiate",
	"Memory",
	"Module"
]);
const PROCESS_STREAM_PROPS = /* @__PURE__ */ new Set([
	"stderr",
	"stdin",
	"stdout"
]);
const FUNCTION_TYPES$1 = /* @__PURE__ */ new Set([
	"ArrowFunctionExpression",
	"FunctionDeclaration",
	"FunctionExpression"
]);
const GUARDED_GLOBAL_REFS = /* @__PURE__ */ new Set(["SharedArrayBuffer"]);
/**
* True when `node` is inside a function/class-method body — i.e. lazy, not
* module-eval. Walks the `.parent` chain (oxlint exposes parents on visited
* nodes; the sibling `no-top-level-await` rule relies on the same).
*/
function isLazy(node) {
	let current = node.parent;
	while (current) {
		if (FUNCTION_TYPES$1.has(current.type)) return true;
		current = current.parent;
	}
	return false;
}
const BUNDLED_GRAPH_PATH_RE = /[\\/]\.claude[\\/]hooks[\\/]fleet[\\/]_(?:dispatch|shared)[\\/]/;
const HOOK_INDEX_PATH_RE = /[\\/]\.claude[\\/]hooks[\\/]fleet[\\/](?!_)[^\\/]+[\\/]index\.[mc]?[jt]s$/;
const ENTRYPOINT_GUARD_RE = /import\.meta\.url\s*===\s*`file:\/\/\$\{process\.argv\[1\]\}`/;
const EXPORT_RUN_RE = /export\s+(?:async\s+)?function\s+run\s*\(/;
/**
* True when the file being linted freezes into the V8 dispatch bundle, so the
* snapshot-eligible-only clauses apply. The `_shared`/`_shared` graph is
* always eligible; a hook `index` is eligible only when its source carries the
* maker's bundle-safe markers (so an `await runHook(...)` entrypoint hook,
* which the maker never bundles, is correctly NOT eligible).
*/
function isSnapshotEligible(filename, source) {
	if (BUNDLED_GRAPH_PATH_RE.test(filename)) return true;
	if (!HOOK_INDEX_PATH_RE.test(filename)) return false;
	return ENTRYPOINT_GUARD_RE.test(source) && EXPORT_RUN_RE.test(source);
}
/**
* The callee NAME of a CallExpression, for the bare (`fn()`) and member
* (`x.fn()`) forms. Returns undefined for computed/other callees.
*/
function calleeName(callee) {
	if (!callee) return;
	if (callee.type === "Identifier") return callee.name;
	if (callee.type === "MemberExpression" && !callee.computed && callee.property?.type === "Identifier") return callee.property.name;
}
/**
* `WebAssembly.<member>` member expression → the member name, else undefined.
* Matches the `WebAssembly` object by identifier name, the global.
*/
function webAssemblyMember(node) {
	if (!node || node.type !== "MemberExpression" || node.computed || node.object?.type !== "Identifier" || node.object.name !== "WebAssembly" || node.property?.type !== "Identifier") return;
	return node.property.name;
}
const rule$79 = {
	meta: {
		type: "problem",
		docs: {
			description: "Forbid native-handle capture and I/O at module eval (top-level). Import-time hygiene — keeps imports fast and modules V8-snapshot-safe. Acquire lazily at first use instead.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: {
			eagerConstruct: "`new {{name}}(...)` at module eval captures a native handle on import — slow startup and not V8-snapshot-safe (the handle can't be serialized into the blob). Construct it lazily at first use (a memoized getter, or `options.x ?? getDefault()` at the call site), not at module scope.",
			eagerWasm: "`WebAssembly.{{member}}` at module eval instantiates a WASM module on import — slow startup and not V8-snapshot-safe (`WebAssembly` is undefined in the snapshot builder). Defer it to first call behind a memoized getter.",
			eagerFactory: "`{{name}}(...)` at module eval acquires a native handle on import — slow startup and not V8-snapshot-safe. Acquire it lazily at first use (memoized getter, or `options.x ?? {{name}}()` at the call site), not at module scope.",
			eagerFsIo: "`{{name}}(...)` reads the filesystem at module eval — every consumer pays this on import. Move the read inside the function that needs it (lazy, memoized on first call).",
			eagerProcessStream: "`process.{{prop}}` access at module eval captures a TTY/pipe handle on import — slow startup and not V8-snapshot-safe. Reach for the stream inside the function that uses it, not at module scope.",
			eagerChildProcess: "`child_process.{{member}}` at module eval spawns/forks on import — a side effect every consumer pays. Move the spawn inside the function that needs it.",
			snapshotTopLevelAwait: "Top-level `await` in a snapshot-eligible module (it freezes into the V8 dispatch bundle). The snapshot build pass is synchronous, so a module-scope `await` aborts `--build-snapshot`. Move it inside `run()` (the dispatcher awaits the hook), or opt out with `// socket-lint: allow top-level-await -- <reason>` if this file is genuinely never bundled.",
			eagerGlobalCapture: "Bare `{{name}}` reference at module eval — this global is NOT defined everywhere ({{name}} is absent in the V8 snapshot builder and, for SharedArrayBuffer, in non-cross-origin-isolated browsers), so this line is a module-eval ReferenceError there. Capture it guarded: `typeof {{name}} === 'undefined' ? undefined : {{name}}`, or reference it lazily inside the function that needs it.",
			snapshotDynamicImport: "Variable-path dynamic `import()` in a snapshot-eligible module. A non-literal specifier can't be statically resolved or frozen into the snapshot — only a string-literal `import('…')` is snapshottable. Use a static `import` (or a literal-specifier dynamic import)."
		},
		schema: []
	},
	create(context) {
		const filename = context.physicalFilename || context.filename || "";
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const source = typeof sourceCode?.getText === "function" ? sourceCode.getText() : sourceCode?.text ?? "";
		const eligible = isSnapshotEligible(filename, source);
		const hasTlaBypass = eligible ? makeBypassChecker(context, TLA_BYPASS_RE) : void 0;
		const listener = {
			NewExpression(node) {
				if (isLazy(node)) return;
				const callee = node.callee;
				const wasm = webAssemblyMember(callee);
				if (wasm && WEBASSEMBLY_MEMBERS.has(wasm)) {
					context.report({
						node,
						messageId: "eagerWasm",
						data: { member: wasm }
					});
					return;
				}
				if (callee?.type === "Identifier" && DENYLISTED_CONSTRUCTORS.has(callee.name)) context.report({
					node,
					messageId: "eagerConstruct",
					data: { name: callee.name }
				});
			},
			Identifier(node) {
				const name = node.name;
				if (!name || !GUARDED_GLOBAL_REFS.has(name)) return;
				const parent = node.parent;
				if (!parent) return;
				if (parent.type === "UnaryExpression" && parent.operator === "typeof") return;
				for (let anc = parent; anc; anc = anc.parent) if (anc.type === "ConditionalExpression" || anc.type === "IfStatement" || anc.type === "LogicalExpression") {
					const { end, start } = anc;
					if (typeof start === "number" && typeof end === "number" && source.slice(start, end).includes(`typeof ${name}`)) return;
				}
				if (parent.type.startsWith("TS")) return;
				if (parent.type === "MemberExpression" && parent.property === node && !parent.computed) return;
				if (parent.type === "Property" && parent.key === node && !parent.computed) return;
				if (parent.type.includes("Specifier")) return;
				if (isLazy(node)) return;
				context.report({
					node,
					messageId: "eagerGlobalCapture",
					data: { name }
				});
			},
			CallExpression(node) {
				if (isLazy(node)) return;
				const callee = node.callee;
				const wasm = webAssemblyMember(callee);
				if (wasm && WEBASSEMBLY_MEMBERS.has(wasm)) {
					context.report({
						node,
						messageId: "eagerWasm",
						data: { member: wasm }
					});
					return;
				}
				if (callee?.type === "MemberExpression" && !callee.computed && callee.object?.type === "Identifier" && callee.property?.type === "Identifier") {
					const objName = callee.object.name;
					const member = callee.property.name;
					if (objName === "fs" && member.endsWith("Sync")) {
						context.report({
							node,
							messageId: "eagerFsIo",
							data: { name: `fs.${member}` }
						});
						return;
					}
					if (objName === "child_process" || objName === "cp") {
						context.report({
							node,
							messageId: "eagerChildProcess",
							data: { member }
						});
						return;
					}
				}
				const name = calleeName(callee);
				if (name && DENYLISTED_FACTORIES.has(name)) context.report({
					node,
					messageId: "eagerFactory",
					data: { name }
				});
			},
			MemberExpression(node) {
				if (node.computed || isLazy(node)) return;
				if (node.object?.type === "Identifier" && node.object.name === "process" && node.property?.type === "Identifier" && PROCESS_STREAM_PROPS.has(node.property.name)) context.report({
					node,
					messageId: "eagerProcessStream",
					data: { prop: node.property.name }
				});
			}
		};
		if (!eligible) return listener;
		listener["AwaitExpression"] = (node) => {
			if (isLazy(node) || hasTlaBypass(node)) return;
			context.report({
				node,
				messageId: "snapshotTopLevelAwait"
			});
		};
		listener["ForOfStatement"] = (node) => {
			if (!node.await || isLazy(node) || hasTlaBypass(node)) return;
			context.report({
				node,
				messageId: "snapshotTopLevelAwait"
			});
		};
		listener["ImportExpression"] = (node) => {
			if (node.source?.type === "Literal") return;
			context.report({
				node,
				messageId: "snapshotDynamicImport"
			});
		};
		return listener;
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-namespace-import/index.mts
/**
* @type {import('eslint').Rule.RuleModule}
*/
const TEST_FILE_RE$1 = /(?:\.test\.[cm]?[jt]sx?$|\/test\/)/;
function isTestFile$1(filename) {
	return TEST_FILE_RE$1.test((0, import_normalize.normalizePath)(filename));
}
function isBuiltinSpecifier(specifier) {
	if (specifier.startsWith("node:")) return true;
	return !specifier.startsWith(".") && !specifier.includes("/");
}
const rule$78 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Forbid `import * as x` — use named imports so the dependency surface is explicit and dead-code-analyzable.",
			category: "Stylistic Issues",
			recommended: true
		},
		schema: [],
		messages: { noNamespaceImport: "Avoid `import * as {{name}}` — use named imports (`import { … } from …`) so the used surface is explicit, greppable, and dead-code-analyzable. (Test module-mocks + bare builtins are exempt.)" }
	},
	create(context) {
		if (isTestFile$1(context.filename ?? context.getFilename?.() ?? "")) return {};
		return { ImportDeclaration(node) {
			if (isBuiltinSpecifier(node.source?.value || "")) return;
			const specifiers = node.specifiers ?? [];
			for (let i = 0, { length } = specifiers; i < length; i += 1) {
				const spec = specifiers[i];
				if (spec.type === "ImportNamespaceSpecifier") context.report({
					node: spec,
					messageId: "noNamespaceImport",
					data: { name: spec.local?.name ?? "x" }
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-npx-dlx/index.mts
const PATTERNS$3 = [
	[
		"pnpm dlx ",
		"node_modules/.bin/",
		"pnpm dlx"
	],
	[
		"yarn dlx ",
		"node_modules/.bin/",
		"yarn dlx"
	],
	[
		"npx ",
		"node_modules/.bin/",
		"npx"
	],
	[
		"pnx ",
		"node_modules/.bin/",
		"pnx"
	]
];
const COMMENT_BYPASS_RE = /socket-lint:\s*allow\s+npx/;
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$77 = {
	meta: {
		type: "problem",
		docs: {
			description: "Use `node_modules/.bin/<tool>` or `pnpm run <script>` instead of `npx` / `pnpm dlx` / `yarn dlx` / `pnx`. Per CLAUDE.md \"Tooling\" rule.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: { banned: "`{{label}}` — run `node_modules/.bin/<tool>` or `pnpm run <script>` instead. CLAUDE.md \"Tooling\" rule bans dlx-style commands; they bypass the soak time and fetch packages without lockfile verification. (`pnpm exec` is also banned — wrapper overhead — see no-pm-exec-guard.)" },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		/**
		* Return [matchPrefix, replacementPrefix, label] for the longest dlx-style
		* prefix that appears anywhere in the string, or undefined when none match.
		* Anchors at word boundaries — `pnxx` doesn't match `pnx`.
		*/
		function findBannedPrefix(value) {
			for (const [match, repl, label] of PATTERNS$3) {
				/* c8 ignore start - PATTERNS entries are hardcoded non-falsy; guard is defensive only */
				if (!match || !repl || !label) continue;
				/* c8 ignore stop */
				let idx = 0;
				while ((idx = value.indexOf(match, idx)) !== -1) {
					const before = idx === 0 ? " " : value[idx - 1];
					if (!/[A-Za-z0-9_-]/.test(before)) return [
						match,
						repl,
						label,
						idx
					];
					idx += match.length;
				}
			}
		}
		/**
		* Skip when the surrounding source has the canonical bypass comment
		* (`socket-lint: allow npx`) on the same or an adjacent line.
		*/
		function hasBypassComment(node) {
			const before = sourceCode.getCommentsBefore(node);
			const after = sourceCode.getCommentsAfter(node);
			for (const c of [...before, ...after]) if (COMMENT_BYPASS_RE.test(c.value)) return true;
			return false;
		}
		function checkLiteral(node, value) {
			const found = findBannedPrefix(value);
			if (!found) return;
			if (hasBypassComment(node)) return;
			const label = found[2];
			context.report({
				node,
				messageId: "banned",
				data: { label },
				fix(fixer) {
					let next = value;
					for (const [m, r] of PATTERNS$3) {
						/* c8 ignore start - PATTERNS entries are hardcoded non-falsy; guard is defensive only */
						if (!m || !r) continue;
						/* c8 ignore stop */
						const parts = next.split(m);
						if (parts.length === 1) continue;
						let out = parts[0];
						for (let i = 1; i < parts.length; i++) {
							const prevChar = out.length === 0 ? " " : out[out.length - 1];
							const replacement = /[A-Za-z0-9_-]/.test(prevChar) ? m : r;
							out += replacement + parts[i];
						}
						next = out;
					}
					/* c8 ignore start - defensive guard: findBannedPrefix guarantees a boundary-valid match, so the fix loop always changes next */
					if (next === value) return;
					const quote = sourceCode.getText(node)[0];
					if (quote === "`") return fixer.replaceText(node, "`" + next + "`");
					const escaped = next.replace(new RegExp(`\\\\|${quote}`, "g"), (ch) => "\\" + ch);
					return fixer.replaceText(node, quote + escaped + quote);
				}
			});
		}
		return {
			Literal(node) {
				if (typeof node.value !== "string") return;
				checkLiteral(node, node.value);
			},
			TemplateLiteral(node) {
				if (node.expressions.length !== 0) {
					for (const q of node.quasis) {
						const found = findBannedPrefix(q.value.cooked);
						if (found) {
							context.report({
								node,
								messageId: "banned",
								data: { label: found[2] }
							});
							return;
						}
					}
					return;
				}
				const cooked = node.quasis[0].value.cooked;
				checkLiteral(node, cooked);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-optional-positional-trap/index.mts
const BYPASS_RE$16 = /socket-lint:\s*allow\s+optional-positional-trap/;
const DEFAULT_THRESHOLD = 3;
function isOptionalParam(param) {
	if (!param) return false;
	if (param.type === "AssignmentPattern") return true;
	if (param.optional === true) return true;
	const ann = param?.typeAnnotation?.typeAnnotation;
	if (ann?.type === "TSUnionType" && Array.isArray(ann.types)) return ann.types.some((t) => t?.type === "TSUndefinedKeyword");
	return false;
}
function isOptionsBag(param) {
	if (!param) return false;
	const target = param.type === "AssignmentPattern" ? param.left : param;
	if (target?.type === "ObjectPattern") return true;
	const ann = target?.typeAnnotation?.typeAnnotation;
	if (!ann) return false;
	if (ann.type === "TSTypeLiteral") return true;
	if (ann.type === "TSUnionType" && Array.isArray(ann.types)) return ann.types.some((t) => t?.type === "TSTypeLiteral");
	return false;
}
/**
* How many parameters at the END of `params` are optional positionals. Stops at
* the first required param, a rest element, or an options bag — anything that
* breaks the placeholder chain.
*/
function countOptionalTail(params) {
	let count = 0;
	for (let i = params.length - 1; i >= 0; i -= 1) {
		const p = params[i];
		if (p.type === "RestElement" || isOptionsBag(p) || !isOptionalParam(p)) break;
		count += 1;
	}
	return count;
}
const rule$76 = {
	meta: {
		type: "problem",
		docs: {
			description: "No pile-up of trailing optional positional params — collapse the tail into an options object. Sibling of socket/no-boolean-trap-param.",
			category: "Best Practices",
			recommended: true
		},
		messages: { banned: "{{count}} trailing optional positional params ({{names}}) — a caller who wants only the last one must pass `undefined` placeholders for the rest, and adding a param later silently breaks positional callers. Collapse them into one options object: `fn(…, { {{names}} })`. Bypass: add a `socket-lint: allow optional-positional-trap` comment." },
		schema: [{
			type: "object",
			properties: { threshold: {
				type: "integer",
				minimum: 2
			} },
			additionalProperties: false
		}]
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$16);
		const configured = context.options?.[0]?.threshold;
		const threshold = typeof configured === "number" && configured >= 2 ? configured : DEFAULT_THRESHOLD;
		function check(node) {
			if (node.body == null) return;
			const params = node.params;
			if (!Array.isArray(params) || params.length < threshold) return;
			const count = countOptionalTail(params);
			if (count < threshold) return;
			if (hasBypassComment(node)) return;
			const tail = params.slice(params.length - count);
			const names = tail.map((p) => {
				const target = p.type === "AssignmentPattern" ? p.left : p;
				return target?.type === "Identifier" ? target.name : "arg";
			}).join(", ");
			context.report({
				node: tail[0],
				messageId: "banned",
				data: {
					count: String(count),
					names
				}
			});
		}
		return {
			FunctionDeclaration: check,
			FunctionExpression: check,
			ArrowFunctionExpression: check
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-options-param-mutation/index.mts
const BYPASS_RE$15 = /socket-lint:\s*allow\s+options-param-mutation/;
const WATCHED_PARAM_NAMES = /* @__PURE__ */ new Set(["options", "opts"]);
const rule$75 = {
	meta: {
		type: "problem",
		docs: {
			description: "No direct property writes to an `options`/`opts` param — mutating a shared config object corrupts callers. Use a spread-copy local instead: `const merged = { ...options, x: y }`.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: { mutated: "`{{name}}.{{prop}}` is a direct write to the `{{name}}` param — the caller's object is mutated in place. Use a spread-copy local instead: `const merged = { ...{{name}}, {{prop}}: <value> }` (or the null-proto form per `options-null-proto`). Bypass: add a `socket-lint: allow options-param-mutation` comment." },
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$15);
		const scopeStack = [];
		function enterFunction(node) {
			const params = node.params;
			const watchedNames = /* @__PURE__ */ new Set();
			if (Array.isArray(params)) for (let i = 0, { length } = params; i < length; i += 1) {
				const p = params[i];
				if (p?.type === "Identifier" && WATCHED_PARAM_NAMES.has(p.name)) watchedNames.add(p.name);
			}
			scopeStack.push({
				locals: /* @__PURE__ */ new Set(),
				params: watchedNames
			});
		}
		function exitFunction() {
			scopeStack.pop();
		}
		function checkAssignment(node) {
			const left = node.left;
			if (left?.type !== "MemberExpression") return;
			const obj = left.object;
			if (obj?.type !== "Identifier") return;
			const name = obj.name;
			if (!WATCHED_PARAM_NAMES.has(name)) return;
			for (let i = scopeStack.length - 1; i >= 0; i -= 1) {
				const scope = scopeStack[i];
				if (scope.locals.has(name)) return;
				if (scope.params.has(name)) {
					if (hasBypassComment(node)) return;
					const prop = left.computed ? "<computed>" : left.property?.name ?? left.property?.value ?? "?";
					context.report({
						node,
						messageId: "mutated",
						data: {
							name,
							prop: String(prop)
						}
					});
					return;
				}
			}
		}
		function recordLocal(node) {
			const id = node.id;
			if (id?.type === "Identifier" && WATCHED_PARAM_NAMES.has(id.name) && scopeStack.length > 0) scopeStack[scopeStack.length - 1].locals.add(id.name);
		}
		return {
			FunctionDeclaration: enterFunction,
			"FunctionDeclaration:exit": exitFunction,
			FunctionExpression: enterFunction,
			"FunctionExpression:exit": exitFunction,
			ArrowFunctionExpression: enterFunction,
			"ArrowFunctionExpression:exit": exitFunction,
			AssignmentExpression: checkAssignment,
			VariableDeclarator: recordLocal
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-package-manager-auto-update-reenable/index.mts
const FALSY_VALUE = "(?:0|false|no|off)";
const PATTERNS$2 = [
	{
		re: new RegExp(`\\b([A-Z][A-Z0-9_]*_NO_(?:AUTO_UPDATE|UPDATE_CHECK|UPDATE_NOTIFIER))\\b\\s*[:=]\\s*["']?${FALSY_VALUE}\\b`),
		knob: "a *_NO_AUTO_UPDATE / *_NO_UPDATE_CHECK disable env var set to a falsy value",
		hardened: "set it back to a truthy value (e.g. HOMEBREW_NO_AUTO_UPDATE=1)"
	},
	{
		re: /\bupdate-notifier\s*=\s*true\b/,
		knob: "update-notifier=true",
		hardened: "update-notifier=false"
	},
	{
		re: /["']update-notifier["']\s*:\s*true\b/,
		knob: "\"update-notifier\": true",
		hardened: "\"update-notifier\": false"
	},
	{
		re: /\bchoco\s+feature\s+enable\b[^\n]*(?:^|\s)(?:--name|-n)(?:\s*=\s*|\s+)["']?autoUpdate\b/i,
		knob: "choco feature enable -n autoUpdate",
		hardened: "choco feature disable -n autoUpdate"
	}
];
/**
* Return the first re-enable pattern that matches anywhere in `value`, or
* undefined when none do.
*/
function findReenable(value) {
	for (let i = 0, { length } = PATTERNS$2; i < length; i += 1) {
		const pattern = PATTERNS$2[i];
		if (pattern.re.test(value)) return {
			knob: pattern.knob,
			hardened: pattern.hardened
		};
	}
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$74 = {
	meta: {
		type: "problem",
		docs: {
			description: "Flag config / code that re-enables a package manager's auto-update — the inverse of the package-manager-auto-update hardening. Auto-update fetches new versions outside the soak window and lockfile verification.",
			category: "Best Practices",
			recommended: true
		},
		messages: { reenabled: "Re-enables package-manager auto-update: {{knob}}. This undoes the package-manager-auto-update hardening — auto-update fetches new versions outside the soak window and lockfile verification. Fix: delete the line, or restore the disable ({{hardened}})." },
		schema: []
	},
	create(context) {
		function checkText(node, value) {
			const match = findReenable(value);
			if (!match) return;
			context.report({
				node,
				messageId: "reenabled",
				data: {
					hardened: match.hardened,
					knob: match.knob
				}
			});
		}
		return {
			Literal(node) {
				if (typeof node.value !== "string") return;
				checkText(node, node.value);
			},
			TemplateLiteral(node) {
				if (node.expressions.length !== 0) {
					for (let i = 0, { length } = node.quasis; i < length; i += 1) checkText(node, node.quasis[i].value.cooked);
					return;
				}
				checkText(node, node.quasis[0].value.cooked);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-parenthetical-aside/index.mts
const GROUP_RE = /\([^()]*\)/g;
const CODE_PUNCT_RE = /[=<>{}[\]|&;:/\\`$@#*+~^%_]/;
const MEMBER_DOT_RE = /\w\.\w/;
const DIGIT_LEADING_RE = /\d\S/;
const DIGIT_TRAILING_RE = /\S\d/;
const CAMEL_RE = /[a-z][A-Z]/;
const CALL_RE = /[A-Za-z_]\(/;
const WORD_RE = /^[A-Za-z][A-Za-z']*$/;
const SHOUT_RE = /^[A-Z][A-Z'-]*[A-Z]$/;
const CAP_RE = /^[A-Z]/;
const MIN_ASIDE_WORDS = 4;
const LEADIN_RE = /^(?:a\.k\.a\.|aka\b|cf\.|default(?:\b|s\b)|e\.g\.|eg\b|i\.e\.|ie\b|resp\.|see\b|viz\.)/i;
const PARTICIPLE_LEAD_RE = /[^e]ed$/;
const QUALIFIER_LEADS = /* @__PURE__ */ new Set([
	"about",
	"above",
	"across",
	"after",
	"against",
	"along",
	"although",
	"amid",
	"among",
	"and",
	"around",
	"as",
	"at",
	"atop",
	"because",
	"before",
	"behind",
	"below",
	"beneath",
	"beside",
	"besides",
	"between",
	"beyond",
	"but",
	"by",
	"can",
	"can't",
	"cannot",
	"could",
	"couldn't",
	"despite",
	"didn't",
	"doesn't",
	"don't",
	"down",
	"during",
	"except",
	"for",
	"from",
	"hence",
	"if",
	"in",
	"inside",
	"into",
	"like",
	"may",
	"might",
	"must",
	"near",
	"never",
	"no",
	"nor",
	"not",
	"of",
	"off",
	"on",
	"once",
	"only",
	"onto",
	"or",
	"otherwise",
	"out",
	"outside",
	"over",
	"past",
	"per",
	"plus",
	"shall",
	"should",
	"shouldn't",
	"since",
	"so",
	"then",
	"though",
	"through",
	"throughout",
	"thus",
	"till",
	"to",
	"toward",
	"towards",
	"under",
	"unless",
	"until",
	"up",
	"upon",
	"via",
	"when",
	"whenever",
	"where",
	"wherever",
	"whether",
	"while",
	"will",
	"with",
	"within",
	"without",
	"won't",
	"would",
	"wouldn't",
	"yet"
]);
const SPACE_RE = / +/;
const NO_GAP_RE = /[\w)\].`]/;
const PRECEDING_WORD_RE = /([A-Za-z]+)\s+$/;
const KEYWORDS = /* @__PURE__ */ new Set([
	"await",
	"catch",
	"delete",
	"do",
	"else",
	"for",
	"function",
	"if",
	"in",
	"new",
	"of",
	"return",
	"super",
	"switch",
	"throw",
	"typeof",
	"void",
	"while",
	"yield"
]);
/**
* True when `inner` carries a code shape and so must never be read as prose.
* Pure + inner-only, exported for the unit test. Covers punctuation, member
* dots, adjacent digits, camelCase / PascalCase identifiers, ALL_CAPS tokens,
* and an identifier-then-paren call.
*/
function innerLooksLikeCode(inner) {
	const trimmed = inner.trim();
	if (CODE_PUNCT_RE.test(trimmed) || MEMBER_DOT_RE.test(trimmed) || DIGIT_LEADING_RE.test(trimmed) || DIGIT_TRAILING_RE.test(trimmed) || CAMEL_RE.test(trimmed) || CALL_RE.test(trimmed)) return true;
	const tokens = trimmed.split(SPACE_RE);
	for (let i = 0, { length } = tokens; i < length; i += 1) {
		const raw = tokens[i];
		const word = raw.endsWith(",") ? raw.slice(0, -1) : raw;
		if (SHOUT_RE.test(word)) return true;
	}
	return false;
}
/**
* True when the `(` at `open` in `text` opens a code reference, not a prose
* aside. Pure + exported for the unit test. A group is a code reference when
* the char before `(` is a word char, closer, backtick, or dot (a call, index,
* or member access), when a JS keyword introduces it, or when it sits inside a
* backtick inline-code span.
*/
function isCodeReference(text, open) {
	const prev = open > 0 ? text[open - 1] : void 0;
	if (prev !== void 0 && NO_GAP_RE.test(prev)) return true;
	const before = text.slice(0, open);
	const kw = PRECEDING_WORD_RE.exec(before);
	if (kw && KEYWORDS.has(kw[1])) return true;
	let ticks = 0;
	for (let i = 0; i < open; i += 1) if (text[i] === "`") ticks += 1;
	return ticks % 2 === 1;
}
/**
* True only when the group at `[open, close]` in `text` reads as a standalone
* prose CLAUSE tucked into parentheses. Pure + exported for the unit test;
* `text` is the full comment body and `open` / `close` are the offsets of the
* group's `(` and `)`. Narrow by design — every check below skips a shape the
* consumer-repo revert showed is a precision tool, not an aside: a code
* reference by context per `isCodeReference`, a code shape per
* `innerLooksLikeCode`, a tuple or list (internal comma), a gloss or `default`
* annotation lead-in, a group under the four-word floor, a hyphenated or
* capitalized token, and a qualifier lead (preposition, subordinator,
* coordination, modal, negation, past participle).
*/
function isParentheticalAside(text, open, close) {
	const trimmed = text.slice(open + 1, close).trim();
	if (!trimmed.includes(" ")) return false;
	if (trimmed.includes(",")) return false;
	if (LEADIN_RE.test(trimmed)) return false;
	if (isCodeReference(text, open) || innerLooksLikeCode(trimmed)) return false;
	const tokens = trimmed.split(SPACE_RE);
	if (tokens.length < MIN_ASIDE_WORDS) return false;
	for (let i = 0, { length } = tokens; i < length; i += 1) {
		const word = tokens[i];
		if (!WORD_RE.test(word) || CAP_RE.test(word)) return false;
	}
	const lead = tokens[0];
	if (QUALIFIER_LEADS.has(lead) || PARTICIPLE_LEAD_RE.test(lead)) return false;
	return true;
}
/**
* Every prose aside in `text`, each returned as its `(...)` snippet. Pure +
* exported for the unit test; the rule reports once per snippet.
*/
function proseAsides(text) {
	const out = [];
	const matches = text.matchAll(GROUP_RE);
	for (const m of matches) {
		const open = m.index;
		if (isParentheticalAside(text, open, open + m[0].length - 1)) out.push(m[0]);
	}
	return out;
}
const rule$73 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Forbid a prose parenthetical aside in a comment. Rewrite the clause with commas, a colon, or an em-dash instead of setting it off in parentheses.",
			category: "Stylistic Issues",
			recommended: true
		},
		messages: { parentheticalAside: "Comment contains a prose parenthetical aside `{{snippet}}`. The fleet house style forbids `(...)` asides in prose — flesh the detail into a full sentence, drop it from a description or tagline, or move it to a `Note:` sentence. Do not just swap the parens for commas." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { Program() {
			const comments = sourceCode.getAllComments ? sourceCode.getAllComments() : [];
			for (let i = 0, { length } = comments; i < length; i += 1) {
				const comment = comments[i];
				const snippets = proseAsides(comment.value ?? "");
				for (let j = 0, { length: n } = snippets; j < n; j += 1) context.report({
					node: comment,
					messageId: "parentheticalAside",
					data: { snippet: snippets[j] }
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-placeholders/index.mts
const COMMENT_MARKER_RE = /\b(?<marker>FIXME|HACK|STUB|TBD|TODO|UNIMPLEMENTED|WIP|XXX)\b/;
const STUB_BODY_MARKER_RE = /\b(?:FIXME|HACK|STUB|TBD|TODO|UNIMPLEMENTED|WIP|XXX|not\s+implemented|placeholder|stub|unimplemented)\b/i;
const THROW_MESSAGE_RE = /\b(?:FIXME|TODO|not\s+implemented|placeholder|stub|unimplemented)\b/i;
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$72 = {
	meta: {
		type: "problem",
		docs: {
			description: "Ban placeholder code: TODO / FIXME / XXX / HACK / TBD / STUB / WIP / UNIMPLEMENTED markers, `throw new Error(\"not implemented\")`, and empty/stub function bodies. Per CLAUDE.md \"Completion\" rule — finish the work 100% or open an issue.",
			category: "Best Practices",
			recommended: true
		},
		messages: {
			commentMarker: "`{{marker}}` comment — finish the work, open an issue, or ask before deferring. CLAUDE.md \"Completion\" rule bans deferral markers in source.",
			throwPlaceholder: "`throw new Error({{message}})` is a placeholder — implement the function or remove the stub. CLAUDE.md bans unfinished work.",
			stubBody: "Function `{{name}}` has a stub body (placeholder comment with no implementation). Finish the function or remove it. Mark intentional no-ops with `@noop` in the leading JSDoc.",
			emptyBody: "Function `{{name}}` has an empty body and a placeholder marker. Finish the function or remove the marker. Mark intentional no-ops with `@noop` in the leading JSDoc."
		},
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		/**
		* A function counts as "intentionally a no-op" when its leading JSDoc /
		* line comment contains `@noop`. This is the documented escape hatch for
		* callbacks that genuinely do nothing (e.g. event-handler defaults, test
		* spies).
		*/
		function isExplicitNoop(fnNode) {
			const leading = sourceCode.getCommentsBefore(fnNode);
			for (let i = 0, { length } = leading; i < length; i += 1) {
				const c = leading[i];
				if (/@noop\b/.test(c.value)) return true;
			}
			const parent = fnNode.parent;
			if (parent && parent.type === "VariableDeclarator") {
				const declStmt = parent.parent;
				if (declStmt) {
					const above = sourceCode.getCommentsBefore(declStmt);
					for (let i = 0, { length } = above; i < length; i += 1) {
						const c = above[i];
						if (/@noop\b/.test(c.value)) return true;
					}
				}
			}
			return false;
		}
		function functionDisplayName(fnNode) {
			if (fnNode.id?.name) return fnNode.id.name;
			const parent = fnNode.parent;
			if (parent && parent.type === "VariableDeclarator" && parent.id && parent.id.type === "Identifier") return parent.id.name;
			if (parent && parent.type === "Property" && parent.key && parent.key.type === "Identifier") return parent.key.name;
			if (parent && parent.type === "MethodDefinition" && parent.key && parent.key.type === "Identifier") return parent.key.name;
			return "<anonymous>";
		}
		function bodyMarkerComment(blockNode) {
			const inner = sourceCode.getCommentsInside ? sourceCode.getCommentsInside(blockNode) : [];
			for (let i = 0, { length } = inner; i < length; i += 1) {
				const c = inner[i];
				if (STUB_BODY_MARKER_RE.test(c.value)) return c;
			}
		}
		function checkFunctionBody(fnNode) {
			if (!fnNode.body || fnNode.body.type !== "BlockStatement") return;
			if (isExplicitNoop(fnNode)) return;
			const block = fnNode.body;
			const stmts = block.body;
			const name = functionDisplayName(fnNode);
			if (stmts.length === 0) {
				if (bodyMarkerComment(block)) context.report({
					node: fnNode,
					messageId: "emptyBody",
					data: { name }
				});
				return;
			}
			if (stmts.length === 1) {
				const only = stmts[0];
				if (only.type === "ReturnStatement" && (!only.argument || only.argument.type === "Identifier" && only.argument.name === "undefined" || only.argument.type === "Literal" && only.argument.value === null)) {
					if (bodyMarkerComment(block)) context.report({
						node: fnNode,
						messageId: "stubBody",
						data: { name }
					});
				}
			}
		}
		return {
			Program() {
				const comments = sourceCode.getAllComments();
				for (let i = 0, { length } = comments; i < length; i += 1) {
					const comment = comments[i];
					const match = COMMENT_MARKER_RE.exec(comment.value);
					if (!match) continue;
					context.report({
						node: comment,
						messageId: "commentMarker",
						/* c8 ignore start - named-capture group is always present on a regex match */
						data: { marker: match.groups?.["marker"] ?? "" }
					});
				}
			},
			ThrowStatement(node) {
				const arg = node.argument;
				if (!arg || arg.type !== "NewExpression" || arg.callee.type !== "Identifier" || !/^(?:Error|RangeError|TypeError)$/.test(arg.callee.name)) return;
				const first = arg.arguments[0];
				if (!first) return;
				let messageText;
				if (first.type === "Literal" && typeof first.value === "string") messageText = first.value;
				else if (first.type === "TemplateLiteral" && first.expressions.length === 0 && first.quasis.length === 1) messageText = first.quasis[0].value.cooked;
				if (!messageText) return;
				if (!THROW_MESSAGE_RE.test(messageText)) return;
				context.report({
					node,
					messageId: "throwPlaceholder",
					data: { message: JSON.stringify(messageText) }
				});
			},
			FunctionDeclaration: checkFunctionBody,
			FunctionExpression: checkFunctionBody,
			ArrowFunctionExpression: checkFunctionBody
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-platform-specific-import/index.mts
const PLATFORM_MODULES = ["http-request", "logger"];
const modulePatternStr = PLATFORM_MODULES.join("|");
const PLATFORM_SUFFIX_RE = new RegExp(`\\/(?<module>${modulePatternStr})\\/(?:node|browser)(?:\\.(?:ts|js|mts|mjs|cts|cjs))?$`);
function canonicalSpecifier(specifier) {
	return specifier.replace(new RegExp(`\\/(?<module>${modulePatternStr})\\/(?:node|browser)(?:\\..+)?$`), "/$<module>");
}
const rule$71 = {
	meta: {
		type: "problem",
		docs: {
			description: "Import from the http-request barrel, not the platform-specific node/browser entry.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: { platformImport: "Import '{{specifier}}' directly targets the '{{platform}}' platform implementation. Use the barrel '{{fix}}' — the bundler resolves the correct platform via the package.json 'browser' condition." },
		schema: []
	},
	create(context) {
		const normalizedFile = (0, import_normalize.normalizePath)(context.getFilename?.() ?? context.filename ?? "");
		if (PLATFORM_MODULES.some((m) => normalizedFile.includes(`/${m}/`))) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		function hasBypassComment(node) {
			const before = sourceCode.getCommentsBefore(node);
			for (const c of before) if (/no-platform-http-import\s*:/.test(c.value)) return true;
			return false;
		}
		return { ImportDeclaration(node) {
			const specifier = node.source.value;
			const m = PLATFORM_SUFFIX_RE.exec(specifier);
			if (!m) return;
			if (hasBypassComment(node)) return;
			/* c8 ignore next */ const platform = m.groups?.["module"] ?? "";
			const fix = canonicalSpecifier(specifier);
			context.report({
				node: node.source,
				messageId: "platformImport",
				data: {
					specifier,
					platform,
					fix
				},
				fix(fixer) {
					return fixer.replaceText(node.source, `'${fix}'`);
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-private-path-in-source/index.mts
const PATTERNS$1 = [
	{
		kind: "an untracked .claude/plans|reports path",
		re: /(?:^|[\s"'`([{<])\.?\/?\.claude\/(?:plans|reports)\/[^\s"'`)\]}>]+/i
	},
	{
		kind: "another fleet repo's private .claude/ tree",
		re: /(?:^|[\s"'`([{<])socket-[a-z0-9][a-z0-9-]*\/\.claude\/[^\s"'`)\]}>]*/i
	},
	{
		kind: "an absolute /Users/<user>/ home path",
		re: /(?:^|[\s"'`([{<])\/Users\/[^/\s"'`)\]}>]+\/[^\s"'`)\]}>]*/
	},
	{
		kind: "a ../socket-<repo>/ sibling fleet-repo relative path",
		re: /(?:^|[\s"'`([{<])\.\.\/socket-[a-z0-9][a-z0-9-]*\/[^\s"'`)\]}>]*/i
	}
];
const PLACEHOLDER_MATCH_RE = /(?:^|[/.])(?:socket-foo\b|Users\/(?:\.\.\.|me|x)(?:\/|$))/;
const SUPPRESS_RE = /socket-lint:\s*allow\s+(?:cross-repo|personal-path|private-path)\b/;
/**
* The first NON-placeholder private-path match in `value`, or undefined.
* `value` is a comment body, delimiters stripped by oxlint. Exported for unit
* tests.
*/
function firstPrivatePath(value) {
	for (let i = 0, { length } = PATTERNS$1; i < length; i += 1) {
		const { kind, re } = PATTERNS$1[i];
		const m = re.exec(value);
		if (m) {
			const match = m[0].replace(/^[\s"'`([{<]/, "");
			if (PLACEHOLDER_MATCH_RE.test(match)) continue;
			return {
				kind,
				match
			};
		}
	}
}
const rule$70 = {
	meta: {
		type: "problem",
		docs: {
			description: "Forbid an internal/private path (`.claude/plans|reports/…`, `socket-<repo>/.claude/…`, `/Users/<user>/…`, `../socket-<repo>/…`) inside a source-code comment; it leaks internal fleet layout into committed source.",
			category: "Possible Errors",
			recommended: true
		},
		schema: [],
		messages: { privatePath: "Comment references {{kind}} (`{{match}}`) — a private/internal path that leaks fleet layout into committed source. Remove it; describe the constraint, not where a plan doc lives." }
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { Program() {
			const comments = sourceCode.getAllComments ? sourceCode.getAllComments() : [];
			for (let i = 0, { length } = comments; i < length; i += 1) {
				const comment = comments[i];
				if (SUPPRESS_RE.test(comment.value)) continue;
				const hit = firstPrivatePath(comment.value);
				if (!hit) continue;
				context.report({
					node: comment,
					messageId: "privatePath",
					data: {
						kind: hit.kind,
						match: hit.match
					}
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-process-chdir/index.mts
const rule$69 = {
	meta: {
		type: "problem",
		docs: {
			description: "Forbid `process.chdir()` — cwd is global process state; pass an explicit `{ cwd }` to the API that needs it instead.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: { processChdir: "`process.chdir()` mutates global cwd and breaks every other module + concurrent task in the process. Pass an explicit `{ cwd }` to the API that needs it (spawn, fs, glob) instead of relocating the whole process." },
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (/\/test\//.test(filename) || /\.test\.(?:[mc]?[jt]s)$/.test(filename)) return {};
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "MemberExpression" || callee.computed || callee.object.type !== "Identifier" || callee.object.name !== "process" || callee.property.type !== "Identifier" || callee.property.name !== "chdir") return;
			context.report({
				node,
				messageId: "processChdir"
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-process-cwd-in-scripts-hooks/index.mts
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$68 = {
	meta: {
		type: "problem",
		docs: {
			description: "Forbid `process.cwd()` in scripts/ and .claude/hooks/ — cwd is unstable; use fileURLToPath(import.meta.url) or an agent project-root env var.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: { processCwd: "`process.cwd()` is unstable in scripts/ and .claude/hooks/ — the user or agent runner may invoke this from any directory. Anchor on the script's own location: `path.dirname(fileURLToPath(import.meta.url))` + walk-up, or read the agent-provided project-root env var inside hooks." },
		schema: []
	},
	create(context) {
		const filename = (0, import_normalize.normalizePath)(context.filename ?? context.getFilename?.() ?? "");
		if (!/\/(?:\.claude\/hooks|scripts)\//.test(filename) || /\/test\//.test(filename) || /\.test\.(?:[mc]?[jt]s)$/.test(filename)) return {};
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "MemberExpression" || callee.computed || callee.object.type !== "Identifier" || callee.object.name !== "process" || callee.property.type !== "Identifier" || callee.property.name !== "cwd") return;
			context.report({
				node,
				messageId: "processCwd"
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-promise-race/index.mts
const rule$67 = {
	meta: {
		type: "problem",
		docs: {
			description: "Forbid `Promise.race(...)` — losers keep running and leak handles. Use `AbortSignal.any` + timeout, `Promise.allSettled`, or restructure the wait.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: { noPromiseRace: "`Promise.race(...)` leaves the losing promises pending — they keep their handles, deliver results to no one, and each call attaches new `.then` handlers to every input (handler list grows unboundedly; see nodejs/node#17469). Use `AbortSignal.any([AbortSignal.timeout(ms), userSignal])` for timeouts, `Promise.allSettled` when you need every result, restructure to a single awaited promise, or adopt `@watchable/unpromise` when racing a long-lived promise is unavoidable." },
		schema: []
	},
	create(context) {
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "MemberExpression") return;
			if (callee.object.type !== "Identifier" || callee.object.name !== "Promise") return;
			if (callee.property.type !== "Identifier" || callee.property.name !== "race") return;
			context.report({
				node,
				messageId: "noPromiseRace"
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-promise-race-in-loop/index.mts
const RACE_METHODS = /* @__PURE__ */ new Set(["any", "race"]);
const LOOP_TYPES = /* @__PURE__ */ new Set([
	"DoWhileStatement",
	"ForInStatement",
	"ForOfStatement",
	"ForStatement",
	"WhileStatement"
]);
function isInsideLoop(node) {
	let current = node.parent;
	while (current) {
		if (LOOP_TYPES.has(current.type)) return true;
		if (current.type === "ArrowFunctionExpression" || current.type === "FunctionDeclaration" || current.type === "FunctionExpression") return false;
		current = current.parent;
	}
	return false;
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$66 = {
	meta: {
		type: "problem",
		docs: {
			description: "Ban Promise.race / Promise.any inside loop bodies — handlers stack on surviving promises and leak.",
			category: "Best Practices",
			recommended: true
		},
		messages: { banned: "Promise.{{method}}() inside a loop — handlers stack on surviving promises across iterations and leak. See .claude/skills/fleet/plugging-promise-race/SKILL.md for safe shapes." },
		schema: []
	},
	create(context) {
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "MemberExpression") return;
			if (callee.object.type !== "Identifier" || callee.object.name !== "Promise") return;
			if (callee.property.type !== "Identifier") return;
			if (!RACE_METHODS.has(callee.property.name)) return;
			if (!isInsideLoop(node)) return;
			context.report({
				node,
				messageId: "banned",
				data: { method: callee.property.name }
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-required-in-options-bag/index.mts
const BYPASS_RE$14 = /socket-lint:\s*allow\s+no-required-in-options-bag/;
const OPTIONS_PARAM_NAMES = /* @__PURE__ */ new Set(["options", "opts"]);
function isOptionalityMember(member) {
	return member.type === "TSMethodSignature" || member.type === "TSPropertySignature";
}
function typeLiteralMembers(node) {
	if (node?.type === "TSTypeLiteral" && Array.isArray(node.members)) return node.members;
}
function paramIdentifier(param) {
	if (!param || typeof param !== "object") return;
	if (param.type === "AssignmentPattern") {
		const left = param.left;
		return left?.type === "Identifier" ? left : void 0;
	}
	return param.type === "Identifier" ? param : void 0;
}
const rule$65 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Options bags are all-optional — a required member is positional or lives in a `config` bag.",
			category: "Stylistic Issues",
			recommended: true
		},
		schema: [],
		messages: { requiredInOptionsBag: "a required member in an options bag — an option the caller MUST pass is not an option; hoist it to a positional parameter (`fn(required, options?)`) or move the bag to a required `config`. Bypass: add a `socket-lint: allow no-required-in-options-bag` comment." }
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$14);
		const filename = (0, import_normalize.normalizePath)(context.filename ?? context.getFilename?.() ?? "");
		if (/\.d\.[cm]?ts$/.test(filename) || /\.test\.[cm]?[jt]sx?$/.test(filename) || filename.includes("/test/") || filename.startsWith("test/")) return {};
		function reportRequiredMembers(owner, members) {
			for (let i = 0, { length } = members; i < length; i += 1) {
				const member = members[i];
				if (isOptionalityMember(member) && member.optional !== true) {
					if (!hasBypassComment(owner)) context.report({
						node: member,
						messageId: "requiredInOptionsBag"
					});
				}
			}
		}
		function checkFunction(node) {
			const params = node.params;
			if (!Array.isArray(params)) return;
			for (let i = 0, { length } = params; i < length; i += 1) {
				const ident = paramIdentifier(params[i]);
				if (!ident || typeof ident.name !== "string" || !OPTIONS_PARAM_NAMES.has(ident.name)) continue;
				const annotation = ident.typeAnnotation;
				const members = typeLiteralMembers(annotation?.typeAnnotation);
				if (members) reportRequiredMembers(node, members);
			}
		}
		return {
			ArrowFunctionExpression: checkFunction,
			FunctionDeclaration: checkFunction,
			FunctionExpression: checkFunction,
			TSInterfaceDeclaration(node) {
				const id = node.id;
				const body = node.body;
				if (typeof id?.name === "string" && id.name.endsWith("Options") && Array.isArray(body?.body)) reportRequiredMembers(node, body.body);
			},
			TSTypeAliasDeclaration(node) {
				const id = node.id;
				const members = typeLiteralMembers(node.typeAnnotation);
				if (typeof id?.name === "string" && id.name.endsWith("Options") && members) reportRequiredMembers(node, members);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-runtime-features-below-engine-floor/index.mts
/**
* @file Forbid modern runtime built-ins whose `engines.node` floor predates the
*   Node major that first shipped them — below that floor they throw
*   `TypeError: ... is not a function` at runtime, which a type-checker
*   targeting a newer lib won't catch. ENGINE-AWARE, not a blanket ban: the
*   rule walks up to the nearest `package.json`, reads `engines.node`, and
*   fires per feature only when the declared floor is below that feature's Node
*   major. No engines field means evergreen — everything allowed. Coverage
*   spans ES2023–2026; the feature → Node-major table is mirrored in
*   MEMBER_METHOD_MAJORS / STATIC_METHOD_MAJORS below. Sources, safe rewrites,
*   and the recheck cadence (verified 2026-06-11):
*   docs/agents.md/fleet/runtime-feature-floors.md.
*/
/**
* @type {import('eslint').Rule.RuleModule}
*/
const MEMBER_METHOD_MAJORS = /* @__PURE__ */ new Map([
	["toReversed", {
		major: 20,
		fix: "`[...arr].reverse()`"
	}],
	["toSorted", {
		major: 20,
		fix: "`[...arr].sort(cmp)`"
	}],
	["toSpliced", {
		major: 20,
		fix: "`const copy = [...arr]; copy.splice(start, deleteCount, ...items)`"
	}],
	["with", {
		major: 20,
		fix: "`const copy = [...arr]; copy[index] = value`"
	}],
	["findLast", {
		major: 20,
		fix: "`[...arr].reverse().find(fn)`"
	}],
	["findLastIndex", {
		major: 20,
		fix: "`for (let i = arr.length - 1; i >= 0; i -= 1) { if (fn(arr[i])) { … } }`"
	}]
]);
const STATIC_METHOD_MAJORS = /* @__PURE__ */ new Map([
	["groupBy", {
		object: "Object",
		major: 21,
		fix: "`arr.reduce((acc, x) => { (acc[key(x)] ??= []).push(x); return acc }, {})`"
	}],
	["withResolvers", {
		object: "Promise",
		major: 22,
		fix: "a manual executor that captures resolve/reject (e.g. the SDK `promiseWithResolvers` helper)"
	}],
	["fromAsync", {
		object: "Array",
		major: 22,
		fix: "`const out = []; for await (const x of iter) { out.push(x) }`"
	}]
]);
const GROUP_BY_OBJECTS = /* @__PURE__ */ new Set(["Map", "Object"]);
const GROUP_BY_MAJOR = 21;
const GROUP_BY_FIX = "`arr.reduce((acc, x) => { (acc[key(x)] ??= []).push(x); return acc }, {})`";
const floorCache = /* @__PURE__ */ new Map();
function parseNodeFloorMajor(range) {
	const m = /(?<major>\d+)/.exec(range);
	if (!m) return;
	/* c8 ignore start - m.groups is always defined when exec() matches a named-group pattern; \d+ always produces an integer */
	const n = Number(m.groups?.["major"]);
	return Number.isInteger(n) ? n : void 0;
	/* c8 ignore stop */
}
function nearestEnginesNodeFloor(fromDir) {
	let dir = fromDir;
	for (let i = 0; i < 64; i += 1) {
		const pkgPath = path.join(dir, "package.json");
		if (existsSync(pkgPath)) try {
			const node = JSON.parse(readFileSync(pkgPath, "utf8")).engines?.node;
			if (typeof node === "string") return parseNodeFloorMajor(node);
		} catch {}
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
}
function floorMajorFor(filename) {
	const dir = path.dirname(filename);
	if (floorCache.has(dir)) return floorCache.get(dir);
	const floor = nearestEnginesNodeFloor(dir);
	floorCache.set(dir, floor);
	return floor;
}
const OSCILLATING_FEATURES = /* @__PURE__ */ new Set(["toSorted"]);
const rule$64 = {
	meta: {
		type: "problem",
		docs: {
			description: "Forbid modern runtime built-ins (ES2023–2026 array copy/find methods, Object/Map.groupBy, Promise.withResolvers, Array.fromAsync) in repos whose engines.node floor is below the feature's Node major.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: {
			belowEngineFloor: "`{{name}}` requires Node {{major}}+, but this package declares `engines.node` below {{major}} — it throws at runtime on the supported floor. Rewrite as {{fix}} (no shim needed).",
			belowEngineFloorOscillates: "`{{name}}` requires Node {{major}}+, but this package declares `engines.node` below {{major}} — it throws at runtime on the supported floor. Do NOT use `{{fix}}` — that triggers unicorn/no-array-sort and causes autofix oscillation. Convergent form: `arr.slice().sort(cmp)` with `// oxlint-disable-next-line unicorn/no-array-sort -- fresh copy`, or raise `engines.node` to `>=20`."
		},
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (!filename) return {};
		const floor = floorMajorFor(filename);
		if (floor === void 0) return {};
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "MemberExpression" || callee.computed || callee.property.type !== "Identifier") return;
			const name = callee.property.name;
			const member = MEMBER_METHOD_MAJORS.get(name);
			if (member !== void 0) {
				if (floor < member.major) {
					const messageId = OSCILLATING_FEATURES.has(name) ? "belowEngineFloorOscillates" : "belowEngineFloor";
					context.report({
						node,
						messageId,
						data: {
							name,
							major: String(member.major),
							fix: member.fix
						}
					});
				}
				return;
			}
			if (callee.object.type !== "Identifier") return;
			const objectName = callee.object.name;
			if (name === "groupBy" && GROUP_BY_OBJECTS.has(objectName)) {
				if (floor < GROUP_BY_MAJOR) context.report({
					node,
					messageId: "belowEngineFloor",
					data: {
						name: `${objectName}.groupBy`,
						major: String(GROUP_BY_MAJOR),
						fix: GROUP_BY_FIX
					}
				});
				return;
			}
			const staticEntry = STATIC_METHOD_MAJORS.get(name);
			if (staticEntry !== void 0 && objectName === staticEntry.object && floor < staticEntry.major) context.report({
				node,
				messageId: "belowEngineFloor",
				data: {
					name: `${staticEntry.object}.${name}`,
					major: String(staticEntry.major),
					fix: staticEntry.fix
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-source-content-tests/index.mts
const REPO_SOURCE_FILE_RE = /(?:^|\/)(?:\.claude|\.config|scripts|src|template)\/[^'"`]*\.(?:[jt]sx?|[mc][jt]s)$/;
const READ_FN_NAMES = /* @__PURE__ */ new Set(["readFile", "readFileSync"]);
const TMP_SIGNAL_RE = /(?:^|[-_.])(?:mkdtemp|scratch|tmpdir|tmp|temp)(?:$|[-_.0-9A-Z])/;
const CONTENT_MATCHERS = /* @__PURE__ */ new Set(["toContain", "toMatch"]);
const CONTENT_METHODS = /* @__PURE__ */ new Set([
	"includes",
	"match",
	"search"
]);
function readCalleeName(node) {
	if (node?.type !== "CallExpression") return;
	const callee = node.callee;
	if (callee?.type === "Identifier") return callee.name;
	if (callee?.type === "MemberExpression" && !callee.computed && callee.property?.type === "Identifier") return callee.property.name;
}
function subtreeNamesRepoSource(node) {
	let found = false;
	walk(node, (child) => {
		if (found) return;
		if (child.type === "Literal" && typeof child.value === "string" && REPO_SOURCE_FILE_RE.test(child.value)) {
			found = true;
			return;
		}
		if (child.type === "TemplateElement") {
			const cooked = child.value?.cooked;
			if (typeof cooked === "string" && REPO_SOURCE_FILE_RE.test(cooked)) found = true;
		}
	});
	return found;
}
function walk(node, visit) {
	if (!node || typeof node !== "object") return;
	if (Array.isArray(node)) {
		for (let i = 0, { length } = node; i < length; i += 1) walk(node[i], visit);
		return;
	}
	if (typeof node.type !== "string") return;
	visit(node);
	const keyList = Object.keys(node);
	for (let i = 0, { length } = keyList; i < length; i += 1) {
		const key = keyList[i];
		if (key === "loc" || key === "parent" || key === "range") continue;
		const child = node[key];
		if (child && typeof child === "object") walk(child, visit);
	}
}
function unwrapAwait(node) {
	return node?.type === "AwaitExpression" ? node.argument : node;
}
function calleeRootsAtExpect$1(callee) {
	let cur = callee;
	while (cur) {
		if (cur.type === "Identifier") return cur.name === "expect";
		if (cur.type === "MemberExpression") {
			cur = cur.object;
			continue;
		}
		if (cur.type === "CallExpression") {
			cur = cur.callee;
			continue;
		}
		return false;
	}
	return false;
}
function matcherName$1(node) {
	if (node.type === "CallExpression" && node.callee?.type === "MemberExpression" && !node.callee.computed && node.callee.property?.type === "Identifier") return node.callee.property.name;
}
function innerExpectCall(node) {
	let cur = node.callee;
	while (cur) {
		if (cur.type === "CallExpression" && cur.callee?.type === "Identifier" && cur.callee.name === "expect") return cur;
		if (cur.type === "MemberExpression") {
			cur = cur.object;
			continue;
		}
		if (cur.type === "CallExpression") {
			cur = cur.callee;
			continue;
		}
		return;
	}
}
function assertCallKind(node) {
	const callee = node.callee;
	if (callee?.type === "Identifier" && callee.name === "assert") return "assert";
	if (callee?.type === "MemberExpression" && !callee.computed && callee.object?.type === "Identifier" && callee.object.name === "assert" && callee.property?.type === "Identifier") return callee.property.name;
}
const rule$63 = {
	meta: {
		type: "problem",
		docs: {
			description: "In tests, do not assert on the raw source text of another repo file — import the module and assert on its behavior.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: { sourceContentAssertion: "This asserts on the raw SOURCE TEXT of a repo file — a rename or comment edit flips the verdict with behavior unchanged. Import the module and assert on its exports, or spawn it and assert on its output. Full-equality parity byte-compares and scripts/fleet/check/* marker checks are the legitimate text checks." },
		schema: []
	},
	create(context) {
		if (!isTestFile$2(context.filename ?? context.getFilename?.() ?? "")) return {};
		return { Program(program) {
			const declInits = /* @__PURE__ */ new Map();
			walk(program, (node) => {
				if (node.type === "VariableDeclarator" && node.id?.type === "Identifier" && node.init) declInits.set(node.id.name, node.init);
			});
			const argsHaveTmpSignal = (args) => {
				let found = false;
				walk(args, (node) => {
					if (found || node.type !== "Identifier") return;
					if (TMP_SIGNAL_RE.test(node.name)) {
						found = true;
						return;
					}
					const init = declInits.get(node.name);
					if (!init) return;
					walk(init, (inner) => {
						if (inner.type === "Identifier" && TMP_SIGNAL_RE.test(inner.name)) found = true;
					});
				});
				return found;
			};
			const argsNameRepoSource = (args) => {
				if (argsHaveTmpSignal(args)) return false;
				if (subtreeNamesRepoSource(args)) return true;
				let found = false;
				walk(args, (node) => {
					if (found || node.type !== "Identifier") return;
					const init = declInits.get(node.name);
					if (init && subtreeNamesRepoSource(init)) found = true;
				});
				return found;
			};
			const isSourceReadCall = (node) => {
				const unwrapped = unwrapAwait(node);
				const name = readCalleeName(unwrapped);
				if (name === void 0 || !READ_FN_NAMES.has(name)) return false;
				return argsNameRepoSource(unwrapped.arguments ?? []);
			};
			const sourceTextBindings = /* @__PURE__ */ new Set();
			for (const [name, init] of declInits) if (isSourceReadCall(init)) sourceTextBindings.add(name);
			const holdsSourceText = (node) => {
				const unwrapped = unwrapAwait(node);
				if (unwrapped?.type === "Identifier" && sourceTextBindings.has(unwrapped.name)) return true;
				return unwrapped ? isSourceReadCall(unwrapped) : false;
			};
			const subtreeProbesSourceText = (args) => {
				let found = false;
				walk(args, (node) => {
					if (found || node.type !== "CallExpression") return;
					const callee = node.callee;
					if (callee?.type !== "MemberExpression" || callee.computed || callee.property?.type !== "Identifier") return;
					const method = callee.property.name;
					if (CONTENT_METHODS.has(method) && holdsSourceText(callee.object)) {
						found = true;
						return;
					}
					if (method === "test" && (callee.object?.type === "Literal" || callee.object?.type === "NewExpression") && holdsSourceText(node.arguments?.[0])) found = true;
				});
				return found;
			};
			walk(program, (node) => {
				if (node.type !== "CallExpression") return;
				if (calleeRootsAtExpect$1(node.callee)) {
					const matcher = matcherName$1(node);
					if (matcher !== void 0 && CONTENT_MATCHERS.has(matcher)) {
						const inner = innerExpectCall(node);
						if (inner && holdsSourceText(inner.arguments?.[0])) {
							context.report({
								node,
								messageId: "sourceContentAssertion"
							});
							return;
						}
					}
					if (node.callee?.type === "Identifier" && node.callee.name === "expect" && subtreeProbesSourceText(node.arguments ?? [])) context.report({
						node,
						messageId: "sourceContentAssertion"
					});
					return;
				}
				const kind = assertCallKind(node);
				if (kind === void 0) return;
				if ((kind === "doesNotMatch" || kind === "match") && holdsSourceText(node.arguments?.[0])) {
					context.report({
						node,
						messageId: "sourceContentAssertion"
					});
					return;
				}
				if (subtreeProbesSourceText(node.arguments ?? [])) context.report({
					node,
					messageId: "sourceContentAssertion"
				});
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-source-sniffing/index.mts
/**
* @file Forbid SOURCE-SNIFFING — inferring what code DOES by pattern-matching
*   its source TEXT, in a check / generator / lint rule / unit test. To know
*   what a module does, IMPORT it and read its typed export (e.g. a
*   `defineHook` instance's `.type` / `.event`), or parse its AST — never regex
*   its source. Text sniffing rots: a refactor that keeps behavior but changes
*   wording silently flips the verdict (the dispatch classifier once decided
*   dispatch-vs-spawn by grepping `withBashGuard|runGuard` out of hook source).
*   Flags, in a file under `scripts/`, `.config/fleet/oxlint-plugin/`, or a
*   `*.test.*`, a regex/string scan of a value holding a code module's source —
*   a variable named `source` or ending in `Source` (`hookFileSource`,
*   `rawSource`): `<regex>.test(source)` / `.exec`, or
*   `source.match(re)` / `.search` / `.includes(s)`. Fix: import the module +
*   assert its typed export, or parse the AST — not its bytes. Deliberately
*   narrow (no `src`/`code`/`contents`, no bare `readFileSync(...)`) so honest
*   content checks ("does package.json contain X?") don't false-positive. No
*   autofix, the rewrite is structural. Pairs with the import-based dispatch
*   classifier + `hook-names-are-accurate`.
*/
function isRegexLike(node) {
	if (!node) return false;
	if (node.type === "Literal" && node.regex) return true;
	return node.type === "NewExpression" && node.callee?.name === "RegExp";
}
function isSourceOperand(node) {
	return node?.type === "Identifier" && (node.name === "source" || node.name.endsWith("Source"));
}
const SCANNER_BYPASS_RE = socketLintAllowRe("source-scanner");
const rule$62 = {
	meta: {
		type: "problem",
		docs: {
			description: "Do not infer behavior by pattern-matching source text — import the module and read its typed export, or parse its AST.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: { sourceSniff: "Source-sniffing: this scans source/file TEXT to infer behavior, which rots when wording changes. Import the module and read its typed export (e.g. a defineHook instance) or parse its AST instead." },
		schema: []
	},
	create(context) {
		const isScannerLine = makeBypassChecker(context, SCANNER_BYPASS_RE);
		const filename = (0, import_normalize.normalizePath)(context.filename ?? context.getFilename?.() ?? "");
		if (!/\/scripts\//.test(filename) && !/\/\.config\/oxlint-plugin\//.test(filename) && !/\.test\.[mc]?[jt]s$/.test(filename)) return {};
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee?.type !== "MemberExpression") return;
			const method = callee.property?.name;
			if ((method === "exec" || method === "test") && isRegexLike(callee.object) && isSourceOperand(node.arguments?.[0])) {
				if (!isScannerLine(node)) context.report({
					node,
					messageId: "sourceSniff"
				});
				return;
			}
			if ((method === "includes" || method === "match" || method === "search") && isSourceOperand(callee.object)) {
				if (!isScannerLine(node)) context.report({
					node,
					messageId: "sourceSniff"
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-spawn-stream-double-consume/index.mts
/**
* @file The fleet `spawn` (`@socketsecurity/lib-stable/process/spawn/child`)
*   BUFFERS the child's stdout/stderr internally — that is how the awaited
*   result carries `.stdout` / `.stderr`. Calling `.setEncoding(enc)` on one of
*   those streams flips it to STRING mode globally, so the wrapper's own
*   internal `data` listener then receives STRINGS, and its close-time
*   `Buffer.concat([...])` throws `TypeError: list[0] must be a Buffer`. This
*   is not theoretical — it broke socket-lib's secrets {macos,linux,windows}
*   backends, which called `.setEncoding('utf8')` on a stream the lib was
*   concurrently buffering. The fix is to read the captured output from the
*   AWAITED result instead: `const { stdout } = await spawn(cmd, args, {
*   stdioString: true })` (wrap in try/catch — the wrapper rejects on a
*   non-zero exit, the error carrying `.code` + `.stdout` + `.stderr`). If you
*   genuinely need to stream the output yourself, pass `stdio` options so the
*   wrapper does not also buffer. This rule flags ONLY `.setEncoding(...)` on
*   the `.stdout` / `.stderr` of a fleet `spawn(...)` child reached through
*   `.process` (`const { process } = spawn(...)` then
*   `process.stdout.setEncoding(...)`, `const c = spawn(...);
*   c.process.stderr.setEncoding(...)`, an intermediate `const s =
*   c.process.stdout`, or the inline `spawn(...).process.stdout.setEncoding`).
*   A plain `.on('data')` / `.pipe()` WITHOUT `setEncoding` keeps the stream in
*   Buffer mode, so the wrapper's concat still works — that is a legitimate
*   streaming pattern, a hook test streaming stderr does it, and is NOT
*   flagged. Accessing the stream off the BARE spawn return (`const c =
*   spawn(...); c.stdout.on(...)`) is a different bug caught by
*   `socket/no-bare-spawn-childproc-access`. Report-only: the right fix is
*   contextual (await the wrapper, or pass `stdio` options), so the human
*   picks. Bypass: a `socket-lint: allow spawn-stream-double-consume` comment
*   on or just above the flagged line.
*/
const CRASH_METHOD = "setEncoding";
const STREAM_PROPS = /* @__PURE__ */ new Set(["stderr", "stdout"]);
const ALLOW_RE$1 = /socket-lint:\s*allow\s+spawn-stream-double-consume/;
function isSpawnCall(node) {
	if (!node || node.type !== "CallExpression") return false;
	const callee = node.callee;
	if (!callee) return false;
	if (callee.type === "Identifier") return callee.name === "spawn";
	if (callee.type === "MemberExpression" && !callee.computed && callee.property?.type === "Identifier") return callee.property.name === "spawn";
	return false;
}
const rule$61 = {
	meta: {
		type: "problem",
		docs: {
			description: "Do not call `.setEncoding()` on a fleet-spawn child stdout/stderr stream the wrapper already buffers — the encoding flip crashes the lib `Buffer.concat`. Read the awaited result instead (a plain `.on(\"data\")` without setEncoding is fine).",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: { spawnStreamDoubleConsume: "`.{{method}}()` on a fleet-spawn child stdout/stderr flips a stream the spawn wrapper is already buffering as Buffers into string mode, so the wrapper`s close-time `Buffer.concat` throws `TypeError: list[0] must be a Buffer`. Read the captured output from the awaited result instead: `const { stdout } = await spawn(cmd, args, { stdioString: true })` (try/catch — it rejects on non-zero, the error carrying `.code`/`.stdout`/`.stderr`). To stream raw output yourself, pass `stdio` options so the wrapper does not also buffer (a plain `.on('data')` without setEncoding is fine — only the encoding flip crashes)." },
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, ALLOW_RE$1);
		const spawnNames = /* @__PURE__ */ new Set();
		const procNames = /* @__PURE__ */ new Set();
		const streamNames = /* @__PURE__ */ new Set();
		function isSpawnProcessExpr(node) {
			if (!node || node.type !== "MemberExpression" || node.computed || node.property?.type !== "Identifier" || node.property.name !== "process") return false;
			const obj = node.object;
			if (!obj) return false;
			if (obj.type === "Identifier") return spawnNames.has(obj.name);
			return isSpawnCall(obj);
		}
		function isSpawnProcessRef(node) {
			if (!node) return false;
			if (node.type === "Identifier") return procNames.has(node.name);
			return isSpawnProcessExpr(node);
		}
		function isSpawnStreamExpr(node) {
			if (!node || node.type !== "MemberExpression" || node.computed || node.property?.type !== "Identifier" || !STREAM_PROPS.has(node.property.name)) return false;
			return isSpawnProcessRef(node.object);
		}
		function isSpawnStream(node) {
			if (!node) return false;
			if (node.type === "Identifier") return streamNames.has(node.name);
			return isSpawnStreamExpr(node);
		}
		return {
			VariableDeclarator(node) {
				const id = node.id;
				const init = node.init;
				if (!id || !init) return;
				if (id.type === "Identifier") {
					if (isSpawnCall(init)) spawnNames.add(id.name);
					else if (isSpawnProcessExpr(init)) procNames.add(id.name);
					else if (isSpawnStreamExpr(init)) streamNames.add(id.name);
					return;
				}
				if (id.type !== "ObjectPattern" || !Array.isArray(id.properties)) return;
				const fromSpawn = isSpawnCall(init) || init.type === "Identifier" && spawnNames.has(init.name);
				const fromProc = isSpawnProcessRef(init);
				for (let i = 0, { length } = id.properties; i < length; i += 1) {
					const p = id.properties[i];
					if (!p || p.type !== "Property" || p.computed || p.key?.type !== "Identifier" || p.value?.type !== "Identifier") continue;
					if (fromSpawn && p.key.name === "process") procNames.add(p.value.name);
					else if (fromProc && STREAM_PROPS.has(p.key.name)) streamNames.add(p.value.name);
				}
			},
			CallExpression(node) {
				const callee = node.callee;
				if (!callee || callee.type !== "MemberExpression" || callee.computed || callee.property?.type !== "Identifier") return;
				if (callee.property.name !== CRASH_METHOD) return;
				if (!isSpawnStream(callee.object)) return;
				if (hasBypassComment(node)) return;
				context.report({
					node,
					messageId: "spawnStreamDoubleConsume",
					data: { method: CRASH_METHOD }
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-spawnsync-code-field/index.mts
/**
* @file The fleet sync spawn (`spawnSync` from
*   `@socketsecurity/lib-stable/process/spawn/child`) returns node's
*   `SpawnSyncReturns`, whose exit code lives on `.status` (an `.signal`
*   sibling), NOT `.code`. Reading `.code` off a `spawnSync(...)` result is
*   ALWAYS `undefined` — a silent false-green: a guard like `if
*   (spawnSync(...).code !== 0)` never fires, so a failed child reads as
*   success. (This is not theoretical — it caused the markdown-filenames
*   check to false-green until fixed in 32e0bf93.) The ASYNC `spawn(...)`
*   wrapper is different: it rejects on non-zero exit with an error carrying
*   `.code`, so `.code` is correct THERE — this rule scopes strictly to
*   values that come from `spawnSync(...)`, both the inline
*   `spawnSync(...).code` and a tracked binding (`const r = spawnSync(...);
*   r.code`). `.status` / computed access (`r['code']`) / `.code` on anything
*   not from spawnSync are left alone. Report-only (the fix is `.status`, but
*   a rename autofix would need to be sure the receiver is a spawnSync result
*   at every site — the human confirms). Bypass: a `socket-lint: allow
*   spawnsync-code-field` comment on or just above the flagged line.
*/
const ALLOW_RE = /socket-lint:\s*allow\s+spawnsync-code-field/;
const BAD_PROP = "code";
function enclosingScope(node) {
	let current = node?.parent;
	while (current) {
		const t = current.type;
		if (t === "ArrowFunctionExpression" || t === "FunctionDeclaration" || t === "FunctionExpression" || t === "Program") return current;
		current = current.parent;
	}
}
function isSpawnSyncCall(node) {
	if (!node || node.type !== "CallExpression") return false;
	const callee = node.callee;
	if (!callee) return false;
	if (callee.type === "Identifier") return callee.name === "spawnSync";
	if (callee.type === "MemberExpression" && !callee.computed && callee.property?.type === "Identifier") return callee.property.name === "spawnSync";
	return false;
}
const rule$60 = {
	meta: {
		type: "problem",
		docs: {
			description: "Do not read `.code` off a `spawnSync(...)` result — SpawnSyncReturns carries the exit code on `.status`, so `.code` is always undefined (silent false-green). Use `.status`.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: { spawnsyncCodeField: "`.code` on a `spawnSync(...)` result is ALWAYS undefined — node`s SpawnSyncReturns carries the exit code on `.status` (`.code` is the async `spawn(...)` error shape). Reading it is a silent false-green: a `!== 0` guard never fires. Use `.status` instead (and `.signal` for a kill signal)." },
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, ALLOW_RE);
		const spawnSyncNamesByScope = /* @__PURE__ */ new Map();
		function isSpawnSyncResult(node) {
			if (!node) return false;
			if (node.type === "Identifier") {
				let scope = enclosingScope(node);
				for (;;) {
					if (spawnSyncNamesByScope.get(scope)?.has(node.name)) return true;
					if (!scope) return false;
					scope = enclosingScope(scope);
				}
			}
			return isSpawnSyncCall(node);
		}
		return {
			VariableDeclarator(node) {
				const id = node.id;
				const init = node.init;
				if (id?.type === "Identifier" && isSpawnSyncCall(init)) {
					const scope = enclosingScope(node);
					let names = spawnSyncNamesByScope.get(scope);
					if (!names) {
						names = /* @__PURE__ */ new Set();
						spawnSyncNamesByScope.set(scope, names);
					}
					names.add(id.name);
				}
			},
			MemberExpression(node) {
				if (node.computed || node.property?.type !== "Identifier" || node.property.name !== BAD_PROP) return;
				if (!isSpawnSyncResult(node.object)) return;
				if (hasBypassComment(node)) return;
				context.report({
					node,
					messageId: "spawnsyncCodeField"
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-src-import-in-test-expect/index.mts
/**
* @file In a test file, a lib utility imported from the local `src/` tree must
*   not be used as a TOOL inside `expect(...)`, to build the expected value.
*   Doing so validates `src` against itself: if the utility has a bug, the API
*   output AND the expected value are wrong the same way, so the assertion
*   still passes and the bug hides. The system-under-test legitimately imports
*   from `src/` — this rule does NOT object to that. It only fires when a
*   `src/`-imported binding appears inside an `expect(...)` argument, where the
*   trustworthy reference is the PUBLISHED snapshot via the `-stable` alias
*   (`@socketsecurity/<pkg>-stable/<subpath>`). Concrete incident (socket-lib,
*   2026-05-27): `dlx/detect.test.mts` imported `normalizePath` from
*   `../../../src/paths/normalize` and used it as
*   `expect(result.packageJsonPath).toBe(normalizePath(join(...)))`. The
*   pre-existing `prefer-stable-self-import` rule missed it twice: it skips
*   test files, and it only flags bare package-name imports, not relative
*   `src/` paths. Scope: files matching `*.test.*`. A binding is flagged only
*   when it (a) is imported from a relative specifier whose path lands under a
*   `src/` segment, and (b) appears as an identifier inside an `expect(...)`
*   call's arguments. Report-only — the `-stable` package name varies per repo,
*   so the rewrite is left to the author (replace the relative `src/` path with
*   `@socketsecurity/<pkg>-stable/<subpath>`).
*/
const SRC_RELATIVE_RE = /^\.\.?\/(?:[^'"]*\/)?src\//;
function calleeRootsAtExpect(callee) {
	let cur = callee;
	while (cur) {
		if (cur.type === "Identifier") return cur.name === "expect";
		if (cur.type === "MemberExpression") {
			cur = cur.object;
			continue;
		}
		if (cur.type === "CallExpression") {
			cur = cur.callee;
			continue;
		}
		return false;
	}
	return false;
}
function isExpectActualCall(node) {
	return node.type === "CallExpression" && node.callee?.type === "Identifier" && node.callee.name === "expect";
}
const CLASS_IDENTITY_MATCHERS = /* @__PURE__ */ new Set([
	"rejects",
	"toBeInstanceOf",
	"toThrow",
	"toThrowError"
]);
function matcherName(node) {
	if (node.type === "CallExpression" && node.callee?.type === "MemberExpression" && !node.callee.computed && node.callee.property?.type === "Identifier") return node.callee.property.name;
}
function collectValueIdentifiers(node, out) {
	if (!node || typeof node !== "object") return;
	if (Array.isArray(node)) {
		for (let i = 0, { length } = node; i < length; i += 1) collectValueIdentifiers(node[i], out);
		return;
	}
	if (typeof node.type !== "string") return;
	if (node.type === "MemberExpression" && !node.computed && node.property?.type === "Identifier" && node.property.name === "prototype") return;
	if (node.type === "Identifier") {
		out.add(node.name);
		return;
	}
	const keyItems = Object.keys(node);
	for (let i = 0, { length } = keyItems; i < length; i += 1) {
		const key = keyItems[i];
		if (key === "loc" || key === "parent" || key === "range") continue;
		const child = node[key];
		if (node.type === "MemberExpression" && key === "property" && !node.computed) continue;
		if (node.type === "Property" && key === "key" && !node.computed) continue;
		if (child && typeof child === "object") collectValueIdentifiers(child, out);
	}
}
const rule$59 = {
	meta: {
		type: "problem",
		docs: {
			description: "In tests, a src/-imported utility used inside expect(...) must come from the -stable alias, not local src/ (else the test validates src against itself).",
			category: "Best Practices",
			recommended: true
		},
		messages: { srcToolInExpect: "`{{name}}` is imported from local `src/` (`{{specifier}}`) and used inside `expect(...)`. A utility used to BUILD the expected value must come from the published snapshot — import it from the `@socketsecurity/<pkg>-stable/<subpath>` alias instead. Importing `src/` for the system-under-test is fine; this only applies to tools used in assertions." },
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (!TEST_FILE_RE$2.test(filename)) return {};
		return { Program(program) {
			const srcBindings = /* @__PURE__ */ new Map();
			const importNodes = /* @__PURE__ */ new Map();
			for (const stmt of program.body) {
				if (stmt.type !== "ImportDeclaration" || stmt.source?.type !== "Literal") continue;
				const specifier = String(stmt.source.value);
				if (!SRC_RELATIVE_RE.test(specifier)) continue;
				for (const spec of stmt.specifiers) if (spec.local?.type === "Identifier") {
					srcBindings.set(spec.local.name, specifier);
					importNodes.set(spec.local.name, stmt);
				}
			}
			if (srcBindings.size === 0) return;
			const flagged = /* @__PURE__ */ new Set();
			const visit = (node) => {
				if (!node || typeof node !== "object") return;
				if (Array.isArray(node)) {
					for (let i = 0, { length } = node; i < length; i += 1) visit(node[i]);
					return;
				}
				if (typeof node.type !== "string") return;
				if (node.type === "CallExpression" && calleeRootsAtExpect(node.callee) && !isExpectActualCall(node) && !CLASS_IDENTITY_MATCHERS.has(matcherName(node) ?? "") && Array.isArray(node.arguments)) {
					const used = /* @__PURE__ */ new Set();
					for (let i = 0, { length } = node.arguments; i < length; i += 1) collectValueIdentifiers(node.arguments[i], used);
					for (const name of used) if (srcBindings.has(name)) flagged.add(name);
				}
				const keyList = Object.keys(node);
				for (let j = 0, { length: jlen } = keyList; j < jlen; j += 1) {
					const key = keyList[j];
					if (key === "loc" || key === "parent" || key === "range") continue;
					const child = node[key];
					if (child && typeof child === "object") visit(child);
				}
			};
			visit(program);
			for (const name of flagged) context.report({
				node: importNodes.get(name),
				messageId: "srcToolInExpect",
				data: {
					name,
					specifier: srcBindings.get(name)
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-status-emoji/index.mts
const EMOJI_TO_METHOD = {
	"☑": "success",
	"⚠": "warn",
	"⚠️": "warn",
	"✅": "success",
	"✓": "success",
	"✔": "success",
	"✗": "fail",
	"❌": "fail",
	"❎": "fail",
	"❗": "warn"
};
const EMOJI = Object.keys(EMOJI_TO_METHOD);
const EMOJI_LEAD_RE = new RegExp(`^\\s*(${EMOJI.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*`);
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$58 = {
	meta: {
		type: "problem",
		docs: {
			description: "Ban status-symbol emoji literals; use the logger.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: {
			banned: "Status-symbol emoji \"{{emoji}}\" — use logger.{{method}}() from @socketsecurity/lib-stable/logger/default.",
			bannedAmbiguous: "Status-symbol emoji \"{{emoji}}\" — use a logger method (success/fail/warn/info) instead of an inline symbol."
		},
		schema: []
	},
	create(context) {
		/**
		* Find any banned emoji in a string. Returns the first match.
		*/
		function findEmoji(value) {
			for (let i = 0, { length } = EMOJI; i < length; i += 1) {
				const emoji = EMOJI[i];
				if (value.includes(emoji)) return emoji;
			}
		}
		function leadingEmoji(value) {
			const match = EMOJI_LEAD_RE.exec(value);
			if (!match) return;
			return {
				emoji: match[1],
				restAfter: value.slice(match[0].length)
			};
		}
		/**
		* Try to autofix by rewriting `console.log('✓ Done')` →
		* `logger.success('Done')`. Returns a fixer function or null.
		*/
		function tryFix(node, literalNode, leadInfo) {
			const method = EMOJI_TO_METHOD[leadInfo.emoji];
			/* c8 ignore start - leadInfo.emoji is always in EMOJI_TO_METHOD, regex is built from its keys*/
			if (!method) return;
			/* c8 ignore stop */
			const parent = node.parent;
			if (!parent || parent.type !== "CallExpression") return;
			if (parent.arguments[0] !== literalNode) return;
			const callee = parent.callee;
			if (callee.type !== "MemberExpression") return;
			const objectName = callee.object.type === "Identifier" ? callee.object.name : void 0;
			const propName = callee.property.type === "Identifier" ? callee.property.name : void 0;
			if (!objectName || !propName) return;
			if (!(objectName === "console" && [
				"log",
				"error",
				"warn",
				"info"
			].includes(propName)) && !(objectName === "logger" && (propName === "info" || propName === "log"))) return;
			const quote = literalNode.raw[0];
			const newLiteral = `${quote}${leadInfo.restAfter.replace(new RegExp(quote, "g"), "\\" + quote)}${quote}`;
			return (fixer) => [fixer.replaceText(callee, `logger.${method}`), fixer.replaceText(literalNode, newLiteral)];
		}
		function reportLiteral(node) {
			const value = typeof node.value === "string" ? node.value : void 0;
			if (!value) return;
			const emoji = findEmoji(value);
			if (!emoji) return;
			const leadInfo = leadingEmoji(value);
			const method = leadInfo ? EMOJI_TO_METHOD[leadInfo.emoji] : void 0;
			if (leadInfo && method) {
				const fix = tryFix(node, node, leadInfo);
				context.report({
					node,
					messageId: "banned",
					data: {
						emoji: leadInfo.emoji,
						method
					},
					...fix ? { fix } : {}
				});
			} else context.report({
				node,
				messageId: "bannedAmbiguous",
				data: { emoji }
			});
		}
		return {
			Literal(node) {
				reportLiteral(node);
			},
			TemplateElement(node) {
				if (node.value && typeof node.value.cooked === "string") reportLiteral({
					...node,
					value: node.value.cooked
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-structured-clone-prefer-json/index.mts
const rule$57 = {
	meta: {
		type: "problem",
		docs: {
			description: "Forbid `structuredClone(...)` — for JSON-roundtrippable data, `JSON.parse(JSON.stringify(x))` is 3-5x faster. Disable per-line with a rationale when the value genuinely needs the spec-heavy clone (Date/Map/Set/etc).",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: { noStructuredClone: "`structuredClone(...)` runs the full HTML structured-clone algorithm — 3-5x slower than `JSON.parse(JSON.stringify(x))` for the JSON subset most callsites use. If the value came from `JSON.parse` (or is otherwise JSON-roundtrippable), use the JSON round-trip instead. When the value genuinely needs `Date` / `Map` / `Set` / `RegExp` / `ArrayBuffer` preservation, add `// oxlint-disable-next-line socket/no-structured-clone-prefer-json -- <reason>` with a one-sentence rationale." },
		schema: []
	},
	create(context) {
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "Identifier") return;
			if (callee.name !== "structuredClone") return;
			context.report({
				node: callee,
				messageId: "noStructuredClone"
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-sync-rm-in-test-lifecycle/index.mts
const LIFECYCLE_HOOK_NAMES = /* @__PURE__ */ new Set([
	"afterAll",
	"afterEach",
	"beforeAll",
	"beforeEach"
]);
const SYNC_FS_METHODS = /* @__PURE__ */ new Set([
	"rmdirSync",
	"rmSync",
	"unlinkSync"
]);
const FS_OBJECT_NAMES = /^(?:fs|fsPromises|fsp|promises)$/;
function calleeKind(callee) {
	if (callee.type === "Identifier" && callee.name === "safeDeleteSync") return {
		kind: "fn",
		text: "safeDeleteSync"
	};
	if (callee.type === "MemberExpression") {
		const prop = callee.property;
		if (!prop || prop.type !== "Identifier") return;
		const propName = prop.name;
		if (!propName || !SYNC_FS_METHODS.has(propName)) return;
		const obj = callee.object;
		const objName = obj?.type === "Identifier" ? obj.name : obj?.type === "MemberExpression" && obj.property?.type === "Identifier" ? obj.property.name : void 0;
		if (!objName || !FS_OBJECT_NAMES.test(objName)) return;
		return {
			kind: "fsmethod",
			text: `${objName}.${propName}`
		};
	}
}
/**
* Walk up from `node` to the nearest enclosing function. If that function is
* the first argument of a `afterEach`/`afterAll`/`beforeEach`/`beforeAll` call
* (i.e. the hook's callback), return the hook name; otherwise undefined. Only
* the IMMEDIATE enclosing function counts — a sync delete nested inside a
* helper that the hook happens to call is out of scope (matches the old
* enter/exit-stack behavior, which only pushed the hook's own callback).
*/
function enclosingLifecycleHook(node) {
	let current = node;
	while (current) {
		const parent = current.parent;
		if (!parent) return;
		if (parent.type === "ArrowFunctionExpression" || parent.type === "FunctionDeclaration" || parent.type === "FunctionExpression") {
			const fnParent = parent.parent;
			if (fnParent?.type === "CallExpression" && fnParent.callee?.type === "Identifier" && LIFECYCLE_HOOK_NAMES.has(fnParent.callee.name ?? "") && Array.isArray(fnParent.arguments) && fnParent.arguments[0] === parent) return fnParent.callee.name;
			return;
		}
		current = parent;
	}
	/* c8 ignore stop */
}
const rule$56 = {
	meta: {
		type: "problem",
		docs: {
			description: "Lifecycle hooks (afterEach / afterAll / beforeEach / beforeAll) must use `await safeDelete(...)`. Sync filesystem deletion races on Windows EBUSY.",
			category: "Best Practices",
			recommended: true
		},
		messages: { syncDelete: "`{{callee}}` inside `{{hook}}` — use `await safeDelete(...)` from @socketsecurity/lib-stable/fs. Lifecycle hooks race on Windows EBUSY; the async form retries and integrates with vitest async teardown ordering." },
		schema: []
	},
	create(context) {
		return { CallExpression(node) {
			const cal = node.callee;
			if (!cal) return;
			const kind = calleeKind(cal);
			if (!kind) return;
			const hook = enclosingLifecycleHook(node);
			if (!hook) return;
			context.report({
				node,
				messageId: "syncDelete",
				data: {
					callee: kind.text,
					hook
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-top-level-await/index.mts
/**
* @file Block top-level `await` (TLA) expressions at module scope. Fleet
*   bundles publish to CJS (rolldown CJS output); CJS doesn't support TLA, so a
*   module-scope `await` either fails the bundle outright or silently compiles
*   to a Promise the consumer never awaits, leaving uninitialized exports.
*   Allowed: `await` inside async functions / async arrows / async methods (the
*   rule walks the parent chain to find an enclosing FunctionDeclaration /
*   FunctionExpression / ArrowFunctionExpression). Allowed: `for await` and
*   `await using` at non-module-scope, already inside a function. Reporting +
*   autofix-free: rewriting TLA to an IIFE or to top-level Promise chains
*   requires reading the surrounding intent; we report so the author makes the
*   call.
*/
const BYPASS_RE$13 = /socket-lint:\s*allow\s+top-level-await/;
const FUNCTION_TYPES = /* @__PURE__ */ new Set([
	"ArrowFunctionExpression",
	"FunctionDeclaration",
	"FunctionExpression"
]);
/**
* Returns true when `node` has an enclosing function ancestor (any function
* shape). Walks the `.parent` chain — relies on oxlint exposing parents on
* visited nodes.
*/
function hasEnclosingFunction(node) {
	let current = node.parent;
	while (current) {
		if (FUNCTION_TYPES.has(current.type)) return true;
		current = current.parent;
	}
	return false;
}
const rule$55 = {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow top-level `await` at module scope. Fleet packs publish to CJS and CJS does not support top-level await.",
			category: "Best Practices",
			recommended: true
		},
		messages: { banned: "Top-level `await` at module scope — CJS bundle target does not support TLA. Wrap the await in an async function (or an async IIFE) and export the function instead of the resolved value." },
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$13);
		return {
			AwaitExpression(node) {
				if (hasEnclosingFunction(node)) return;
				if (hasBypassComment(node)) return;
				context.report({
					node,
					messageId: "banned"
				});
			},
			ForOfStatement(node) {
				if (!node.await) return;
				if (hasEnclosingFunction(node)) return;
				if (hasBypassComment(node)) return;
				context.report({
					node,
					messageId: "banned"
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-underscore-identifier/index.mts
const UNDERSCORE_NAME_RE = /^_[A-Za-z]/;
const ALLOWED_FREE_VARS = /* @__PURE__ */ new Set(["__dirname", "__filename"]);
function isInInternalDir(filename) {
	return filename.includes("/_internal/");
}
function checkIdentifier(context, node, name) {
	if (!name || !UNDERSCORE_NAME_RE.test(name)) return;
	/* c8 ignore start - ALLOWED_FREE_VARS entries (__dirname, __filename) all start with __ which fails UNDERSCORE_NAME_RE, so this branch is unreachable with current data */
	if (ALLOWED_FREE_VARS.has(name)) return;
	/* c8 ignore stop */
	context.report({
		node,
		messageId: "noUnderscoreIdentifier",
		data: { name }
	});
}
const rule$54 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Forbid underscore-prefixed identifiers — use module boundaries or `_internal/` directories for privacy.",
			category: "Stylistic Issues",
			recommended: true
		},
		messages: { noUnderscoreIdentifier: "'{{name}}' starts with `_`. Drop the underscore — privacy in TS comes from not exporting (or from a `_internal/` directory), not from a leading underscore on the symbol name." },
		schema: []
	},
	create(context) {
		if (isInInternalDir(typeof context.filename === "string" ? context.filename : context.getFilename?.() ?? "")) return {};
		return {
			VariableDeclarator(node) {
				if (node.id?.type === "Identifier") checkIdentifier(context, node.id, node.id.name);
			},
			FunctionDeclaration(node) {
				if (node.id?.type === "Identifier") checkIdentifier(context, node.id, node.id.name);
			},
			ClassDeclaration(node) {
				if (node.id?.type === "Identifier") checkIdentifier(context, node.id, node.id.name);
			},
			TSInterfaceDeclaration(node) {
				if (node.id?.type === "Identifier") checkIdentifier(context, node.id, node.id.name);
			},
			TSTypeAliasDeclaration(node) {
				if (node.id?.type === "Identifier") checkIdentifier(context, node.id, node.id.name);
			},
			MethodDefinition(node) {
				if (!node.computed && node.key?.type === "Identifier") checkIdentifier(context, node.key, node.key.name);
			},
			PropertyDefinition(node) {
				if (!node.computed && node.key?.type === "Identifier") checkIdentifier(context, node.key, node.key.name);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-use-strict-in-esm/index.mts
/**
* @file Forbid a `'use strict'` directive in ES modules (`.mjs` / `.mts`). ES
*   modules are strict by default — the directive is dead noise that implies
*   the file might NOT otherwise be strict, which misleads a reader. It only
*   ever does anything in a classic script / CommonJS module, so its presence
*   in an ESM file is always a mistake (usually a copy-paste from a `.cjs` file
*   or a script template). Scope: files with a `.mjs` / `.mts` extension
*   (authoritatively ESM); `.js` / `.ts` / `.cjs` / `.cts` are left alone (a
*   `.cjs` is legitimately a script where `'use strict'` is meaningful, and
*   ambiguous `.js`/`.ts` may be compiled as a script). Autofix removes the
*   directive statement.
*/
const ESM_EXT = /* @__PURE__ */ new Set([".mjs", ".mts"]);
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$53 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Forbid `'use strict'` in ES modules (.mjs/.mts) — modules are strict by default.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: { useStrictInEsm: "`'use strict'` is redundant in an ES module (.mjs/.mts are strict by default). Remove it — keeping it implies the file might not be strict, which misleads the reader." },
		schema: []
	},
	create(context) {
		const filename = typeof context.filename === "string" ? context.filename : typeof context.getFilename === "function" ? context.getFilename() : "";
		const extension = filename ? path.extname(filename) : "";
		if (!ESM_EXT.has(extension)) return {};
		return { ExpressionStatement(node) {
			const expr = node.expression;
			if (!expr || expr.type !== "Literal" || typeof expr.value !== "string" || expr.value !== "use strict") return;
			context.report({
				node,
				messageId: "useStrictInEsm",
				fix(fixer) {
					return fixer.remove(node);
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/lib/vitest-fn-call.mts
const TEST_CASE_NAMES = /* @__PURE__ */ new Set([
	"bench",
	"fit",
	"it",
	"test",
	"xit",
	"xtest"
]);
const DESCRIBE_NAMES = /* @__PURE__ */ new Set([
	"describe",
	"fdescribe",
	"xdescribe"
]);
const HOOK_NAMES = /* @__PURE__ */ new Set([
	"afterAll",
	"afterEach",
	"beforeAll",
	"beforeEach"
]);
const ALWAYS_KNOWN_ROOTS = /* @__PURE__ */ new Set([
	...TEST_CASE_NAMES,
	...DESCRIBE_NAMES,
	...HOOK_NAMES,
	"expect"
]);
const NODE_TEST_SPECIFIERS = /* @__PURE__ */ new Set([
	"node:test",
	"test",
	"test/reporters"
]);
function collectVitestNames(program) {
	const names = /* @__PURE__ */ new Map();
	const fromVitestImport = /* @__PURE__ */ new Set();
	const importedNames = /* @__PURE__ */ new Set();
	let importsNodeTest = false;
	for (const root of ALWAYS_KNOWN_ROOTS) names.set(root, root);
	if (!program || !Array.isArray(program.body)) return {
		fromVitestImport,
		importedNames,
		importsNodeTest,
		names
	};
	for (let i = 0, { length } = program.body; i < length; i += 1) {
		const stmt = program.body[i];
		if (stmt?.type !== "ImportDeclaration" || stmt.source?.type !== "Literal" || !Array.isArray(stmt.specifiers)) continue;
		for (let j = 0, { length: slen } = stmt.specifiers; j < slen; j += 1) {
			const spec = stmt.specifiers[j];
			if (spec?.local?.type === "Identifier") importedNames.add(spec.local.name);
		}
		const specifier = String(stmt.source.value);
		if (NODE_TEST_SPECIFIERS.has(specifier)) {
			importsNodeTest = true;
			continue;
		}
		if (specifier !== "vitest") continue;
		for (let j = 0, { length: slen } = stmt.specifiers; j < slen; j += 1) {
			const spec = stmt.specifiers[j];
			if (spec?.type === "ImportSpecifier" && spec.imported?.type === "Identifier" && spec.local?.type === "Identifier") {
				names.set(spec.local.name, spec.imported.name);
				fromVitestImport.add(spec.local.name);
			}
		}
	}
	return {
		fromVitestImport,
		importedNames,
		importsNodeTest,
		names
	};
}
function isTitledCallWithBody(node) {
	const args = node?.arguments;
	if (!Array.isArray(args) || args.length < 2) return false;
	const title = args[0];
	if (!(title?.type === "Literal" && typeof title.value === "string" || title?.type === "TemplateLiteral")) return false;
	const body = args[1];
	return body?.type === "FunctionExpression" || body?.type === "ArrowFunctionExpression";
}
function getCalleeChain(node) {
	if (node?.type !== "CallExpression") return;
	const chain = [];
	let cur = node.callee;
	while (cur) {
		if (cur.type === "Identifier") {
			chain.unshift(cur.name);
			return chain;
		}
		if (cur.type === "MemberExpression") {
			if (cur.computed || cur.property?.type !== "Identifier") return;
			chain.unshift(cur.property.name);
			cur = cur.object;
			continue;
		}
		if (cur.type === "CallExpression") {
			cur = cur.callee;
			continue;
		}
		return;
	}
}
function classifyVitestCall(node, names) {
	const chain = getCalleeChain(node);
	if (!chain || !chain.length) return;
	const localRoot = chain[0];
	const imported = names.get(localRoot);
	if (!imported) {
		if (chain.length === 1 && isTitledCallWithBody(node)) {
			if (/^(?:it|test)[A-Z]/.test(localRoot)) return {
				root: localRoot,
				kind: "test",
				modifiers: chain.slice(1),
				localChain: chain
			};
			if (/^describe[A-Z]/.test(localRoot)) return {
				root: localRoot,
				kind: "describe",
				modifiers: chain.slice(1),
				localChain: chain
			};
		}
		return;
	}
	const modifiers = chain.slice(1);
	let kind;
	if (TEST_CASE_NAMES.has(imported)) kind = "test";
	else if (DESCRIBE_NAMES.has(imported)) kind = "describe";
	else if (HOOK_NAMES.has(imported)) kind = "hook";
	else if (imported === "expect") kind = "expect";
	else return;
	return {
		root: imported,
		kind,
		modifiers,
		localChain: chain
	};
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-vitest-empty-test/index.mts
/**
* @file Flag a test case (`it` / `test`) whose body contains NO assertion. A
*   test with no `expect(...)`, or recognized assertion helper, passes
*   vacuously — it proves nothing but shows green, the worst kind of false
*   confidence. The fleet survey found a placeholder `expect(true).toBe(true)`
*   shape used to satisfy "needs an assertion"; this rule is the reason to
*   delete such placeholders rather than add them. Recognized assertions:
*   `expect(...)`, `expect.<x>(...)` (e.g. `expect.assertions`), `assert(...)`,
*   and `vi.*`-spy assertions are NOT counted (a spy call alone isn't an
*   assertion — it must reach an `expect`). A test that only calls another
*   function which asserts internally can't be seen statically; for those, add
*   an inline `expect` or an `// eslint-disable-next-line`. Scope: `*.test.*`.
*   Report-only. Ported from `@vitest/eslint-plugin`'s `expect-expect`, on
*   lib/vitest-fn-call.mts.
*/
const ASSERTION_ROOTS = /* @__PURE__ */ new Set(["assert", "expect"]);
function containsAssertion(node) {
	if (!node || typeof node !== "object") return false;
	if (Array.isArray(node)) {
		for (let i = 0, { length } = node; i < length; i += 1) if (containsAssertion(node[i])) return true;
		return false;
	}
	if (typeof node.type !== "string") return false;
	if (node.type === "CallExpression") {
		let cur = node.callee;
		while (cur) {
			if (cur.type === "Identifier") {
				if (ASSERTION_ROOTS.has(cur.name) || /^(?:assert|expect)[A-Z]/.test(cur.name)) return true;
				break;
			}
			if (cur.type === "MemberExpression") {
				cur = cur.object;
				continue;
			}
			if (cur.type === "CallExpression") {
				cur = cur.callee;
				continue;
			}
			break;
		}
	}
	const keyList = Object.keys(node);
	for (let i = 0, { length } = keyList; i < length; i += 1) {
		const key = keyList[i];
		if (key === "loc" || key === "parent" || key === "range") continue;
		const child = node[key];
		if (child && typeof child === "object") {
			if (containsAssertion(child)) return true;
		}
	}
	return false;
}
function testCallback(node) {
	if (!Array.isArray(node.arguments)) return;
	for (let i = 0, { length } = node.arguments; i < length; i += 1) {
		const arg = node.arguments[i];
		if (arg?.type === "ArrowFunctionExpression" || arg?.type === "FunctionExpression") return arg;
	}
}
const rule$52 = {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow a test case with no assertion — a test with no expect(...) passes vacuously.",
			category: "Possible Errors",
			recommended: true
		},
		messages: { noAssertion: "Test `{{ title }}` has no assertion — it passes vacuously and proves nothing. Add an `expect(...)`, or delete the test if it was a placeholder." },
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (!TEST_FILE_RE$2.test(filename)) return {};
		let names;
		let fromVitestImport;
		let disabled = false;
		return {
			Program(program) {
				const collected = collectVitestNames(program);
				names = collected.names;
				fromVitestImport = collected.fromVitestImport;
				disabled = collected.importsNodeTest;
			},
			CallExpression(node) {
				if (!names || disabled) return;
				const call = classifyVitestCall(node, names);
				if (!call || call.kind !== "test") return;
				if (!fromVitestImport?.has(call.localChain[0])) return;
				if (call.modifiers.includes("todo") || call.modifiers.includes("skip")) return;
				const cb = testCallback(node);
				if (!cb?.body) return;
				if (!containsAssertion(cb.body)) {
					const titleArg = node.arguments?.[0];
					const title = titleArg?.type === "Literal" ? String(titleArg.value) : "<dynamic>";
					context.report({
						node,
						messageId: "noAssertion",
						data: { title }
					});
				}
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-vitest-focused-tests/index.mts
/**
* @file Flag focused vitest tests — `it.only` / `test.only` / `describe.only`
*   (and the `fit` / `fdescribe` aliases). A focused test silently disables
*   every sibling: CI goes green while running a fraction of the suite, so a
*   stray `.only` left in from local debugging is a coverage hole that passes
*   review. The fleet survey (2026-06-03) found ZERO `.only` in ~3,880 test
*   files — which is exactly when a fail-closed guard pays off: it catches the
*   first one before it lands. Scope: `*.test.*` files. Report-only — removing
*   the modifier vs. the test is the author's call. Ported from
*   `@vitest/eslint-plugin`'s `no-focused-tests`, narrowed to the fleet's
*   globals-off, import-based test style via lib/vitest-fn-call.mts.
*/
const FOCUSED_ALIASES = /* @__PURE__ */ new Set(["fdescribe", "fit"]);
const rule$51 = {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow focused vitest tests (it.only / describe.only / fit / fdescribe) — a stray .only disables the rest of the suite and passes CI.",
			category: "Possible Errors",
			recommended: true
		},
		messages: { focused: "Focused test `{{ chain }}` disables every sibling test — CI passes while running a fraction of the suite. Remove the `.only` (or `fit`/`fdescribe`) before committing." },
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (!TEST_FILE_RE$2.test(filename)) return {};
		let names;
		return {
			Program(program) {
				names = collectVitestNames(program).names;
			},
			CallExpression(node) {
				if (!names) return;
				const call = classifyVitestCall(node, names);
				if (!call || call.kind !== "describe" && call.kind !== "test") return;
				if (call.modifiers.includes("only") || FOCUSED_ALIASES.has(call.root)) context.report({
					node,
					messageId: "focused",
					data: { chain: call.localChain.join(".") }
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-vitest-identical-title/index.mts
/**
* @file Flag duplicate test/describe titles within the SAME describe scope —
*   two `it('does X', …)` with the identical title, or two sibling
*   `describe('group', …)`. The fleet leans on describe-nesting for uniqueness,
*   so a flattened duplicate slips by silently: the runner shows two
*   identically-named cases and it's ambiguous which failed. Titles are
*   compared per enclosing describe scope, siblings only, so the same title in
*   two different groups is fine. Only string-literal / template-without-
*   substitution titles are compared (a dynamic title can't be statically
*   deduped). Scope: `*.test.*`. Report-only. Ported from
*   `@vitest/eslint-plugin`'s `no-identical-title`, on lib/vitest-fn-call.mts.
*/
function staticTitle(node) {
	const arg = node.arguments?.[0];
	if (!arg) return;
	if (arg.type === "Literal" && typeof arg.value === "string") return arg.value;
	if (arg.type === "TemplateLiteral" && Array.isArray(arg.expressions) && arg.expressions.length === 0 && Array.isArray(arg.quasis) && arg.quasis.length === 1) return String(arg.quasis[0]?.value?.cooked ?? arg.quasis[0]?.value?.raw ?? "");
}
const rule$50 = {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow duplicate test/describe titles within the same describe scope — a flattened duplicate makes failures ambiguous.",
			category: "Best Practices",
			recommended: true
		},
		messages: { duplicate: "Duplicate {{ kind }} title \"{{ title }}\" in this scope. Two same-named {{ kind }}s make a failure ambiguous — rename one or nest them under distinct `describe` groups." },
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (!TEST_FILE_RE$2.test(filename)) return {};
		let names;
		const scopes = [{
			tests: /* @__PURE__ */ new Set(),
			describes: /* @__PURE__ */ new Set()
		}];
		function currentScope() {
			return scopes[scopes.length - 1];
		}
		function maybeEnterDescribe(fn) {
			const parent = fn.parent;
			if (parent?.type === "CallExpression" && names) {
				if (classifyVitestCall(parent, names)?.kind === "describe") scopes.push({
					tests: /* @__PURE__ */ new Set(),
					describes: /* @__PURE__ */ new Set()
				});
			}
		}
		function maybeExitDescribe(fn) {
			const parent = fn.parent;
			if (parent?.type === "CallExpression" && names) {
				if (classifyVitestCall(parent, names)?.kind === "describe" && scopes.length > 1) scopes.pop();
			}
		}
		return {
			Program(program) {
				names = collectVitestNames(program).names;
			},
			FunctionExpression: maybeEnterDescribe,
			"FunctionExpression:exit": maybeExitDescribe,
			ArrowFunctionExpression: maybeEnterDescribe,
			"ArrowFunctionExpression:exit": maybeExitDescribe,
			CallExpression(node) {
				if (!names) return;
				const call = classifyVitestCall(node, names);
				if (!call || call.kind !== "describe" && call.kind !== "test") return;
				if (call.modifiers.includes("each") || call.modifiers.includes("for")) return;
				const title = staticTitle(node);
				if (title === void 0) return;
				const scope = currentScope();
				const bucket = call.kind === "test" ? scope.tests : scope.describes;
				if (bucket.has(title)) context.report({
					node,
					messageId: "duplicate",
					data: {
						kind: call.kind,
						title
					}
				});
				else bucket.add(title);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-vitest-skipped-tests/index.mts
const SKIP_ALIASES = /* @__PURE__ */ new Set([
	"xdescribe",
	"xit",
	"xtest"
]);
function hasOptionsSkip(node) {
	if (!Array.isArray(node.arguments)) return false;
	for (let i = 0, { length } = node.arguments; i < length; i += 1) {
		const arg = node.arguments[i];
		if (arg?.type !== "ObjectExpression" || !Array.isArray(arg.properties)) continue;
		for (let j = 0, { length: plen } = arg.properties; j < plen; j += 1) {
			const prop = arg.properties[j];
			if (prop?.type === "Property" && !prop.computed && prop.key?.type === "Identifier" && prop.key.name === "skip") return true;
		}
	}
	return false;
}
const rule$49 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Disallow unconditionally skipped vitest tests (it.skip / xit / xdescribe) — conditional skips (.skipIf/.runIf, { skip: expr }) are allowed.",
			category: "Best Practices",
			recommended: true
		},
		messages: { skipped: "Unconditionally skipped test `{{ chain }}` never runs again. Gate it on a condition (`.skipIf(...)` / `{ skip: <expr> }`) or remove it — a bare `.skip` rots silently." },
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (!TEST_FILE_RE$2.test(filename)) return {};
		let names;
		return {
			Program(program) {
				names = collectVitestNames(program).names;
			},
			CallExpression(node) {
				if (!names) return;
				const call = classifyVitestCall(node, names);
				if (!call || call.kind !== "describe" && call.kind !== "test") return;
				if (call.modifiers.includes("skipIf") || call.modifiers.includes("runIf")) return;
				if (hasOptionsSkip(node)) return;
				if (call.modifiers.includes("skip") || SKIP_ALIASES.has(call.root)) context.report({
					node,
					messageId: "skipped",
					data: { chain: call.localChain.join(".") }
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-vitest-standalone-expect/index.mts
/**
* @file Flag `expect(...)` assertions that sit OUTSIDE any `it` / `test` block
*   (a "standalone expect"). An assertion in `describe` body scope, at module
*   top level, or in a hook runs at collection time or once — not as part of a
*   test case — so a failure is mis-attributed or silently ignored. The fleet
*   survey found zero today; this guard keeps it that way. An `expect` inside a
*   hook (`beforeEach`) is allowed, a common setup-assertion pattern. Scope:
*   `*.test.*`. Report-only. Ported from `@vitest/eslint-plugin`'s
*   `no-standalone-expect`, on lib/vitest-fn-call.mts. Like upstream, the
*   `additionalTestBlockFunctions` option names custom test-registering
*   wrappers (socket-cli's `cmdit`) whose callbacks count as test scope.
*/
const rule$48 = {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow expect() outside an it()/test() block (or hook) — a standalone assertion runs at collection time and its failure is mis-attributed.",
			category: "Possible Errors",
			recommended: true
		},
		messages: { standalone: "`expect(...)` here is not inside an `it()` / `test()` (or hook) — it runs at collection time, not as a test assertion. Move it into a test case." },
		schema: [{
			type: "object",
			additionalProperties: false,
			properties: { additionalTestBlockFunctions: {
				type: "array",
				items: { type: "string" }
			} }
		}]
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (!TEST_FILE_RE$2.test(filename)) return {};
		const extraTestFns = new Set((context.options?.[0])?.additionalTestBlockFunctions ?? []);
		let names;
		let testFnDepth = 0;
		const fnStack = [];
		function isTestOrHookCallback(fn) {
			const parent = fn.parent;
			if (parent?.type !== "CallExpression" || !names) return false;
			const call = classifyVitestCall(parent, names);
			if (call && (call.kind === "hook" || call.kind === "test")) return true;
			const callee = parent.callee;
			const wrapperName = callee?.type === "Identifier" ? callee.name : callee?.type === "MemberExpression" && callee.object?.type === "Identifier" ? callee.object.name : void 0;
			return wrapperName !== void 0 && extraTestFns.has(wrapperName);
		}
		function enterFn(fn) {
			const isTest = isTestOrHookCallback(fn);
			fnStack.push(isTest);
			if (isTest) testFnDepth += 1;
		}
		function exitFn() {
			if (fnStack.pop()) testFnDepth -= 1;
		}
		return {
			Program(program) {
				names = collectVitestNames(program).names;
			},
			FunctionExpression: enterFn,
			"FunctionExpression:exit": exitFn,
			ArrowFunctionExpression: enterFn,
			"ArrowFunctionExpression:exit": exitFn,
			FunctionDeclaration: enterFn,
			"FunctionDeclaration:exit": exitFn,
			CallExpression(node) {
				if (!names) return;
				if (classifyVitestCall(node, names)?.kind === "expect" && node.callee?.type === "Identifier" && testFnDepth === 0) context.report({
					node,
					messageId: "standalone"
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/no-which-for-local-bin/index.mts
const SHELL_LOOKUP_RE = /^(?:command\s+-[vV]|type\s+-P|where|which)\s+[\w./@+-]+$/;
const BYPASS_RE$12 = /socket-lint:\s*allow\s+which-lookup/;
/**
* True when `value` is a string that invokes a PATH-lookup command, either as a
* bare command name (argv[0] form) or as the head of a shell string.
*/
function isWhichLookup(value) {
	return SHELL_LOOKUP_RE.test(value.trim());
}
const rule$47 = {
	meta: {
		type: "problem",
		docs: {
			description: "Do not shell out to `which` / `command -v` / `where` to locate a project binary — resolve from `node_modules/.bin` via `whichSync({ path })` from @socketsecurity/lib-stable/bin/which.",
			category: "Best Practices",
			recommended: true
		},
		messages: { whichLookup: "`{{cmd}}` shells out to search the GLOBAL PATH for a binary — fleet binaries live in `node_modules/.bin`. Use `whichSync(name, { path: <binDir>, nothrow: true })` from @socketsecurity/lib-stable/bin/which (handles the `.cmd` wrapper + existence check), or resolve the `.bin` path directly. If you really need a global lookup (system git, etc.), add `// socket-lint: allow which-lookup`." },
		schema: []
	},
	create(context) {
		if (isPluginSelfFile(context)) return {};
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$12);
		function check(node, value) {
			if (typeof value !== "string" || !isWhichLookup(value)) return;
			if (hasBypassComment(node)) return;
			context.report({
				node,
				messageId: "whichLookup",
				/* c8 ignore next - split on non-empty string always yields [0]; ?? fallback is unreachable */
				data: { cmd: value.trim().split(/\s+/)[0] ?? value.trim() }
			});
		}
		return {
			Literal(node) {
				check(node, node.value);
			},
			TemplateElement(node) {
				const cooked = node.value?.cooked;
				check(node, cooked);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/normalize-path-before-match/index.mts
const PATH_VAR_RE = /(?:^|_)(?:abs|base|cwd|dest|dir|entry|file|input|output|path|rel|root|src|target)(?:_|$)|(?:P|p)ath$|(?:F|f)ile$|(?:D|d)ir$/;
const NORMALIZE_CALLEE_NAMES = /* @__PURE__ */ new Set(["normalizePath", "toUnixPath"]);
const PATH_STRING_METHODS = /* @__PURE__ */ new Set([
	"endsWith",
	"includes",
	"split",
	"startsWith"
]);
const RECEIVER_REGEX_METHODS = /* @__PURE__ */ new Set(["exec", "test"]);
const SEPARATOR_PATTERNS = /* @__PURE__ */ new Set([
	"[/\\\\]",
	"[\\\\/]",
	"\\\\"
]);
const SEPARATOR_PREFIX_RE = /^[/\\]/;
const LIB_STABLE_TIER_RE = /(?:^|\/)(?:\.claude\/hooks|\.git-hooks|scripts)\//;
function isPathLikeName(name) {
	return PATH_VAR_RE.test(name);
}
function isSeparatorStringLiteral(node) {
	if (!node || node.type !== "Literal" || typeof node.value !== "string") return false;
	return SEPARATOR_PREFIX_RE.test(node.value);
}
function isSeparatorRegexLiteral(node) {
	if (!node || node.type !== "Literal" || !node.regex) return false;
	const pattern = node.regex.pattern ?? "";
	return SEPARATOR_PATTERNS.has(pattern) || pattern.includes("\\/");
}
function getIdentifierName(node) {
	if (!node) return;
	if (node.type === "Identifier") return node.name;
}
const rule$46 = {
	meta: {
		type: "problem",
		docs: {
			description: "Normalize a path-like variable with `normalizePath` before matching, splitting, or testing it against separators.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: {
			normalizeBeforeRegexMatch: "Path-like variable '{{name}}' used in a separator-regex match without prior normalization. Wrap the argument in `normalizePath({{name}})` from `@socketsecurity/lib/paths/normalize`.",
			normalizeBeforeStringSep: "Path-like variable '{{name}}' used in a separator-string operation without prior normalization. Wrap the argument in `normalizePath({{name}})` from `@socketsecurity/lib/paths/normalize`."
		},
		schema: []
	},
	create(context) {
		const filename = (0, import_normalize.normalizePath)(context.filename ?? context.getFilename?.() ?? "");
		if (/\/paths\/normalize\.[mc]?[jt]s$/.test(filename)) return {};
		const normalizedVars = /* @__PURE__ */ new Set();
		let lastImportNode;
		let hasNormalizeImport = false;
		let importPkg;
		let importFixQueued = false;
		const tierPkg = LIB_STABLE_TIER_RE.test(filename) ? "@socketsecurity/lib-stable" : void 0;
		function trackImport(node) {
			lastImportNode = node;
			const source = node.source?.value ?? "";
			if (source.startsWith("@socketsecurity/lib-stable/")) importPkg = "@socketsecurity/lib-stable";
			else if (source.startsWith("@socketsecurity/lib/") && importPkg !== "@socketsecurity/lib-stable") importPkg = "@socketsecurity/lib";
			const specs = node.specifiers ?? [];
			for (let i = 0, { length } = specs; i < length; i += 1) {
				const spec = specs[i];
				if (spec.type === "ImportSpecifier" && spec.local?.name === "normalizePath") hasNormalizeImport = true;
			}
		}
		function makeFix(subject, name) {
			const pkg = importPkg ?? tierPkg;
			if (!hasNormalizeImport && (!lastImportNode || !pkg)) return;
			return (fixer) => {
				const wrap = fixer.replaceText(subject, `normalizePath(${name})`);
				if (hasNormalizeImport || importFixQueued) return wrap;
				importFixQueued = true;
				return [fixer.insertTextAfter(lastImportNode, `\nimport { normalizePath } from '${pkg}/paths/normalize'`), wrap];
			};
		}
		function isNormalizeCall(node) {
			if (!node || node.type !== "CallExpression") return false;
			const callee = node.callee;
			if (callee?.type === "Identifier") return NORMALIZE_CALLEE_NAMES.has(callee.name);
			if (callee?.type === "MemberExpression") return NORMALIZE_CALLEE_NAMES.has(callee.property?.name);
			return false;
		}
		function recordNormalizedBinding(node) {
			if (!node) return;
			if (node.type === "VariableDeclarator" && node.id?.type === "Identifier" && isNormalizeCall(node.init)) {
				normalizedVars.add(node.id.name);
				return;
			}
			if (node.type === "AssignmentExpression" && node.left?.type === "Identifier" && isNormalizeCall(node.right)) normalizedVars.add(node.left.name);
		}
		return {
			ImportDeclaration(node) {
				trackImport(node);
			},
			VariableDeclarator(node) {
				recordNormalizedBinding(node);
			},
			AssignmentExpression(node) {
				recordNormalizedBinding(node);
			},
			CallExpression(node) {
				const callee = node.callee;
				if (callee?.type !== "MemberExpression") return;
				const method = callee.property?.name ?? "";
				const receiver = callee.object;
				if (RECEIVER_REGEX_METHODS.has(method)) {
					if (isSeparatorRegexLiteral(receiver)) {
						const arg0 = node.arguments?.[0];
						const argName = getIdentifierName(arg0);
						if (argName && isPathLikeName(argName) && !normalizedVars.has(argName)) context.report({
							node,
							messageId: "normalizeBeforeRegexMatch",
							data: { name: argName },
							fix: makeFix(arg0, argName)
						});
					}
					return;
				}
				if (PATH_STRING_METHODS.has(method)) {
					const receiverName = getIdentifierName(receiver);
					if (receiverName && isPathLikeName(receiverName) && !normalizedVars.has(receiverName)) {
						const arg0 = node.arguments?.[0];
						if (isSeparatorStringLiteral(arg0)) context.report({
							node,
							messageId: "normalizeBeforeStringSep",
							data: { name: receiverName },
							fix: makeFix(receiver, receiverName)
						});
					}
				}
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/optional-explicit-undefined/index.mts
const rule$45 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require `?: T | undefined` (not bare `?: T`) on type-literal and interface properties to pair with `exactOptionalPropertyTypes`.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: {
			missingUndefined: "Optional property `{{name}}` should be typed as `{{name}}?: {{type}} | undefined` to pair with `exactOptionalPropertyTypes`.",
			missingUndefinedAbsorbing: "Optional property `{{name}}` should be typed as `{{name}}?: {{type}} | undefined` to pair with `exactOptionalPropertyTypes`. The autofix also silences typescript/no-redundant-type-constituents on this line — the explicit `| undefined` is the fleet convention, not redundancy."
		},
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (!/\.(?:cts|mts|ts)$/.test(filename)) return {};
		/**
		* True when `typeAnnotation` already includes `undefined` somewhere in its
		* top-level union. Recursive into TSUnionType so `T | (U | undefined)`
		* (rare) still passes.
		*/
		function hasUndefined(typeAnnotation) {
			if (!typeAnnotation) return false;
			if (typeAnnotation.type === "TSUndefinedKeyword") return true;
			if (typeAnnotation.type === "TSUnionType") {
				for (const t of typeAnnotation.types) if (hasUndefined(t)) return true;
			}
			return false;
		}
		/**
		* Pull the property name token for the error message. Handles Identifier
		* keys (`foo?:`), Literal keys (`'foo'?:`), and computed keys (skipped via
		* "unknown").
		*/
		function keyName(node) {
			const k = node.key;
			if (!k) return typeof node.name === "string" ? node.name : "property";
			if (k.type === "Identifier") return k.name;
			if (k.type === "Literal" && typeof k.value === "string") return k.value;
			return "property";
		}
		/**
		* Source-text snippet of the type annotation for the error message + the
		* fix. Tolerant of missing source ranges.
		*/
		function typeText(node) {
			const ann = node.typeAnnotation?.typeAnnotation;
			if (!ann || !ann.range) return "T";
			const src = context.sourceCode ?? context.getSourceCode?.();
			if (!src) return "T";
			return src.text.slice(ann.range[0], ann.range[1]);
		}
		/**
		* True when appending ` | undefined` after the annotation would bind to a
		* sub-expression instead of the whole type. Affected shapes (need parens
		* before union): - `() => void` (TSFunctionType) - `new () => Foo`
		* (TSConstructorType) - `Foo | Bar` (TSUnionType — would technically work
		* but parens make it explicit; non-issue here since hasUndefined already
		* catches `| undefined`) - `Foo & Bar` (TSIntersectionType)
		*/
		function needsParens(ann) {
			return ann.type === "TSConstructorType" || ann.type === "TSFunctionType" || ann.type === "TSIntersectionType";
		}
		function check(node) {
			if (!node.optional) return;
			const ann = node.typeAnnotation?.typeAnnotation;
			if (!ann) return;
			if (hasUndefined(ann)) return;
			if ((ann.type === "TSConstructorType" || ann.type === "TSFunctionType") && hasUndefined(ann.returnType?.typeAnnotation)) return;
			const name = keyName(node);
			const type = typeText(node);
			const absorbing = ann.type === "TSAnyKeyword" || ann.type === "TSUnknownKeyword";
			context.report({
				node: ann,
				messageId: absorbing ? "missingUndefinedAbsorbing" : "missingUndefined",
				data: {
					name,
					type
				},
				fix(fixer) {
					const fixes = [];
					if (absorbing && node.range) {
						const text = (context.sourceCode ?? context.getSourceCode?.())?.text ?? "";
						const lineStart = text.lastIndexOf("\n", node.range[0] - 1) + 1;
						const indent = text.slice(lineStart, node.range[0]);
						if (/^\s*$/.test(indent)) fixes.push(fixer.insertTextBefore(node, `// oxlint-disable-next-line typescript/no-redundant-type-constituents -- fleet optional-explicit-undefined convention: the explicit | undefined on an optional is intentional, not redundant.\n${indent}`));
					}
					if (needsParens(ann)) fixes.push(fixer.insertTextBefore(ann, "("), fixer.insertTextAfter(ann, ") | undefined"));
					else fixes.push(fixer.insertTextAfter(ann, " | undefined"));
					return fixes;
				}
			});
		}
		/**
		* Optional parameters (`foo?: string`) get the same treatment as optional
		* properties: the explicit `| undefined` is the fleet convention. A param
		* is a bare Identifier with `optional: true`; `check` reads its
		* annotation the same way it reads a property's.
		*/
		function checkFunctionParams(node) {
			const params = node.params;
			if (!Array.isArray(params)) return;
			for (const param of params) if (param.type === "Identifier" && param.optional) check(param);
		}
		return {
			TSPropertySignature: check,
			PropertyDefinition: check,
			ArrowFunctionExpression: checkFunctionParams,
			FunctionDeclaration: checkFunctionParams,
			FunctionExpression: checkFunctionParams,
			TSConstructorType: checkFunctionParams,
			TSDeclareFunction: checkFunctionParams,
			TSFunctionType: checkFunctionParams,
			TSMethodSignature: checkFunctionParams
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/options-null-proto/index.mts
/**
* @file Per the fleet options convention: a function that reads an `options` /
*   `opts` parameter must first normalize it with `{ __proto__: null,
*   ...options }` before destructuring or property-access. The null prototype
*   defends against a caller passing an object with a polluted prototype (a
*   `__proto__` / inherited property masquerading as an option); reading the
*   raw param lets that pollution flow into the function's logic. socket-lib
*   does this in ~125 modules (`const { cwd } = { __proto__: null, ...options }
*   as Opts`); this rule holds the rest of the fleet to it. Flags a function
*   with a param named `options` / `opts` whose body reads it (a `const { … } =
*   options` destructure, or an `options.x` / `options?.x` member access)
*   without a `{ __proto__: null, ...options }` spread present in the body.
*   Autofixed both ways with an `as typeof <name>` cast on TypeScript files
*   (`.ts`/`.tsx`/`.mts`/`.cts`, detected via `context.filename` the same way
*   `optional-explicit-undefined` / `prefer-cached-for-loop` do) — a closed
*   options type rejects the `__proto__` excess property without it: the
*   destructure form rewrites `const { … } = options` to `const { … } = {
*   __proto__: null, ...options } as typeof options`; a member-access reader
*   gets a NORMALIZED LOCAL `const opts = { __proto__: null, ...options } as
*   typeof options` prepended to the body and each `options.x` read repointed
*   at `opts.x`. On a plain JS file (`.js`/`.mjs`/`.cjs`/…) the same rewrites
*   land WITHOUT the `as typeof <name>` cast — `as` is TypeScript-only syntax
*   and a SyntaxError in plain JS, and the cast is erased at runtime anyway, so
*   dropping it changes nothing observable. The fix never reassigns the param
*   in place — the fleet bans variable shadowing,
*   and an in-place `options = …` conflates the raw input with its normalized
*   form, the anti-pattern options-param-naming kills. The member-access fix
*   only applies when the param is literally `options` (a param already named
*   `opts` would collide with the new local → reported without a fix;
*   options-param-naming renames it `opts`→`options` first). A function that
*   passes `options` straight through untouched, never reads a property, is not
*   flagged. Test files (`*.test.*`, `/test/`) are skipped — they mock
*   options-shaped literals, not production readers. Bypass: a `socket-lint:
*   allow options-null-proto` comment.
*   The member-access fix is ALSO withheld (reported without a fix, same as
*   the `opts`-name collision above) when the `options` binding is reassigned
*   anywhere in the function body — `isReassignedInBody` walks the whole body
*   for an `options = …` assignment, a destructuring-assignment target
*   (`({ options } = x)`), an `options++`/`--options` update, or a
*   `for (options of/in …)` loop. The hoisted `const opts = { __proto__: null,
*   ...options }` snapshot is inserted as the FIRST statement of the function,
*   capturing whatever `options` holds at that instant; every later
*   `options.x` read in the body then gets repointed at `opts.x`. When
*   `options` is reassigned partway through the body — the acorn `core.ts`
*   constructor shape `this.options = options = getOptions(options)`, which
*   normalizes `options` in place — the hoisted `opts` is stuck holding the
*   PRE-normalization value while every rewritten `opts.x` read downstream of
*   the reassignment silently reads stale data. Confirmed in production: a
*   `parse(src, { ecmaVersion: 'latest' })` constructor snapshotted the raw
*   `options` (still the string `'latest'`) into `opts` before
*   `getOptions()` normalized `ecmaVersion` to a number, so the later
*   `opts.ecmaVersion >= 6` check compared the string and read false —
*   `const` was rejected as a pre-ES6 token, 75 Test262 failures, no lint/type
*   error, only a runtime behavior change. The walk is deliberately
*   scope-naive, no binding resolution — a same-named binding inside a
*   NESTED function reads as a hit too, which only makes the guard bail more
*   often, never miss a real reassignment.
*/
const BYPASS_RE$11 = /socket-lint:\s*allow\s+options-null-proto/;
const OPTIONS_NAMES = /* @__PURE__ */ new Set(["options", "opts"]);
function optionsParamName(params) {
	for (let i = 0, { length } = params; i < length; i += 1) {
		const p = params[i];
		if (p?.type === "Identifier" && OPTIONS_NAMES.has(p.name)) return p.name;
	}
}
function hasNullProtoNormalization(bodyText, name) {
	return bodyText.includes("__proto__: null") && bodyText.includes(`...${name}`);
}
function patternWrites(pattern, name) {
	if (!pattern || typeof pattern !== "object") return false;
	if (pattern.type === "Identifier") return pattern.name === name;
	if (pattern.type === "ObjectPattern") {
		const props = pattern.properties;
		if (!Array.isArray(props)) return false;
		for (let i = 0, { length } = props; i < length; i += 1) {
			const prop = props[i];
			if (patternWrites(prop?.type === "RestElement" ? prop.argument : prop?.value, name)) return true;
		}
		return false;
	}
	if (pattern.type === "ArrayPattern") {
		const elements = pattern.elements;
		if (!Array.isArray(elements)) return false;
		for (let i = 0, { length } = elements; i < length; i += 1) if (patternWrites(elements[i], name)) return true;
		return false;
	}
	if (pattern.type === "AssignmentPattern") return patternWrites(pattern.left, name);
	if (pattern.type === "RestElement") return patternWrites(pattern.argument, name);
	return false;
}
function isReassignedInBody(body, name) {
	let found = false;
	const visit = (n) => {
		if (found || !n || typeof n !== "object") return;
		if (n.type === "AssignmentExpression" && patternWrites(n.left, name)) {
			found = true;
			return;
		}
		if (n.type === "UpdateExpression" && n.argument?.type === "Identifier" && n.argument.name === name) {
			found = true;
			return;
		}
		if ((n.type === "ForInStatement" || n.type === "ForOfStatement") && n.left?.type !== "VariableDeclaration" && patternWrites(n.left, name)) {
			found = true;
			return;
		}
		const keyItems = Object.keys(n);
		for (let j = 0, { length: jlen } = keyItems; j < jlen; j += 1) {
			const key = keyItems[j];
			if (key === "parent") continue;
			const child = n[key];
			if (Array.isArray(child)) for (let i = 0, { length } = child; i < length; i += 1) {
				visit(child[i]);
				if (found) return;
			}
			else if (child && typeof child === "object") visit(child);
			if (found) return;
		}
	};
	visit(body);
	return found;
}
const rule$44 = {
	meta: {
		type: "problem",
		docs: {
			description: "A function reading an `options`/`opts` param must normalize it via `{ __proto__: null, ...options }` first (prototype-pollution defense).",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: { banned: "reads `{{name}}` without normalizing it — a caller could pass a polluted prototype. Use `{ __proto__: null, ...{{name}} }` before destructuring/accessing. Bypass: add a `socket-lint: allow options-null-proto` comment." },
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$11);
		const source = context.sourceCode ?? context.getSourceCode?.();
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (/\.test\.[cm]?[jt]sx?$/.test(filename) || /\/test\//.test((0, import_normalize.normalizePath)(filename))) return {};
		const isTypeScriptFile = /\.(?:cts|mts|tsx?)$/.test(filename);
		function check(node) {
			if (node.body == null) return;
			const params = node.params;
			if (!Array.isArray(params)) return;
			const name = optionsParamName(params);
			if (!name) return;
			if (hasBypassComment(node)) return;
			if (hasNullProtoNormalization(source?.getText?.(node.body) ?? "", name)) return;
			let firstDestructure;
			const memberObjects = [];
			const visit = (n) => {
				if (!n || typeof n !== "object") return;
				if (n.type === "VariableDeclarator" && n.id?.type === "ObjectPattern" && n.init?.type === "Identifier" && n.init.name === name && !firstDestructure) firstDestructure = n;
				if (n.type === "MemberExpression" && n.object?.type === "Identifier" && n.object.name === name) memberObjects.push(n.object);
				const keyList = Object.keys(n);
				for (let j = 0, { length: jlen } = keyList; j < jlen; j += 1) {
					const key = keyList[j];
					if (key === "parent") continue;
					const child = n[key];
					if (Array.isArray(child)) for (let i = 0, { length } = child; i < length; i += 1) visit(child[i]);
					else if (child && typeof child === "object") visit(child);
				}
			};
			visit(node.body);
			if (!firstDestructure && !memberObjects.length) return;
			const body = node.body;
			const canInsert = body?.type === "BlockStatement" && Array.isArray(body.body);
			context.report({
				node: firstDestructure ?? node,
				messageId: "banned",
				data: { name },
				fix(fixer) {
					if (firstDestructure?.init) {
						const cast = isTypeScriptFile ? ` as typeof ${name}` : "";
						return fixer.replaceText(firstDestructure.init, `{ __proto__: null, ...${name} }${cast}`);
					}
					const first = canInsert ? body.body[0] : void 0;
					if (!first || name !== "options") return;
					if (isReassignedInBody(node.body, name)) return;
					const indent = "  ";
					const cast = isTypeScriptFile ? " as typeof options" : "";
					return [fixer.insertTextBefore(first, `const opts = { __proto__: null, ...options }${cast}\n${indent}`), ...memberObjects.map((obj) => fixer.replaceText(obj, "opts"))];
				}
			});
		}
		return {
			FunctionDeclaration: check,
			FunctionExpression: check,
			ArrowFunctionExpression: check
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/options-param-naming/index.mts
const BYPASS_RE$10 = /socket-lint:\s*allow\s+options-param-naming/;
const BANNED_PARAM_NAME = "opts";
const CANONICAL_PARAM_NAME = "options";
function bannedParamIdentifier(params) {
	for (let i = 0, { length } = params; i < length; i += 1) {
		const p = params[i];
		if (p?.type === "Identifier" && p.name === BANNED_PARAM_NAME) return p;
	}
}
function hasCanonicalParam(params) {
	for (let i = 0, { length } = params; i < length; i += 1) {
		const p = params[i];
		if (p?.type === "Identifier" && p.name === CANONICAL_PARAM_NAME) return true;
	}
	return false;
}
const TYPE_SUBTREE_KEYS = /* @__PURE__ */ new Set([
	"returnType",
	"typeAnnotation",
	"typeArguments",
	"typeParameters"
]);
function collectOptsIdentifiers(root) {
	const found = [];
	const visit = (n, parent) => {
		if (!n || typeof n !== "object") return;
		if (n.type === "TSAsExpression" || n.type === "TSSatisfiesExpression") {
			visit(n.expression, n);
			visit(n.typeAnnotation, n);
			return;
		}
		if (n.type === "TSTypeQuery") {
			visit(n.exprName, n);
			return;
		}
		if (typeof n.type === "string" && n.type.startsWith("TS")) return;
		if (n.type === "Identifier" && n.name === BANNED_PARAM_NAME && !(parent?.type === "MemberExpression" && parent.property === n && !parent.computed) && !(parent?.type === "Property" && parent.key === n && !parent.computed)) found.push(n);
		const keyList = Object.keys(n);
		for (let j = 0, { length: jlen } = keyList; j < jlen; j += 1) {
			const key = keyList[j];
			if (key === "parent" || TYPE_SUBTREE_KEYS.has(key)) continue;
			const child = n[key];
			if (Array.isArray(child)) for (let i = 0, { length } = child; i < length; i += 1) visit(child[i], n);
			else if (child && typeof child === "object") visit(child, n);
		}
	};
	visit(root, void 0);
	return found;
}
const rule$43 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "The options-bag PARAM must be named `options` (the normalized local stays `opts`); `opts` as a param name conflates input with its null-proto-safe form.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: void 0,
		hasSuggestions: true,
		messages: {
			banned: "name the options-bag param `options`, not `opts` — `opts` is reserved for the normalized local (`const opts = { __proto__: null, ...options }`). Bypass: add a `socket-lint: allow options-param-naming` comment.",
			bannedNoFix: "name the options-bag param `options`, not `opts`, but a param named `options` already exists here — rename by hand to resolve the clash. Bypass: add a `socket-lint: allow options-param-naming` comment."
		},
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$10);
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (/\.d\.[cm]?ts$/.test(filename) || /\.test\.[cm]?[jt]sx?$/.test(filename) || /\/test\//.test((0, import_normalize.normalizePath)(filename))) return {};
		function check(node) {
			const params = node.params;
			if (!Array.isArray(params)) return;
			const banned = bannedParamIdentifier(params);
			if (!banned) return;
			if (hasBypassComment(node)) return;
			if (hasCanonicalParam(params)) {
				context.report({
					node: banned,
					messageId: "bannedNoFix"
				});
				return;
			}
			const refs = collectOptsIdentifiers(node);
			context.report({
				node: banned,
				messageId: "banned",
				suggest: [{
					messageId: "banned",
					fix(fixer) {
						return refs.map((ref) => {
							const start = ref.range?.[0] ?? ref.start;
							return fixer.replaceTextRange([start, start + 4], CANONICAL_PARAM_NAME);
						});
					}
				}]
			});
		}
		return {
			FunctionDeclaration: check,
			FunctionExpression: check,
			ArrowFunctionExpression: check
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/personal-path-placeholders/index.mts
const PATTERNS = [
	{
		re: /(?<![A-Za-z]:)(\/Users\/)<([^>]+)>(\/|$)/,
		canonical: "user",
		label: "/Users/<user>/"
	},
	{
		re: /(\/home\/)<([^>]+)>(\/|$)/,
		canonical: "user",
		label: "/home/<user>/"
	},
	{
		re: /([A-Za-z]:[\\/]Users[\\/])<([^>]+)>([\\/]|$)/,
		canonical: "USERNAME",
		label: "C:\\Users\\<USERNAME>\\"
	}
];
/**
* A real-username detection — a path of the same shape but with a
* non-placeholder username segment. Reported, not fixed.
*/
const REAL_USERNAME_PATTERNS = [/(\/Users\/)([a-zA-Z][a-zA-Z0-9_-]{1,31})(\/)/, /(\/home\/)([a-zA-Z][a-zA-Z0-9_-]{1,31})(\/)/];
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$42 = {
	meta: {
		type: "problem",
		docs: {
			description: "Use canonical personal-path placeholders (<user> on Unix, <USERNAME> on Windows). Drift breaks fleet-wide grep audits.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: {
			drift: "Personal-path placeholder `<{{actual}}>` should be the canonical `<{{canonical}}>`. Saw `{{path}}`; expected the form `{{label}}`.",
			realUsername: "Personal path with literal username `{{name}}`. In source/docs: replace with placeholder `{{label}}`, an env-var form, or delete the path. In WASM / generated bundles: this is a build leak — fix the bundler config, not the artifact."
		},
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		function checkText(textNode, text, { isComment }) {
			let mutated = false;
			let next = text;
			let firstReport;
			for (let i = 0, { length } = PATTERNS; i < length; i += 1) {
				const p = PATTERNS[i];
				const reAll = new RegExp(p.re.source, "g");
				next = next.replace(reAll, (whole, prefix, slug, suffix) => {
					if (slug === p.canonical) return whole;
					if (/^\$|^%/.test(slug)) return whole;
					if (!firstReport) firstReport = {
						actual: slug,
						canonical: p.canonical,
						path: whole,
						label: p.label
					};
					mutated = true;
					return `${prefix}<${p.canonical}>${suffix}`;
				});
			}
			if (mutated && firstReport) {
				context.report({
					node: textNode,
					messageId: "drift",
					data: firstReport,
					fix(fixer) {
						if (isComment) {
							const prefix = textNode.type === "Line" ? "//" : "/*";
							const suffix = textNode.type === "Line" ? "" : "*/";
							return fixer.replaceTextRange(textNode.range, prefix + next + suffix);
						}
						const quote = sourceCode.getText(textNode)[0];
						if (quote === "`") return fixer.replaceText(textNode, "`" + next + "`");
						const escaped = next.replace(new RegExp(`\\\\|${quote}`, "g"), (ch) => "\\" + ch);
						return fixer.replaceText(textNode, quote + escaped + quote);
					}
				});
				return;
			}
			for (let i = 0, { length } = REAL_USERNAME_PATTERNS; i < length; i += 1) {
				const re = REAL_USERNAME_PATTERNS[i];
				const m = re.exec(text);
				if (!m) continue;
				const slug = m[2];
				if (slug === "user" || slug === "USERNAME") continue;
				if (slug === "Public" || slug === "Shared") continue;
				const label = re.source.indexOf("Users") !== -1 ? "/Users/<user>/" : "/home/<user>/";
				context.report({
					node: textNode,
					messageId: "realUsername",
					data: {
						name: slug,
						label
					}
				});
				return;
			}
		}
		return {
			Literal(node) {
				if (typeof node.value !== "string") return;
				checkText(node, node.value, { isComment: false });
			},
			TemplateLiteral(node) {
				if (node.expressions.length !== 0) {
					for (const q of node.quasis) checkText(node, q.value.cooked, { isComment: false });
					return;
				}
				checkText(node, node.quasis[0].value.cooked, { isComment: false });
			},
			Program() {
				const comments = sourceCode.getAllComments();
				for (let i = 0, { length } = comments; i < length; i += 1) {
					const comment = comments[i];
					checkText(comment, comment.value, { isComment: true });
				}
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-all-settled/index.mts
const rule$41 = {
	meta: {
		type: "problem",
		docs: {
			description: "Prefer `Promise.allSettled` over an awaited, result-discarded `Promise.all` — one rejection aborts the batch and leaves sibling rejections unhandled.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: { preferAllSettled: "This awaited `Promise.all(...)` discards its result, so its only effect over `Promise.allSettled` is aborting the whole batch on the first rejection — the sibling promises then reject unhandled. For order-independent work use `Promise.allSettled(...)` so one failure does not abandon the rest. For a deliberate fail-fast batch, add `// oxlint-disable-next-line socket/prefer-all-settled -- fail-fast: <reason>`." },
		schema: []
	},
	create(context) {
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "MemberExpression") return;
			if (callee.object.type !== "Identifier" || callee.object.name !== "Promise") return;
			if (callee.property.type !== "Identifier" || callee.property.name !== "all") return;
			const arg = node.arguments?.[0];
			if (!arg) return;
			const isArray = arg.type === "ArrayExpression";
			const isMapCall = arg.type === "CallExpression" && arg.callee?.type === "MemberExpression" && arg.callee.property?.type === "Identifier" && (arg.callee.property.name === "flatMap" || arg.callee.property.name === "map");
			if (!isArray && !isMapCall) return;
			const parent = node.parent;
			if (parent?.type !== "AwaitExpression" || parent.parent?.type !== "ExpressionStatement") return;
			context.report({
				node,
				messageId: "preferAllSettled"
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-async-spawn/index.mts
const CHILD_PROCESS_SPECIFIERS$1 = /* @__PURE__ */ new Set(["child_process", "node:child_process"]);
const LIB_SPECIFIER = "@socketsecurity/lib-stable/process/spawn/child";
const BANNED_NAMES$1 = /* @__PURE__ */ new Set(["spawn", "spawnSync"]);
const BYPASS_RE$9 = /prefer-async-spawn:\s*sync-required/;
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$40 = {
	meta: {
		type: "problem",
		docs: {
			description: "Use `spawn` from @socketsecurity/lib-stable/process/spawn/child instead of `spawnSync` / core `spawn` from node:child_process.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: {
			importBanned: "Importing `{{name}}` from {{specifier}} — use `spawn` from @socketsecurity/lib-stable/process/spawn/child. Async unblocks parallel work and the lib ships consistent error shapes (SpawnError).",
			callBanned: "Calling `child_process.{{name}}(...)` — use `spawn` from @socketsecurity/lib-stable/process/spawn/child instead."
		},
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		function hasBypassComment(node) {
			const before = sourceCode.getCommentsBefore(node);
			const after = sourceCode.getCommentsAfter(node);
			for (const c of [...before, ...after]) if (BYPASS_RE$9.test(c.value)) return true;
			return false;
		}
		/**
		* Build a fixer that swaps the import SOURCE without changing the imported
		* NAMES. The lib re-exports both `spawn` and `spawnSync` (and a
		* `Spawn`-typed namespace under them), so consumers who imported
		* `spawnSync` keep using `spawnSync` from the lib and their call sites stay
		* correct.
		*
		* The original rule collapsed `spawnSync` → `spawn` and left the call sites
		* untouched, producing files that called `spawnSync(...)` with no
		* `spawnSync` symbol in scope. Sync-aware: never rename.
		*
		* Conservatively skip when other (non-banned) named imports share the line
		* — `exec`, `ChildProcess`, etc. aren't re-exported, so the whole-line
		* rewrite would break those references.
		*/
		function fixImport(fixer, node) {
			if (node.specifiers.filter((s) => s.type !== "ImportSpecifier" || !s.imported || !BANNED_NAMES$1.has(s.imported.name)).length > 0) return;
			return fixer.replaceText(node.source, `'${LIB_SPECIFIER}'`);
		}
		return {
			ImportDeclaration(node) {
				const specifier = node.source.value;
				if (!CHILD_PROCESS_SPECIFIERS$1.has(specifier)) return;
				if (hasBypassComment(node)) return;
				const banned = node.specifiers.filter((s) => s.type === "ImportSpecifier" && s.imported && BANNED_NAMES$1.has(s.imported.name));
				if (banned.length === 0) return;
				for (let i = 0, { length } = banned; i < length; i += 1) {
					const spec = banned[i];
					context.report({
						node: spec,
						messageId: "importBanned",
						data: {
							name: spec.imported.name,
							specifier: `'${specifier}'`
						},
						fix(fixer) {
							return fixImport(fixer, node);
						}
					});
				}
			},
			CallExpression(node) {
				const callee = node.callee;
				if (callee.type !== "MemberExpression") return;
				if (callee.property.type !== "Identifier") return;
				if (!BANNED_NAMES$1.has(callee.property.name)) return;
				const obj = callee.object;
				const objName = obj.type === "Identifier" ? obj.name : obj.type === "MemberExpression" && obj.property.type === "Identifier" ? obj.property.name : void 0;
				if (!objName) return;
				if (!/^(?:childProcess|child_process|cp)$/.test(objName)) return;
				if (hasBypassComment(node)) return;
				context.report({
					node,
					messageId: "callBanned",
					data: { name: callee.property.name }
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-cached-for-loop/index.mts
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$39 = {
	meta: {
		type: "problem",
		docs: {
			description: "Prefer cached-length C-style `for (let i = 0, { length } = arr; i < length; i += 1)` over `.forEach` and `for...of`.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: {
			preferCachedFor: "Use a cached-length `for (let i = 0, { length } = {{iter}}; i < length; i += 1)` loop instead of `{{shape}}` — avoids per-iteration callback / iterator allocation.",
			preferCachedForNoFix: "Use a cached-length `for` loop instead of `{{shape}}`, but the rewrite is unsafe here ({{reason}}). Rewrite manually."
		},
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const filename = context.filename ?? context.getFilename?.() ?? "";
		const nonNullAssertion = /\.(?:cts|mts|tsx?)$/.test(filename) ? "!" : "";
		const resolveKind = createKindResolver();
		return {
			CallExpression(node) {
				const callee = node.callee;
				if (callee.type !== "MemberExpression") return;
				if (callee.property.type !== "Identifier" || callee.property.name !== "forEach") return;
				if (callee.computed) return;
				if (node.arguments.length === 0 || node.arguments.length > 1) return;
				const cb = node.arguments[0];
				if (cb.type !== "ArrowFunctionExpression" && cb.type !== "FunctionExpression") {
					context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: ".forEach(handler)",
							reason: "callback is not an inline arrow / function expression"
						}
					});
					return;
				}
				if (cb.params.length === 0 || cb.params.length > 2) {
					context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: ".forEach",
							reason: "callback arity is 0 or 3+"
						}
					});
					return;
				}
				const itemParam = cb.params[0];
				const indexParam = cb.params[1];
				if (itemParam.type !== "Identifier") {
					context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: ".forEach",
							reason: "first parameter is destructured"
						}
					});
					return;
				}
				if (indexParam && indexParam.type !== "Identifier") {
					context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: ".forEach",
							reason: "second parameter is destructured"
						}
					});
					return;
				}
				if (cb.body.type !== "BlockStatement") {
					context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: ".forEach",
							reason: "callback uses expression body"
						}
					});
					return;
				}
				if (cb.async) {
					context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: ".forEach",
							reason: "callback is async (changes parallel-vs-sequential semantics)"
						}
					});
					return;
				}
				const bodyText = sourceCode.getText(cb.body);
				if (/\bthis\b/.test(bodyText)) {
					context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: ".forEach",
							reason: "callback references `this`"
						}
					});
					return;
				}
				const parent = node.parent;
				if (parent && parent.type === "MemberExpression" && parent.object === node) return;
				if (!parent || parent.type !== "ExpressionStatement") {
					context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: ".forEach",
							reason: "call result is consumed (not a standalone statement)"
						}
					});
					return;
				}
				const iterText = sourceCode.getText(callee.object);
				const itemName = itemParam.name;
				const indexName = indexParam ? indexParam.name : pickCounterName(itemName, bodyText);
				if (!indexName || referencesIdentifier(bodyText, "length")) {
					context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: ".forEach",
							reason: "a `for` counter or the `{ length }` binding would collide with an identifier the callback body already uses"
						}
					});
					return;
				}
				const itemKind = reassignsInBody(sourceCode, cb.body, itemName) ? "let" : "const";
				context.report({
					node,
					messageId: "preferCachedFor",
					data: {
						iter: iterText,
						shape: ".forEach"
					},
					fix(fixer) {
						const bodyInner = sourceCode.text.slice(cb.body.range[0] + 1, cb.body.range[1] - 1);
						const indent = leadingIndent(sourceCode, parent);
						const innerIndent = `${indent}  `;
						const asiGuard = ASI_HAZARD_LEAD.test(bodyInner.trimStart().charAt(0)) ? ";" : "";
						const replacement = `for (let ${indexName} = 0, { length } = ${iterText}; ${indexName} < length; ${indexName} += 1) {\n${innerIndent}${itemKind} ${itemName} = ${iterText}[${indexName}]${nonNullAssertion}${asiGuard}${bodyInner.trimEnd()}\n${indent}}`;
						return fixer.replaceText(parent, replacement);
					}
				});
			},
			ForOfStatement(node) {
				if (node.await) return;
				const left = node.left;
				if (left.type !== "VariableDeclaration") return;
				if (left.declarations.length !== 1) return;
				const declarator = left.declarations[0];
				if (!declarator.id || declarator.id.type !== "Identifier") return;
				const iter = node.right;
				if (iter.type === "CallExpression") {
					if (classifyInit(iter) === "array") context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: "for…of over an array-producing call",
							reason: "hoist the call to a local (`const items = …`) so the loop can cache its length"
						}
					});
					return;
				}
				if (iter.type !== "Identifier") return;
				const iterKind = resolveKind(node, iter.name);
				if (FLAGGED_KINDS.has(iterKind) || iterKind === "unknown") return;
				if (node.body.type !== "BlockStatement") return;
				const itemName = declarator.id.name;
				const iterText = iter.name;
				const forOfBodyText = sourceCode.getText(node.body);
				const counterName = pickCounterName(itemName, forOfBodyText);
				if (!counterName || referencesIdentifier(forOfBodyText, "length")) {
					context.report({
						node,
						messageId: "preferCachedForNoFix",
						data: {
							shape: "for...of",
							reason: "a `for` counter or the `{ length }` binding would collide with an identifier the loop body already uses"
						}
					});
					return;
				}
				const itemKind = left.kind === "let" || reassignsInBody(sourceCode, node.body, itemName) ? "let" : "const";
				context.report({
					node,
					messageId: "preferCachedFor",
					data: {
						iter: iterText,
						shape: "for...of"
					},
					fix(fixer) {
						const bodyInner = sourceCode.text.slice(node.body.range[0] + 1, node.body.range[1] - 1);
						const indent = leadingIndent(sourceCode, node);
						const innerIndent = `${indent}  `;
						const asiGuard = ASI_HAZARD_LEAD.test(bodyInner.trimStart().charAt(0)) ? ";" : "";
						const replacement = `for (let ${counterName} = 0, { length } = ${iterText}; ${counterName} < length; ${counterName} += 1) {\n${innerIndent}${itemKind} ${itemName} = ${iterText}[${counterName}]${nonNullAssertion}${asiGuard}${bodyInner.trimEnd()}\n${indent}}`;
						return fixer.replaceText(node, replacement);
					}
				});
			}
		};
	}
};
/**
* A statement whose first character is one of these can merge with the
* preceding line under ASI (e.g. `arr[i]!` newline `(fn)()` parses as a call).
* When a loop body's first statement leads with one, the injected item
* declaration needs an explicit `;` terminator to stay correct under the
* fleet's no-semicolon style.
*/
const ASI_HAZARD_LEAD = /[([`+\-*/]/;
/**
* Does the loop body text reference `name` as a standalone identifier? A
* word-boundary textual probe, not a substring match. Conservative: a false
* positive only forces a different counter name or a skip — both safe.
*/
function referencesIdentifier(bodyText, name) {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(String.raw`\b${escaped}\b`).test(bodyText);
}
/**
* Pick a loop-counter name that collides with neither the item variable NOR any
* identifier the loop body already uses (scope-aware). Tries `i`, then
* `i2`…`i9`. Returns `undefined` when every candidate is taken so the caller
* skips the autofix rather than shadow a live binding — the collision that made
* a naive `i` rewrite silently break a body that already bound its own `i`.
* `bodyText` defaults to '' so a name-only call still dodges the item name.
*/
function pickCounterName(itemName, bodyText = "") {
	const candidates = [
		"i",
		"i2",
		"i3",
		"i4",
		"i5",
		"i6",
		"i7",
		"i8",
		"i9"
	];
	for (let idx = 0, { length } = candidates; idx < length; idx += 1) {
		const name = candidates[idx];
		if (name !== itemName && !referencesIdentifier(bodyText, name)) return name;
	}
}
/**
* Textual check: does the loop body reassign the named identifier? Catches
* `name = ...`, `name +=`, `name++`, `++name`, etc., and
* destructuring-as-assignment patterns. Conservative: false positives only
* force `let`, semantically safe, false negatives trip `no-const-assign` (the
* bug this guards against).
*
* AST-walking would be more precise but oxlint's plugin host doesn't expose a
* uniform visitor for body subtrees here; the regex catches every reassignment
* shape that compiles today.
*/
function reassignsInBody(sourceCode, bodyNode, name) {
	if (!bodyNode) return false;
	const text = sourceCode.text.slice(bodyNode.range[0], bodyNode.range[1]);
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	if (new RegExp(String.raw`\b${escaped}\b\s*(?:=(?!=)|[-+*/%&|^]=|<<=|>>=|>>>=|\*\*=|&&=|\|\|=|\?\?=|\+\+|--)`).test(text)) return true;
	return new RegExp(String.raw`(?:\+\+|--)\s*\b${escaped}\b`).test(text);
}
/**
* Recover the indentation prefix on the line where `node` starts so the
* rewritten block can re-indent its contents consistently with the surrounding
* code.
*/
function leadingIndent(sourceCode, node) {
	const text = sourceCode.text;
	const start = node.range[0];
	const lineStart = text.lastIndexOf("\n", start - 1) + 1;
	const indent = text.slice(lineStart, start);
	/* c8 ignore next */
	return /^\s*/.exec(indent)?.[0] ?? "";
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-ellipsis-char/index.mts
const ELLIPSIS_TAIL = String.raw`(?![./)\]}>A-Za-z0-9$_{])`;
const WORD_FINAL_ELLIPSIS_RE = new RegExp(String.raw`[A-Za-z0-9]\.{3,}${ELLIPSIS_TAIL}`);
const WORD_FINAL_ELLIPSIS_RE_G = new RegExp(String.raw`([A-Za-z0-9])\.{3,}${ELLIPSIS_TAIL}`, "g");
const BYPASS_RE$8 = /socket-lint:\s*allow\s+literal-ellipsis/;
const rule$38 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Use the ellipsis character `…` (U+2026) instead of three literal dots `...` in string / template / comment text.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: { literalEllipsis: "Three literal dots `...` in text — use the ellipsis character `…` (U+2026). It reads as one glyph and matches fleet typography. (Spread/rest `...` operators are not flagged.) For an intentional three-dot form, add `// socket-lint: allow literal-ellipsis`." },
		schema: []
	},
	create(context) {
		if (isPluginSelfFile(context)) return {};
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$8);
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		function checkTextNode(node, text) {
			if (!WORD_FINAL_ELLIPSIS_RE.test(text)) return;
			if (hasBypassComment(node)) return;
			context.report({
				node,
				messageId: "literalEllipsis",
				fix(fixer) {
					const raw = sourceCode.getText(node);
					return fixer.replaceText(node, raw.replace(WORD_FINAL_ELLIPSIS_RE_G, (_m, lead) => `${lead}…`));
				}
			});
		}
		return {
			Literal(node) {
				const v = node.value;
				if (typeof v === "string") checkTextNode(node, v);
			},
			TemplateElement(node) {
				const cooked = node.value?.cooked;
				if (typeof cooked !== "string") return;
				checkTextNode(node, node.tail !== false ? cooked : `${cooked}$`);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-env-as-boolean/index.mts
const TRUTHY_LITERALS = /* @__PURE__ */ new Set(["1", "true"]);
function isSocketGetterCall(node) {
	if (node.type !== "CallExpression") return false;
	const callee = node.callee;
	if (!callee || callee.type !== "Identifier") return false;
	const name = callee.name;
	if (!name) return false;
	return /^getSocket[A-Z]/.test(name);
}
function isTruthyStringLiteral(node) {
	if (node.type !== "Literal") return false;
	const v = node.value;
	return typeof v === "string" && TRUTHY_LITERALS.has(v);
}
const rule$37 = {
	meta: {
		type: "problem",
		docs: {
			description: "Use envAsBoolean from @socketsecurity/lib-stable/env/boolean for SOCKET_* env coercion. Truthy coercion misclassifies the string \"0\" as true.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: "code",
		messages: { coerce: "`{{shape}}` misclassifies the string \"0\" / \"false\" as truthy. Use `envAsBoolean({{inner}})` from @socketsecurity/lib-stable/env/boolean." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		let summary;
		function ensureSummary() {
			if (!summary) summary = summarizeImportTarget(sourceCode.ast, "envAsBoolean", "envAsBoolean");
			return summary;
		}
		function reportAndFix(node, shape, innerExpr) {
			const innerText = sourceCode.getText(innerExpr);
			const s = ensureSummary();
			if (s.hasLocal) {
				context.report({
					node,
					messageId: "coerce",
					data: {
						shape,
						inner: innerText
					}
				});
				return;
			}
			context.report({
				node,
				messageId: "coerce",
				data: {
					shape,
					inner: innerText
				},
				fix(fixer) {
					return [fixer.replaceText(node, `envAsBoolean(${innerText})`), ...appendImportFixes(s, fixer, `import { envAsBoolean } from '@socketsecurity/lib-stable/env/boolean'`, void 0)];
				}
			});
		}
		return {
			UnaryExpression(node) {
				if (node.operator !== "!") return;
				const arg = node.argument;
				if (!arg || arg.type !== "UnaryExpression" || arg.operator !== "!") return;
				const inner = arg.argument;
				if (!inner || !isSocketGetterCall(inner)) return;
				reportAndFix(node, "!!getSocketX()", inner);
			},
			CallExpression(node) {
				const callee = node.callee;
				if (!callee || callee.type !== "Identifier" || callee.name !== "Boolean") return;
				const args = node.arguments ?? [];
				if (args.length !== 1) return;
				const arg = args[0];
				if (!isSocketGetterCall(arg)) return;
				reportAndFix(node, "Boolean(getSocketX())", arg);
			},
			BinaryExpression(node) {
				const op = node.operator;
				if (op !== "==" && op !== "===") return;
				const left = node.left;
				const right = node.right;
				if (!left || !right) return;
				if (isSocketGetterCall(left) && isTruthyStringLiteral(right)) {
					reportAndFix(node, `getSocketX() ${op} '<literal>'`, left);
					return;
				}
				if (isSocketGetterCall(right) && isTruthyStringLiteral(left)) reportAndFix(node, `'<literal>' ${op} getSocketX()`, right);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-error-message/index.mts
function identifierName$1(node) {
	if (!node || node.type !== "Identifier") return;
	return node.name;
}
function isStringCallOf(node, name) {
	if (!node || node.type !== "CallExpression") return false;
	const callee = node.callee;
	if (!callee || callee.type !== "Identifier" || callee.name !== "String") return false;
	const args = node.arguments ?? [];
	if (args.length !== 1) return false;
	return identifierName$1(args[0]) === name;
}
function isMessageMemberOf(node, name) {
	if (!node || node.type !== "MemberExpression") return false;
	if (node.computed) return false;
	const property = node.property;
	if (!property || property.type !== "Identifier" || property.name !== "message") return false;
	return identifierName$1(node.object) === name;
}
function isInstanceOfErrorOf(node, name) {
	/* c8 ignore start - caller already guards node non-null + BinaryExpression */
	if (!node || node.type !== "BinaryExpression") return false;
	/* c8 ignore stop */
	if (node.operator !== "instanceof") return false;
	/* c8 ignore next - name is always derived from node.left at the call site */
	if (identifierName$1(node.left) !== name) return false;
	return identifierName$1(node.right) === "Error";
}
const rule$36 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer `errorMessage(e)` from `@socketsecurity/lib/errors/message` over the `e instanceof Error ? e.message : String(e)` ternary.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: void 0,
		messages: { preferErrorMessage: "`{{name}} instanceof Error ? {{name}}.message : String({{name}})` reinvents `errorMessage({{name}})` from `@socketsecurity/lib/errors/message`. Replace with `errorMessage({{name}})` and add the import — `@socketsecurity/lib/errors/message` for runtime source, `@socketsecurity/lib-stable/errors/message` for scripts / tests / hooks." },
		schema: []
	},
	create(context) {
		return { ConditionalExpression(node) {
			const test = node.test;
			if (!test || test.type !== "BinaryExpression") return;
			const name = identifierName$1(test.left);
			if (!name) return;
			if (!isInstanceOfErrorOf(test, name)) return;
			if (!isMessageMemberOf(node.consequent, name)) return;
			if (!isStringCallOf(node.alternate, name)) return;
			context.report({
				node,
				messageId: "preferErrorMessage",
				data: { name }
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-error-message-helper/index.mts
const ERROR_PROPS = /* @__PURE__ */ new Set(["message", "stack"]);
/**
* Identifier name, or undefined for any other node.
*/
function identifierName(node) {
	if (!node || node.type !== "Identifier") return;
	return node.name;
}
/**
* True when `node` is a non-computed `<name>.<prop>` where `prop` is one of the
* error text properties (`message` / `stack`).
*/
function errorMemberProp(node, name) {
	if (!node || node.type !== "MemberExpression" || node.computed) return;
	if (node.property?.type !== "Identifier" || !ERROR_PROPS.has(node.property.name)) return;
	if (identifierName(node.object) !== name) return;
	return node.property.name;
}
/**
* The identifier name inside `String(<id>)`, or undefined when `node` is not a
* single-argument `String(<Identifier>)` call.
*/
function stringCallArgName(node) {
	if (!node || node.type !== "CallExpression") return;
	const { callee } = node;
	if (!callee || callee.type !== "Identifier" || callee.name !== "String") return;
	const args = node.arguments ?? [];
	if (args.length !== 1) return;
	return identifierName(args[0]);
}
/**
* True when `node` is `<name> instanceof Error`.
*/
function isInstanceOfError(node, name) {
	return !!node && node.type === "BinaryExpression" && node.operator === "instanceof" && identifierName(node.left) === name && identifierName(node.right) === "Error";
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$35 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer errorMessage(e) from @socketsecurity/lib/errors/message over hand-rolled error-message extraction (instanceof-Error ternary, stack ?? message chain, String(e) as sole logger.error / throw text).",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: { preferErrorMessageHelper: "Manual error-message extraction — use `errorMessage({{name}})` from `@socketsecurity/lib/errors/message` (runtime source) / `@socketsecurity/lib-stable/errors/message` (scripts / tests / hooks). It centralizes cause-chain / aggregate handling and keeps every call site identical." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const filename = context.filename ?? context.getFilename?.() ?? "";
		let summary;
		function ensureSummary() {
			if (summary) return summary;
			summary = summarizeImportTarget(sourceCode.ast, "errorMessage", "errorMessage");
			return summary;
		}
		function importLine() {
			const normalized = (0, import_normalize.normalizePath)(filename);
			return `import { errorMessage } from '${/(?:^|\/)scripts\//.test(normalized) || /(?:^|\/)tests?\//.test(normalized) || /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(normalized) || normalized.includes("/.claude/hooks/") || normalized.includes("/.config/") ? "@socketsecurity/lib-stable/errors/message" : "@socketsecurity/lib/errors/message"}'`;
		}
		/**
		* Report `node`, the whole matched expression, and, when safe, autofix it
		* to `errorMessage(<name>)` plus the missing import.
		*/
		function reportPreferHelper(node, name) {
			const s = ensureSummary();
			if (s.hasLocal && !s.hasImport) {
				context.report({
					node,
					messageId: "preferErrorMessageHelper",
					data: { name }
				});
				return;
			}
			context.report({
				node,
				messageId: "preferErrorMessageHelper",
				data: { name },
				fix(fixer) {
					return [fixer.replaceText(node, `errorMessage(${name})`), ...appendImportFixes(s, fixer, importLine(), void 0)];
				}
			});
		}
		return {
			ConditionalExpression(node) {
				const name = identifierName(node.test?.left);
				if (!name || !isInstanceOfError(node.test, name)) return;
				if (!errorMemberProp(node.consequent, name)) return;
				if (stringCallArgName(node.alternate) !== name) return;
				reportPreferHelper(node, name);
			},
			LogicalExpression(node) {
				if (node.operator !== "??") return;
				const name = identifierName(node.left?.object);
				if (!name) return;
				const leftProp = errorMemberProp(node.left, name);
				const rightProp = errorMemberProp(node.right, name);
				if (!leftProp || !rightProp || leftProp === rightProp) return;
				reportPreferHelper(node, name);
			},
			CallExpression(node) {
				const name = stringCallArgName(node);
				if (!name) return;
				const parent = node.parent;
				if (!parent) return;
				if (parent.type === "ThrowStatement" && parent.argument === node) {
					reportPreferHelper(node, name);
					return;
				}
				if (parent.type === "CallExpression" && parent.callee?.type === "MemberExpression" && !parent.callee.computed && parent.callee.property?.type === "Identifier" && parent.callee.property.name === "error" && (parent.arguments?.length ?? 0) === 1 && parent.arguments[0] === node) reportPreferHelper(node, name);
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-exists-sync/index.mts
const ACCESS_METHODS = /* @__PURE__ */ new Set(["access", "accessSync"]);
const STAT_METHODS = /* @__PURE__ */ new Set([
	"lstat",
	"lstatSync",
	"stat",
	"statSync"
]);
const WRAPPER_NAMES = /* @__PURE__ */ new Set([
	"fileExists",
	"isDir",
	"isFile",
	"pathExists"
]);
const EXISTS_SYNC_IMPORT_LINE = "import { existsSync } from 'node:fs'";
const STAT_BYPASS_RE = socketLintAllowRe("stat-for-metadata");
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$34 = {
	meta: {
		type: "problem",
		docs: {
			description: "Prefer existsSync from node:fs over fs.access / fs.stat-for-existence / async fileExists wrapper.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: {
			access: "fs.{{method}}() — use existsSync from node:fs for existence checks. fs.access throws on missing files (forces try/catch); existsSync returns boolean directly.",
			stat: "fs.{{method}}() — if you only need to know whether the path exists, use existsSync from node:fs. If you need the metadata (size, mtime), keep stat and mark the line `socket-lint: allow stat-for-metadata` with the reason.",
			fileExists: "Custom `{{name}}` wrapper — use existsSync from node:fs directly."
		},
		schema: []
	},
	create(context) {
		const hasStatBypass = makeBypassChecker(context, STAT_BYPASS_RE);
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		let summary;
		function ensureSummary() {
			if (summary) return summary;
			summary = summarizeImportTarget(sourceCode.ast, "existsSync", "existsSync");
			return summary;
		}
		function calleeMethodName(callee) {
			if (callee.type !== "MemberExpression") return;
			if (callee.property.type !== "Identifier") return;
			return callee.property.name;
		}
		/**
		* Wrappers are only fixable when: - exactly 1 argument (matches existsSync
		* arity) - argument is not a SpreadElement.
		*
		* The call is often wrapped in `await` — that's fine. Replacing `await
		* fileExists(p)` with `existsSync(p)`, no await, is the intended rewrite;
		* existsSync is sync and the surrounding `await` collapses to a no-op on a
		* non-promise value.
		*/
		function isFixableWrapperCall(node) {
			if (node.arguments.length !== 1) return false;
			if (node.arguments[0].type === "SpreadElement") return false;
			return true;
		}
		return { CallExpression(node) {
			const method = calleeMethodName(node.callee);
			if (!method) {
				if (node.callee.type === "Identifier" && WRAPPER_NAMES.has(node.callee.name)) {
					const name = node.callee.name;
					if (!isFixableWrapperCall(node)) {
						context.report({
							node,
							messageId: "fileExists",
							data: { name }
						});
						return;
					}
					const s = ensureSummary();
					if (s.hasLocal) {
						context.report({
							node,
							messageId: "fileExists",
							data: { name }
						});
						return;
					}
					const argText = sourceCode.getText(node.arguments[0]);
					context.report({
						node,
						messageId: "fileExists",
						data: { name },
						fix(fixer) {
							return [fixer.replaceText(node, `existsSync(${argText})`), ...appendImportFixes(s, fixer, EXISTS_SYNC_IMPORT_LINE, void 0)];
						}
					});
				}
				return;
			}
			if (ACCESS_METHODS.has(method)) context.report({
				node,
				messageId: "access",
				data: { method }
			});
			else if (STAT_METHODS.has(method) && !hasStatBypass(node)) context.report({
				node,
				messageId: "stat",
				data: { method }
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-find-repo-root/index.mts
const rule$33 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer importing REPO_ROOT from paths.mts (or findRepoRoot(import.meta)) over `path.join(__dirname, \"..\", \"..\")`. The ascent count drifts on every scripts-into-subdir refactor.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: { preferFindRepoRoot: "`{{call}}(__dirname, {{ascent}})` is fragile — the {{count}}× `..` chain breaks every time this file moves between directories. Import `REPO_ROOT` from `paths.mts` (or `findRepoRoot(import.meta)` once it ships in lib-stable), which walks up to the nearest `package.json` and stays correct across refactors." },
		schema: []
	},
	create(context) {
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "MemberExpression" || callee.computed || callee.object.type !== "Identifier" || callee.object.name !== "path" || callee.property.type !== "Identifier") return;
			const method = callee.property.name;
			if (method !== "join" && method !== "resolve") return;
			const args = node.arguments;
			if (!args || args.length < 3) return;
			if (args[0]?.type !== "Identifier" || args[0].name !== "__dirname") return;
			let ascentCount = 0;
			for (let i = 1; i < args.length; i += 1) {
				const arg = args[i];
				if (arg?.type === "Literal" && typeof arg.value === "string" && arg.value === "..") {
					ascentCount += 1;
					continue;
				}
				break;
			}
			if (ascentCount < 2) return;
			const ascentArgs = Array(ascentCount).fill("'..'").join(", ");
			context.report({
				node,
				messageId: "preferFindRepoRoot",
				data: {
					call: `path.${method}`,
					ascent: ascentArgs,
					count: String(ascentCount)
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-find-up-package-json/index.mts
const rule$32 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer findUpPackageJson(import.meta) over `path.join(__dirname, \"..\", \"..\")`. The ascent count drifts on every scripts-into-subdir refactor.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: { preferFindUpPackageJson: "`{{call}}(__dirname, {{ascent}})` is fragile — the {{count}}× `..` chain breaks every time this file moves between directories. Use `path.dirname(findUpPackageJson(import.meta))` — the `findUpPackageJson` helper exported by the fleet lib (`@socketsecurity/lib-stable`, package helpers) — which walks up to the nearest `package.json` and stays correct across refactors." },
		schema: []
	},
	create(context) {
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "MemberExpression" || callee.computed || callee.object.type !== "Identifier" || callee.object.name !== "path" || callee.property.type !== "Identifier") return;
			const method = callee.property.name;
			if (method !== "join" && method !== "resolve") return;
			const args = node.arguments;
			if (!args || args.length < 3) return;
			if (args[0]?.type !== "Identifier" || args[0].name !== "__dirname") return;
			let ascentCount = 0;
			for (let i = 1; i < args.length; i += 1) {
				const arg = args[i];
				if (arg?.type === "Literal" && typeof arg.value === "string" && arg.value === "..") {
					ascentCount += 1;
					continue;
				}
				break;
			}
			if (ascentCount < 2) return;
			const ascentArgs = Array(ascentCount).fill("'..'").join(", ");
			context.report({
				node,
				messageId: "preferFindUpPackageJson",
				data: {
					call: `path.${method}`,
					ascent: ascentArgs,
					count: String(ascentCount)
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-function-declaration/index.mts
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$31 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Module-scope functions should use `function foo() {}` declarations instead of `const foo = () => ...` / `const foo = function () {}`.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: {
			preferFunctionDeclaration: "Module-scope `{{name}}` is an arrow/function expression. Use `function {{name}}() {}` — hoists, sorts under `sort-source-methods`, and renders a stable name in stack traces.",
			preferFunctionDeclarationNoFix: "Module-scope `{{name}}` should be a `function` declaration, but autofix is unsafe here (generator / `this` reference / type-annotated declarator / multi-declarator binding). Rewrite manually."
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { VariableDeclaration(node) {
			const parent = node.parent;
			if (!(parent && parent.type === "Program" || parent && (parent.type === "ExportDefaultDeclaration" || parent.type === "ExportNamedDeclaration") && parent.parent && parent.parent.type === "Program")) return;
			if (node.kind !== "const") return;
			if (node.declarations.length !== 1) return;
			const decl = node.declarations[0];
			if (!decl.id || decl.id.type !== "Identifier") return;
			if (!decl.init) return;
			const init = decl.init;
			if (init.type !== "ArrowFunctionExpression" && init.type !== "FunctionExpression") return;
			const name = decl.id.name;
			if (init.generator) {
				context.report({
					node: decl.id,
					messageId: "preferFunctionDeclarationNoFix",
					data: { name }
				});
				return;
			}
			if (decl.id.typeAnnotation) {
				context.report({
					node: decl.id,
					messageId: "preferFunctionDeclarationNoFix",
					data: { name }
				});
				return;
			}
			if (init.type === "ArrowFunctionExpression" && referencesThis(init)) {
				context.report({
					node: decl.id,
					messageId: "preferFunctionDeclarationNoFix",
					data: { name }
				});
				return;
			}
			context.report({
				node: decl.id,
				messageId: "preferFunctionDeclaration",
				data: { name },
				fix(fixer) {
					const asyncPrefix = init.async ? "async " : "";
					const params = init.params.map((p) => sourceCode.getText(p)).join(", ");
					let body;
					if (init.body.type === "BlockStatement") body = sourceCode.getText(init.body);
					else body = `{\n  return ${sourceCode.getText(init.body)}\n}`;
					const replacement = `${asyncPrefix}function ${name}(${params}) ${body}`;
					return fixer.replaceText(node, replacement);
				}
			});
		} };
	}
};
/**
* Walk the function body iteratively looking for a `ThisExpression`.
*
* We previously serialized the AST with JSON.stringify + regex on `\bthis\b`,
* but oxlint's AST nodes can carry back-references (parent, scope, type-arg
* back-pointers from the TS plugin) via getters that return fresh wrapper
* objects. A WeakSet de-cycle keyed on object identity misses those cases — the
* seen-check returns false and JSON.stringify hits the limit and throws
* "Converting circular structure to JSON," crashing the rule. The AST walk
* avoids serialization entirely: each visit checks the node's `type` and pushes
* child nodes onto a work queue. Identity- based seen-set still de-cycles for
* safety, this time without paying the cost of stringification.
*/
function referencesThis(node) {
	if (!node.body) return false;
	const seen = /* @__PURE__ */ new WeakSet();
	const STRUCTURAL_KEYS = [
		"argument",
		"arguments",
		"body",
		"callee",
		"cases",
		"consequent",
		"declaration",
		"declarations",
		"discriminant",
		"elements",
		"expression",
		"expressions",
		"finalizer",
		"handler",
		"id",
		"init",
		"key",
		"left",
		"object",
		"param",
		"params",
		"properties",
		"property",
		"quasi",
		"quasis",
		"right",
		"specifiers",
		"tag",
		"test",
		"update",
		"value"
	];
	const queue = [node.body.type === "BlockStatement" ? node.body.body : node.body];
	while (queue.length > 0) {
		const item = queue.pop();
		if (item === null || item === void 0) continue;
		if (Array.isArray(item)) {
			for (let i = 0, { length } = item; i < length; i += 1) queue.push(item[i]);
			continue;
		}
		if (typeof item !== "object") continue;
		if (seen.has(item)) continue;
		seen.add(item);
		if (item.type === "ThisExpression") return true;
		if (item.type === "FunctionDeclaration" || item.type === "FunctionExpression") continue;
		for (let i = 0, { length } = STRUCTURAL_KEYS; i < length; i += 1) {
			const k = STRUCTURAL_KEYS[i];
			if (k && item[k] !== void 0) queue.push(item[k]);
		}
	}
	return false;
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-lib-versions-over-semver/index.mts
const BYPASS_RE$7 = /socket-lint:\s*allow\s+bare-semver/;
const rule$30 = {
	meta: {
		type: "problem",
		docs: {
			description: "Use '@socketsecurity/lib-stable/versions/*' instead of the bare 'semver' import.",
			category: "Best Practices",
			recommended: true
		},
		messages: { banned: "Bare 'semver' import — use '@socketsecurity/lib-stable/versions/*' instead: isValidVersion / coerceVersion / getMajorVersion (versions/parse), gt / lt / compare / sort / rsort (versions/compare), minVersion / maxVersion / satisfiesVersion (versions/range). The lib keeps semver a bundled dep so consumers carry no runtime semver." },
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$7);
		if ((context.getFilename?.() ?? context.physicalFilename ?? "").includes("/src/external/")) return {};
		return { ImportDeclaration(node) {
			const source = node.source;
			if (source?.type !== "Literal" || typeof source.value !== "string") return;
			const spec = source.value;
			if (spec !== "semver" && !spec.startsWith("semver/")) return;
			if (node.importKind === "type") return;
			if (hasBypassComment(node)) return;
			context.report({
				node: source,
				messageId: "banned"
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-mirror-lock-write/index.mts
const MIRROR_LOCK_FILE_SUFFIX = "_shared/mirror-lock.mts";
const FS_WRITE_NAMES = /* @__PURE__ */ new Set([
	"copyFileSync",
	"cp",
	"cpSync",
	"writeFile",
	"writeFileSync"
]);
function fsWriteName(node) {
	const callee = node.callee;
	if (!callee) return;
	if (callee.type === "Identifier" && FS_WRITE_NAMES.has(callee.name)) return callee.name;
	if (callee.type === "MemberExpression" && !callee.computed && callee.property?.type === "Identifier" && FS_WRITE_NAMES.has(callee.property.name)) return callee.property.name;
}
const rule$29 = {
	meta: {
		type: "problem",
		docs: {
			description: "Inside a module that already imports the mirror-lock primitive, a bare writeFileSync/writeFile/copyFileSync/cp/cpSync bypasses the cascade lock and EACCESes on a locked mirror. Use writeThroughMirrorLock.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: { bareMirrorWrite: "Bare `{{name}}` call in a mirror-lock-aware module — a cascade-locked mirror is chmod 0444/0555, so this EACCESes the moment the target is locked. Use `writeThroughMirrorLock` (or `withMirrorLockLifted(Sync)`) from `scripts/fleet/_shared/mirror-lock.mts` instead. If this destination is genuinely not a mirror, add `oxlint-disable-next-line socket/prefer-mirror-lock-write -- <reason>`." },
		schema: []
	},
	create(context) {
		if ((0, import_normalize.normalizePath)(context.filename ?? context.getFilename?.() ?? "").endsWith(MIRROR_LOCK_FILE_SUFFIX)) return {};
		return { CallExpression(node) {
			const name = fsWriteName(node);
			if (!name) return;
			context.report({
				node,
				messageId: "bareMirrorWrite",
				data: { name }
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-mock-import/index.mts
const MOCK_OBJECTS = /* @__PURE__ */ new Set(["vi", "vitest"]);
const MOCK_METHODS = /* @__PURE__ */ new Set([
	"doMock",
	"doUnmock",
	"mock",
	"unmock"
]);
const rule$28 = {
	meta: {
		type: "problem",
		docs: {
			description: "Prefer vi.mock(import('./path')) over vi.mock('./path') so module renames/moves are typechecked, not silently stale.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: "code",
		messages: { preferImport: "Use `{{call}}(import('{{path}}'))` instead of `{{call}}('{{path}}')`. The raw string isn't typechecked — a rename or move of the mocked module goes stale silently and the mock stops applying. The import() form is resolved by TypeScript, so a move is a compile error." },
		schema: []
	},
	create(context) {
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee.type !== "MemberExpression") return;
			if (callee.object.type !== "Identifier" || !MOCK_OBJECTS.has(callee.object.name)) return;
			if (callee.property.type !== "Identifier" || !MOCK_METHODS.has(callee.property.name)) return;
			const firstArg = node.arguments[0];
			if (!firstArg || firstArg.type !== "Literal" || typeof firstArg.value !== "string") return;
			const call = `${callee.object.name}.${callee.property.name}`;
			context.report({
				node: firstArg,
				messageId: "preferImport",
				data: {
					call,
					path: firstArg.value
				},
				fix(fixer) {
					const raw = (context.getSourceCode ? context.getSourceCode() : context.sourceCode).getText(firstArg);
					return fixer.replaceText(firstArg, `import(${raw})`);
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-node-builtin-imports/index.mts
const PREFER_DEFAULT = [
	"node:path",
	"node:os",
	"node:crypto"
];
const DEFAULT_LOCAL = {
	"node:crypto": "crypto",
	"node:os": "os",
	"node:path": "path"
};
const NAMED_EXCEPTIONS = {};
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$27 = {
	meta: {
		type: "problem",
		docs: {
			description: "Use cherry-pick named imports for node:fs / node:url and default imports for node:path / os / crypto. Per CLAUDE.md \"Imports\" rule.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: {
			fsDefault: "`import fs from 'node:fs'` — use cherry-pick named imports (e.g. `import { existsSync } from 'node:fs'`). Per CLAUDE.md.",
			fsNamespace: "`import * as fs from 'node:fs'` — use cherry-pick named imports. Per CLAUDE.md.",
			preferDefault: "`import {{names}} from '{{specifier}}'` — use a default import and dotted access (`{{local}}.{{first}}`). Per CLAUDE.md."
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		/**
		* Look at the program body to determine whether `localName` is already in
		* use, any binding form. If so, autofixing to a default import would
		* shadow it.
		*/
		function localBindingExists(programBody, localName) {
			for (let i = 0, { length } = programBody; i < length; i += 1) {
				const stmt = programBody[i];
				if (stmt.type === "ImportDeclaration") {
					for (const spec of stmt.specifiers) if (spec.local && spec.local.name === localName && stmt.source.value !== "") return true;
					continue;
				}
				if (stmt.type === "VariableDeclaration") {
					for (const decl of stmt.declarations) if (decl.id && decl.id.type === "Identifier" && decl.id.name === localName) return true;
				}
			}
			return false;
		}
		return { ImportDeclaration(node) {
			const specifier = node.source.value;
			if (typeof specifier !== "string") return;
			if (node.importKind === "type") return;
			if (specifier === "node:fs") {
				let bannedSpec;
				let messageId;
				for (const spec of node.specifiers) {
					if (spec.type === "ImportDefaultSpecifier") {
						bannedSpec = spec;
						messageId = "fsDefault";
						break;
					}
					if (spec.type === "ImportNamespaceSpecifier") {
						bannedSpec = spec;
						messageId = "fsNamespace";
						break;
					}
				}
				if (!bannedSpec) return;
				const fsLocalName = bannedSpec.local.name;
				const scope = context.getScope ? context.getScope() : void 0;
				if (!scope) {
					context.report({
						node,
						messageId
					});
					return;
				}
				const accessed = /* @__PURE__ */ new Set();
				const memberRefs = [];
				let unsafe = false;
				function visit(s, visited) {
					if (visited.has(s)) return;
					visited.add(s);
					for (const ref of s.references) {
						if (ref.identifier.name !== fsLocalName) continue;
						if (ref.identifier.range[0] >= node.range[0] && ref.identifier.range[1] <= node.range[1]) continue;
						const refParent = ref.identifier.parent;
						if (!refParent || refParent.type !== "MemberExpression" || refParent.object !== ref.identifier || refParent.computed || refParent.property.type !== "Identifier") {
							unsafe = true;
							return;
						}
						accessed.add(refParent.property.name);
						memberRefs.push(refParent);
					}
					for (const child of s.childScopes) {
						if (unsafe) return;
						visit(child, visited);
					}
				}
				visit(scope, /* @__PURE__ */ new Set());
				if (unsafe || accessed.size === 0) {
					context.report({
						node,
						messageId
					});
					return;
				}
				const programBody = sourceCode.ast.body;
				for (const name of accessed) if (localBindingExists(programBody, name)) {
					context.report({
						node,
						messageId
					});
					return;
				}
				const newImport = `import { ${[...accessed].toSorted().join(", ")} } from 'node:fs'`;
				context.report({
					node,
					messageId,
					fix(fixer) {
						const fixes = [fixer.replaceText(node, newImport)];
						for (let i = 0, { length } = memberRefs; i < length; i += 1) {
							const ref = memberRefs[i];
							fixes.push(fixer.replaceText(ref, ref.property.name));
						}
						return fixes;
					}
				});
				return;
			}
			if (!PREFER_DEFAULT.includes(specifier)) return;
			if (node.specifiers.some((s) => s.type === "ImportDefaultSpecifier")) return;
			const named = node.specifiers.filter((s) => s.type === "ImportSpecifier");
			if (named.length === 0) return;
			const exceptions = NAMED_EXCEPTIONS[specifier];
			/* c8 ignore start - exceptions map is empty; the ternary true arm and zero-length guard require a populated NAMED_EXCEPTIONS entry */
			const violatingNames = exceptions ? named.filter((s) => s.imported?.name && !exceptions.has(s.imported.name)) : named;
			if (violatingNames.length === 0) return;
			/* c8 ignore stop */
			const local = DEFAULT_LOCAL[specifier];
			const violatingNameList = violatingNames.map((s) => s.imported.name).join(", ");
			const programBody = sourceCode.ast.body;
			if (localBindingExists(programBody, local)) {
				context.report({
					node,
					messageId: "preferDefault",
					data: {
						names: `{ ${violatingNameList} }`,
						specifier,
						local,
						first: violatingNames[0].imported.name
					}
				});
				return;
			}
			const scopeForFix = context.getScope ? context.getScope() : void 0;
			if (!scopeForFix) {
				context.report({
					node,
					messageId: "preferDefault",
					data: {
						names: `{ ${violatingNameList} }`,
						specifier,
						local,
						first: violatingNames[0].imported.name
					}
				});
				return;
			}
			context.report({
				node,
				messageId: "preferDefault",
				data: {
					names: `{ ${violatingNameList} }`,
					specifier,
					local,
					first: violatingNames[0].imported.name
				},
				fix(fixer) {
					const fixes = [];
					/* c8 ignore start - keptNamed is always [] while NAMED_EXCEPTIONS is empty; the length>0 branch requires exceptions */
					const keptNamed = exceptions ? named.filter((s) => s.imported?.name && exceptions.has(s.imported.name)) : [];
					let newImport;
					if (keptNamed.length > 0) {
						const keptText = keptNamed.map((s) => sourceCode.getText(s)).join(", ");
						newImport = `import ${local}, { ${keptText} } from '${specifier}'`;
					} else
 /* c8 ignore stop */
					newImport = `import ${local} from '${specifier}'`;
					fixes.push(fixer.replaceText(node, newImport));
					const scope = scopeForFix;
					const targetNames = new Set(violatingNames.map((s) => s.local.name));
					/* c8 ignore start - scope is always truthy here; the !scopeForFix guard above returns early before this point */
					if (scope) {
						const visited = /* @__PURE__ */ new Set();
						function visitScope(s) {
							if (visited.has(s)) return;
							visited.add(s);
							for (const ref of s.references) {
								if (!targetNames.has(ref.identifier.name)) continue;
								if (ref.identifier.range[0] >= node.range[0] && ref.identifier.range[1] <= node.range[1]) continue;
								fixes.push(fixer.replaceText(ref.identifier, `${local}.${ref.identifier.name}`));
							}
							for (const child of s.childScopes) visitScope(child);
						}
						visitScope(scope);
					}
					/* c8 ignore stop */
					return fixes;
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-non-capturing-group/index.mts
const SOCKET_LINT_MARKER_RE$3 = /(?:#|\/\*|\/\/)\s*socket-lint:\s*allow(?:\s+(?<tag>[\w-]+))?/;
const CAPTURE_USAGE_RES = [
	/['"`][^'"`]*\$\d[^'"`]*['"`]/,
	/\b[A-Za-z_$][\w$]*\s*\??\.?\s*\[\s*[1-9][0-9]*\s*\]/,
	/\[\s*[\w$,\s]+\]\s*=\s*[^;]+\.(?:exec|match|matchAll)\b/,
	/\bRegExp\.\$\d\b/,
	/\b(?:m|match|res|result)\.groups\b/,
	/\.replace\([^)]*\$\d/,
	/\.replace\s*\([^)]*\/[^,]*,\s*(?:\(|function\s*\()[^)]*,\s*[\w$]/,
	/\bStringPrototypeReplace(?:All)?\s*\([^)]*,\s*[^,]*\/[^,]*,\s*(?:\(|function\s*\()[^)]*,\s*[\w$]/
];
function isLineMarkered$3(line) {
	const m = line.match(SOCKET_LINT_MARKER_RE$3);
	if (!m) return false;
	const tag = m.groups?.["tag"];
	return !tag || tag === "capture";
}
/**
* Walk a regex pattern and return every top-level _capturing_ group: bare
* `(...)` openings that aren't followed by `?:` / `?=` / `?!` / `?<`. Skips
* character classes and escaped parens.
*/
function findBareCaptureGroups(pattern) {
	const groups = [];
	const stack = [];
	let inClass = false;
	let i = 0;
	while (i < pattern.length) {
		const c = pattern[i];
		if (c === "\\") {
			i += 2;
			continue;
		}
		if (inClass) {
			if (c === "]") inClass = false;
			i++;
			continue;
		}
		if (c === "[") {
			inClass = true;
			i++;
			continue;
		}
		if (c === "(") {
			let capturing = true;
			if (pattern[i + 1] === "?") capturing = false;
			stack.push({
				start: i,
				capturing
			});
			i++;
			continue;
		}
		if (c === ")") {
			const open = stack.pop();
			if (open?.capturing) groups.push({
				start: open.start,
				end: i + 1,
				inner: pattern.slice(open.start + 1, i)
			});
			i++;
			continue;
		}
		i++;
	}
	return groups;
}
/**
* Heuristic: does the file's source contain any markers suggesting at least one
* regex in this file relies on its captures? When true, we DROP the autofix
* still report, so a wrong rewrite can't break unrelated code.
*/
function fileUsesCaptures(source) {
	for (let i = 0, { length } = CAPTURE_USAGE_RES; i < length; i += 1) if (CAPTURE_USAGE_RES[i].test(source)) return true;
	return false;
}
const rule$26 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Use `(?:...)` instead of `(...)` for regex groups whose capture value is not used. Per CLAUDE.md fleet regex rule.",
			category: "Best Practices",
			recommended: true
		},
		messages: { captureGroup: "Numbered capturing group `({{inner}})` is not referenced in THIS file. If its capture is unused, make it non-capturing `(?:{{inner}})`. If it IS used — including via `match[N]` / `$N` in another file — convert it to a NAMED capture `(?<name>{{inner}})` (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Named_capturing_group) so the intent is explicit and later edits do not renumber it. Or append `// socket-lint: allow capture` on this line if the capture is intentional." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		if (fileUsesCaptures(sourceCode.text ?? "")) return {};
		function checkLiteral(node) {
			if (!node.regex) return;
			if (isLineMarkered$3(sourceCode.lines[node.loc.start.line - 1] ?? "")) return;
			const pattern = node.regex.pattern;
			if (/\\[1-9]/.test(pattern)) return;
			const groups = findBareCaptureGroups(pattern);
			if (groups.length === 0) return;
			for (let i = 0, { length } = groups; i < length; i += 1) context.report({
				node,
				messageId: "captureGroup",
				data: { inner: groups[i].inner }
			});
		}
		return { Literal(node) {
			checkLiteral(node);
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-normalize-path/index.mts
/**
* @file Per CLAUDE.md "Cross-platform path matching" — when code matches
*   against a path string, normalize the path FIRST with `normalizePath` from
*   `@socketsecurity/lib/paths/normalize` and write the regex against `/` only,
*   rather than rewriting separators by hand with a `.replace(...)` /
*   `.replaceAll(...)` over a path-separator regex. A manual `p.replace(/\\/g,
*   '/')` (backslash → forward slash) or a dual-separator character class
*   (`[\\/]` / `[/\\]`) is the exact shape `normalizePath` exists to replace:
*   it gives one path representation across darwin / linux / win32, so a regex
*   written against `/` works everywhere. Flags a `CallExpression` whose callee
*   is a `.replace(` / `.replaceAll(` MemberExpression and whose FIRST argument
*   is a separator regex, a manual rewrite, OR a `.test(` / `.exec(` call
*   whose RECEIVER is a separator regex (a manual match — `/[/\\]/.test(p)` on
*   an un-normalized path). No autofix — the rewrite is contextual (the right
*   shape is `normalizePath(p)` at the input boundary, not a local
*   substitution), so the AI-fix tier handles it. Skips the two files where the
*   canonical separator rewrite legitimately lives: lib's own
*   `paths/normalize`, and the fleet's dep-0 counterpart
*   `scripts/fleet/_shared/unix-path.mts` — the leaf a bare-checkout module
*   the release-reconcile gap job, a hook script, calls when lib-stable is
*   unreachable. Pairs with the `path-regex-normalize-nudge` Stop hook + the
*   `socket/cross-platform-path-matching` doctrine.
*/
const SEPARATOR_REWRITE_PATTERNS = /* @__PURE__ */ new Set([
	"[/\\\\]",
	"[\\\\/]",
	"\\\\"
]);
const CANONICAL_REWRITE_HOME_RE = /\/(?:_shared\/unix-path|paths\/normalize)\.[mc]?[jt]s$/;
function isSeparatorRewriteRegex(node) {
	if (!node || node.type !== "Literal" || !node.regex) return false;
	const pattern = node.regex.pattern ?? "";
	return SEPARATOR_REWRITE_PATTERNS.has(pattern);
}
const rule$25 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Normalize a path with `normalizePath` from `@socketsecurity/lib/paths/normalize` instead of rewriting separators by hand with a `.replace(...)` over a path-separator regex, or matching one with `.test(...)` / `.exec(...)`.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: {
			preferNormalizePath: "Manual path-separator rewrite. Use `normalizePath` from `@socketsecurity/lib/paths/normalize` to get one `/`-separated representation across darwin / linux / win32, then match `/` only.",
			preferNormalizePathMatch: "Matching a path against a dual-separator regex. Normalize the path first with `normalizePath` from `@socketsecurity/lib/paths/normalize`, then match against `/` only — a `[/\\\\]` / `[\\\\/]` class means the path was never normalized."
		},
		schema: []
	},
	create(context) {
		const filename = (0, import_normalize.normalizePath)(context.filename ?? context.getFilename?.() ?? "");
		if (CANONICAL_REWRITE_HOME_RE.test(filename)) return {};
		return { CallExpression(node) {
			const callee = node.callee;
			if (callee?.type !== "MemberExpression") return;
			const method = callee.property?.name;
			if ((method === "replace" || method === "replaceAll") && isSeparatorRewriteRegex(node.arguments?.[0])) {
				context.report({
					node,
					messageId: "preferNormalizePath"
				});
				return;
			}
			if ((method === "exec" || method === "test") && isSeparatorRewriteRegex(callee.object)) context.report({
				node,
				messageId: "preferNormalizePathMatch"
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-optional-chain/index.mts
function outerMemberObject(node) {
	if (!node) return;
	if (node.type === "MemberExpression") return node.object;
	if (node.type === "CallExpression") {
		const callee = node.callee;
		if (callee && callee.type === "MemberExpression") return callee.object;
	}
}
function joinMember(node) {
	if (!node) return;
	if (node.type === "MemberExpression") return node;
	if (node.type === "CallExpression") {
		const callee = node.callee;
		if (callee && callee.type === "MemberExpression") return callee;
	}
}
const rule$24 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer optional chaining (`a?.b`) over the `a && a.b` guard-then-access pattern.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: { preferOptionalChain: "`{{guard}} && {{guard}}.…` repeats the operand to null-check it. Use optional chaining: `{{guard}}?.…`." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { LogicalExpression(node) {
			if (node.operator !== "&&") return;
			const { left, right } = node;
			const member = joinMember(right);
			const base = outerMemberObject(right);
			if (!member || !base || !left) return;
			if (member.optional) return;
			const guardText = sourceCode.getText(left);
			const baseText = sourceCode.getText(base);
			if (guardText !== baseText) return;
			context.report({
				node,
				messageId: "preferOptionalChain",
				data: { guard: guardText },
				fix(fixer) {
					const rightText = sourceCode.getText(right);
					const insertAt = baseText.length;
					const after = rightText.slice(insertAt);
					const tail = after.startsWith(".") ? `?.${after.slice(1)}` : `?.${after}`;
					return fixer.replaceText(node, `${baseText}${tail}`);
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-pure-call-form/index.mts
const PURE_MAGIC_RE = /^\s*@(?:__NO_SIDE_EFFECTS__|__PURE__)\s*$/;
function isMagicCommentText(raw) {
	if (!raw) return false;
	return PURE_MAGIC_RE.test(raw);
}
function commentRange(c) {
	const r = c.range;
	if (!Array.isArray(r) || r.length !== 2) return;
	return [r[0], r[1]];
}
const rule$23 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "`/*@__PURE__*/` / `/*@__NO_SIDE_EFFECTS__*/` magic comments only affect the bundler when they sit directly before a CallExpression or NewExpression. Detached comments silently regress tree-shaking.",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: { detachedPureComment: "`{{kind}}` magic comment is not attached to a CallExpression / NewExpression — the bundler ignores it and the value stays live in the output. Move the comment to immediately before the call, e.g. `const x = {{kind}} foo()`; if the call is buried in a member or parenthesized expression, introduce an intermediate `const tmp = {{kind}} foo()` so the comment can land adjacent." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { Program() {
			const comments = sourceCode.getAllComments && sourceCode.getAllComments() || [];
			const text = sourceCode.getText();
			for (let i = 0, { length } = comments; i < length; i += 1) {
				const c = comments[i];
				if (!c || c.type !== "Block") continue;
				if (!isMagicCommentText(c.value)) continue;
				const cRange = commentRange(c);
				if (!cRange) continue;
				const stripped = text.slice(cRange[1]).replace(/^\s+/, "");
				if (/^(?:new\s+)?[A-Za-z_$][\w$]*(?:(?:\.|\?\.)[A-Za-z_$][\w$]*)*(?:<[^<>]*>)?(?:\(|\?\.\()/.test(stripped)) continue;
				/* c8 ignore next */
				const ct = c.value || "";
				const kind = /__NO_SIDE_EFFECTS__/.test(ct) ? "/*@__NO_SIDE_EFFECTS__*/" : "/*@__PURE__*/";
				context.report({
					node: c,
					messageId: "detachedPureComment",
					data: { kind }
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-repo-root-dot-cache/index.mts
const NODE_MODULES_CACHE_RE = /(?:^|\/)node_modules\/\.cache(?:\/|$)/;
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$22 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer the repo-root tool-cache store over one nested inside `node_modules`, for per-repo tool caches and runtime state.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: {
			pathLiteral: "Cache path `{{value}}` nests the store inside `node_modules`, which a `clean` or a `rm -rf node_modules` destroys while hooks are still writing to it. Put per-repo state in the repo-root store instead — import `FLEET_CACHE_DIR` / `REPO_CACHE_DIR` from the package `paths.mts`, which resolve under `TOOL_CACHE_DIR`.",
			pathJoin: "`path.join(..., 'node_modules', '.cache', ...)` puts the store inside the dependency tree, where a `clean` sweeps it. Import `FLEET_CACHE_DIR` / `REPO_CACHE_DIR` from the package `paths.mts` instead."
		},
		schema: []
	},
	create(context) {
		/**
		* True for a Literal / TemplateElement whose string value names a path
		* under `node_modules/.cache`.
		*/
		function isNodeModulesCacheString(node) {
			if (node.type !== "Literal" && node.type !== "TemplateElement") return false;
			const raw = node.type === "TemplateElement" ? node.value?.cooked ?? "" : typeof node.value === "string" ? node.value : "";
			if (!raw) return false;
			return NODE_MODULES_CACHE_RE.test((0, import_normalize.normalizePath)(raw));
		}
		/**
		* Detect `path.join(...args)` where a `'node_modules'` arg is directly
		* followed by a `'.cache'` arg — the split-literal form of the same path.
		*/
		function checkPathJoin(node) {
			if (node.type !== "CallExpression") return;
			const callee = node.callee;
			if (callee.type !== "MemberExpression" || callee.computed || callee.property.type !== "Identifier" || callee.property.name !== "join") return;
			const args = node.arguments;
			for (let i = 1; i < args.length; i += 1) {
				const prev = args[i - 1];
				const cur = args[i];
				if (prev.type === "Literal" && prev.value === "node_modules" && cur.type === "Literal" && cur.value === ".cache") {
					context.report({
						node: cur,
						messageId: "pathJoin"
					});
					return;
				}
			}
		}
		/**
		* Visit Literal / TemplateElement nodes and flag node_modules caches.
		*/
		function checkLiteral(node) {
			if (!isNodeModulesCacheString(node)) return;
			const value = node.type === "TemplateElement" ? node.value?.cooked : node.value;
			context.report({
				node,
				messageId: "pathLiteral",
				data: { value: String(value) }
			});
		}
		return {
			Literal: checkLiteral,
			TemplateElement: checkLiteral,
			CallExpression: checkPathJoin
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-safe-delete/index.mts
const DELETE_METHODS = /* @__PURE__ */ new Set([
	"rm",
	"rmdir",
	"rmdirSync",
	"rmSync",
	"unlink",
	"unlinkSync"
]);
const SYNC_METHODS = /* @__PURE__ */ new Set([
	"rmdirSync",
	"rmSync",
	"unlinkSync"
]);
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$21 = {
	meta: {
		type: "problem",
		docs: {
			description: "Route every delete through safeDelete / safeDeleteSync from @socketsecurity/lib-stable/fs/safe.",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: { banned: "`{{method}}()` — use safeDelete / safeDeleteSync from @socketsecurity/lib-stable/fs/safe (bare `rmSync`/`unlinkSync` imported from node:fs counts too). The lib wrapper handles ENOENT, retries on EBUSY, and integrates with the rest of the fleet. In unit tests prefer an `os.tmpdir()` mkdtemp dir + `safeDeleteSync(dir)` over deleting individual files." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const fsDeleteLocals = /* @__PURE__ */ new Map();
		const FS_SOURCES = /* @__PURE__ */ new Set([
			"fs",
			"fs/promises",
			"node:fs",
			"node:fs/promises"
		]);
		const body = sourceCode.ast?.body;
		if (Array.isArray(body)) for (let i = 0, { length } = body; i < length; i += 1) {
			const stmt = body[i];
			if (stmt.type !== "ImportDeclaration" || typeof stmt.source?.value !== "string" || !FS_SOURCES.has(stmt.source.value) || !Array.isArray(stmt.specifiers)) continue;
			for (let j = 0, slen = stmt.specifiers.length; j < slen; j += 1) {
				const spec = stmt.specifiers[j];
				if (spec.type === "ImportSpecifier" && spec.imported?.type === "Identifier" && DELETE_METHODS.has(spec.imported.name) && spec.local?.type === "Identifier") fsDeleteLocals.set(spec.local.name, spec.imported.name);
			}
		}
		const summaryCache = /* @__PURE__ */ new Map();
		function ensureSummary(importName) {
			let s = summaryCache.get(importName);
			if (s) return s;
			s = summarizeImportTarget(sourceCode.ast, importName);
			summaryCache.set(importName, s);
			return s;
		}
		/**
		* The autofix only fires when the call shape is unambiguous: fs.rm(path)
		* fs.rm(path, { ...opts }) fs.rmSync(path) fs.rmSync(path, { ...opts })
		*
		* Bail on: - 0 args (malformed; skip) - 3+ args (callback-style fs.rm —
		* semantics differ) - 2nd arg is a function expression (callback-style) -
		* any spread argument (...args; can't reason about arity)
		*/
		function isFixable(node) {
			const args = node.arguments;
			if (args.length === 0 || args.length > 2) return false;
			for (let i = 0, { length } = args; i < length; i += 1) if (args[i].type === "SpreadElement") return false;
			if (args.length === 2) {
				const second = args[1];
				if (second.type === "ArrowFunctionExpression" || second.type === "FunctionExpression") return false;
			}
			return true;
		}
		function detectFsDeleteMethod(callee) {
			if (callee.type === "MemberExpression") {
				if (callee.property.type !== "Identifier" || !DELETE_METHODS.has(callee.property.name)) return;
				const obj = callee.object;
				const objName = obj.type === "Identifier" ? obj.name : obj.type === "MemberExpression" && obj.property.type === "Identifier" ? obj.property.name : void 0;
				if (!objName || !/^(fs|fsPromises|fsp|promises)$/.test(objName)) return;
				return callee.property.name;
			}
			if (callee.type === "Identifier") return fsDeleteLocals.get(callee.name);
		}
		return { CallExpression(node) {
			const method = detectFsDeleteMethod(node.callee);
			if (!method) return;
			const replacement = SYNC_METHODS.has(method) ? "safeDeleteSync" : "safeDelete";
			if (!isFixable(node)) {
				context.report({
					node,
					messageId: "banned",
					data: { method }
				});
				return;
			}
			const s = ensureSummary(replacement);
			const pathArg = node.arguments[0];
			const pathText = sourceCode.getText(pathArg);
			context.report({
				node,
				messageId: "banned",
				data: { method },
				fix(fixer) {
					return [fixer.replaceText(node, `${replacement}(${pathText})`), ...appendImportFixes(s, fixer, `import { ${replacement} } from '@socketsecurity/lib-stable/fs/safe'`, void 0)];
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-separate-type-import/index.mts
const rule$20 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer a separate `import type { X }` over inline `import { type X, Y }`.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: { preferSeparateTypeImport: "Inline `type` specifier on `{{name}}` — move type-only specifiers into a separate `import type { ... } from \"{{source}}\"` statement." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		return { ImportDeclaration(node) {
			if (node.importKind === "type") return;
			if (!node.specifiers || node.specifiers.length === 0) return;
			const typeSpecifiers = [];
			const valueSpecifiers = [];
			let defaultSpec;
			let namespaceSpec;
			for (const spec of node.specifiers) {
				if (spec.type === "ImportDefaultSpecifier") {
					defaultSpec = spec;
					continue;
				}
				if (spec.type === "ImportNamespaceSpecifier") {
					namespaceSpec = spec;
					continue;
				}
				if (spec.type === "ImportSpecifier") if (spec.importKind === "type") typeSpecifiers.push(spec);
				else valueSpecifiers.push(spec);
			}
			if (typeSpecifiers.length === 0) return;
			const source = node.source.value;
			const indent = (() => {
				const text = sourceCode.text;
				const lineStart = text.lastIndexOf("\n", node.range[0] - 1) + 1;
				return text.slice(lineStart, node.range[0]);
			})();
			const typeNames = typeSpecifiers.map((s) => specifierText(sourceCode, s, { stripType: true })).join(", ");
			let fixerAttached = false;
			for (let i = 0, { length } = typeSpecifiers; i < length; i += 1) {
				const spec = typeSpecifiers[i];
				const report = {
					node: spec,
					messageId: "preferSeparateTypeImport",
					data: {
						name: spec.imported?.name ? spec.imported.name : "<unknown>",
						source: String(source)
					}
				};
				if (!fixerAttached) {
					report.fix = function(fixer) {
						if (valueSpecifiers.length === 0 && !defaultSpec && !namespaceSpec) {
							const rewritten = sourceCode.getText(node).replace(/^import\s+/, "import type ").replace(/\btype\s+/g, "");
							return fixer.replaceText(node, rewritten);
						}
						const remainingParts = [];
						if (defaultSpec) remainingParts.push(sourceCode.getText(defaultSpec));
						if (namespaceSpec) remainingParts.push(sourceCode.getText(namespaceSpec));
						if (valueSpecifiers.length > 0) {
							const valueText = valueSpecifiers.map((s) => specifierText(sourceCode, s, { stripType: false })).join(", ");
							remainingParts.push(`{ ${valueText} }`);
						}
						const quote = sourceCode.text[node.source.range[0]];
						const rewrittenOriginal = `import ${remainingParts.join(", ")} from ${quote}${source}${quote}`;
						const newLine = `${indent}import type { ${typeNames} } from ${quote}${source}${quote}`;
						return fixer.replaceText(node, `${rewrittenOriginal}\n${newLine}`);
					};
					fixerAttached = true;
				}
				context.report(report);
			}
		} };
	}
};
/**
* Render an `ImportSpecifier` for the rewritten statement. When `stripType` is
* true the `type` keyword is omitted (the specifier is being moved into a
* statement-level `import type` block, where per-specifier `type` would be
* redundant).
*/
function specifierText(sourceCode, spec, { stripType }) {
	const imported = spec.imported;
	const local = spec.local;
	const importedName = imported.type === "Identifier" ? imported.name : `"${imported.value}"`;
	const localName = local.name;
	const body = importedName !== localName ? `${importedName} as ${localName}` : importedName;
	/* c8 ignore start - specifiers passed with stripType=false are always value specifiers (importKind='value'), making this branch unreachable */
	if (!stripType && spec.importKind === "type") return `type ${body}`;
	/* c8 ignore stop */
	return body;
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-shell-win32/index.mts
const BYPASS_RE$6 = /prefer-shell-win32:\s*intentional/;
const rule$19 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer `shell: WIN32` (Windows-only shell wrap) over `shell: true` (wraps on every platform).",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: { shellTrue: "Use `shell: WIN32` (imported from `constants/platform` in src or `test/fleet/_shared/lib/platform` in tests). `shell: true` wraps the child in `/bin/sh` on Unix too, which is rarely intended — the fleet idiom is \"wrap in cmd.exe on Windows so .cmd/.bat resolves, no shell wrap on Unix\". If a cross-platform shell wrap really is intended, add `// prefer-shell-win32: intentional` with a reason." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		function hasBypassComment(node) {
			const before = sourceCode.getCommentsBefore(node);
			const after = sourceCode.getCommentsAfter(node);
			for (const c of [...before, ...after]) if (BYPASS_RE$6.test(c.value)) return true;
			return false;
		}
		function findEnclosingStatement(node) {
			let cur = node.parent;
			while (cur) {
				if (cur.type === "ExpressionStatement" || cur.type === "ReturnStatement" || cur.type === "ThrowStatement" || cur.type === "VariableDeclaration") return cur;
				cur = cur.parent;
			}
		}
		return { Property(node) {
			const { key, value } = node;
			/* c8 ignore start - Property nodes always have key + value in valid JS ASTs */
			if (!key || !value) return;
			if ((key.type === "Identifier" ? key.name : key.type === "Literal" && typeof key.value === "string" ? key.value : void 0) !== "shell") return;
			if (value.type !== "Literal" || value.value !== true) return;
			if (hasBypassComment(node) || hasBypassComment(value)) return;
			const stmt = findEnclosingStatement(node);
			if (stmt && hasBypassComment(stmt)) return;
			context.report({
				node: value,
				messageId: "shellTrue"
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-spawn-over-execsync/index.mts
const CHILD_PROCESS_SPECIFIERS = /* @__PURE__ */ new Set(["child_process", "node:child_process"]);
const BANNED_NAMES = /* @__PURE__ */ new Set(["execFileSync", "execSync"]);
const BYPASS_RE$5 = /prefer-spawn-over-execsync:\s*required/;
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$18 = {
	meta: {
		type: "problem",
		docs: {
			description: "Use `spawn` from @socketsecurity/lib-stable/process/spawn/child instead of `execSync` / `execFileSync` from node:child_process.",
			category: "Best Practices",
			recommended: true
		},
		fixable: void 0,
		messages: {
			importBanned: "Importing `{{name}}` from {{specifier}} — use `spawn` (or `spawnSync` for top-level-sync) from @socketsecurity/lib-stable/process/spawn/child. `execSync` runs through a shell (command-injection surface); array-arg `spawn` does not. The lib also ships a typed SpawnError shape — `execSync` errors are plain Errors with no structured fields.",
			callBanned: "Calling `{{obj}}.{{name}}(...)` — use `spawn` from @socketsecurity/lib-stable/process/spawn/child instead. Avoids shell-interpolation injection paths; ships consistent SpawnError shape."
		},
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$5);
		return {
			ImportDeclaration(node) {
				const specifier = node.source.value;
				if (!CHILD_PROCESS_SPECIFIERS.has(specifier)) return;
				if (hasBypassComment(node)) return;
				const banned = node.specifiers.filter((s) => s.type === "ImportSpecifier" && s.imported && BANNED_NAMES.has(s.imported.name));
				if (banned.length === 0) return;
				for (let i = 0, { length } = banned; i < length; i += 1) {
					const spec = banned[i];
					context.report({
						node: spec,
						messageId: "importBanned",
						data: {
							name: spec.imported.name,
							specifier: `'${specifier}'`
						}
					});
				}
			},
			CallExpression(node) {
				const callee = node.callee;
				if (callee.type !== "MemberExpression") return;
				if (callee.property.type !== "Identifier") return;
				if (!BANNED_NAMES.has(callee.property.name)) return;
				const obj = callee.object;
				const objName = obj.type === "Identifier" ? obj.name : obj.type === "MemberExpression" && obj.property.type === "Identifier" ? obj.property.name : void 0;
				if (!objName) return;
				if (!/^(?:childProcess|child_process|cp)$/.test(objName)) return;
				if (hasBypassComment(node)) return;
				context.report({
					node,
					messageId: "callBanned",
					data: {
						obj: objName,
						name: callee.property.name
					}
				});
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-stable-self-import/index.mts
/**
* @file In `scripts/` and `.claude/hooks/`, forbid importing the fleet package
*   that the current repo OWNS by its bare name — require the `-stable` alias
*   instead. Why: a fleet repo that publishes `@socketsecurity/<X>` resolves
*   the bare `@socketsecurity/<X>` specifier to its own local `src/` (workspace
*   link), which is work-in-progress and may be mid-edit / broken. Build
*   scripts and git-hooks must run against a KNOWN-GOOD published copy, so the
*   fleet pins a `@socketsecurity/<X>-stable` catalog alias
*   (`npm:@socketsecurity/<X>@<last published>`). Tooling imports the `-stable`
*   alias; only the package's own source consumers use the bare name. Concrete
*   failure this prevents: socket-lib's git-hooks imported
*   `@socketsecurity/lib/logger/default` (bare). In socket-lib that resolves to
*   local `src/`, so during a version straddle the subpath didn't exist yet and
*   every commit threw `ERR_PACKAGE_PATH_NOT_EXPORTED`. The `-stable` alias
*   would have resolved to the published package that has the subpath. Scope:
*   files under `**∕scripts/**` or `**∕.claude/hooks/**`. The owned package
*   name is read from the nearest ancestor `package.json` `name` field (walk-up
*   from the linted file). Only flags imports of THAT exact package — e.g. in
*   socket-lib, `@socketsecurity/lib/...` is flagged but
*   `@socketsecurity/registry/...` is not, socket-lib doesn't own registry.
*   Autofix: rewrite the specifier's package segment from `@scope/name` to
*   `@scope/name-stable`, preserving the subpath:
*   `@socketsecurity/lib/logger/default` →
*   `@socketsecurity/lib-stable/logger/default`. ALSO flags a relative import
*   that reaches into the repo's own `src/` tree (e.g.
*   `../../src/packages/read.ts`) from scripts/ + hooks/ — same
*   unpublished-vs-published hazard, just spelled as a relative path instead of
*   the bare package name. 2026-06-04: a post-build script imported
*   `../../src/packages/read.ts` during the 6.0.7 straddle; the bundler choked
*   on the source's extensionless imports. No autofix for the relative form
*   (the src→stable subpath mapping isn't mechanical); the message points at
*   the `-stable` equivalent. Per
*   https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
*   — give scripted/AI-driven tooling a deterministic, published dependency
*   surface rather than a moving local-src target, so generated edits build
*   against a stable contract.
*/
/**
* Walk up from `startDir` to find the nearest `package.json` and return its
* `name` field, or undefined if none is found / it has no name.
*/
function findOwnedPackageName(startDir) {
	let dir = startDir;
	while (dir && dir !== path.dirname(dir)) {
		const pkgPath = path.join(dir, "package.json");
		if (existsSync(pkgPath)) try {
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
			if (typeof pkg.name === "string" && pkg.name) return pkg.name;
		} catch {}
		dir = path.dirname(dir);
	}
}
const rule$17 = {
	meta: {
		type: "problem",
		docs: {
			description: "In scripts/ + .claude/hooks/, import the repo-owned fleet package via its `-stable` alias, not the bare name (the bare name resolves to local src).",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: {
			preferStable: "`{{specifier}}` imports the repo-owned package `{{owned}}` by its bare name. In scripts/ + .claude/hooks/ use the `{{owned}}-stable` alias — the bare name resolves to local `src/` (WIP), but tooling must run against the published snapshot. Fix: `{{fixed}}`.",
			noRelativeSrc: "`{{specifier}}` reaches into the repo's `src/` tree from scripts/ + .claude/hooks/. Tooling must run against the PUBLISHED `-stable` surface, never WIP src/ (a relative src/ import breaks during a version straddle when the file is mid-edit or its subpath is unpublished — ERR_PACKAGE_PATH_NOT_EXPORTED / ERR_MODULE_NOT_FOUND). Import the equivalent helper from `@socketsecurity/<owned>-stable/<subpath>` instead."
		},
		schema: []
	},
	create(context) {
		const normalizedFilename = (0, import_normalize.normalizePath)(context.filename ?? context.getFilename?.() ?? "");
		if (!/\/(?:\.claude\/hooks|scripts)\//.test(normalizedFilename) || /\/test\//.test(normalizedFilename) || /\.test\.(?:[mc]?[jt]s)$/.test(normalizedFilename)) return {};
		const owned = findOwnedPackageName(path.dirname(normalizedFilename));
		if (!owned || owned.endsWith("-stable")) return {};
		const ownedPrefix = `${owned}/`;
		const checkSpecifier = (node, raw) => {
			if (/^(?:\.\.\/)+src\//.test(raw)) {
				context.report({
					node,
					messageId: "noRelativeSrc",
					data: { specifier: raw }
				});
				return;
			}
			if (raw !== owned && !raw.startsWith(ownedPrefix)) return;
			const subpath = raw === owned ? "" : raw.slice(owned.length);
			const fixed = `${owned}-stable${subpath}`;
			context.report({
				node,
				messageId: "preferStable",
				data: {
					specifier: raw,
					owned,
					fixed
				},
				fix(fixer) {
					const quote = node.source.raw?.[0] ?? "'";
					return fixer.replaceText(node.source, `${quote}${fixed}${quote}`);
				}
			});
		};
		return {
			ImportDeclaration(node) {
				if (node.source?.type === "Literal") checkSpecifier(node, String(node.source.value));
			},
			ExportNamedDeclaration(node) {
				if (node.source?.type === "Literal") checkSpecifier(node, String(node.source.value));
			},
			ExportAllDeclaration(node) {
				if (node.source?.type === "Literal") checkSpecifier(node, String(node.source.value));
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-static-type-import/index.mts
const rule$16 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer a static `import type { X } from \"mod\"` over inline `import(\"mod\").X` type expressions.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: void 0,
		messages: {
			preferStaticTypeImport: "Inline `import(\"{{source}}\").{{name}}` type expression — replace with a static `import type {{names}} from \"{{source}}\"` at the top of the file.",
			preferStaticTypeImportNoQualifier: "Inline `import(\"{{source}}\")` namespace type — replace with a static `import type * as <Name> from \"{{source}}\"` at the top of the file."
		},
		schema: []
	},
	create(context) {
		return { TSImportType(node) {
			const parent = node.parent;
			if (parent && parent.type === "TSTypeQuery") return;
			const argument = node.argument;
			const sourceNode = node.source;
			const source = sourceNode && typeof sourceNode.value === "string" ? sourceNode.value : argument && argument.type === "TSLiteralType" && argument.literal ? argument.literal.value : argument && typeof argument.value === "string" ? argument.value : void 0;
			if (typeof source !== "string") return;
			const qualifier = node.qualifier;
			if (!qualifier) {
				context.report({
					node,
					messageId: "preferStaticTypeImportNoQualifier",
					data: { source }
				});
				return;
			}
			let name;
			if (qualifier.type === "Identifier" && typeof qualifier.name === "string") name = qualifier.name;
			else {
				let leftmost = qualifier;
				while (leftmost.left) leftmost = leftmost.left;
				name = leftmost.type === "Identifier" && typeof leftmost.name === "string" ? leftmost.name : void 0;
			}
			if (!name) return;
			context.report({
				node,
				messageId: "preferStaticTypeImport",
				data: {
					source,
					name,
					names: `{ ${name} }`
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-typebox-schema/index.mts
/**
* @file Per CLAUDE.md "Code style": 🚨 `@sinclair/typebox` over zod / valibot /
*   ajv. The fleet standardizes on TypeBox for runtime schema validation — one
*   schema lib across the fleet keeps validators consistent and avoids dragging
*   in a second validation runtime. Flags an `import … from 'zod' | 'valibot' |
*   'ajv'` (and their subpaths, e.g. `ajv/dist/...`, `zod/lib/...`). Reporting
*   only — no autofix, because the schema-building APIs differ (`z.object({…})`
*   vs `Type.Object({…})`), so a mechanical import swap would leave broken call
*   sites. Bypass: a `socket-lint: allow schema-lib` comment on the import
*   (rare — e.g. a test fixture that must reproduce a zod-specific bug).
*/
const BYPASS_RE$4 = /socket-lint:\s*allow\s+schema-lib/;
const BANNED_PKGS = [
	"zod",
	"valibot",
	"ajv",
	"joi",
	"@hapi/joi",
	"yup"
];
function bannedSpecifier(source) {
	for (let i = 0, { length } = BANNED_PKGS; i < length; i += 1) {
		const pkg = BANNED_PKGS[i];
		if (source === pkg || source.startsWith(`${pkg}/`)) return pkg;
	}
}
const rule$15 = {
	meta: {
		type: "problem",
		docs: {
			description: "Use @sinclair/typebox for runtime schema validation instead of zod / valibot / ajv / joi / yup. Per CLAUDE.md \"Code style\".",
			category: "Best Practices",
			recommended: true
		},
		messages: { banned: "`{{pkg}}` — the fleet standardizes on @sinclair/typebox for runtime schema validation (Type.Object({…})). A second validation runtime fragments the fleet; port the schema to TypeBox. Bypass: add a `socket-lint: allow schema-lib` comment if this import is genuinely required." },
		schema: []
	},
	create(context) {
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$4);
		return { ImportDeclaration(node) {
			const source = node.source?.value;
			if (typeof source !== "string") return;
			const pkg = bannedSpecifier(source);
			if (!pkg) return;
			if (hasBypassComment(node)) return;
			context.report({
				node,
				messageId: "banned",
				data: { pkg }
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-undefined-over-null/index.mts
const rule$14 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Prefer `undefined` over `null` (CLAUDE.md style — `null` is allowed only for __proto__:null or external API requirements).",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: void 0,
		hasSuggestions: true,
		messages: {
			preferUndefined: "Use `undefined` instead of `null` (allowed exceptions: `__proto__: null`, `Object.create(null)`, external API requirements like JSON.stringify replacer / third-party callbacks).",
			preferUndefinedNoFix: "Use `undefined` instead of `null`. Surrounding type annotation mentions `null` — both the annotation (`| null` → `| undefined`) and the value need to flip together. Handed off to the AI-fix step (Step 4 of `pnpm run fix`) to trace the refactor through the function signatures / interfaces / return types involved."
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		/**
		* Walk up through TS type-cast wrappers (`x as T`, `x as const`, `<T>x`) so
		* that `null as never` inside `{ __proto__: null as never }` still matches
		* the proto-null exception. Without this, the autofix rewrites `null as
		* never` → `undefined as never`, which silently breaks the null-prototype
		* object semantics — `Object.create(null)` vs `Object.create(undefined)`
		* are very different.
		*/
		function unwrapTsCast(node) {
			let cur = node.parent;
			while (cur && (cur.type === "TSAsExpression" || cur.type === "TSTypeAssertion")) cur = cur.parent;
			return cur;
		}
		function isProtoNull(node) {
			const parent = unwrapTsCast(node);
			if (!parent || parent.type !== "Property") return false;
			const key = parent.key;
			/* c8 ignore start - Property always has a key in ECMAScript AST; defensive guard */
			if (!key) return false;
			/* c8 ignore stop */
			if (key.type === "Identifier" && key.name === "__proto__") return true;
			if (key.type === "Literal" && key.value === "__proto__") return true;
			return false;
		}
		function isComparisonOperand(node) {
			const parent = node.parent;
			if (!parent) return false;
			if (parent.type === "SwitchCase" && parent.test === node) return true;
			if (parent.type !== "BinaryExpression") return false;
			return [
				"===",
				"!==",
				"==",
				"!="
			].includes(parent.operator);
		}
		/**
		* `expect(x).toBe(null)` / `.toEqual(null)` / `.toStrictEqual(null)` /
		* `.toMatchObject(null)` — vitest/jest assertion matchers where the `null`
		* is the SEMANTIC value being asserted. Rewriting to `undefined` flips the
		* test contract (a passing test that asserted "x is null" now asserts "x is
		* undefined").
		*
		* Also covers chai (`.equal(null)` / `.equals(null)` / `.is(null)` /
		* `.same(null)`) and node:assert (`assert.equal(_, null)` / `.deepEqual(_,
		* null)` / `.deepStrictEqual(_, null)` / `.strictEqual(_, null)`).
		*
		* The detection is shape-based, not name-import-based — any call that ends
		* in `.<assert-method>(null, ...)` qualifies. False positives (a non-test
		* method named `toBe`) are extremely rare; the cost is missing a real
		* autofix opportunity, which is a safe outcome.
		*/
		const ASSERT_METHODS = /* @__PURE__ */ new Set([
			"deepEqual",
			"deepStrictEqual",
			"equal",
			"equals",
			"is",
			"notDeepEqual",
			"notDeepStrictEqual",
			"notEqual",
			"notStrictEqual",
			"same",
			"strictEqual",
			"toBe",
			"toEqual",
			"toMatchObject",
			"toStrictEqual"
		]);
		function isAssertionLibraryArg(node) {
			let cur = unwrapTsCast(node);
			while (cur && (cur.type === "ArrayExpression" || cur.type === "ObjectExpression" || cur.type === "Property" || cur.type === "SpreadElement")) cur = unwrapTsCast(cur);
			if (!cur || cur.type !== "CallExpression") return false;
			const callee = cur.callee;
			if (callee.type !== "MemberExpression" || callee.property.type !== "Identifier") return false;
			return ASSERT_METHODS.has(callee.property.name);
		}
		/**
		* `const x: Foo | null = null` / `let y: Foo | null | undefined = null` —
		* the developer explicitly opted into null in the variable's type
		* signature. The dedicated annotation IS the contract; flipping the value
		* alone leaves the contract intact but produces dead `undefined` writes
		* against a `| null` slot.
		*
		* Faster than the generic `hasNullTypeAnnotation` walk-up because it
		* short-circuits at the immediate VariableDeclarator parent. Both
		* predicates are kept — this fast-path covers the canonical declarator
		* shape; the walk-up handles the broader Property / Parameter / return-type
		* / TS-cast cases that declarator-only detection misses.
		*
		* Textual scan over `<id>: <annot> = ` rather than AST navigation: the
		* typeAnnotation field shape varies between oxlint AST and
		* babel/typescript-eslint AST, so the regex is the most resilient detector
		* across plugin host versions.
		*/
		function isNullableTypeInitializer(node) {
			const parent = node.parent;
			if (!parent || parent.type !== "VariableDeclarator") return false;
			if (parent.init !== node) return false;
			const declStart = parent.range ? parent.range[0] : parent.start ?? parent.id?.range?.[0];
			const litStart = node.range ? node.range[0] : node.start;
			if (typeof declStart !== "number" || typeof litStart !== "number") return false;
			const text = (context.getSourceCode ? context.getSourceCode() : context.sourceCode).getText().slice(declStart, litStart);
			return /:[^=]*\bnull\b[^=]*=/.test(text);
		}
		function isJsonStringifyReplacer(node) {
			const parent = unwrapTsCast(node);
			if (!parent || parent.type !== "CallExpression" || parent.arguments[1] !== node) return false;
			const callee = parent.callee;
			if (callee.type === "Identifier" && callee.name === "JSONStringify") return true;
			if (callee.type !== "MemberExpression") return false;
			return callee.object.type === "Identifier" && callee.object.name === "JSON" && callee.property.type === "Identifier" && callee.property.name === "stringify";
		}
		/**
		* Prototype-aware callsites where `null` is the explicit "no prototype"
		* sentinel. Replacing any of these with `undefined` either throws TypeError
		* or silently changes semantics:
		*
		* - `Object.create(null)` — first arg, throws if undefined.
		* - `Object.setPrototypeOf(o, null)` — second arg, semantics differ undefined
		*   is rejected by the spec.
		* - `Reflect.setPrototypeOf(o, null)` — same as above.
		*
		* Each entry is `[object, method, argIndex]` where argIndex is the
		* 0-indexed slot whose `null` is allowed.
		*/
		const PROTOTYPE_NULL_CALLSITES = [
			[
				"Object",
				"create",
				0
			],
			[
				"Object",
				"setPrototypeOf",
				1
			],
			[
				"Reflect",
				"setPrototypeOf",
				1
			]
		];
		function isPrototypeAwareNull(node) {
			const parent = unwrapTsCast(node);
			if (!parent || parent.type !== "CallExpression") return false;
			const callee = parent.callee;
			if (callee.type !== "MemberExpression") return false;
			if (callee.object.type !== "Identifier" || callee.property.type !== "Identifier") return false;
			const objectName = callee.object.name;
			const methodName = callee.property.name;
			for (const [obj, method, argIndex] of PROTOTYPE_NULL_CALLSITES) {
				/* c8 ignore start - PROTOTYPE_NULL_CALLSITES always provides 3-tuples; argIndex is never undefined */
				if (argIndex === void 0) continue;
				/* c8 ignore stop */
				if (obj === objectName && method === methodName && parent.arguments[argIndex] === node) return true;
			}
			return false;
		}
		/**
		* Walk up the AST and return true if any ancestor carries a TS type
		* annotation that mentions `null`. Used to skip autofix on cases like `let
		* x: string | null = null` where flipping just the value creates a type
		* error. Walks until a function / block / program boundary so we don't pick
		* up unrelated type annotations elsewhere in the file.
		*
		* Cheap shortcut: stringify the typeAnnotation subtree and look for a
		* 'null' token. Avoids a full type-system traversal.
		*/
		function hasNullTypeAnnotation(node) {
			const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
			let cur = node.parent;
			while (cur) {
				if (cur.type === "ArrowFunctionExpression" || cur.type === "BlockStatement" || cur.type === "FunctionDeclaration" || cur.type === "FunctionExpression" || cur.type === "Program") {
					if (cur.returnType) {
						const text = sourceCode.getText(cur.returnType);
						if (/\bnull\b/.test(text)) return true;
					}
					return false;
				}
				if (cur.type === "VariableDeclarator" && cur.id && cur.id.typeAnnotation) {
					const text = sourceCode.getText(cur.id.typeAnnotation);
					if (/\bnull\b/.test(text)) return true;
				}
				if (cur.type === "Property" && cur.typeAnnotation) {
					const text = sourceCode.getText(cur.typeAnnotation);
					if (/\bnull\b/.test(text)) return true;
				}
				if (cur.type === "AssignmentPattern" && cur.left && cur.left.typeAnnotation) {
					const text = sourceCode.getText(cur.left.typeAnnotation);
					if (/\bnull\b/.test(text)) return true;
				}
				if ((cur.type === "TSAsExpression" || cur.type === "TSTypeAssertion") && cur.typeAnnotation) {
					const text = sourceCode.getText(cur.typeAnnotation);
					if (/\bnull\b/.test(text)) return true;
				}
				cur = cur.parent;
			}
			return false;
		}
		return { Literal(node) {
			if (node.value !== null || node.raw !== "null") return;
			if (isProtoNull(node)) return;
			if (isComparisonOperand(node)) return;
			if (isPrototypeAwareNull(node)) return;
			if (isJsonStringifyReplacer(node)) return;
			if (isAssertionLibraryArg(node)) return;
			if (isNullableTypeInitializer(node)) return;
			if (hasNullTypeAnnotation(node)) {
				context.report({
					node,
					messageId: "preferUndefinedNoFix"
				});
				return;
			}
			context.report({
				node,
				messageId: "preferUndefined",
				suggest: [{
					messageId: "preferUndefined",
					fix(fixer) {
						return fixer.replaceText(node, "undefined");
					}
				}]
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/prefer-windows-test-helpers/index.mts
const HELPER_DIR_PATH = "test/fleet/_shared/lib";
const TEST_FILE_RE = /\.(?:spec|test)\.[cm]?[jt]sx?$/;
const SMALL_SLEEP_MAX_MS = 200;
const LONG_TIMEOUT_MIN_MS = 5e3;
const SOCKET_LINT_MARKER_RE$2 = /(?:#|\/\*|\/\/)\s*socket-lint:\s*allow(?:\s+(?<tag>[\w-]+))?/;
const helperFileCache = /* @__PURE__ */ new Map();
function findHelperFile(testFilePath) {
	let dir = path.dirname(testFilePath);
	const seen = [];
	while (true) {
		seen.push(dir);
		if (helperFileCache.has(dir)) {
			const cached = helperFileCache.get(dir);
			for (let i = 0, { length } = seen; i < length; i += 1) {
				const d = seen[i];
				helperFileCache.set(d, cached);
			}
			return cached;
		}
		if (existsSync(path.join(dir, HELPER_DIR_PATH))) {
			for (let i = 0, { length } = seen; i < length; i += 1) {
				const d = seen[i];
				helperFileCache.set(d, true);
			}
			return true;
		}
		const parent = path.dirname(dir);
		if (parent === dir) {
			for (let i = 0, { length } = seen; i < length; i += 1) {
				const d = seen[i];
				helperFileCache.set(d, false);
			}
			return false;
		}
		dir = parent;
	}
}
function isLineMarkered$2(line) {
	const m = line.match(SOCKET_LINT_MARKER_RE$2);
	if (!m) return false;
	const tag = m.groups?.["tag"];
	return !tag || tag === "raw-windows-test";
}
const rule$13 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Use the Windows-tolerance test helpers from `test/fleet/_shared/` instead of raw `setTimeout`, `skipIf(WIN32)`, or long per-test timeout literals. Rule is silent when the helper directory does not exist.",
			category: "Best Practices",
			recommended: true
		},
		fixable: false,
		messages: {
			smallSleep: "`setTimeout(_, {{ms}})` in a test sleeps below Windows's 15.6 ms timer quantum and will round up unpredictably. Use `tolerantSleep({{ms}})` or `minTimerQuantum({{ms}})` from `test/fleet/_shared/lib/timing.mts`.",
			skipIfWindows: "`it/describe.skipIf(WIN32)(...)` is the raw form. Use `itUnixOnly` / `describeUnixOnly` from `test/util/skip-helpers.mts` so the skip reason is in the helper name.",
			skipIfNotWindows: "`it/describe.skipIf(!WIN32)(...)` is the raw form. Use `itWindowsOnly` / `describeWindowsOnly` from `test/util/skip-helpers.mts`.",
			longTimeout: "Per-test timeout literal `{{ms}}` does not adapt for the 5× multiplier Windows needs. Use `tolerantTimeout({{ms}})` from `test/fleet/_shared/lib/timing.mts`."
		},
		schema: []
	},
	create(context) {
		const filename = context.getFilename ? context.getFilename() : context.filename ?? "";
		if (!TEST_FILE_RE.test(filename)) return {};
		if (!findHelperFile(filename)) return {};
		const lines = (context.getSourceCode ? context.getSourceCode() : context.sourceCode).lines ?? [];
		function lineFor(node) {
			const idx = (node.loc?.start?.line ?? 1) - 1;
			return lines[idx] ?? "";
		}
		return { CallExpression(node) {
			if (isLineMarkered$2(lineFor(node))) return;
			const callee = node.callee;
			if (!callee) return;
			if (callee.type === "Identifier" && callee.name === "setTimeout" && Array.isArray(node.arguments) && node.arguments.length >= 2) {
				const delay = node.arguments[1];
				if (delay && delay.type === "Literal" && typeof delay.value === "number" && delay.value > 0 && delay.value <= SMALL_SLEEP_MAX_MS) context.report({
					node: delay,
					messageId: "smallSleep",
					data: { ms: String(delay.value) }
				});
			}
			if (callee.type === "MemberExpression" && callee.property?.type === "Identifier" && callee.property.name === "skipIf" && callee.object?.type === "Identifier" && (callee.object.name === "describe" || callee.object.name === "it" || callee.object.name === "test") && Array.isArray(node.arguments) && node.arguments.length === 1) {
				const arg = node.arguments[0];
				if (arg?.type === "Identifier" && arg.name === "WIN32") context.report({
					node,
					messageId: "skipIfWindows"
				});
				else if (arg?.type === "UnaryExpression" && arg.operator === "!" && arg.argument?.type === "Identifier" && arg.argument.name === "WIN32") context.report({
					node,
					messageId: "skipIfNotWindows"
				});
			}
			if (callee.type === "Identifier" && (callee.name === "it" || callee.name === "test") && Array.isArray(node.arguments) && node.arguments.length >= 3) {
				const timeout = node.arguments[2];
				if (timeout && timeout.type === "Literal" && typeof timeout.value === "number" && timeout.value >= LONG_TIMEOUT_MIN_MS) context.report({
					node: timeout,
					messageId: "longTimeout",
					data: { ms: String(timeout.value) }
				});
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/require-async-iife-entry/index.mts
function memberPropName(node) {
	return node?.property?.name;
}
function isEntryGuardTest(test) {
	let expr = test;
	if (expr?.type === "ChainExpression") expr = expr.expression;
	if (!expr || expr.type !== "CallExpression" && expr.type !== "OptionalCallExpression") return false;
	const callee = expr.callee;
	if (memberPropName(callee) !== "endsWith") return false;
	let obj = callee.object;
	for (let depth = 0; obj && depth < 6; depth += 1) {
		if (obj.type === "Identifier" && (obj.name === "argv" || obj.name === "process")) return true;
		if (obj.type === "MetaProperty") return true;
		obj = obj.object ?? obj.expression;
	}
	return false;
}
function collectAsyncFnNames(programBody) {
	const names = /* @__PURE__ */ new Set();
	for (let i = 0, { length } = programBody; i < length; i += 1) {
		const node = programBody[i];
		if (node.type === "FunctionDeclaration" && node.async && node.id) names.add(node.id.name);
		if (node.type === "VariableDeclaration") for (let j = 0, { length: dl } = node.declarations; j < dl; j += 1) {
			const decl = node.declarations[j];
			if (decl.id?.name && decl.init && (decl.init.type === "ArrowFunctionExpression" || decl.init.type === "FunctionExpression") && decl.init.async) names.add(decl.id.name);
		}
	}
	return names;
}
function entryCall(stmt) {
	if (!stmt || stmt.type !== "ExpressionStatement") return;
	let expr = stmt.expression;
	let form = "floating";
	if (expr?.type === "UnaryExpression" && expr.operator === "void") expr = expr.argument;
	else if (expr?.type === "AwaitExpression") {
		form = "await";
		expr = expr.argument;
	}
	if (!expr || expr.type !== "CallExpression") return;
	const callee = expr.callee;
	if (!callee || callee.type !== "Identifier") return;
	return {
		name: callee.name,
		form
	};
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$12 = {
	meta: {
		type: "problem",
		docs: {
			description: "Require a module-scope async entry guard to await main() via an async IIFE, not a floating void main() / main().",
			category: "Possible Errors",
			recommended: true
		},
		fixable: void 0,
		messages: {
			floating: "Entry-guard `{{name}}()` floats an async promise (an unhandled rejection is silent, exitCode timing is implicit). Wrap it: `void (async () => { await {{name}}() })()`.",
			awaited: "Entry-guard `await {{name}}()` is top-level await (the CJS bundle target forbids it). Wrap it: `void (async () => { await {{name}}() })()`."
		},
		schema: []
	},
	create(context) {
		return { Program(program) {
			const body = program.body ?? [];
			const asyncNames = collectAsyncFnNames(body);
			if (asyncNames.size === 0) return;
			for (let i = 0, { length } = body; i < length; i += 1) {
				const node = body[i];
				if (node.type !== "IfStatement" || !isEntryGuardTest(node.test)) continue;
				const guardBody = node.consequent?.type === "BlockStatement" ? node.consequent.body ?? [] : node.consequent ? [node.consequent] : [];
				for (let j = 0, { length: gl } = guardBody; j < gl; j += 1) {
					const call = entryCall(guardBody[j]);
					if (call && asyncNames.has(call.name)) context.report({
						node: guardBody[j],
						messageId: call.form === "await" ? "awaited" : "floating",
						data: { name: call.name }
					});
				}
			}
		} };
	}
};

//#endregion
//#region node_modules/.pnpm/regjsparser@0.13.2/node_modules/regjsparser/parser.js
var require_parser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function() {
		var fromCodePoint = String.fromCodePoint || function() {
			var stringFromCharCode = String.fromCharCode;
			var floor = Math.floor;
			return function fromCodePoint() {
				var MAX_SIZE = 16384;
				var codeUnits = [];
				var highSurrogate;
				var lowSurrogate;
				var index = -1;
				var length = arguments.length;
				if (!length) return "";
				var result = "";
				while (++index < length) {
					var codePoint = Number(arguments[index]);
					if (!isFinite(codePoint) || codePoint < 0 || codePoint > 1114111 || floor(codePoint) != codePoint) throw RangeError("Invalid code point: " + codePoint);
					if (codePoint <= 65535) codeUnits.push(codePoint);
					else {
						codePoint -= 65536;
						highSurrogate = (codePoint >> 10) + 55296;
						lowSurrogate = codePoint % 1024 + 56320;
						codeUnits.push(highSurrogate, lowSurrogate);
					}
					if (index + 1 == length || codeUnits.length > MAX_SIZE) {
						result += stringFromCharCode.apply(null, codeUnits);
						codeUnits.length = 0;
					}
				}
				return result;
			};
		}();
		function parse(str, flags, features) {
			if (!features) features = {};
			function updateRawStart(node, start) {
				node.range[0] = start;
				node.raw = str.substring(start, node.range[1]);
				return node;
			}
			function createAnchor(kind, rawLength) {
				return {
					type: "anchor",
					kind,
					range: [pos - rawLength, pos],
					raw: str.substring(pos - rawLength, pos)
				};
			}
			function createValue(kind, codePoint, from, to) {
				return {
					type: "value",
					kind,
					codePoint,
					range: [from, to],
					raw: str.substring(from, to)
				};
			}
			function createEscaped(kind, codePoint, value, fromOffset) {
				fromOffset = fromOffset || 0;
				return createValue(kind, codePoint, pos - (value.length + fromOffset), pos);
			}
			function createCharacter(matches) {
				var _char = matches[0];
				var first = _char.charCodeAt(0);
				if (isUnicodeMode) {
					var second;
					if (_char.length === 1 && first >= 55296 && first <= 56319) {
						second = lookahead().charCodeAt(0);
						if (second >= 56320 && second <= 57343) {
							pos++;
							return createValue("symbol", (first - 55296) * 1024 + second - 56320 + 65536, pos - 2, pos);
						}
					}
				}
				return createValue("symbol", first, pos - 1, pos);
			}
			function createDisjunction(alternatives, from, to) {
				return {
					type: "disjunction",
					body: alternatives,
					range: [from, to],
					raw: str.substring(from, to)
				};
			}
			function createDot() {
				return {
					type: "dot",
					range: [pos - 1, pos],
					raw: "."
				};
			}
			function createCharacterClassEscape(value) {
				return {
					type: "characterClassEscape",
					value,
					range: [pos - 2, pos],
					raw: str.substring(pos - 2, pos)
				};
			}
			function createReference(matchIndex) {
				var start = pos - 1 - matchIndex.length;
				return {
					type: "reference",
					matchIndex: parseInt(matchIndex, 10),
					range: [start, pos],
					raw: str.substring(start, pos)
				};
			}
			function createNamedReference(name) {
				var start = name.range[0] - 3;
				return {
					type: "reference",
					name,
					range: [start, pos],
					raw: str.substring(start, pos)
				};
			}
			function createGroup(behavior, disjunction, from, to) {
				return {
					type: "group",
					behavior,
					body: disjunction,
					range: [from, to],
					raw: str.substring(from, to)
				};
			}
			function createQuantifier(min, max, from, to, symbol) {
				if (to == null) {
					from = pos - 1;
					to = pos;
				}
				return {
					type: "quantifier",
					min,
					max,
					greedy: true,
					body: null,
					symbol,
					range: [from, to],
					raw: str.substring(from, to)
				};
			}
			function createAlternative(terms, from, to) {
				return {
					type: "alternative",
					body: terms,
					range: [from, to],
					raw: str.substring(from, to)
				};
			}
			function createCharacterClass(contents, negative, from, to) {
				return {
					type: "characterClass",
					kind: contents.kind,
					body: contents.body,
					negative,
					range: [from, to],
					raw: str.substring(from, to)
				};
			}
			function createClassRange(min, max, from, to) {
				if (min.codePoint > max.codePoint) bail("invalid range in character class", min.raw + "-" + max.raw, from, to);
				return {
					type: "characterClassRange",
					min,
					max,
					range: [from, to],
					raw: str.substring(from, to)
				};
			}
			function createClassStrings(strings, from, to) {
				return {
					type: "classStrings",
					strings,
					range: [from, to],
					raw: str.substring(from, to)
				};
			}
			function createClassString(characters, from, to) {
				return {
					type: "classString",
					characters,
					range: [from, to],
					raw: str.substring(from, to)
				};
			}
			function flattenBody(body) {
				if (body.type === "alternative") return body.body;
				else return [body];
			}
			function incr(amount) {
				amount = amount || 1;
				pos += amount;
			}
			function consume(amount) {
				return str.substring(pos, pos += amount);
			}
			function skip(value) {
				if (!match(value)) bail("character", value);
			}
			function match(value) {
				var len = value.length;
				if (str.substring(pos, pos + len) === value) {
					incr(len);
					return value;
				}
			}
			function matchOne(value) {
				if (str[pos] === value) {
					pos++;
					return value;
				}
			}
			function lookahead() {
				return str[pos];
			}
			function currentOne(value) {
				return str[pos] === value;
			}
			function current(value) {
				var len = value.length;
				return str.substring(pos, pos + len) === value;
			}
			function next(value) {
				return str[pos + 1] === value;
			}
			function matchReg(regExp) {
				var res = str.substring(pos).match(regExp);
				if (res) pos += res[0].length;
				return res;
			}
			function parseDisjunction() {
				var res = [], from = pos;
				res.push(parseAlternative());
				while (matchOne("|")) res.push(parseAlternative());
				if (res.length === 1) return res[0];
				return createDisjunction(res, from, pos);
			}
			function parseAlternative() {
				var res = [], from = pos;
				var term;
				while (term = parseTerm()) res.push(term);
				if (res.length === 1) return res[0];
				return createAlternative(res, from, pos);
			}
			function parseTerm() {
				if (pos >= str.length || currentOne("|") || currentOne(")")) return null;
				var anchor = parseAnchor();
				var quantifier;
				if (anchor) {
					var pos_backup = pos;
					quantifier = parseQuantifier() || false;
					if (quantifier) {
						if (!isUnicodeMode && anchor.type === "group") {
							quantifier.body = flattenBody(anchor);
							updateRawStart(quantifier, anchor.range[0]);
							return quantifier;
						}
						pos = pos_backup;
						bail("Expected atom");
					}
					return anchor;
				}
				var atom = parseAtomAndExtendedAtom();
				if (!atom) {
					pos_backup = pos;
					quantifier = parseQuantifier() || false;
					if (quantifier) {
						pos = pos_backup;
						bail("Expected atom");
					}
					if (!isUnicodeMode && matchOne("{")) atom = createCharacter("{");
					else bail("Expected atom");
				}
				quantifier = parseQuantifier() || false;
				if (quantifier) {
					var type = atom.type, behavior = atom.behavior;
					if (type === "group" && (behavior === "negativeLookbehind" || behavior === "lookbehind")) bail("Invalid quantifier", "", quantifier.range[0], quantifier.range[1]);
					quantifier.body = flattenBody(atom);
					updateRawStart(quantifier, atom.range[0]);
					return quantifier;
				}
				return atom;
			}
			function parseGroup(matchA, typeA, matchB, typeB) {
				var type, from = pos;
				if (match(matchA)) type = typeA;
				else if (match(matchB)) type = typeB;
				else return false;
				return finishGroup(type, from);
			}
			function finishGroup(type, from) {
				var body = parseDisjunction();
				if (!body) bail("Expected disjunction");
				skip(")");
				var group = createGroup(type, flattenBody(body), from, pos);
				if (type == "normal") {
					if (firstIteration) closedCaptureCounter++;
				}
				return group;
			}
			function parseAnchor() {
				switch (lookahead()) {
					case "^":
						incr();
						return createAnchor("start", 1);
					case "$":
						incr();
						return createAnchor("end", 1);
					case "\\":
						if (next("b")) {
							incr(2);
							return createAnchor("boundary", 2);
						} else if (next("B")) {
							incr(2);
							return createAnchor("not-boundary", 2);
						}
						break;
					case "(": return parseGroup("(?=", "lookahead", "(?!", "negativeLookahead");
					default: return;
				}
			}
			function parseQuantifier() {
				var res, from = pos;
				var quantifier;
				var min, max;
				switch (lookahead()) {
					case "*":
						incr();
						quantifier = createQuantifier(0, void 0, void 0, void 0, "*");
						break;
					case "+":
						incr();
						quantifier = createQuantifier(1, void 0, void 0, void 0, "+");
						break;
					case "?":
						incr();
						quantifier = createQuantifier(0, 1, void 0, void 0, "?");
						break;
					case "{":
						if (res = matchReg(/^\{(\d+)\}/)) {
							min = parseInt(res[1], 10);
							quantifier = createQuantifier(min, min, from, pos);
						} else if (res = matchReg(/^\{(\d+),\}/)) {
							min = parseInt(res[1], 10);
							quantifier = createQuantifier(min, void 0, from, pos);
						} else if (res = matchReg(/^\{(\d+),(\d+)\}/)) {
							min = parseInt(res[1], 10);
							max = parseInt(res[2], 10);
							if (min > max) bail("numbers out of order in {} quantifier", "", from, pos);
							quantifier = createQuantifier(min, max, from, pos);
						}
						if (min && !Number.isSafeInteger(min) || max && !Number.isSafeInteger(max)) bail("iterations outside JS safe integer range in quantifier", "", from, pos);
				}
				if (quantifier) {
					if (matchOne("?")) {
						quantifier.greedy = false;
						quantifier.range[1] += 1;
					}
				}
				return quantifier;
			}
			function parseAtomAndExtendedAtom() {
				var res;
				switch (res = lookahead()) {
					case ".":
						incr();
						return createDot();
					case "\\":
						incr();
						res = parseAtomEscape();
						if (!res) {
							if (!isUnicodeMode && lookahead() == "c") return createValue("symbol", 92, pos - 1, pos);
							bail("atomEscape");
						}
						return res;
					case "[": return parseCharacterClass();
					case "(": if (features.lookbehind && (res = parseGroup("(?<=", "lookbehind", "(?<!", "negativeLookbehind"))) return res;
					else if (features.namedGroups && match("(?<")) {
						var name = parseIdentifier();
						skip(">");
						var group = finishGroup("normal", name.range[0] - 3);
						group.name = name;
						return group;
					} else if (features.modifiers && current("(?") && str[pos + 2] != ":") return parseModifiersGroup();
					else return parseGroup("(?:", "ignore", "(", "normal");
					case "]":
					case "}":
						if (!isUnicodeMode) {
							incr();
							return createCharacter(res);
						}
						break;
					case "^":
					case "$":
					case "*":
					case "+":
					case "?":
					case "{":
					case ")":
					case "|": break;
					default:
						incr();
						return createCharacter(res);
				}
			}
			function parseModifiersGroup() {
				function hasDupChar(str) {
					var i = 0;
					while (i < str.length) {
						if (str.indexOf(str[i], i + 1) != -1) return true;
						i++;
					}
					return false;
				}
				var from = pos;
				incr(2);
				var enablingFlags = matchReg(/^[sim]+/);
				var disablingFlags;
				if (matchOne("-") && lookahead() !== ":") {
					disablingFlags = matchReg(/^[sim]+/);
					if (!disablingFlags) bail("Invalid flags for modifiers group");
				} else if (!enablingFlags) bail("Invalid flags for modifiers group");
				enablingFlags = enablingFlags ? enablingFlags[0] : "";
				disablingFlags = disablingFlags ? disablingFlags[0] : "";
				var flags = enablingFlags + disablingFlags;
				if (flags.length > 3 || hasDupChar(flags)) bail("flags cannot be duplicated for modifiers group");
				if (!matchOne(":")) bail("Invalid flags for modifiers group");
				var modifiersGroup = finishGroup("ignore", from);
				modifiersGroup.modifierFlags = {
					enabling: enablingFlags,
					disabling: disablingFlags
				};
				return modifiersGroup;
			}
			function parseUnicodeSurrogatePairEscape(firstEscape, isUnicodeMode) {
				if (isUnicodeMode) {
					var first, second;
					if (firstEscape.kind == "unicodeEscape" && (first = firstEscape.codePoint) >= 55296 && first <= 56319 && currentOne("\\") && next("u")) {
						var prevPos = pos;
						pos++;
						var secondEscape = parseClassEscape();
						if (secondEscape.kind == "unicodeEscape" && (second = secondEscape.codePoint) >= 56320 && second <= 57343) {
							firstEscape.kind = "unicodeCodePointEscape";
							firstEscape.codePoint = (first - 55296) * 1024 + second - 56320 + 65536;
							firstEscape.range[1] = pos;
							firstEscape.raw = str.substring(firstEscape.range[0], pos);
						} else pos = prevPos;
					}
				}
				return firstEscape;
			}
			function parseClassEscape() {
				return parseAtomEscape(true);
			}
			function parseAtomEscape(insideCharacterClass) {
				var res, from = pos, ch;
				switch (ch = lookahead()) {
					case "0":
					case "1":
					case "2":
					case "3":
					case "4":
					case "5":
					case "6":
					case "7":
					case "8":
					case "9": return parseDecimalEscape(insideCharacterClass);
					case "B": if (insideCharacterClass) {
						bail("\\B not possible inside of CharacterClass", "", from);
						break;
					} else return parseIdentityEscape();
					case "b": if (insideCharacterClass) {
						incr();
						return createEscaped("singleEscape", 8, "\\b");
					} else return parseIdentityEscape();
					case "c":
						if (insideCharacterClass) {
							if (!isUnicodeMode && (res = matchReg(/^c(\d)/))) return createEscaped("controlLetter", res[1] + 16, res[1], 2);
							else if (!isUnicodeMode && match("c_")) return createEscaped("controlLetter", 31, "_", 2);
						}
						return parseCharacterEscape();
					case "d":
					case "D":
					case "w":
					case "W":
					case "s":
					case "S":
						incr();
						return createCharacterClassEscape(ch);
					case "k": return parseNamedReference() || parseIdentityEscape();
					case "p":
					case "P": return parseUnicodePropertyEscape() || parseIdentityEscape();
					case "-":
						if (insideCharacterClass && isUnicodeMode) {
							incr();
							return createEscaped("singleEscape", 45, "\\-");
						}
						return parseIdentityEscape();
					default: return parseCharacterEscape();
				}
			}
			function parseDecimalEscape(insideCharacterClass) {
				var res, match, from = pos;
				if (res = matchReg(/^(?!0)\d+/)) {
					match = res[0];
					var refIdx = parseInt(match, 10);
					if (refIdx <= closedCaptureCounter && !insideCharacterClass) return createReference(match);
					else {
						backrefDenied.push(refIdx);
						if (firstIteration) shouldReparse = true;
						else bailOctalEscapeIfUnicode(from, pos);
						incr(-match.length);
						if (res = matchReg(/^[0-7]{1,3}/)) return createEscaped("octal", parseInt(res[0], 8), res[0], 1);
						else {
							var start = pos;
							res = createCharacter(matchReg(/^[89]/));
							return updateRawStart(res, start - 1);
						}
					}
				} else if (res = matchReg(/^[0-7]{1,3}/)) {
					match = res[0];
					if (match !== "0") bailOctalEscapeIfUnicode(from, pos);
					if (/^0{1,3}$/.test(match)) return createEscaped("null", 0, "0", match.length);
					else return createEscaped("octal", parseInt(match, 8), match, 1);
				}
				return false;
			}
			function bailOctalEscapeIfUnicode(from, pos) {
				if (isUnicodeMode) bail("Invalid decimal escape in unicode mode", null, from, pos);
			}
			function parseUnicodePropertyEscape() {
				var res, from = pos;
				if (features.unicodePropertyEscape && isUnicodeMode && (res = matchReg(/^([pP])\{([^}]+)\}/))) return {
					type: "unicodePropertyEscape",
					negative: res[1] === "P",
					value: res[2],
					range: [from - 1, pos],
					raw: str.substring(from - 1, pos)
				};
				return false;
			}
			function parseNamedReference() {
				if (features.namedGroups && matchReg(/^k<(?=.*?>)/)) {
					var name = parseIdentifier();
					skip(">");
					return createNamedReference(name);
				}
			}
			function parseRegExpUnicodeEscapeSequence(isUnicodeMode) {
				var res;
				if (res = matchReg(/^u([0-9a-fA-F]{4})/)) return parseUnicodeSurrogatePairEscape(createEscaped("unicodeEscape", parseInt(res[1], 16), res[1], 2), isUnicodeMode);
				else if (isUnicodeMode && (res = matchReg(/^u\{([0-9a-fA-F]+)\}/))) return createEscaped("unicodeCodePointEscape", parseInt(res[1], 16), res[1], 4);
			}
			function parseCharacterEscape() {
				var res;
				var from = pos;
				switch (lookahead()) {
					case "t":
						incr();
						return createEscaped("singleEscape", 9, "\\t");
					case "n":
						incr();
						return createEscaped("singleEscape", 10, "\\n");
					case "v":
						incr();
						return createEscaped("singleEscape", 11, "\\v");
					case "f":
						incr();
						return createEscaped("singleEscape", 12, "\\f");
					case "r":
						incr();
						return createEscaped("singleEscape", 13, "\\r");
					case "c":
						if (res = matchReg(/^c([a-zA-Z])/)) return createEscaped("controlLetter", res[1].charCodeAt(0) % 32, res[1], 2);
						break;
					case "x":
						if (res = matchReg(/^x([0-9a-fA-F]{2})/)) return createEscaped("hexadecimalEscape", parseInt(res[1], 16), res[1], 2);
						break;
					case "u":
						if (res = parseRegExpUnicodeEscapeSequence(isUnicodeMode)) {
							if (!res || res.codePoint > 1114111) bail("Invalid escape sequence", null, from, pos);
							return res;
						}
						break;
				}
				return parseIdentityEscape();
			}
			function parseIdentifierAtom(check) {
				var ch = lookahead();
				var from = pos;
				if (ch === "\\") {
					incr();
					var esc = parseRegExpUnicodeEscapeSequence(true);
					if (!esc || !check(esc.codePoint)) bail("Invalid escape sequence", null, from, pos);
					return fromCodePoint(esc.codePoint);
				}
				var code = ch.charCodeAt(0);
				if (code >= 55296 && code <= 56319) {
					ch += str[pos + 1];
					var second = ch.charCodeAt(1);
					if (second >= 56320 && second <= 57343) code = (code - 55296) * 1024 + second - 56320 + 65536;
				}
				if (!check(code)) return;
				incr();
				if (code > 65535) incr();
				return ch;
			}
			function parseIdentifier() {
				var start = pos;
				var res = parseIdentifierAtom(isIdentifierStart);
				if (!res) bail("Invalid identifier");
				var ch;
				while (ch = parseIdentifierAtom(isIdentifierPart)) res += ch;
				return {
					type: "identifier",
					value: res,
					range: [start, pos],
					raw: str.substring(start, pos)
				};
			}
			function isIdentifierStart(ch) {
				return ch === 36 || ch === 95 || ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch >= 128 && /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088F\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5C\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDC-\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C8A\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7DC\uA7F1-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDDC0-\uDDF3\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD40-\uDD59\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDD4A-\uDD65\uDD6F-\uDD85\uDE80-\uDEA9\uDEB0\uDEB1\uDEC2-\uDEC7\uDF00-\uDF1C\uDF27\uDF30-\uDF45\uDF70-\uDF81\uDFB0-\uDFC4\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE3F\uDE40\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61\uDF80-\uDF89\uDF8B\uDF8E\uDF90-\uDFB5\uDFB7\uDFD1\uDFD3]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDEB8\uDF00-\uDF1A\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8\uDFC0-\uDFE0]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDDB0-\uDDDB\uDEE0-\uDEF2\uDF02\uDF04-\uDF10\uDF12-\uDF33\uDFB0]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD80E\uD80F\uD81C-\uD822\uD840-\uD868\uD86A-\uD86D\uD86F-\uD872\uD874-\uD879\uD880-\uD883\uD885-\uD88C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2F\uDC41-\uDC46\uDC60-\uDFFF]|\uD810[\uDC00-\uDFFA]|\uD811[\uDC00-\uDE46]|\uD818[\uDD00-\uDD1D]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE70-\uDEBE\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDD40-\uDD6C\uDE40-\uDE7F\uDEA0-\uDEB8\uDEBB-\uDED3\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3\uDFF2-\uDFF6]|\uD823[\uDC00-\uDCD5\uDCFF-\uDD1E\uDD80-\uDDF2]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD32\uDD50-\uDD52\uDD55\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD837[\uDF00-\uDF1E\uDF25-\uDF2A]|\uD838[\uDC30-\uDC6D\uDD00-\uDD2C\uDD37-\uDD3D\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB]|\uD839[\uDCD0-\uDCEB\uDDD0-\uDDED\uDDF0\uDEC0-\uDEDE\uDEE0-\uDEE2\uDEE4\uDEE5\uDEE7-\uDEED\uDEF0-\uDEF4\uDEFE\uDEFF\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD4B]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEAD\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0\uDFF0-\uDFFF]|\uD87B[\uDC00-\uDE5D]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A\uDF50-\uDFFF]|\uD88D[\uDC00-\uDC79]/.test(fromCodePoint(ch));
			}
			function isIdentifierPart(ch) {
				return isIdentifierStart(ch) || ch >= 48 && ch <= 57 || ch >= 128 && /[\xB7\u0300-\u036F\u0387\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u0897-\u089F\u08CA-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C04\u0C3C\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0CF3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D81-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECE\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u180F-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19DA\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1ABF-\u1ADD\u1AE0-\u1AEB\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DFF\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\u30FB\uA620-\uA629\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA82C\uA880\uA881\uA8B4-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F1\uA8FF-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F\uFF65]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD801[\uDCA0-\uDCA9]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD803[\uDD24-\uDD27\uDD30-\uDD39\uDD40-\uDD49\uDD69-\uDD6D\uDEAB\uDEAC\uDEFA-\uDEFF\uDF46-\uDF50\uDF82-\uDF85]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC66-\uDC70\uDC73\uDC74\uDC7F-\uDC82\uDCB0-\uDCBA\uDCC2\uDCF0-\uDCF9\uDD00-\uDD02\uDD27-\uDD34\uDD36-\uDD3F\uDD45\uDD46\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDDC9-\uDDCC\uDDCE-\uDDD9\uDE2C-\uDE37\uDE3E\uDE41\uDEDF-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF3B\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74\uDFB8-\uDFC0\uDFC2\uDFC5\uDFC7-\uDFCA\uDFCC-\uDFD0\uDFD2\uDFE1\uDFE2]|\uD805[\uDC35-\uDC46\uDC50-\uDC59\uDC5E\uDCB0-\uDCC3\uDCD0-\uDCD9\uDDAF-\uDDB5\uDDB8-\uDDC0\uDDDC\uDDDD\uDE30-\uDE40\uDE50-\uDE59\uDEAB-\uDEB7\uDEC0-\uDEC9\uDED0-\uDEE3\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDC2C-\uDC3A\uDCE0-\uDCE9\uDD30-\uDD35\uDD37\uDD38\uDD3B-\uDD3E\uDD40\uDD42\uDD43\uDD50-\uDD59\uDDD1-\uDDD7\uDDDA-\uDDE0\uDDE4\uDE01-\uDE0A\uDE33-\uDE39\uDE3B-\uDE3E\uDE47\uDE51-\uDE5B\uDE8A-\uDE99\uDF60-\uDF67\uDFF0-\uDFF9]|\uD807[\uDC2F-\uDC36\uDC38-\uDC3F\uDC50-\uDC59\uDC92-\uDCA7\uDCA9-\uDCB6\uDD31-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD45\uDD47\uDD50-\uDD59\uDD8A-\uDD8E\uDD90\uDD91\uDD93-\uDD97\uDDA0-\uDDA9\uDDE0-\uDDE9\uDEF3-\uDEF6\uDF00\uDF01\uDF03\uDF34-\uDF3A\uDF3E-\uDF42\uDF50-\uDF5A]|\uD80D[\uDC40\uDC47-\uDC55]|\uD818[\uDD1E-\uDD39]|\uD81A[\uDE60-\uDE69\uDEC0-\uDEC9\uDEF0-\uDEF4\uDF30-\uDF36\uDF50-\uDF59]|\uD81B[\uDD70-\uDD79\uDF4F\uDF51-\uDF87\uDF8F-\uDF92\uDFE4\uDFF0\uDFF1]|\uD82F[\uDC9D\uDC9E]|\uD833[\uDCF0-\uDCF9\uDF00-\uDF2D\uDF30-\uDF46]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A\uDC8F\uDD30-\uDD36\uDD40-\uDD49\uDEAE\uDEEC-\uDEF9]|\uD839[\uDCEC-\uDCF9\uDDEE\uDDEF\uDDF1-\uDDFA\uDEE3\uDEE6\uDEEE\uDEEF\uDEF5]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A\uDD50-\uDD59]|\uD83E[\uDFF0-\uDFF9]|\uDB40[\uDD00-\uDDEF]/.test(fromCodePoint(ch));
			}
			function parseIdentityEscape() {
				var tmp;
				var l = lookahead();
				if (isUnicodeMode && /[\^$.*+?()\\[\]{}|/]/.test(l) || !isUnicodeMode && l !== "c") {
					if (l === "k" && features.lookbehind) return null;
					tmp = consume(1);
					return createEscaped("identifier", tmp.charCodeAt(0), tmp, 1);
				}
				return null;
			}
			function parseCharacterClass() {
				var res, from = pos;
				if (match("[^")) {
					res = parseClassContents();
					skip("]");
					return createCharacterClass(res, true, from, pos);
				} else if (matchOne("[")) {
					res = parseClassContents();
					skip("]");
					return createCharacterClass(res, false, from, pos);
				}
				return null;
			}
			function parseClassContents() {
				var res;
				if (currentOne("]")) return {
					kind: "union",
					body: []
				};
				else if (hasUnicodeSetFlag) return parseClassSetExpression();
				else {
					res = parseNonemptyClassRanges();
					if (!res) bail("nonEmptyClassRanges");
					return {
						kind: "union",
						body: res
					};
				}
			}
			function parseHelperClassContents(atom) {
				var from, to, res, atomTo, dash;
				if (currentOne("-") && !next("]")) {
					from = atom.range[0];
					incr();
					dash = createCharacter("-");
					atomTo = parseClassAtom();
					if (!atomTo) bail("classAtom");
					to = pos;
					var classContents = parseClassContents();
					if (!classContents) bail("classContents");
					if (!("codePoint" in atom) || !("codePoint" in atomTo)) if (!isUnicodeMode) res = [
						atom,
						dash,
						atomTo
					];
					else bail("invalid character class");
					else res = [createClassRange(atom, atomTo, from, to)];
					if (classContents.type === "empty") return res;
					return res.concat(classContents.body);
				}
				res = parseNonemptyClassRangesNoDash();
				if (!res) bail("nonEmptyClassRangesNoDash");
				return [atom].concat(res);
			}
			function parseNonemptyClassRanges() {
				var atom = parseClassAtom();
				if (!atom) bail("classAtom");
				if (currentOne("]")) return [atom];
				return parseHelperClassContents(atom);
			}
			function parseNonemptyClassRangesNoDash() {
				var res = parseClassAtom();
				if (!res) bail("classAtom");
				if (currentOne("]")) return res;
				return parseHelperClassContents(res);
			}
			function parseClassAtom() {
				if (matchOne("-")) return createCharacter("-");
				else return parseClassAtomNoDash();
			}
			function parseClassAtomNoDash() {
				var res;
				switch (res = lookahead()) {
					case "\\":
						incr();
						res = parseClassEscape();
						if (!res) {
							if (!isUnicodeMode && lookahead() == "c") return createCharacter("\\");
							bail("classEscape");
						}
						return parseUnicodeSurrogatePairEscape(res, isUnicodeMode);
					case "]":
					case "-": break;
					default:
						incr();
						return createCharacter(res);
				}
			}
			function parseClassSetExpression() {
				var body = [];
				var kind;
				var operand = parseClassSetOperand(true);
				body.push(operand);
				if (operand.type === "classRange") kind = "union";
				else if (currentOne("&")) kind = "intersection";
				else if (currentOne("-")) kind = "subtraction";
				else kind = "union";
				while (!currentOne("]")) {
					if (kind === "intersection") {
						skip("&");
						skip("&");
						if (currentOne("&")) bail("&& cannot be followed by &. Wrap it in brackets: &&[&].");
					} else if (kind === "subtraction") {
						skip("-");
						skip("-");
					}
					operand = parseClassSetOperand(kind === "union");
					body.push(operand);
				}
				return {
					kind,
					body
				};
			}
			function parseClassSetOperand(allowRanges) {
				var from = pos;
				var start, res;
				if (matchOne("\\")) if (match("q{")) return parseClassStringDisjunction();
				else if (res = parseClassEscape()) start = res;
				else if (res = parseClassSetCharacterEscapedHelper()) return res;
				else bail("Invalid escape", "\\" + lookahead(), from);
				else if (res = parseClassSetCharacterUnescapedHelper()) start = res;
				else if (res = parseCharacterClass()) return res;
				else bail("Invalid character", lookahead());
				if (allowRanges && currentOne("-") && !next("-")) {
					incr();
					if (res = parseClassSetCharacter()) return createClassRange(start, res, from, pos);
					bail("Invalid range end", lookahead());
				}
				return start;
			}
			function parseClassSetCharacter() {
				if (matchOne("\\")) {
					var res, from = pos;
					if (res = parseClassSetCharacterEscapedHelper()) return res;
					else bail("Invalid escape", "\\" + lookahead(), from);
				}
				return parseClassSetCharacterUnescapedHelper();
			}
			function parseClassSetCharacterUnescapedHelper() {
				var res;
				if (matchReg(/^(?:&&|!!|##|\$\$|%%|\*\*|\+\+|,,|\.\.|::|;;|<<|==|>>|\?\?|@@|\^\^|``|~~)/)) bail("Invalid set operation in character class");
				if (res = matchReg(/^[^()[\]{}/\-\\|]/)) return createCharacter(res);
			}
			function parseClassSetCharacterEscapedHelper() {
				var res;
				if (matchOne("b")) return createEscaped("singleEscape", 8, "\\b");
				else if (matchOne("B")) bail("\\B not possible inside of ClassContents", "", pos - 2);
				else if (res = matchReg(/^[&\-!#%,:;<=>@`~]/)) return createEscaped("identifier", res[0].codePointAt(0), res[0]);
				else if (res = parseCharacterEscape()) return res;
				else return null;
			}
			function parseClassStringDisjunction() {
				var from = pos - 3;
				var res = [];
				do
					res.push(parseClassString());
				while (matchOne("|"));
				skip("}");
				return createClassStrings(res, from, pos);
			}
			function parseClassString() {
				var res = [], from = pos;
				var char;
				while (char = parseClassSetCharacter()) res.push(char);
				return createClassString(res, from, pos);
			}
			function bail(message, details, from, to) {
				from = from == null ? pos : from;
				to = to == null ? from : to;
				var contextStart = Math.max(0, from - 10);
				var contextEnd = Math.min(to + 10, str.length);
				var context = "    " + str.substring(contextStart, contextEnd);
				var pointer = "    " + new Array(from - contextStart + 1).join(" ") + "^";
				throw SyntaxError(message + " at position " + from + (details ? ": " + details : "") + "\n" + context + "\n" + pointer);
			}
			var backrefDenied = [];
			var closedCaptureCounter = 0;
			var firstIteration = true;
			var shouldReparse = false;
			var hasUnicodeFlag = (flags || "").indexOf("u") !== -1;
			var hasUnicodeSetFlag = (flags || "").indexOf("v") !== -1;
			var isUnicodeMode = hasUnicodeFlag || hasUnicodeSetFlag;
			var pos = 0;
			if (hasUnicodeSetFlag && !features.unicodeSet) throw new Error("The \"v\" flag is only supported when the .unicodeSet option is enabled.");
			if (hasUnicodeFlag && hasUnicodeSetFlag) throw new Error("The \"u\" and \"v\" flags are mutually exclusive.");
			str = String(str);
			if (str === "") str = "(?:)";
			var result = parseDisjunction();
			if (result.range[1] !== str.length) bail("Could not parse entire input - got stuck", "", result.range[1]);
			shouldReparse = shouldReparse || backrefDenied.some(function(ref) {
				return ref <= closedCaptureCounter;
			});
			if (shouldReparse) {
				pos = 0;
				firstIteration = false;
				return parseDisjunction();
			}
			return result;
		}
		var regjsparser = { parse };
		if (typeof module !== "undefined" && module.exports) module.exports = regjsparser;
		else window.regjsparser = regjsparser;
	})();
}));

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/require-regex-comment/index.mts
var import_parser = /* @__PURE__ */ __toESM(require_parser(), 1);
const parseRegex = import_parser.default.parse;
const SOCKET_LINT_MARKER_RE$1 = /(?:#|\/\*|\/\/)\s*socket-lint:\s*allow(?:\s+(?<tag>[\w-]+))?/;
function isLineMarkered$1(line) {
	const m = line.match(SOCKET_LINT_MARKER_RE$1);
	if (!m) return false;
	const tag = m.groups?.["tag"];
	return !tag || tag === "uncommented-regex";
}
const STRUCTURAL_BRANCH_TYPES = /* @__PURE__ */ new Set([
	"characterClass",
	"group",
	"quantifier"
]);
const LOOKAROUND_BEHAVIORS = /* @__PURE__ */ new Set([
	"lookahead",
	"lookbehind",
	"negativeLookahead",
	"negativeLookbehind"
]);
function childrenOf(node) {
	return node.body ?? node.alternatives ?? [];
}
function isLookaround(node) {
	return node.type === "group" && LOOKAROUND_BEHAVIORS.has(
		/* c8 ignore start - regjsparser always emits behavior on group nodes; ?? '' is a defensive fallback unreachable from real input */
		node.behavior ?? ""
		/* c8 ignore stop */
	);
}
function containsStructural(node) {
	if (STRUCTURAL_BRANCH_TYPES.has(node.type) || isLookaround(node)) return true;
	const kids = childrenOf(node);
	for (let i = 0, { length } = kids; i < length; i += 1) if (containsStructural(kids[i])) return true;
	return false;
}
function analyze(node) {
	let groups = 0;
	let lookarounds = 0;
	let hasBackref = false;
	let hasNonTrivialDisjunction = false;
	function walk(n, { underQuantifier }) {
		let nextQuantifier = underQuantifier;
		if (n.type === "group") if (isLookaround(n)) lookarounds += 1;
		else groups += 1;
		else if (n.type === "quantifier") nextQuantifier = true;
		else if (n.type === "reference") hasBackref = true;
		else if (n.type === "disjunction") {
			const branches = childrenOf(n);
			if (underQuantifier || branches.some((b) => containsStructural(b))) hasNonTrivialDisjunction = true;
		}
		const kids = childrenOf(n);
		for (let i = 0, { length } = kids; i < length; i += 1) walk(kids[i], { underQuantifier: nextQuantifier });
	}
	walk(node, { underQuantifier: false });
	return {
		groups,
		lookarounds,
		hasBackref,
		hasNonTrivialDisjunction
	};
}
function isComplexPattern(pattern, flags) {
	let ast;
	try {
		ast = parseRegex(pattern, flags, { unicodePropertyEscape: true });
	} catch {
		return false;
	}
	const { groups, lookarounds, hasBackref, hasNonTrivialDisjunction } = analyze(ast);
	if (hasNonTrivialDisjunction) return true;
	if (groups >= 2) return true;
	if (lookarounds >= 2) return true;
	if (lookarounds >= 1 && groups >= 1) return true;
	if (hasBackref) return true;
	return false;
}
function isTestFile(filename) {
	return !!filename && /\.test\.[cm]?tsx?$/.test(filename);
}
function lineHasComment(line) {
	if (!line) return false;
	const withoutDirective = line.replace(SOCKET_LINT_MARKER_RE$1, "");
	return withoutDirective.includes("//") || withoutDirective.includes("/*") || withoutDirective.includes("*/");
}
const rule$11 = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require an explanatory comment near every non-trivial regex literal so a junior reader understands the pattern without executing it.",
			category: "Stylistic Issues",
			recommended: true
		},
		messages: { uncommented: "Complex regex `{{pattern}}` (combines groups / alternation / lookaround / backreference) has no adjacent explanatory comment. Add a `//` breakdown on the line above (what each part matches) for a junior reader, or append `// socket-lint: allow uncommented-regex` if it is obvious in context." },
		schema: []
	},
	create(context) {
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		if (isTestFile(context.filename ?? context.getFilename?.())) return {};
		function checkLiteral(node) {
			if (!node.regex) return;
			const pattern = node.regex.pattern;
			if (!isComplexPattern(pattern, node.regex.flags ?? "")) return;
			const { lines } = sourceCode;
			const lineIdx = node.loc.start.line - 1;
			const ownLine = lines[lineIdx] ?? "";
			if (isLineMarkered$1(ownLine)) return;
			if (lineHasComment(ownLine)) return;
			let explained = false;
			for (let i = lineIdx - 1; i >= 0; i -= 1) {
				const line = lines[i] ?? "";
				if (lineHasComment(line)) {
					explained = true;
					break;
				}
				if (!/[=([{:,?|&+]\s*$/.test(line.trim())) break;
			}
			if (explained) return;
			context.report({
				node,
				messageId: "uncommented",
				data: { pattern: `/${pattern}/` }
			});
		}
		return { Literal(node) {
			checkLiteral(node);
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/require-vitest-globals-import/index.mts
/**
* @file In a `*.test.*` file, a vitest global (`describe` / `it` / `test` /
*   `expect` / `beforeAll` / `beforeEach` / `afterAll` / `afterEach`) that is
*   CALLED but never imported from `'vitest'` is an error. The fleet runs
*   vitest with `globals: false` (.config/repo/vitest.config.mts), so an
*   un-imported global is `undefined` at runtime — the file errors at
*   COLLECTION ("X is not defined") and the whole suite never runs. This is a
*   silent, total failure: the test file looks present but contributes zero
*   assertions. Why a rule: a fleet sweep found 95 test files in one repo
*   broken exactly this way (a `globals: true → false` migration that didn't
*   update test imports). The fix is mechanical, add the import, but nothing
*   stopped the next one — so this gate fails CI/editor the moment a test uses
*   a vitest global it didn't import. Scope: `*.test.*`. Stands down when the
*   file imports from `node:test` (it's a node:test file, not vitest —
*   `globals` doesn't apply). Reports once per distinct missing global. Built
*   on lib/vitest-fn-call.mts, whose `fromVitestImport` set is the
*   authoritative "actually imported from vitest" signal.
*/
const rule$10 = {
	meta: {
		type: "problem",
		docs: {
			description: "In a *.test.* file (vitest globals:false), a vitest global called without importing it from `vitest` is undefined at runtime — the file errors at collection and the suite never runs.",
			category: "Possible Errors",
			recommended: true
		},
		messages: { missingImport: "`{{name}}` is a vitest global used here but never imported. Fleet vitest is `globals: false`, so this is `undefined` at runtime — the file errors at collection and NEVER runs. Add it to `import { … } from 'vitest'`." },
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (!TEST_FILE_RE$2.test(filename)) return {};
		let fromVitestImport;
		let importedNames;
		let names;
		let importsNodeTest = false;
		const reported = /* @__PURE__ */ new Set();
		return {
			Program(program) {
				const collected = collectVitestNames(program);
				names = collected.names;
				fromVitestImport = collected.fromVitestImport;
				importedNames = collected.importedNames;
				importsNodeTest = collected.importsNodeTest;
			},
			CallExpression(node) {
				if (importsNodeTest || !names || !fromVitestImport || !importedNames) return;
				const call = classifyVitestCall(node, names);
				if (!call) return;
				const localName = call.localChain[0];
				if (!localName || reported.has(localName)) return;
				if (!fromVitestImport.has(localName) && !importedNames.has(localName)) {
					reported.add(localName);
					context.report({
						node,
						messageId: "missingImport",
						data: { name: localName }
					});
				}
			}
		};
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/socket-api-token-env/index.mts
const LEGACY_ALIASES = /* @__PURE__ */ new Set([
	"SOCKET_API_KEY",
	"SOCKET_SECURITY_API_KEY",
	"SOCKET_SECURITY_API_TOKEN"
]);
const CANONICAL = "SOCKET_API_TOKEN";
const BYPASS_RE$3 = /socket-api-token-env:\s*bootstrap/;
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$9 = {
	meta: {
		type: "problem",
		docs: {
			description: "Use the canonical SOCKET_API_TOKEN env var; rewrite legacy aliases (SOCKET_API_KEY, SOCKET_SECURITY_API_TOKEN, SOCKET_SECURITY_API_KEY).",
			category: "Best Practices",
			recommended: true
		},
		fixable: "code",
		messages: { legacy: "`{{name}}` is a legacy alias — use `SOCKET_API_TOKEN` (the canonical fleet name). Bootstrap hooks normalize the aliases." },
		schema: []
	},
	create(context) {
		if (isPluginSelfFile(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		function hasBypassComment(node) {
			let cursor = node;
			while (cursor) {
				const before = sourceCode.getCommentsBefore(cursor);
				const after = sourceCode.getCommentsAfter(cursor);
				for (const c of [...before, ...after]) if (BYPASS_RE$3.test(c.value)) return true;
				if (cursor.type === "ExportNamedDeclaration" || cursor.type === "ExpressionStatement" || cursor.type === "VariableDeclaration") break;
				cursor = cursor.parent;
			}
			return false;
		}
		function checkStringValue(node, value) {
			if (!LEGACY_ALIASES.has(value)) return;
			if (hasBypassComment(node)) return;
			context.report({
				node,
				messageId: "legacy",
				data: { name: value },
				fix(fixer) {
					const quote = sourceCode.getText(node)[0];
					if (quote === "`") return fixer.replaceText(node, "`SOCKET_API_TOKEN`");
					return fixer.replaceText(node, quote + CANONICAL + quote);
				}
			});
		}
		return {
			Literal(node) {
				if (typeof node.value !== "string") return;
				checkStringValue(node, node.value);
			},
			TemplateLiteral(node) {
				if (node.expressions.length !== 0) return;
				checkStringValue(node, node.quasis[0].value.cooked);
			},
			MemberExpression(node) {
				if (node.computed) return;
				if (node.property.type !== "Identifier") return;
				if (!LEGACY_ALIASES.has(node.property.name)) return;
				const obj = node.object;
				if (obj.type !== "MemberExpression" || obj.property.type !== "Identifier" || obj.property.name !== "env") return;
				if (obj.object.type !== "Identifier" || obj.object.name !== "process") return;
				if (hasBypassComment(node)) return;
				context.report({
					node: node.property,
					messageId: "legacy",
					data: { name: node.property.name },
					fix(fixer) {
						return fixer.replaceText(node.property, CANONICAL);
					}
				});
			}
		};
	}
};

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/primordials/intl.js
var require_intl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	/**
	* @file Safe references to `Intl` constructors. Captured once at module load so
	*   consumers reading adversarial input never see a tampered global. `new
	*   Intl.X(...)` is expensive (10-14ms for Collator in Node); callers are
	*   responsible for caching instances — these exports are the constructors
	*   only. On the smol Node binary the captures come from
	*   `node:smol-primordial`, which hoists them from within the sealed module
	*   context; on stock Node they fall back to the global `Intl` object.
	*/
	const smolPrimordial = require_primordial().getSmolPrimordial();
	const IntlCollator = smolPrimordial?.IntlCollator ?? Intl.Collator;
	const IntlListFormat = smolPrimordial?.IntlListFormat ?? Intl.ListFormat;
	const IntlPluralRules = smolPrimordial?.IntlPluralRules ?? Intl.PluralRules;
	const IntlSegmenter = smolPrimordial?.IntlSegmenter ?? Intl.Segmenter;
	exports.IntlCollator = IntlCollator;
	exports.IntlListFormat = IntlListFormat;
	exports.IntlPluralRules = IntlPluralRules;
	exports.IntlSegmenter = IntlSegmenter;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/primordials/array.js
var require_array = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_uncurry = require_uncurry();
	/**
	* @file Safe references to `Array`, typed-array, `ArrayBuffer`, `DataView`,
	*   `Atomics`, and shared iterator-prototype primordials. `Array.fromAsync` and
	*   `Array.prototype.with` are ES2024 / ES2023; the primordial captures the
	*   live reference at module load so consumers never see a tampered global.
	*/
	const smolPrimordial = require_primordial().getSmolPrimordial();
	const ArrayCtor = Array;
	const ArrayBufferCtor = ArrayBuffer;
	const DataViewCtor = DataView;
	const Float32ArrayCtor = Float32Array;
	const Float64ArrayCtor = Float64Array;
	const Int8ArrayCtor = Int8Array;
	const Int16ArrayCtor = Int16Array;
	const Int32ArrayCtor = Int32Array;
	const Uint8ArrayCtor = Uint8Array;
	const Uint8ClampedArrayCtor = Uint8ClampedArray;
	const Uint16ArrayCtor = Uint16Array;
	const Uint32ArrayCtor = Uint32Array;
	const ArrayFrom = Array.from;
	const ArrayFromAsync = Array.fromAsync;
	const ArrayIsArray = smolPrimordial?.arrayIsArray ?? Array.isArray;
	const ArrayOf = Array.of;
	const ArrayBufferIsView = ArrayBuffer.isView;
	const AtomicsWait = Atomics.wait;
	const ArrayPrototypeAt = require_primordials_uncurry.uncurryThis(Array.prototype.at);
	const ArrayPrototypeConcat = require_primordials_uncurry.uncurryThis(Array.prototype.concat);
	const ArrayPrototypeCopyWithin = require_primordials_uncurry.uncurryThis(Array.prototype.copyWithin);
	const ArrayPrototypeEntries = require_primordials_uncurry.uncurryThis(Array.prototype.entries);
	const ArrayPrototypeEvery = require_primordials_uncurry.uncurryThis(Array.prototype.every);
	const ArrayPrototypeFill = require_primordials_uncurry.uncurryThis(Array.prototype.fill);
	const ArrayPrototypeFilter = require_primordials_uncurry.uncurryThis(Array.prototype.filter);
	const ArrayPrototypeFind = require_primordials_uncurry.uncurryThis(Array.prototype.find);
	const ArrayPrototypeFindIndex = require_primordials_uncurry.uncurryThis(Array.prototype.findIndex);
	const ArrayPrototypeFindLast = require_primordials_uncurry.uncurryThis(Array.prototype.findLast);
	const ArrayPrototypeFindLastIndex = require_primordials_uncurry.uncurryThis(Array.prototype.findLastIndex);
	const ArrayPrototypeFlat = require_primordials_uncurry.uncurryThis(Array.prototype.flat);
	const ArrayPrototypeFlatMap = require_primordials_uncurry.uncurryThis(Array.prototype.flatMap);
	const ArrayPrototypeForEach = require_primordials_uncurry.uncurryThis(Array.prototype.forEach);
	const ArrayPrototypeIncludes = require_primordials_uncurry.uncurryThis(Array.prototype.includes);
	const ArrayPrototypeIndexOf = require_primordials_uncurry.uncurryThis(Array.prototype.indexOf);
	const ArrayPrototypeJoin = require_primordials_uncurry.uncurryThis(Array.prototype.join);
	const ArrayPrototypeKeys = require_primordials_uncurry.uncurryThis(Array.prototype.keys);
	const ArrayPrototypeLastIndexOf = require_primordials_uncurry.uncurryThis(Array.prototype.lastIndexOf);
	const ArrayPrototypeMap = require_primordials_uncurry.uncurryThis(Array.prototype.map);
	const ArrayPrototypePop = require_primordials_uncurry.uncurryThis(Array.prototype.pop);
	const ArrayPrototypePush = require_primordials_uncurry.uncurryThis(Array.prototype.push);
	const ArrayPrototypeReduce = require_primordials_uncurry.uncurryThis(Array.prototype.reduce);
	const ArrayPrototypeReduceRight = require_primordials_uncurry.uncurryThis(Array.prototype.reduceRight);
	const ArrayPrototypeReverse = require_primordials_uncurry.uncurryThis(Array.prototype.reverse);
	const ArrayPrototypeShift = require_primordials_uncurry.uncurryThis(Array.prototype.shift);
	const ArrayPrototypeSlice = require_primordials_uncurry.uncurryThis(Array.prototype.slice);
	const ArrayPrototypeSome = require_primordials_uncurry.uncurryThis(Array.prototype.some);
	const ArrayPrototypeSort = require_primordials_uncurry.uncurryThis(Array.prototype.sort);
	const ArrayPrototypeSplice = require_primordials_uncurry.uncurryThis(Array.prototype.splice);
	const ArrayPrototypeToLocaleString = require_primordials_uncurry.uncurryThis(Array.prototype.toLocaleString);
	const ArrayPrototypeToReversed = require_primordials_uncurry.uncurryThis(Array.prototype.toReversed);
	const ArrayPrototypeToSorted = require_primordials_uncurry.uncurryThis(Array.prototype.toSorted);
	const ArrayPrototypeToSpliced = require_primordials_uncurry.uncurryThis(Array.prototype.toSpliced);
	const ArrayPrototypeToString = require_primordials_uncurry.uncurryThis(Array.prototype.toString);
	const ArrayPrototypeUnshift = require_primordials_uncurry.uncurryThis(Array.prototype.unshift);
	const ArrayPrototypeValues = require_primordials_uncurry.uncurryThis(Array.prototype.values);
	const ArrayPrototypeWith = require_primordials_uncurry.uncurryThis(Array.prototype.with);
	const anyIterator = (/* @__PURE__ */ new Map()).keys();
	let iteratorLookup = Object.getPrototypeOf(anyIterator);
	while (iteratorLookup && typeof iteratorLookup.next !== "function")
 /* c8 ignore next - Modern V8 puts Iterator.prototype one hop up the chain
	so the first check already finds .next; the walk-further branch fires
	only on hypothetical engines where the prototype layout differs. */
	iteratorLookup = Object.getPrototypeOf(iteratorLookup);
	const iteratorProto = iteratorLookup;
	const IteratorPrototypeNext = require_primordials_uncurry.uncurryThis(iteratorProto.next);
	/* c8 ignore start */
	const IteratorPrototypeReturn = typeof iteratorProto.return === "function" ? require_primordials_uncurry.uncurryThis(iteratorProto.return) : void 0;
	/* c8 ignore stop */
	exports.ArrayBufferCtor = ArrayBufferCtor;
	exports.ArrayBufferIsView = ArrayBufferIsView;
	exports.ArrayCtor = ArrayCtor;
	exports.ArrayFrom = ArrayFrom;
	exports.ArrayFromAsync = ArrayFromAsync;
	exports.ArrayIsArray = ArrayIsArray;
	exports.ArrayOf = ArrayOf;
	exports.ArrayPrototypeAt = ArrayPrototypeAt;
	exports.ArrayPrototypeConcat = ArrayPrototypeConcat;
	exports.ArrayPrototypeCopyWithin = ArrayPrototypeCopyWithin;
	exports.ArrayPrototypeEntries = ArrayPrototypeEntries;
	exports.ArrayPrototypeEvery = ArrayPrototypeEvery;
	exports.ArrayPrototypeFill = ArrayPrototypeFill;
	exports.ArrayPrototypeFilter = ArrayPrototypeFilter;
	exports.ArrayPrototypeFind = ArrayPrototypeFind;
	exports.ArrayPrototypeFindIndex = ArrayPrototypeFindIndex;
	exports.ArrayPrototypeFindLast = ArrayPrototypeFindLast;
	exports.ArrayPrototypeFindLastIndex = ArrayPrototypeFindLastIndex;
	exports.ArrayPrototypeFlat = ArrayPrototypeFlat;
	exports.ArrayPrototypeFlatMap = ArrayPrototypeFlatMap;
	exports.ArrayPrototypeForEach = ArrayPrototypeForEach;
	exports.ArrayPrototypeIncludes = ArrayPrototypeIncludes;
	exports.ArrayPrototypeIndexOf = ArrayPrototypeIndexOf;
	exports.ArrayPrototypeJoin = ArrayPrototypeJoin;
	exports.ArrayPrototypeKeys = ArrayPrototypeKeys;
	exports.ArrayPrototypeLastIndexOf = ArrayPrototypeLastIndexOf;
	exports.ArrayPrototypeMap = ArrayPrototypeMap;
	exports.ArrayPrototypePop = ArrayPrototypePop;
	exports.ArrayPrototypePush = ArrayPrototypePush;
	exports.ArrayPrototypeReduce = ArrayPrototypeReduce;
	exports.ArrayPrototypeReduceRight = ArrayPrototypeReduceRight;
	exports.ArrayPrototypeReverse = ArrayPrototypeReverse;
	exports.ArrayPrototypeShift = ArrayPrototypeShift;
	exports.ArrayPrototypeSlice = ArrayPrototypeSlice;
	exports.ArrayPrototypeSome = ArrayPrototypeSome;
	exports.ArrayPrototypeSort = ArrayPrototypeSort;
	exports.ArrayPrototypeSplice = ArrayPrototypeSplice;
	exports.ArrayPrototypeToLocaleString = ArrayPrototypeToLocaleString;
	exports.ArrayPrototypeToReversed = ArrayPrototypeToReversed;
	exports.ArrayPrototypeToSorted = ArrayPrototypeToSorted;
	exports.ArrayPrototypeToSpliced = ArrayPrototypeToSpliced;
	exports.ArrayPrototypeToString = ArrayPrototypeToString;
	exports.ArrayPrototypeUnshift = ArrayPrototypeUnshift;
	exports.ArrayPrototypeValues = ArrayPrototypeValues;
	exports.ArrayPrototypeWith = ArrayPrototypeWith;
	exports.AtomicsWait = AtomicsWait;
	exports.DataViewCtor = DataViewCtor;
	exports.Float32ArrayCtor = Float32ArrayCtor;
	exports.Float64ArrayCtor = Float64ArrayCtor;
	exports.Int16ArrayCtor = Int16ArrayCtor;
	exports.Int32ArrayCtor = Int32ArrayCtor;
	exports.Int8ArrayCtor = Int8ArrayCtor;
	exports.IteratorPrototypeNext = IteratorPrototypeNext;
	exports.IteratorPrototypeReturn = IteratorPrototypeReturn;
	exports.Uint16ArrayCtor = Uint16ArrayCtor;
	exports.Uint32ArrayCtor = Uint32ArrayCtor;
	exports.Uint8ArrayCtor = Uint8ArrayCtor;
	exports.Uint8ClampedArrayCtor = Uint8ClampedArrayCtor;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/primordials/object.js
var require_object = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_uncurry = require_uncurry();
	/**
	* @file Safe references to `Object` static methods and prototype methods. Annex
	*   B legacy accessor methods (`__defineGetter__`, `__lookupGetter__`, etc.)
	*   are exposed alongside the canonical static methods — implementations exist
	*   in V8, SpiderMonkey, and JavaScriptCore even though the spec calls them
	*   "normative optional".
	*/
	const ObjectCtor = Object;
	const ObjectAssign = Object.assign;
	const ObjectCreate = Object.create;
	const ObjectDefineProperties = Object.defineProperties;
	const ObjectDefineProperty = Object.defineProperty;
	const ObjectEntries = Object.entries;
	const ObjectFreeze = Object.freeze;
	const ObjectFromEntries = Object.fromEntries;
	const ObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
	const ObjectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
	const ObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
	const ObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;
	const ObjectGetPrototypeOf = Object.getPrototypeOf;
	const ObjectHasOwn = Object.hasOwn;
	const ObjectIs = Object.is;
	const ObjectIsExtensible = Object.isExtensible;
	const ObjectIsFrozen = Object.isFrozen;
	const ObjectIsSealed = Object.isSealed;
	const ObjectKeys = Object.keys;
	const ObjectPreventExtensions = Object.preventExtensions;
	const ObjectSeal = Object.seal;
	const ObjectSetPrototypeOf = Object.setPrototypeOf;
	const ObjectValues = Object.values;
	const ObjectPrototype = Object.prototype;
	const ObjectPrototypeHasOwnProperty = require_primordials_uncurry.uncurryThis(Object.prototype.hasOwnProperty);
	const ObjectPrototypeIsPrototypeOf = require_primordials_uncurry.uncurryThis(Object.prototype.isPrototypeOf);
	const ObjectPrototypePropertyIsEnumerable = require_primordials_uncurry.uncurryThis(Object.prototype.propertyIsEnumerable);
	const ObjectPrototypeToString = require_primordials_uncurry.uncurryThis(Object.prototype.toString);
	const ObjectPrototypeValueOf = require_primordials_uncurry.uncurryThis(Object.prototype.valueOf);
	const objectProto = Object.prototype;
	const ObjectPrototypeDefineGetter = require_primordials_uncurry.uncurryThis(objectProto.__defineGetter__);
	const ObjectPrototypeDefineSetter = require_primordials_uncurry.uncurryThis(objectProto.__defineSetter__);
	const ObjectPrototypeLookupGetter = require_primordials_uncurry.uncurryThis(objectProto.__lookupGetter__);
	const ObjectPrototypeLookupSetter = require_primordials_uncurry.uncurryThis(objectProto.__lookupSetter__);
	exports.ObjectAssign = ObjectAssign;
	exports.ObjectCreate = ObjectCreate;
	exports.ObjectCtor = ObjectCtor;
	exports.ObjectDefineProperties = ObjectDefineProperties;
	exports.ObjectDefineProperty = ObjectDefineProperty;
	exports.ObjectEntries = ObjectEntries;
	exports.ObjectFreeze = ObjectFreeze;
	exports.ObjectFromEntries = ObjectFromEntries;
	exports.ObjectGetOwnPropertyDescriptor = ObjectGetOwnPropertyDescriptor;
	exports.ObjectGetOwnPropertyDescriptors = ObjectGetOwnPropertyDescriptors;
	exports.ObjectGetOwnPropertyNames = ObjectGetOwnPropertyNames;
	exports.ObjectGetOwnPropertySymbols = ObjectGetOwnPropertySymbols;
	exports.ObjectGetPrototypeOf = ObjectGetPrototypeOf;
	exports.ObjectHasOwn = ObjectHasOwn;
	exports.ObjectIs = ObjectIs;
	exports.ObjectIsExtensible = ObjectIsExtensible;
	exports.ObjectIsFrozen = ObjectIsFrozen;
	exports.ObjectIsSealed = ObjectIsSealed;
	exports.ObjectKeys = ObjectKeys;
	exports.ObjectPreventExtensions = ObjectPreventExtensions;
	exports.ObjectPrototype = ObjectPrototype;
	exports.ObjectPrototypeDefineGetter = ObjectPrototypeDefineGetter;
	exports.ObjectPrototypeDefineSetter = ObjectPrototypeDefineSetter;
	exports.ObjectPrototypeHasOwnProperty = ObjectPrototypeHasOwnProperty;
	exports.ObjectPrototypeIsPrototypeOf = ObjectPrototypeIsPrototypeOf;
	exports.ObjectPrototypeLookupGetter = ObjectPrototypeLookupGetter;
	exports.ObjectPrototypeLookupSetter = ObjectPrototypeLookupSetter;
	exports.ObjectPrototypePropertyIsEnumerable = ObjectPrototypePropertyIsEnumerable;
	exports.ObjectPrototypeToString = ObjectPrototypeToString;
	exports.ObjectPrototypeValueOf = ObjectPrototypeValueOf;
	exports.ObjectSeal = ObjectSeal;
	exports.ObjectSetPrototypeOf = ObjectSetPrototypeOf;
	exports.ObjectValues = ObjectValues;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/external/fast-sort.js
var require_fast_sort = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { ArrayIsArray: _p_ArrayIsArray } = require_array();
	const { ObjectDefineProperty: _p_ObjectDefineProperty } = require_object();
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
	const { createNewSortInstance } = (/* @__PURE__ */ __commonJSMin(((exports$1) => {
		_p_ObjectDefineProperty(exports$1, "__esModule", { value: true });
		var castComparer = function(comparer) {
			return function(a, b, order) {
				return comparer(a, b, order) * order;
			};
		};
		var throwInvalidConfigErrorIfTrue = function(condition, context) {
			if (condition) throw Error("Invalid sort config: " + context);
		};
		var unpackObjectSorter = function(sortByObj) {
			var _a = sortByObj || {};
			var asc = _a.asc;
			var desc = _a.desc;
			var order = asc ? 1 : -1;
			var sortBy = asc || desc;
			throwInvalidConfigErrorIfTrue(!sortBy, "Expected `asc` or `desc` property");
			throwInvalidConfigErrorIfTrue(asc && desc, "Ambiguous object with `asc` and `desc` config properties");
			return {
				order,
				sortBy,
				comparer: sortByObj.comparer && castComparer(sortByObj.comparer)
			};
		};
		var multiPropertySorterProvider = function(defaultComparer) {
			return function multiPropertySorter(sortBy, sortByArr, depth, order, comparer, a, b) {
				var valA;
				var valB;
				if (typeof sortBy === "string") {
					valA = a[sortBy];
					valB = b[sortBy];
				} else if (typeof sortBy === "function") {
					valA = sortBy(a);
					valB = sortBy(b);
				} else {
					var objectSorterConfig = unpackObjectSorter(sortBy);
					return multiPropertySorter(objectSorterConfig.sortBy, sortByArr, depth, objectSorterConfig.order, objectSorterConfig.comparer || defaultComparer, a, b);
				}
				var equality = comparer(valA, valB, order);
				if ((equality === 0 || valA == null && valB == null) && sortByArr.length > depth) return multiPropertySorter(sortByArr[depth], sortByArr, depth + 1, order, comparer, a, b);
				return equality;
			};
		};
		function getSortStrategy(sortBy, comparer, order) {
			if (sortBy === void 0 || sortBy === true) return function(a, b) {
				return comparer(a, b, order);
			};
			if (typeof sortBy === "string") {
				throwInvalidConfigErrorIfTrue(sortBy.includes("."), "String syntax not allowed for nested properties.");
				return function(a, b) {
					return comparer(a[sortBy], b[sortBy], order);
				};
			}
			if (typeof sortBy === "function") return function(a, b) {
				return comparer(sortBy(a), sortBy(b), order);
			};
			if (_p_ArrayIsArray(sortBy)) {
				var multiPropSorter_1 = multiPropertySorterProvider(comparer);
				return function(a, b) {
					return multiPropSorter_1(sortBy[0], sortBy, 1, order, comparer, a, b);
				};
			}
			var objectSorterConfig = unpackObjectSorter(sortBy);
			return getSortStrategy(objectSorterConfig.sortBy, objectSorterConfig.comparer || comparer, objectSorterConfig.order);
		}
		var sortArray = function(order, ctx, sortBy, comparer) {
			var _a;
			if (!_p_ArrayIsArray(ctx)) return ctx;
			if (_p_ArrayIsArray(sortBy) && sortBy.length < 2) _a = sortBy, sortBy = _a[0];
			return ctx.sort(getSortStrategy(sortBy, comparer, order));
		};
		function createNewSortInstance(opts) {
			var comparer = castComparer(opts.comparer);
			return function(arrayToSort) {
				var ctx = _p_ArrayIsArray(arrayToSort) && !opts.inPlaceSorting ? arrayToSort.slice() : arrayToSort;
				return {
					asc: function(sortBy) {
						return sortArray(1, ctx, sortBy, comparer);
					},
					desc: function(sortBy) {
						return sortArray(-1, ctx, sortBy, comparer);
					},
					by: function(sortBy) {
						return sortArray(1, ctx, sortBy, comparer);
					}
				};
			};
		}
		var defaultComparer = function(a, b, order) {
			if (a == null) return order;
			if (b == null) return -order;
			if (typeof a !== typeof b) return typeof a < typeof b ? -1 : 1;
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		};
		var sort = createNewSortInstance({ comparer: defaultComparer });
		var inPlaceSort = createNewSortInstance({
			comparer: defaultComparer,
			inPlaceSorting: true
		});
		exports$1.createNewSortInstance = createNewSortInstance;
		exports$1.defaultComparer = defaultComparer;
		exports$1.inPlaceSort = inPlaceSort;
		exports$1.sort = sort;
	})))();
	module.exports = { createNewSortInstance };
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/sorts/_internal.js
var require__internal = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	let fastSort;
	function getFastSort() {
		if (fastSort === void 0) fastSort = require_fast_sort();
		return fastSort;
	}
	exports.getFastSort = getFastSort;
}));

//#endregion
//#region node_modules/.pnpm/@socketsecurity+lib@6.5.2_typescript@7.0.2/node_modules/@socketsecurity/lib/dist/sorts/natural.js
var require_natural = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	const require_primordials_intl = require_intl();
	const require_sorts__internal = require__internal();
	/**
	* @file Locale-aware + numeric-aware comparison via `Intl.Collator`, plus the
	*   `naturalSorter` helper that wires the fast-sort engine to the natural
	*   comparator. Collator instances are lazy-created and cached because `new
	*   Intl.Collator()` is 10-14ms in Node — too expensive to call
	*   per-comparison.
	*/
	let cachedLocaleCompare;
	let cachedNaturalCompare;
	let cachedNaturalSorter;
	/**
	* Compare two strings using locale-aware comparison.
	*
	* @example
	*   ;```typescript
	*   localeCompare('a', 'b') // -1
	*   localeCompare('b', 'a') // 1
	*   localeCompare('a', 'a') // 0
	*   ```
	*/
	function localeCompare(x, y) {
		if (cachedLocaleCompare === void 0) cachedLocaleCompare = new require_primordials_intl.IntlCollator().compare;
		return cachedLocaleCompare(x, y);
	}
	/**
	* Compare two strings using natural sorting: numeric-aware and
	* case-insensitive.
	*
	* @example
	*   ;```typescript
	*   naturalCompare('file2', 'file10') // negative (file2 before file10)
	*   naturalCompare('img10', 'img2') // positive (img10 after img2)
	*   ```
	*/
	function naturalCompare(x, y) {
		if (cachedNaturalCompare === void 0) cachedNaturalCompare = new require_primordials_intl.IntlCollator(void 0, {
			numeric: true,
			sensitivity: "base"
		}).compare;
		return cachedNaturalCompare(x, y);
	}
	/**
	* Sort an array using natural comparison.
	*
	* @example
	*   ;```typescript
	*   naturalSorter(['file10', 'file2', 'file1']).asc()
	*   // ['file1', 'file2', 'file10']
	*   ```
	*/
	function naturalSorter(arrayToSort) {
		if (cachedNaturalSorter === void 0) cachedNaturalSorter = require_sorts__internal.getFastSort().createNewSortInstance({ comparer: naturalCompare });
		return cachedNaturalSorter(arrayToSort);
	}
	exports.localeCompare = localeCompare;
	exports.naturalCompare = naturalCompare;
	exports.naturalSorter = naturalSorter;
}));

//#endregion
//#region .config/fleet/oxlint-plugin/lib/comparators.mts
var import_natural = require_natural();
/**
* Total order over two strings: the fleet's natural comparator
* (case-insensitive + numeric-aware) from `@socketsecurity/lib`. Pass extracted
* sort keys, not nodes.
*/
function stringComparator(a, b) {
	return (0, import_natural.naturalCompare)(a, b);
}
/**
* True when `keys` are already in non-decreasing natural order — the fast-path
* guard a sort rule runs before building a sorted copy + reporting. Shares the
* comparator with `stringComparator` so the two never disagree.
*/
function isAlreadySorted(keys) {
	for (let i = 1, { length } = keys; i < length; i += 1) if (stringComparator(keys[i - 1], keys[i]) > 0) return false;
	return true;
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/sort-array-literals/index.mts
/**
* @file Sort an array literal's elements alphanumerically when it carries a
*   leading `/* sort *​/` marker comment. Per CLAUDE.md "Sorting": config
*   lists, allowlists, and set-like collections sort; position-bearing arrays
*   argv, priority lists, weight tables, keep their meaningful order. Plain
*   arrays can't be sorted blindly — order often carries meaning — so this rule
*   is OPT-IN: it fires only on an array whose declaration is preceded by a `/*
*   sort *​/` block comment, where the author has declared the order
*   irrelevant. Uses the fleet `stringComparator` (natural order:
*   case-insensitive + numeric-aware), identical to the rest of the
*   `socket/sort-*` family. Autofix rewrites the elements in order. Only fires
*   when every element is a string/number Literal — a mixed-type or
*   expression-bearing array is reported, so the marker isn't silently ignored
*   but not auto-fixed. Detection is range-based rather than
*   AST-comment-attachment-based: oxlint attaches a leading comment to the
*   `export`/declaration wrapper, not the ArrayExpression, so the rule pairs
*   each `/* sort *​/` comment with the array whose `range[0]` follows it
*   across only a declaration prefix (`export const NAME =`), nothing else.
*/
const SORT_MARKER_RE = /^\s*sort\s*$/;
const DECL_PREFIX_RE = /^\s*(?:export\s+)?(?:const|let|var)\s+[\w$]+\s*=\s*$/;
function isSortableElement$1(node) {
	return node !== void 0 && node.type === "Literal" && (typeof node.value === "string" || typeof node.value === "number");
}
function compareSortable$1(a, b) {
	return stringComparator(String(a.value), String(b.value));
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$8 = {
	meta: {
		type: "problem",
		docs: {
			description: "Sort `/* sort */`-marked array literal elements alphanumerically (CLAUDE.md sorting rule).",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: {
			unsorted: "`/* sort */`-marked array elements should be sorted alphanumerically. Expected: [{{expected}}]",
			unsortedNoFix: "`/* sort */`-marked array has mixed-type or non-literal elements; sort manually or drop the marker."
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const markerEnds = [];
		const comments = sourceCode.getAllComments ? sourceCode.getAllComments() : [];
		for (let i = 0, { length } = comments; i < length; i += 1) {
			const comment = comments[i];
			if (comment.type === "Block" && SORT_MARKER_RE.test(comment.value)) markerEnds.push(comment.range[1]);
		}
		function markerPrecedes(arrayStart) {
			for (let i = 0, { length } = markerEnds; i < length; i += 1) {
				const end = markerEnds[i];
				if (end < arrayStart) {
					const between = sourceCode.text.slice(end, arrayStart);
					if (DECL_PREFIX_RE.test(between)) return true;
				}
			}
			return false;
		}
		return { ArrayExpression(node) {
			if (markerEnds.length === 0 || !markerPrecedes(node.range[0])) return;
			const els = node.elements;
			if (els.length < 2) return;
			if (els.some((e) => e !== void 0 && e.type === "SpreadElement")) return;
			if (!els.every(isSortableElement$1)) {
				context.report({
					node,
					messageId: "unsortedNoFix"
				});
				return;
			}
			const sorted = [...els].toSorted(compareSortable$1);
			if (sorted.every((s, i) => s === els[i])) return;
			const expected = sorted.map((e) => sourceCode.getText(e)).join(", ");
			context.report({
				node,
				messageId: "unsorted",
				data: { expected },
				fix(fixer) {
					return fixer.replaceText(node, `[${expected}]`);
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/lib/logical-chain.mts
function flattenLogicalChain(node, op, out) {
	if (node.type === "LogicalExpression" && node.operator === op) {
		flattenLogicalChain(node.left, op, out);
		flattenLogicalChain(node.right, op, out);
	} else out.push(node);
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/sort-boolean-chains/index.mts
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$7 = {
	meta: {
		type: "problem",
		docs: {
			description: "Sort all-identifier boolean chains alphanumerically (`a && b && c`, `x || y || z`).",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: { unsorted: "Boolean chain identifiers are out of alphabetical order. Saw `{{actual}}`, expected `{{expected}}`." },
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		/**
		* Returns true if a comment lies anywhere between the first and last leaf
		* of the chain. Reordering through a comment would silently relocate
		* attribution.
		*/
		function hasInteriorComment(leaves) {
			if (!sourceCode.getCommentsInside) return false;
			const first = leaves[0];
			const last = leaves[leaves.length - 1];
			return sourceCode.getCommentsInside({
				range: [first.range[0], last.range[1]],
				loc: {
					start: first.loc.start,
					end: last.loc.end
				},
				type: "Program"
			}).length > 0;
		}
		function isInBooleanContext(node) {
			let cur = node;
			let parent = cur.parent;
			while (parent) {
				if (parent.type === "UnaryExpression" && parent.operator === "!") return true;
				if (parent.type === "LogicalExpression") {
					cur = parent;
					parent = cur.parent;
					continue;
				}
				if ((parent.type === "ConditionalExpression" || parent.type === "DoWhileStatement" || parent.type === "IfStatement" || parent.type === "WhileStatement") && parent.test === cur) return true;
				if (parent.type === "ForStatement" && parent.test === cur) return true;
				return false;
			}
			return false;
		}
		function checkChain(rootNode) {
			const parent = rootNode.parent;
			if (parent && parent.type === "LogicalExpression" && parent.operator === rootNode.operator) return;
			if (!isInBooleanContext(rootNode)) return;
			const op = rootNode.operator;
			if (op !== "&&" && op !== "||") return;
			const leaves = [];
			flattenLogicalChain(rootNode, op, leaves);
			if (leaves.length < 3) return;
			const names = [];
			for (let i = 0, { length } = leaves; i < length; i += 1) {
				const leaf = leaves[i];
				if (leaf.type !== "Identifier") return;
				names.push(leaf.name);
			}
			if (new Set(names).size !== names.length) return;
			const sortedNames = [...names].toSorted();
			const actualOrder = names.join(", ");
			const expectedOrder = sortedNames.join(", ");
			if (actualOrder === expectedOrder) return;
			if (hasInteriorComment(leaves)) {
				context.report({
					node: rootNode,
					messageId: "unsorted",
					data: {
						actual: actualOrder,
						expected: expectedOrder
					}
				});
				return;
			}
			context.report({
				node: rootNode,
				messageId: "unsorted",
				data: {
					actual: actualOrder,
					expected: expectedOrder
				},
				fix(fixer) {
					const fixes = [];
					for (let i = 0; i < leaves.length; i++) fixes.push(fixer.replaceText(leaves[i], sortedNames[i]));
					return fixes;
				}
			});
		}
		return { LogicalExpression: checkChain };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/sort-equality-disjunctions/index.mts
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$6 = {
	meta: {
		type: "problem",
		docs: {
			description: "Sort string-equality disjunctions alphanumerically (`x === \"a\" || x === \"b\"`).",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: { unsorted: "String-equality disjunction operands are out of alphabetical order. Saw `{{actual}}`, expected `{{expected}}`." },
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		/**
		* For a binary-equality leaf, return `{ left, right, operator }` if it's
		* the shape we sort. Returns undefined otherwise.
		*/
		function asEqualityClause(node) {
			if (node.type !== "BinaryExpression") return;
			if (node.operator !== "!==" && node.operator !== "===") return;
			if (node.right.type !== "Literal" || typeof node.right.value !== "string") return;
			if (node.left.type !== "Identifier" && node.left.type !== "MemberExpression") return;
			return {
				leftText: sourceCode.getText(node.left),
				operator: node.operator,
				right: node.right,
				rightValue: node.right.value
			};
		}
		/**
		* Returns true if a comment lies anywhere between the first and last leaf
		* of the chain. Comment-aware skipping prevents the autofix from silently
		* relocating attribution.
		*/
		function hasInteriorComment(leaves) {
			if (!sourceCode.getCommentsInside) return false;
			const first = leaves[0];
			const last = leaves[leaves.length - 1];
			return sourceCode.getCommentsInside({
				range: [first.range[0], last.range[1]],
				loc: {
					start: first.loc.start,
					end: last.loc.end
				},
				type: "Program"
			}).length > 0;
		}
		function checkChain(rootNode) {
			const parent = rootNode.parent;
			if (parent && parent.type === "LogicalExpression" && parent.operator === rootNode.operator) return;
			const op = rootNode.operator;
			if (op !== "&&" && op !== "||") return;
			const leaves = [];
			flattenLogicalChain(rootNode, op, leaves);
			/* c8 ignore start - flattenLogicalChain on a LogicalExpression always yields ≥2 leaves */
			if (leaves.length < 2) return;
			const clauses = [];
			for (let i = 0, { length } = leaves; i < length; i += 1) {
				const leaf = leaves[i];
				const c = asEqualityClause(leaf);
				if (!c) return;
				clauses.push(c);
			}
			const firstLeft = clauses[0].leftText;
			const firstOp = clauses[0].operator;
			for (let i = 1; i < clauses.length; i++) if (clauses[i].leftText !== firstLeft || clauses[i].operator !== firstOp) return;
			if (op === "||" && firstOp !== "===") return;
			if (op === "&&" && firstOp !== "!==") return;
			const sortedClauses = [...clauses].toSorted((a, b) => stringComparator(a.rightValue, b.rightValue));
			const actualOrder = clauses.map((c) => c.rightValue).join(", ");
			const expectedOrder = sortedClauses.map((c) => c.rightValue).join(", ");
			if (actualOrder === expectedOrder) return;
			if (hasInteriorComment(leaves)) {
				context.report({
					node: rootNode,
					messageId: "unsorted",
					data: {
						actual: actualOrder,
						expected: expectedOrder
					}
				});
				return;
			}
			context.report({
				node: rootNode,
				messageId: "unsorted",
				data: {
					actual: actualOrder,
					expected: expectedOrder
				},
				fix(fixer) {
					const fixes = [];
					for (let i = 0; i < leaves.length; i++) {
						const leaf = leaves[i];
						const targetRight = sortedClauses[i].right;
						const rawTarget = sourceCode.getText(targetRight);
						fixes.push(fixer.replaceText(asEqualityClause(leaf).right, rawTarget));
					}
					return fixes;
				}
			});
		}
		return { LogicalExpression: checkChain };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/lib/comment-checks.mts
/**
* True when any comment lives strictly between `first` and `last` (inclusive of
* their span) inside `container`. Callers pass the container node whose
* children are being reordered plus the first and last child. Returns false
* when the source-code object lacks `getCommentsInside` (older AST shapes) —
* the rule then proceeds with the autofix, matching prior behavior.
*/
function hasInteriorComments(sourceCode, container, first, last) {
	if (!sourceCode.getCommentsInside) return false;
	return sourceCode.getCommentsInside(container).some((c) => c.range[0] >= first.range[0] && c.range[1] <= last.range[1]);
}

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/sort-named-imports/index.mts
/**
* @file Per CLAUDE.md "Sorting" rule: sort the named-imports inside a single
*   `import { ... }` statement alphanumerically (natural order:
*   case-insensitive + numeric-aware). Default + namespace imports (`import
*   foo, { ... } from`, `import * as ns from`) keep their leading binding; only
*   the named-imports clause gets sorted. Detects `import { c, b, a } from
*   'pkg'` (and aliased forms like `import { c as x, b, a } from 'pkg'`).
*   Autofix: rewrites the brace contents in alphabetical order. Comments inside
*   the brace are NOT moved — when there's a comment between specifiers, the
*   rule skips the autofix and only reports, because reordering through a
*   comment can break attribution. The rewrite preserves trailing-newline /
*   multi-line layout: a single-line block stays single-line; a multi-line
*   block stays multi-line with one specifier per line. Sort key: the
*   _imported_ name (before any `as` alias), so `Z as a, A as z` sorts to `A as
*   z, Z as a`, the import side is the stable identity, not the local.
*/
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$5 = {
	meta: {
		type: "problem",
		docs: {
			description: "Sort named imports alphanumerically within an import statement.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: { unsorted: "Named imports must be sorted alphabetically. Saw `{{actual}}`, expected `{{expected}}`." },
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		function specSortKey(spec) {
			if (spec.imported?.name) return spec.imported.name;
			if (spec.imported?.value) return spec.imported.value;
			return spec.local?.name ? spec.local.name : "";
		}
		return { ImportDeclaration(node) {
			const named = node.specifiers.filter((s) => s.type === "ImportSpecifier");
			if (named.length < 2) return;
			const keys = named.map(specSortKey);
			if (isAlreadySorted(keys)) return;
			const sorted = [...named].toSorted((a, b) => stringComparator(specSortKey(a), specSortKey(b)));
			const sortedKeys = sorted.map(specSortKey);
			const first = named[0];
			const last = named[named.length - 1];
			if (hasInteriorComments(sourceCode, node, first, last)) {
				context.report({
					node,
					messageId: "unsorted",
					data: {
						actual: keys.join(", "),
						expected: sortedKeys.join(", ")
					}
				});
				return;
			}
			context.report({
				node,
				messageId: "unsorted",
				data: {
					actual: keys.join(", "),
					expected: sortedKeys.join(", ")
				},
				fix(fixer) {
					const openBrace = sourceCode.getTokenBefore(first, { filter: (t) => t.value === "{" });
					const closeBrace = sourceCode.getTokenAfter(last, { filter: (t) => t.value === "}" });
					if (!openBrace || !closeBrace) return;
					const sliceStart = openBrace.range[1];
					const sliceEnd = closeBrace.range[0];
					const original = sourceCode.text.slice(sliceStart, sliceEnd);
					const isMultiline = /\n/.test(original);
					let indent = "";
					if (isMultiline) {
						const m = original.match(/\n(?<indent>[ \t]*)/);
						/* c8 ignore start - regex always matches when isMultiline is true; named group always populates */
						if (m) indent = m.groups?.indent ?? "";
					}
					const specTexts = sorted.map((s) => sourceCode.getText(s));
					let rebuilt;
					if (isMultiline) {
						rebuilt = "\n" + specTexts.map((t) => indent + t).join(",\n");
						const trailingComma = /,\s*$/.test(original.replace(/\s+$/, "")) ? "," : "";
						const closeIndent = indent.replace(/^(?: {2}| {4}|\t)/, "");
						rebuilt += trailingComma + "\n" + closeIndent;
					} else rebuilt = " " + specTexts.join(", ") + " ";
					return fixer.replaceTextRange([sliceStart, sliceEnd], rebuilt);
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/sort-object-literal-properties/index.mts
/**
* @file Per CLAUDE.md "Sorting" rule: sort the sibling properties of an object
*   literal alphanumerically (literal byte order — ASCII before letters). Scope
*   is deliberately narrow to avoid touching order-bearing object literals:
*   only literals that are the initializer of a module-scope `const`, an
*   `export const`, or an `export default` are checked. `__proto__: null` (and
*   a bare `__proto__` shorthand) always sorts first, ahead of any data key —
*   it's the fleet's "treat this as data, not a class" marker and must lead.
*   The one exception to alphabetical is a rule-definition object (carries BOTH
*   a `meta` and a `create`/`createOnce` property — the canonical ESLint/oxlint
*   rule shape): it ENFORCES `meta` first + `create` last (the universal plugin
*   convention) instead, since alphabetical would read backwards from every
*   other plugin.
*   Autofix rewrites the brace contents in sorted order, preserving single-line
*   vs multi-line layout (mirrors `sort-named-imports`). The fix is SKIPPED
*   (report-only) when: any property is a spread (`...rest`) — reordering
*   across a spread changes runtime semantics; any property is computed (`[k]:
*   v`) — the key isn't a stable sort token; or a comment lives between the
*   first and last property — moving properties would break comment
*   attribution. Opt out an intentionally order-bearing literal (HTTP header
*   order, protocol field order) with a trailing or leading `// socket-lint:
*   allow object-property-order` comment.
*/
/**
* @type {import('eslint').Rule.RuleModule}
*/
const BYPASS_RE$2 = /socket-lint:\s*allow\s+object-property-order\b/;
const PROTO_KEY = "\0";
const rule$4 = {
	meta: {
		type: "problem",
		docs: {
			description: "Sort object literal properties alphanumerically (module-scope / exported literals).",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: {
			ruleShape: "A rule-definition object keeps the canonical `{ meta, create }` order (meta first, create last), not alphabetical. Saw `{{actual}}`, expected `{{expected}}`.",
			unsorted: "Object properties must be sorted alphabetically. Saw `{{actual}}`, expected `{{expected}}`."
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE$2);
		function propSortKey(prop) {
			if (prop.type === "ExperimentalSpreadProperty" || prop.type === "SpreadElement") return;
			if (prop.computed) return;
			const key = prop.key;
			if (!key) return;
			const name = key.name !== void 0 ? key.name : key.value !== void 0 ? String(key.value) : void 0;
			if (name === void 0) return;
			return name === "__proto__" ? PROTO_KEY : name;
		}
		function hasImpureValue(prop) {
			const v = prop.value;
			if (!v || typeof v.type !== "string") return false;
			return v.type === "AwaitExpression" || v.type === "CallExpression" || v.type === "NewExpression" || v.type === "TaggedTemplateExpression" || v.type === "YieldExpression";
		}
		function isRuleDefinition(properties) {
			let hasMeta = false;
			let hasCreate = false;
			for (let i = 0, { length } = properties; i < length; i += 1) {
				const k = propSortKey(properties[i]);
				if (k === "meta") hasMeta = true;
				else if (k === "create" || k === "createOnce") hasCreate = true;
			}
			return hasMeta && hasCreate;
		}
		function isCreateProp(prop) {
			const k = propSortKey(prop);
			return k === "create" || k === "createOnce";
		}
		function ruleShapeOrder(properties) {
			const meta = properties.filter((p) => propSortKey(p) === "meta");
			const create = properties.filter(isCreateProp);
			const others = properties.filter((p) => propSortKey(p) !== "meta" && !isCreateProp(p));
			return [
				...meta,
				...others,
				...create
			];
		}
		function checkObject(node) {
			const props = node.properties;
			if (!props || props.length < 2) return;
			if (hasBypassComment(node)) return;
			const keys = props.map(propSortKey);
			if (keys.some((k) => k === void 0)) return;
			const safeKeys = keys;
			const ruleShape = isRuleDefinition(props);
			if (!ruleShape && isAlreadySorted(safeKeys)) return;
			const hasSideEffectValue = props.some(hasImpureValue);
			const sorted = ruleShape ? ruleShapeOrder(props) : [...props].toSorted((a, b) => stringComparator(propSortKey(a), propSortKey(b)));
			if (sorted.every((p, i) => p === props[i])) return;
			const messageId = ruleShape ? "ruleShape" : "unsorted";
			const displayKey = (prop) => {
				const k = prop.key;
				return k?.name !== void 0 ? k.name : String(k?.value);
			};
			const actual = props.map(displayKey).join(", ");
			const expected = sorted.map(displayKey).join(", ");
			const first = props[0];
			const last = props[props.length - 1];
			if (hasSideEffectValue || hasInteriorComments(sourceCode, node, first, last)) {
				context.report({
					node,
					messageId: "unsorted",
					data: {
						actual,
						expected
					}
				});
				return;
			}
			context.report({
				node,
				messageId,
				data: {
					actual,
					expected
				},
				fix(fixer) {
					const openBrace = sourceCode.getTokenBefore(first, { filter: (t) => t.value === "{" });
					const closeBrace = sourceCode.getTokenAfter(last, { filter: (t) => t.value === "}" });
					if (!openBrace || !closeBrace) return;
					const sliceStart = openBrace.range[1];
					const sliceEnd = closeBrace.range[0];
					const original = sourceCode.text.slice(sliceStart, sliceEnd);
					const isMultiline = /\n/.test(original);
					const propTexts = sorted.map((p) => sourceCode.getText(p));
					let rebuilt;
					if (isMultiline) {
						let indent = "";
						const m = original.match(/\n(?<indent>[ \t]*)/);
						/* c8 ignore start - m is always non-null when isMultiline is true (original always contains \n); groups.indent is always a string from a named capture */
						if (m) indent = m.groups?.indent ?? "";
						/* c8 ignore stop */
						const trailingComma = /,\s*$/.test(original.replace(/\s+$/, "")) ? "," : "";
						const closeIndent = indent.replace(/^(?: {2}| {4}|\t)/, "");
						rebuilt = "\n" + propTexts.map((t) => indent + t).join(",\n") + trailingComma + "\n" + closeIndent;
					} else rebuilt = " " + propTexts.join(", ") + " ";
					return fixer.replaceTextRange([sliceStart, sliceEnd], rebuilt);
				}
			});
		}
		function isInScope(node) {
			const parent = node.parent;
			if (!parent) return false;
			if (parent.type === "ExportDefaultDeclaration") return true;
			if (parent.type === "VariableDeclarator" && parent.init === node) {
				const decl = parent.parent;
				const declParent = decl?.parent;
				if (decl?.type === "VariableDeclaration" && (declParent?.type === "Program" || declParent?.type === "ExportNamedDeclaration")) return true;
			}
			return false;
		}
		return { ObjectExpression(node) {
			if (isInScope(node)) checkObject(node);
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/sort-regex-alternations/index.mts
const SOCKET_LINT_MARKER_RE = /(?:#|\/\*|\/\/)\s*socket-lint:\s*allow(?:\s+(?<tag>[\w-]+))?/;
const SIMPLE_ALT_ELEMENT_RE = /^[\w\-:./]+$/;
function isLineMarkered(line) {
	const m = line.match(SOCKET_LINT_MARKER_RE);
	if (!m) return false;
	const tag = m.groups?.["tag"];
	return !tag || tag === "regex-alternation-order";
}
/**
* Find every alternation group in a regex pattern. Returns `{ start, end,
* prefix, alternatives, suffix }` for each group. Walks the pattern character
* by character to handle nested groups + character classes correctly.
*/
function findAlternationGroups(pattern) {
	const groups = [];
	const stack = [];
	let inClass = false;
	let i = 0;
	while (i < pattern.length) {
		const c = pattern[i];
		if (c === "\\") {
			i += 2;
			continue;
		}
		if (inClass) {
			if (c === "]") inClass = false;
			i++;
			continue;
		}
		if (c === "[") {
			inClass = true;
			i++;
			continue;
		}
		if (c === "(") {
			let prefixEnd = i + 1;
			let prefix = "(";
			if (pattern[prefixEnd] === "?") {
				prefix += "?";
				prefixEnd++;
				const next = pattern[prefixEnd];
				if (next === ":" || next === "!" || next === "=") {
					prefix += next;
					prefixEnd++;
				} else if (next === "<") {
					prefix += "<";
					prefixEnd++;
					const after = pattern[prefixEnd];
					if (after === "!" || after === "=") {
						prefix += after;
						prefixEnd++;
					} else {
						while (prefixEnd < pattern.length && pattern[prefixEnd] !== ">") {
							prefix += pattern[prefixEnd];
							prefixEnd++;
						}
						if (prefixEnd < pattern.length) {
							prefix += ">";
							prefixEnd++;
						}
					}
				}
			}
			stack.push({
				start: i,
				prefixEnd,
				alts: [],
				altStart: prefixEnd
			});
			i = prefixEnd;
			continue;
		}
		if (c === "|" && stack.length > 0) {
			const top = stack[stack.length - 1];
			top.alts.push({
				start: top.altStart,
				end: i
			});
			top.altStart = i + 1;
			i++;
			continue;
		}
		if (c === ")") {
			const top = stack.pop();
			if (top) {
				top.alts.push({
					start: top.altStart,
					end: i
				});
				if (top.alts.length > 1) groups.push({
					altsRanges: top.alts,
					end: i,
					prefixEnd: top.prefixEnd,
					start: top.start
				});
			}
			i++;
			continue;
		}
		i++;
	}
	return groups;
}
/**
* True if any alternative is a prefix of another distinct alternative. When
* this holds, alternation order is semantically load-bearing (leftmost match
* wins), so the group must not be sorted OR flagged — alphabetical order would
* be wrong. e.g. `js` is a prefix of `jsx`.
*/
function hasPrefixOverlap(alts) {
	for (let i = 0, { length } = alts; i < length; i += 1) for (let j = 0; j < length; j += 1) if (i !== j && alts[j].startsWith(alts[i])) return true;
	return false;
}
/**
* True if any alternative contains an unescaped position anchor — `^` (start)
* or `$` (end). Such an alternation mixes a zero-width position with literal
* text (the `(^|\/)` "start-of-path or a slash" idiom, or `(^|$)`): the
* branches are different KINDS, not interchangeable values, so no alphanumeric
* order between them is meaningful and sorting only makes the pattern read
* worse. Skip these entirely — neither sort nor flag — like prefix-overlap
* groups. An escaped `\^` / `\$` is a literal, not an anchor, so it doesn't
* count.
*/
function hasAnchorBranch(alts) {
	return alts.some((alt) => {
		for (let i = 0, { length } = alt; i < length; i += 1) {
			const ch = alt[i];
			if ((ch === "^" || ch === "$") && alt[i - 1] !== "\\") return true;
		}
		return false;
	});
}
/**
* Sort an alternation in alphanumeric order. Returns null if any element isn't
* a simple literal, caller should report-only.
*/
function sortAlternativesIfSimple(pattern, group) {
	const alts = group.altsRanges.map((r) => pattern.slice(r.start, r.end));
	if (!alts.every((a) => SIMPLE_ALT_ELEMENT_RE.test(a))) return;
	if (hasPrefixOverlap(alts)) return;
	const sorted = [...alts].toSorted();
	if (alts.every((a, i) => a === sorted[i])) return;
	return {
		actual: alts,
		sorted
	};
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$3 = {
	meta: {
		type: "problem",
		docs: {
			description: "Sort regex alternation groups alphanumerically per the CLAUDE.md sorting rule.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: {
			unsorted: "Regex alternation `({{actual}})` is not sorted alphanumerically. Expected `({{sorted}})`.",
			unsortedNoFix: "Regex alternation `({{actual}})` is not sorted alphanumerically. Expected `({{sorted}})`. (Not auto-fixed: contains non-literal elements; sort manually or append `// socket-lint: allow regex-alternation-order` if the order is intentional.)"
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		function checkLiteral(node) {
			if (!node.regex) return;
			if (isLineMarkered((context.getSourceCode ? context.getSourceCode() : context.sourceCode).lines[node.loc.start.line - 1] ?? "")) return;
			const pattern = node.regex.pattern;
			const groups = findAlternationGroups(pattern);
			for (let i = 0, { length } = groups; i < length; i += 1) {
				const group = groups[i];
				if (hasAnchorBranch(group.altsRanges.map((r) => pattern.slice(r.start, r.end)))) continue;
				const result = sortAlternativesIfSimple(pattern, group);
				if (!result) {
					const alts = group.altsRanges.map((r) => pattern.slice(r.start, r.end));
					if (hasPrefixOverlap(alts)) continue;
					const sortedRaw = [...alts].toSorted();
					if (alts.every((a, idx) => a === sortedRaw[idx])) continue;
					context.report({
						node,
						messageId: "unsortedNoFix",
						data: {
							actual: alts.join("|"),
							sorted: sortedRaw.join("|")
						}
					});
					continue;
				}
				const before = pattern.slice(0, group.prefixEnd);
				const after = pattern.slice(group.end);
				const newPattern = before + result.sorted.join("|") + after;
				context.report({
					node,
					messageId: "unsorted",
					data: {
						actual: result.actual.join("|"),
						sorted: result.sorted.join("|")
					},
					fix(fixer) {
						const flags = node.regex.flags || "";
						return fixer.replaceText(node, `/${newPattern}/${flags}`);
					}
				});
			}
		}
		return { Literal(node) {
			checkLiteral(node);
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/sort-set-args/index.mts
/**
* @file Sort `new Set([...])` array elements alphanumerically. Per CLAUDE.md
*   "Sorting" rule, Set/SafeSet constructor arguments are sorted (natural
*   order: case-insensitive + numeric-aware). Order doesn't affect Set
*   semantics but keeps diff churn low and reading easier. Autofix: rewrites
*   the array literal in sorted order. Only fires when every element is a
*   Literal, string or number — mixed-type arrays or arrays containing
*   identifiers/expressions get reported but not auto-fixed (sorting computed
*   values would change behavior).
*/
const SET_NAMES = /* @__PURE__ */ new Set(["SafeSet", "Set"]);
function isSortableElement(node) {
	return node !== void 0 && node.type === "Literal" && (typeof node.value === "string" || typeof node.value === "number");
}
function compareSortable(a, b) {
	return stringComparator(String(a.value), String(b.value));
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const rule$2 = {
	meta: {
		type: "problem",
		docs: {
			description: "Sort Set/SafeSet constructor array arguments alphanumerically (CLAUDE.md sorting rule).",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: {
			unsorted: "{{name}}([...]) elements should be sorted alphanumerically. Expected: [{{expected}}]",
			unsortedNoFix: "{{name}}([...]) elements should be sorted alphanumerically (mixed-type or non-literal elements; sort manually)."
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		return { NewExpression(node) {
			const callee = node.callee;
			if (callee.type !== "Identifier" || !SET_NAMES.has(callee.name)) return;
			if (node.arguments.length !== 1) return;
			const arg = node.arguments[0];
			if (arg.type !== "ArrayExpression") return;
			const els = arg.elements;
			if (els.length < 2) return;
			if (els.some((e) => e !== void 0 && e.type === "SpreadElement")) return;
			if (!els.every(isSortableElement)) {
				context.report({
					node: arg,
					messageId: "unsortedNoFix",
					data: { name: callee.name }
				});
				return;
			}
			const sorted = [...els].toSorted(compareSortable);
			if (sorted.every((s, i) => s === els[i])) return;
			const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
			const expected = sorted.map((e) => sourceCode.getText(e)).join(", ");
			context.report({
				node: arg,
				messageId: "unsorted",
				data: {
					name: callee.name,
					expected
				},
				fix(fixer) {
					const newText = `[${expected}]`;
					return fixer.replaceText(arg, newText);
				}
			});
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/sort-source-methods/index.mts
const SCRIPT_ENTRY_NAMES = /* @__PURE__ */ new Set(["main"]);
/**
* Type-only top-level statements that can travel with the function they sit
* above. Reordering them is safe because they're erased at compile time (no
* runtime side effects, no declaration-order semantics).
*/
function isTypeOnlyStatement(node) {
	if (!node) return false;
	if (node.type === "TSInterfaceDeclaration" || node.type === "TSTypeAliasDeclaration") return true;
	if (node.type === "ExportNamedDeclaration" && node.declaration && (node.declaration.type === "TSInterfaceDeclaration" || node.declaration.type === "TSTypeAliasDeclaration")) return true;
	if (node.type === "ExportNamedDeclaration" && node.exportKind === "type" && !node.declaration) return true;
	return false;
}
function declVisibility(node) {
	if (node.type === "ExportNamedDeclaration" && node.declaration && node.declaration.type === "FunctionDeclaration") return {
		visibility: "export",
		fn: node.declaration
	};
	if (node.type === "ExportDefaultDeclaration" && node.declaration && node.declaration.type === "FunctionDeclaration") return {
		visibility: "export",
		fn: node.declaration
	};
	if (node.type === "FunctionDeclaration") return {
		visibility: "private",
		fn: node
	};
}
function sortKey(entry) {
	if (entry.isEntrypoint) return "2entrypoint";
	return `${entry.visibility === "private" ? "0" : "1"}${entry.name}`;
}
/**
* Locate the byte-range start of a function entry, including any leading JSDoc
* / line-comment block that's contiguous with it (a block separated by a blank
* line is treated as a free-standing comment and stays put). Falls back to the
* node's own start when there are no leading comments.
*/
function leadingCommentStart(sourceCode, node) {
	const comments = sourceCode.getCommentsBefore ? sourceCode.getCommentsBefore(node) : [];
	if (!comments || comments.length === 0) return node.range[0];
	const tokenText = sourceCode.text;
	let earliest = node.range[0];
	for (let i = comments.length - 1; i >= 0; i--) {
		const c = comments[i];
		const between = tokenText.slice(c.range[1], earliest);
		if (/\n\s*\n/.test(between)) break;
		earliest = c.range[0];
	}
	return earliest;
}
/**
* Locate the byte-range end of a function entry, including any trailing comment
* that's contiguous, no blank line between, and exclusive of the next function.
* Useful for capturing c8-ignore-stop markers that pair with a start above the
* function — those need to travel with the function when reordered.
*/
function trailingCommentEnd(sourceCode, node, nextNodeStart) {
	const tokenText = sourceCode.text;
	const comments = sourceCode.getCommentsAfter ? sourceCode.getCommentsAfter(node) : [];
	let latest = node.range[1];
	if (!comments || comments.length === 0) return latest;
	for (let i = 0, { length } = comments; i < length; i += 1) {
		const c = comments[i];
		if (nextNodeStart !== void 0 && c.range[0] >= nextNodeStart) break;
		const between = tokenText.slice(latest, c.range[0]);
		if (/\n\s*\n/.test(between)) break;
		latest = c.range[1];
	}
	return latest;
}
/**
* @type {import('eslint').Rule.RuleModule}
*/
const BYPASS_RE$1 = /socket-lint:\s*allow\s+source-method-order\b/;
const rule$1 = {
	meta: {
		type: "problem",
		docs: {
			description: "Top-level functions sorted by visibility (private→export) and alphanumerically within each group.",
			category: "Stylistic Issues",
			recommended: true
		},
		fixable: "code",
		messages: {
			entrypointOutOfOrder: "Script entrypoint `{{name}}` must be the final top-level function.",
			groupOutOfOrder: "Top-level function `{{name}}` ({{visibility}}) appears after a function from the next visibility group. Order: private functions first (alphanumeric), then exported functions (alphanumeric).",
			alphaOutOfOrder: "Top-level function `{{name}}` ({{visibility}}) is out of alphanumeric order within its visibility group. Expected to come before `{{prev}}`."
		},
		schema: []
	},
	create(context) {
		if (isLockstepMirror(context)) return {};
		const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode;
		const allComments = sourceCode.getAllComments ? sourceCode.getAllComments() : [];
		if (allComments.length ? allComments.some((c) => BYPASS_RE$1.test(String(c.value ?? ""))) : BYPASS_RE$1.test(sourceCode.text ?? "")) return {};
		return { Program(programNode) {
			const entries = [];
			let lastVisibilityRank = -1;
			let lastNameInGroup = void 0;
			let currentVisibility = void 0;
			const violations = [];
			const bodyByIndex = programNode.body;
			for (let i = 0; i < bodyByIndex.length; i++) {
				const node = bodyByIndex[i];
				const info = declVisibility(node);
				if (!info || !info.fn.id || info.fn.id.type !== "Identifier") continue;
				const name = info.fn.id.name;
				const isEntrypoint = SCRIPT_ENTRY_NAMES.has(name);
				let start = leadingCommentStart(sourceCode, node);
				let j = i - 1;
				while (j >= 0 && isTypeOnlyStatement(bodyByIndex[j])) {
					const prevEntry = entries[entries.length - 1];
					if (prevEntry && prevEntry.end > bodyByIndex[j].range[0]) break;
					start = leadingCommentStart(sourceCode, bodyByIndex[j]);
					j -= 1;
				}
				const nextStart = i + 1 < bodyByIndex.length ? bodyByIndex[i + 1].range[0] : void 0;
				const end = trailingCommentEnd(sourceCode, node, nextStart);
				entries.push({
					node,
					name,
					visibility: info.visibility,
					isEntrypoint,
					start,
					end
				});
				if (isEntrypoint) continue;
				const rank = info.visibility === "private" ? 0 : 1;
				if (rank < lastVisibilityRank) {
					violations.push({
						node: info.fn.id,
						messageId: "groupOutOfOrder",
						data: {
							name,
							visibility: info.visibility
						}
					});
					continue;
				}
				if (rank !== lastVisibilityRank) {
					currentVisibility = info.visibility;
					lastVisibilityRank = rank;
					lastNameInGroup = name;
					continue;
				}
				if (lastNameInGroup !== null && name < lastNameInGroup) violations.push({
					node: info.fn.id,
					messageId: "alphaOutOfOrder",
					data: {
						name,
						visibility: currentVisibility,
						prev: lastNameInGroup
					}
				});
				else lastNameInGroup = name;
			}
			for (let i = 0, last = entries.length - 1; i < last; i += 1) {
				const entry = entries[i];
				if (!entry.isEntrypoint) continue;
				const info = declVisibility(entry.node);
				violations.push({
					node: info?.fn.id ?? entry.node,
					messageId: "entrypointOutOfOrder",
					data: { name: entry.name }
				});
			}
			if (violations.length === 0) return;
			const sorted = entries.slice().toSorted((a, b) => stringComparator(sortKey(a), sortKey(b)));
			const orderedByPosition = entries.slice().toSorted((a, b) => a.start - b.start);
			const sourceText = sourceCode.text;
			const rangeStart = orderedByPosition[0].start;
			const rangeEnd = orderedByPosition[orderedByPosition.length - 1].end;
			for (const stmt of programNode.body) {
				if (entries.some((e) => e.node === stmt) || isTypeOnlyStatement(stmt)) continue;
				if (stmt.range[0] >= rangeStart && stmt.range[1] <= rangeEnd) {
					for (let i = 0, { length } = violations; i < length; i += 1) {
						const v = violations[i];
						context.report(v);
					}
					return;
				}
			}
			const replacement = sorted.map((e) => sourceText.slice(e.start, e.end)).join("\n\n");
			let fixerAttached = false;
			for (let i = 0, { length } = violations; i < length; i += 1) {
				const v = violations[i];
				if (!fixerAttached) {
					context.report({
						...v,
						fix(fixer) {
							return fixer.replaceTextRange([rangeStart, rangeEnd], replacement);
						}
					});
					fixerAttached = true;
				} else context.report(v);
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/fleet/use-fleet-canonical-api-token-getter/index.mts
const FLAGGED_PROPERTIES = /* @__PURE__ */ new Set(["SOCKET_API_KEY", "SOCKET_API_TOKEN"]);
const BYPASS_RE = /socket-api-token-getter:\s*allow direct-env/;
function isProcessEnv(node) {
	if (node.type !== "MemberExpression") return false;
	const obj = node.object;
	const prop = node.property;
	if (!obj || !prop) return false;
	if (obj.type !== "Identifier" || obj.name !== "process") return false;
	if (prop.type !== "Identifier" || prop.name !== "env") return false;
	return true;
}
const rule = {
	meta: {
		type: "problem",
		docs: {
			description: "Use readSocketApiToken / readSocketApiTokenSync from @socketsecurity/lib-stable/secrets/socket-api-token instead of process.env reads of SOCKET_API_TOKEN / SOCKET_API_KEY.",
			category: "Best Practices",
			recommended: true
		},
		messages: { directEnv: "`process.env.{{name}}` direct env read — use `readSocketApiToken()` / `readSocketApiTokenSync()` from @socketsecurity/lib-stable/secrets/socket-api-token. Direct env reads skip the keychain fallback. Bootstrap/setup code can suppress with `// socket-api-token-getter: allow direct-env`." },
		schema: []
	},
	create(context) {
		const filename = context.filename ?? context.getFilename?.() ?? "";
		if (/\/src\/secrets\//.test((0, import_normalize.normalizePath)(filename))) return {};
		const hasBypassComment = makeBypassChecker(context, BYPASS_RE);
		function reportName(node, name) {
			if (hasBypassComment(node)) return;
			context.report({
				node,
				messageId: "directEnv",
				data: { name }
			});
		}
		return { MemberExpression(node) {
			const obj = node.object;
			if (!obj || !isProcessEnv(obj)) return;
			const prop = node.property;
			if (!prop) return;
			const computed = node.computed;
			if (!computed && prop.type === "Identifier") {
				const name = prop.name ?? "";
				if (FLAGGED_PROPERTIES.has(name)) reportName(node, name);
				return;
			}
			if (computed && prop.type === "Literal") {
				const v = prop.value;
				if (typeof v === "string" && FLAGGED_PROPERTIES.has(v)) reportName(node, v);
			}
		} };
	}
};

//#endregion
//#region .config/fleet/oxlint-plugin/index.mts
/**
* @file Fleet oxlint plugin. Custom rules that encode the fleet's CLAUDE.md
*   style guide as lint errors with autofix where the rewrite is unambiguous.
*   Why a plugin instead of a separate scanner: oxlint's native plugin surface
*   integrates with the existing `pnpm run lint` pipeline, inherits oxlint's
*   AST + sourcemap + fix-application machinery, and keeps the rule set
*   discoverable via `oxlint --rules`. Wiring: `.config/fleet/oxlintrc.json`
*   adds this plugin via `jsPlugins: ["oxlint-plugin/index.mts"]` and
*   enables rules under the `socket/` namespace. Each rule is its own dir under
*   `fleet/` (mirrors `.claude/hooks/fleet/<name>/`); this file's rule imports
*   \+ `rules: {}` registry are generated by `pnpm run sync-oxlint-rules` from
*   that dir inventory.
*/
/**
* @type {import('eslint').ESLint.Plugin}
*/
const plugin = {
	meta: {
		name: "socket",
		version: "0.5.0"
	},
	rules: {
		"bag-param-optionality-naming": rule$106,
		"export-top-level-functions": rule$105,
		"exported-name-has-domain-word": rule$104,
		"guard-contract": rule$103,
		"inclusive-language": rule$102,
		"max-comment-block-lines": rule$101,
		"max-file-lines": rule$100,
		"no-agent-brand-assumption": rule$99,
		"no-bare-crypto-named-usage": rule$98,
		"no-bare-spawn-childproc-access": rule$97,
		"no-boolean-trap-param": rule$96,
		"no-cached-for-on-iterable": rule$95,
		"no-comment-glob-star-slash": rule$94,
		"no-console-prefer-logger": rule$93,
		"no-default-export": rule$92,
		"no-deprecation": rule$91,
		"no-dynamic-import-outside-bundle": rule$90,
		"no-eslint-biome-config-ref": rule$89,
		"no-fetch-prefer-http-request": rule$88,
		"no-file-scope-oxlint-disable": rule$87,
		"no-fileoverview-prefer-file": rule$86,
		"no-inline-defer-async": rule$85,
		"no-inline-logger": rule$84,
		"no-lib-barrel-import": rule$83,
		"no-logger-newline-literal": rule$82,
		"no-malformed-bypass-marker": rule$81,
		"no-minified-bundler-output": rule$80,
		"no-module-eval-side-effects": rule$79,
		"no-namespace-import": rule$78,
		"no-npx-dlx": rule$77,
		"no-optional-positional-trap": rule$76,
		"no-options-param-mutation": rule$75,
		"no-package-manager-auto-update-reenable": rule$74,
		"no-parenthetical-aside": rule$73,
		"no-placeholders": rule$72,
		"no-platform-specific-import": rule$71,
		"no-private-path-in-source": rule$70,
		"no-process-chdir": rule$69,
		"no-process-cwd-in-scripts-hooks": rule$68,
		"no-promise-race": rule$67,
		"no-promise-race-in-loop": rule$66,
		"no-required-in-options-bag": rule$65,
		"no-runtime-features-below-engine-floor": rule$64,
		"no-source-content-tests": rule$63,
		"no-source-sniffing": rule$62,
		"no-spawn-stream-double-consume": rule$61,
		"no-spawnsync-code-field": rule$60,
		"no-src-import-in-test-expect": rule$59,
		"no-status-emoji": rule$58,
		"no-structured-clone-prefer-json": rule$57,
		"no-sync-rm-in-test-lifecycle": rule$56,
		"no-top-level-await": rule$55,
		"no-underscore-identifier": rule$54,
		"no-use-strict-in-esm": rule$53,
		"no-vitest-empty-test": rule$52,
		"no-vitest-focused-tests": rule$51,
		"no-vitest-identical-title": rule$50,
		"no-vitest-skipped-tests": rule$49,
		"no-vitest-standalone-expect": rule$48,
		"no-which-for-local-bin": rule$47,
		"normalize-path-before-match": rule$46,
		"optional-explicit-undefined": rule$45,
		"options-null-proto": rule$44,
		"options-param-naming": rule$43,
		"personal-path-placeholders": rule$42,
		"prefer-all-settled": rule$41,
		"prefer-async-spawn": rule$40,
		"prefer-cached-for-loop": rule$39,
		"prefer-ellipsis-char": rule$38,
		"prefer-env-as-boolean": rule$37,
		"prefer-error-message": rule$36,
		"prefer-error-message-helper": rule$35,
		"prefer-exists-sync": rule$34,
		"prefer-find-repo-root": rule$33,
		"prefer-find-up-package-json": rule$32,
		"prefer-function-declaration": rule$31,
		"prefer-lib-versions-over-semver": rule$30,
		"prefer-mirror-lock-write": rule$29,
		"prefer-mock-import": rule$28,
		"prefer-node-builtin-imports": rule$27,
		"prefer-non-capturing-group": rule$26,
		"prefer-normalize-path": rule$25,
		"prefer-optional-chain": rule$24,
		"prefer-pure-call-form": rule$23,
		"prefer-repo-root-dot-cache": rule$22,
		"prefer-safe-delete": rule$21,
		"prefer-separate-type-import": rule$20,
		"prefer-shell-win32": rule$19,
		"prefer-spawn-over-execsync": rule$18,
		"prefer-stable-self-import": rule$17,
		"prefer-static-type-import": rule$16,
		"prefer-typebox-schema": rule$15,
		"prefer-undefined-over-null": rule$14,
		"prefer-windows-test-helpers": rule$13,
		"require-async-iife-entry": rule$12,
		"require-regex-comment": rule$11,
		"require-vitest-globals-import": rule$10,
		"socket-api-token-env": rule$9,
		"sort-array-literals": rule$8,
		"sort-boolean-chains": rule$7,
		"sort-equality-disjunctions": rule$6,
		"sort-named-imports": rule$5,
		"sort-object-literal-properties": rule$4,
		"sort-regex-alternations": rule$3,
		"sort-set-args": rule$2,
		"sort-source-methods": rule$1,
		"use-fleet-canonical-api-token-getter": rule
	}
};

//#endregion
export { plugin as default };