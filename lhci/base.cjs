// Shared Lighthouse CI settings. Used by lighthouserc.mobile.cjs and lighthouserc.desktop.cjs.
// CI is the fast guard; the strict local check (performance >= 95 everywhere) is `npm run qa`.
const PORT = 3100;
const base = `http://localhost:${PORT}`;

module.exports = function makeConfig(preset) {
  const settings = { chromeFlags: "--no-sandbox --headless=new" };
  if (preset === "desktop") settings.preset = "desktop";
  return {
    ci: {
      collect: {
        startServerCommand: `npx next start -p ${PORT}`,
        startServerReadyPattern: "Ready",
        startServerReadyTimeout: 60000,
        url: [`${base}/`, `${base}/projects/foodlens`, `${base}/this-page-does-not-exist`],
        numberOfRuns: 3,
        settings: { ...settings, ignoreStatusCode: true }, // the 404 page answers 404 on purpose
      },
      assert: {
        assertMatrix: [
          // Home and the case study: performance error below 0.90, warning below 0.95;
          // accessibility, best practices and SEO must be 1.
          {
            matchingUrlPattern: "^http://localhost:\\d+/(projects/foodlens)?$",
            aggregationMethod: "median-run",
            assertions: {
              "categories:performance": ["error", { minScore: 0.9 }],
              "categories:accessibility": ["error", { minScore: 1 }],
              "categories:best-practices": ["error", { minScore: 1 }],
              "categories:seo": ["error", { minScore: 1 }],
            },
          },
          {
            matchingUrlPattern: "^http://localhost:\\d+/(projects/foodlens)?$",
            aggregationMethod: "median-run",
            aggregationMethod: "median-run",
            assertions: { "categories:performance": ["warn", { minScore: 0.95 }] },
          },
          // The 404 page: performance and accessibility only (SEO and best practices are
          // below 100 by design for a noindex 404 that the browser logs).
          {
            matchingUrlPattern: "this-page-does-not-exist",
            aggregationMethod: "median-run",
            assertions: {
              "categories:performance": ["error", { minScore: 0.9 }],
              "categories:accessibility": ["error", { minScore: 1 }],
            },
          },
          {
            matchingUrlPattern: "this-page-does-not-exist",
            aggregationMethod: "median-run",
            aggregationMethod: "median-run",
            assertions: { "categories:performance": ["warn", { minScore: 0.95 }] },
          },
        ],
      },
      upload: { target: "filesystem", outputDir: `lhci/out-${preset}` },
    },
  };
};
