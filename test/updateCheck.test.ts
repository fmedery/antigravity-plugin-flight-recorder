import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkForUpdate } from "../src/server/updateCheck.js";
import {
  buildGitPullCommand,
  compareSemver,
  parseSemver
} from "../src/shared/updateCheck.js";

test("parseSemver and compareSemver handle standard, v-prefixed, prerelease, and invalid versions", () => {
  assert.deepEqual(parseSemver("0.2.0"), {
    major: 0,
    minor: 2,
    patch: 0,
    prerelease: null
  });
  assert.deepEqual(parseSemver(" v1.10.3-beta.2+build9 "), {
    major: 1,
    minor: 10,
    patch: 3,
    prerelease: "beta.2"
  });
  assert.equal(parseSemver("not-a-version"), null);
  assert.equal(parseSemver("1.2"), null);

  assert.equal(compareSemver("0.2.0", "0.2.0"), 0);
  assert.equal(compareSemver("v0.2.0", "0.2.0"), 0);
  assert.equal(compareSemver("0.2.0", "0.2.1"), -1);
  assert.equal(compareSemver("0.2.0", "0.3.0"), -1);
  assert.equal(compareSemver("0.2.0", "1.0.0"), -1);
  assert.equal(compareSemver("0.3.0", "0.2.9"), 1);
  assert.equal(compareSemver("0.3.0-beta.1", "0.3.0"), -1);
  assert.equal(compareSemver("0.3.0-beta.2", "0.3.0-beta.10"), -1);
  assert.equal(compareSemver("0.3.0", "bad"), null);
});

test("buildGitPullCommand quotes paths safely on POSIX and Windows", () => {
  assert.equal(
    buildGitPullCommand("/Users/dev/.gemini/config/plugins/flight-recorder", "darwin"),
    "git -C /Users/dev/.gemini/config/plugins/flight-recorder pull"
  );
  assert.equal(
    buildGitPullCommand("/Users/my user/flight-recorder", "linux"),
    "git -C '/Users/my user/flight-recorder' pull"
  );
  assert.equal(
    buildGitPullCommand("/Users/o'malley/flight-recorder", "linux"),
    "git -C '/Users/o'\\''malley/flight-recorder' pull"
  );
  assert.equal(
    buildGitPullCommand("C:\\Users\\Alice Smith\\.gemini\\config\\plugins\\flight-recorder", "win32"),
    'git -C "C:\\Users\\Alice Smith\\.gemini\\config\\plugins\\flight-recorder" pull'
  );
});

test("checkForUpdate handles up-to-date, git/zip update_available, and error conditions", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fr-update-test-"));
  const gitRoot = path.join(tmpDir, "git-install");
  const zipRoot = path.join(tmpDir, "zip-install");
  fs.mkdirSync(path.join(gitRoot, ".git"), { recursive: true });
  fs.mkdirSync(zipRoot, { recursive: true });
  fs.writeFileSync(
    path.join(gitRoot, "plugin.json"),
    JSON.stringify({ name: "flight-recorder", version: "0.2.0" }),
    "utf8"
  );
  fs.writeFileSync(
    path.join(zipRoot, "plugin.json"),
    JSON.stringify({ name: "flight-recorder", version: "0.2.0" }),
    "utf8"
  );

  const mockJsonResponse = (body: unknown, status = 200) =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" }
    });

  try {
    // 1. Up to date
    const upToDate = await checkForUpdate({
      pluginRoot: gitRoot,
      cacheTtlMs: 0,
      fetchImpl: async () =>
        mockJsonResponse({ name: "flight-recorder", version: "0.2.0" })
    });
    assert.equal(upToDate.status, "up_to_date");
    assert.equal(upToDate.currentVersion, "0.2.0");
    assert.equal(upToDate.latestVersion, "0.2.0");
    assert.equal(upToDate.installMethod, "git");
    assert.ok(upToDate.updateCommand?.startsWith("git -C "));

    // 2. Update available on git install
    const gitUpdate = await checkForUpdate({
      pluginRoot: gitRoot,
      platform: "darwin",
      cacheTtlMs: 0,
      fetchImpl: async () =>
        mockJsonResponse({ name: "flight-recorder", version: "0.2.1" })
    });
    assert.equal(gitUpdate.status, "update_available");
    assert.equal(gitUpdate.latestVersion, "0.2.1");
    assert.equal(gitUpdate.installMethod, "git");
    assert.equal(gitUpdate.updateCommand, `git -C ${gitRoot} pull`);

    // 3. Update available on ZIP install (no .git dir)
    const zipUpdate = await checkForUpdate({
      pluginRoot: zipRoot,
      cacheTtlMs: 0,
      fetchImpl: async () =>
        mockJsonResponse({ name: "flight-recorder", version: "0.3.0" })
    });
    assert.equal(zipUpdate.status, "update_available");
    assert.equal(zipUpdate.installMethod, "zip");
    assert.equal(zipUpdate.updateCommand, null);

    // 4. HTTP error
    const httpErr = await checkForUpdate({
      pluginRoot: gitRoot,
      cacheTtlMs: 0,
      fetchImpl: async () => mockJsonResponse("Server Error", 500)
    });
    assert.equal(httpErr.status, "error");
    assert.match(httpErr.message ?? "", /HTTP 500/);

    // 5. Network failure
    const netErr = await checkForUpdate({
      pluginRoot: gitRoot,
      cacheTtlMs: 0,
      fetchImpl: async () => {
        throw new TypeError("fetch failed");
      }
    });
    assert.equal(netErr.status, "error");
    assert.match(netErr.message ?? "", /Could not reach GitHub/);

    // 6. Timeout / AbortError
    const timeoutErr = await checkForUpdate({
      pluginRoot: gitRoot,
      cacheTtlMs: 0,
      fetchImpl: async () => {
        const err = new Error("The operation timed out");
        err.name = "TimeoutError";
        throw err;
      }
    });
    assert.equal(timeoutErr.status, "error");
    assert.match(timeoutErr.message ?? "", /timed out/i);

    // 7. Malformed JSON, wrong plugin name, invalid version
    for (const badBody of [
      "{not-json",
      { name: "other-plugin", version: "9.9.9" },
      { name: "flight-recorder", version: "bad" }
    ]) {
      const badRes = await checkForUpdate({
        pluginRoot: gitRoot,
        cacheTtlMs: 0,
        fetchImpl: async () => mockJsonResponse(badBody)
      });
      assert.equal(badRes.status, "error");
      assert.match(badRes.message ?? "", /valid version/);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
