import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  checkForUpdate,
  detectInstallMethod,
  REMOTE_MANIFEST_URL,
  REMOTE_RELEASE_URL,
  REPO_URL
} from "../src/server/updateCheck.js";
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

test("detectInstallMethod distinguishes git, marketplace markers, and zip installs", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fr-method-test-"));
  try {
    const gitDir = path.join(tmpDir, "git-dir");
    fs.mkdirSync(path.join(gitDir, ".git"), { recursive: true });
    assert.equal(detectInstallMethod(gitDir), "git");

    const catalogIdDir = path.join(tmpDir, "-1870732469773246571");
    fs.mkdirSync(catalogIdDir, { recursive: true });
    assert.equal(detectInstallMethod(catalogIdDir), "marketplace");

    const markerDir = path.join(tmpDir, "mp-marker");
    fs.mkdirSync(markerDir, { recursive: true });
    fs.writeFileSync(path.join(markerDir, ".marketplace"), "partners\n", "utf8");
    assert.equal(detectInstallMethod(markerDir), "marketplace");

    const sourceManifestDir = path.join(tmpDir, "mp-source");
    fs.mkdirSync(sourceManifestDir, { recursive: true });
    fs.writeFileSync(
      path.join(sourceManifestDir, "plugin.json"),
      JSON.stringify({
        name: "flight-recorder",
        version: "0.3.0",
        source: "antigravity-plugins-partners"
      }),
      "utf8"
    );
    assert.equal(detectInstallMethod(sourceManifestDir), "marketplace");

    const zipDir = path.join(tmpDir, "flight-recorder");
    fs.mkdirSync(zipDir, { recursive: true });
    fs.writeFileSync(
      path.join(zipDir, "plugin.json"),
      JSON.stringify({ name: "flight-recorder", version: "0.3.0" }),
      "utf8"
    );
    assert.equal(detectInstallMethod(zipDir), "zip");
    assert.equal(detectInstallMethod(null), "zip");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("checkForUpdate checks GitHub Releases first, falls back to plugin.json on 404/403, and handles marketplace/git/zip/errors", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fr-update-test-"));
  const gitRoot = path.join(tmpDir, "git-install");
  const zipRoot = path.join(tmpDir, "zip-install");
  const mpRoot = path.join(tmpDir, "-1870732469773246571");
  fs.mkdirSync(path.join(gitRoot, ".git"), { recursive: true });
  fs.mkdirSync(zipRoot, { recursive: true });
  fs.mkdirSync(mpRoot, { recursive: true });
  for (const dir of [gitRoot, zipRoot, mpRoot]) {
    fs.writeFileSync(
      path.join(dir, "plugin.json"),
      JSON.stringify({ name: "flight-recorder", version: "0.3.0" }),
      "utf8"
    );
  }

  const mockJsonResponse = (body: unknown, status = 200) =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" }
    });

  try {
    // 1. Primary GitHub Release endpoint: up to date
    const upToDate = await checkForUpdate({
      pluginRoot: gitRoot,
      cacheTtlMs: 0,
      fetchImpl: async (url) => {
        assert.equal(String(url), REMOTE_RELEASE_URL);
        return mockJsonResponse({
          tag_name: "v0.3.0",
          html_url: `${REPO_URL}/releases/tag/v0.3.0`,
          draft: false,
          prerelease: false
        });
      }
    });
    assert.equal(upToDate.status, "up_to_date");
    assert.equal(upToDate.currentVersion, "0.3.0");
    assert.equal(upToDate.latestVersion, "0.3.0");
    assert.equal(upToDate.installMethod, "git");
    assert.equal(upToDate.source, "github_release");
    assert.equal(upToDate.releaseUrl, `${REPO_URL}/releases/tag/v0.3.0`);
    assert.ok(upToDate.updateCommand?.startsWith("git -C "));

    // 2. Primary GitHub Release endpoint: update available on marketplace install + untrusted html_url sanitized
    const mpUpdate = await checkForUpdate({
      pluginRoot: mpRoot,
      cacheTtlMs: 0,
      fetchImpl: async () =>
        mockJsonResponse({
          tag_name: "v1.0.0",
          html_url: "https://evil.example.com/phish",
          draft: false,
          prerelease: false
        })
    });
    assert.equal(mpUpdate.status, "update_available");
    assert.equal(mpUpdate.latestVersion, "1.0.0");
    assert.equal(mpUpdate.installMethod, "marketplace");
    assert.equal(mpUpdate.updateCommand, null);
    assert.equal(mpUpdate.releaseUrl, `${REPO_URL}/releases/tag/v1.0.0`);

    // 3. Fallback to raw plugin.json when Releases API returns 404 (no releases yet)
    const calledUrls: string[] = [];
    const fallbackGit = await checkForUpdate({
      pluginRoot: gitRoot,
      platform: "darwin",
      cacheTtlMs: 0,
      fetchImpl: async (url) => {
        const u = String(url);
        calledUrls.push(u);
        if (u === REMOTE_RELEASE_URL) return mockJsonResponse({ message: "Not Found" }, 404);
        assert.equal(u, REMOTE_MANIFEST_URL);
        return mockJsonResponse({ name: "flight-recorder", version: "0.3.1" });
      }
    });
    assert.deepEqual(calledUrls, [REMOTE_RELEASE_URL, REMOTE_MANIFEST_URL]);
    assert.equal(fallbackGit.status, "update_available");
    assert.equal(fallbackGit.latestVersion, "0.3.1");
    assert.equal(fallbackGit.source, "manifest");
    assert.equal(fallbackGit.releaseUrl, REPO_URL);
    assert.equal(
      fallbackGit.updateCommand,
      buildGitPullCommand(gitRoot, "darwin")
    );

    // 4. Fallback on 403 rate limit for ZIP install
    const fallbackZip = await checkForUpdate({
      pluginRoot: zipRoot,
      cacheTtlMs: 0,
      fetchImpl: async (url) => {
        if (String(url) === REMOTE_RELEASE_URL) return mockJsonResponse("rate limited", 403);
        return mockJsonResponse({ name: "flight-recorder", version: "0.4.0" });
      }
    });
    assert.equal(fallbackZip.status, "update_available");
    assert.equal(fallbackZip.installMethod, "zip");
    assert.equal(fallbackZip.updateCommand, null);
    assert.equal(fallbackZip.source, "manifest");

    // 5. HTTP 500 error
    const httpErr = await checkForUpdate({
      pluginRoot: gitRoot,
      cacheTtlMs: 0,
      fetchImpl: async () => mockJsonResponse("Server Error", 500)
    });
    assert.equal(httpErr.status, "error");
    assert.match(httpErr.message ?? "", /HTTP 500/);

    // 6. Network failure
    const netErr = await checkForUpdate({
      pluginRoot: gitRoot,
      cacheTtlMs: 0,
      fetchImpl: async () => {
        throw new TypeError("fetch failed");
      }
    });
    assert.equal(netErr.status, "error");
    assert.match(netErr.message ?? "", /Could not reach GitHub/);

    // 7. Timeout / AbortError
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

    // 8. Malformed JSON, draft release, wrong plugin name, invalid version
    for (const badRelease of [
      "{not-json",
      { tag_name: "v0.9.0", draft: true },
      { tag_name: "v0.9.0-rc.1", prerelease: true },
      { tag_name: "bad" }
    ]) {
      const badRes = await checkForUpdate({
        pluginRoot: gitRoot,
        cacheTtlMs: 0,
        fetchImpl: async () => mockJsonResponse(badRelease)
      });
      assert.equal(badRes.status, "error");
      assert.match(badRes.message ?? "", /valid version/);
    }

    for (const badManifest of [
      "{not-json",
      { name: "other-plugin", version: "9.9.9" },
      { name: "flight-recorder", version: "bad" }
    ]) {
      const badRes = await checkForUpdate({
        pluginRoot: gitRoot,
        cacheTtlMs: 0,
        fetchImpl: async (url) => {
          if (String(url) === REMOTE_RELEASE_URL) return mockJsonResponse({}, 404);
          return mockJsonResponse(badManifest);
        }
      });
      assert.equal(badRes.status, "error");
      assert.match(badRes.message ?? "", /valid version/);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
