import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";
import indexCss from "./index.css?raw";
import headers from "../nginx/security-headers.conf?raw";
import siteConf from "../nginx/default.conf.template?raw";

// The web app loads everything from its own origin: no request may reach a third party
// (privacy, and a content policy that allows only 'self').
const fonts = import.meta.glob("../public/fonts/*", { query: "?url", import: "default", eager: true });

describe("no third-party hosts", () => {
  it("page and stylesheet reference no external URL", () => {
    expect(indexHtml).not.toMatch(/https?:\/\//);
    expect(indexCss).not.toMatch(/url\(\s*["']?https?:/);
  });

  it("content policy allows only this origin", () => {
    const csp = /Content-Security-Policy "([^"]+)"/.exec(headers)?.[1] ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toMatch(/https?:/);
  });

  it("the header snippet is included wherever the app's own files are served", () => {
    const includes = siteConf.match(/include \/etc\/nginx\/snippets\/security-headers\.conf;/g) ?? [];
    expect(includes).toHaveLength(2); // location /assets/ and location /
    expect(siteConf).not.toMatch(/add_header Content-Security-Policy/);
  });

  it("the self-hosted font ships with its license", () => {
    const names = Object.keys(fonts).map((path) => path.split("/").pop());
    expect(names).toContain("OFL.txt");
    expect(names.filter((n) => n?.endsWith(".woff2"))).toHaveLength(4);
    for (const name of names.filter((n) => n?.endsWith(".woff2"))) {
      expect(indexCss).toContain(`/fonts/${name}`);
    }
  });
});
