const fs = require("fs/promises");
const path = require("path");
const esbuild = require("esbuild");
const { sassPlugin } = require("esbuild-sass-plugin");

async function createAssetPaths() {
  const assetPath = path.join(__dirname, "../_site/assets");
  const assetDirs = await fs.readdir(assetPath);
  const assetsFiles = await Promise.all(
    assetDirs.map(async (dir) => {
      const files = await fs.readdir(
        path.join(__dirname, "../_site/assets", dir)
      );
      return files.map((file) => {
        const { name, ext } = path.parse(file);
        const hashedAt = name.lastIndexOf("-");
        const originalName = hashedAt > -1 ? name.slice(0, hashedAt) : name;
        const key = `${originalName}${ext}`;
        return {
          [key]: `/assets/${dir}/${file}`,
        };
      });
    })
  );
  const assets = Object.assign({}, ...assetsFiles.flat());
  const outputData = path.join(__dirname, "../_data/assetPaths.json");

  return await fs.writeFile(outputData, JSON.stringify(assets, null, 2));
}

esbuild
  .build({
    entryPoints: ["styles/styles.scss", "js/app.js", "js/admin.js"],
    entryNames: "[dir]/[name]-[hash]",
    outdir: "_site/assets",
    format: "iife",
    loader: {
      ".png": "dataurl",
      ".jpg": "dataurl",
      ".svg": "dataurl",
      ".ttf": "dataurl",
      ".woff": "dataurl",
      ".woff2": "dataurl",
    },
    minify: process.env.ELEVENTY_ENV === "production",
    sourcemap: process.env.ELEVENTY_ENV !== "production",
    target: ["chrome58", "firefox57", "safari11", "edge18"],
    plugins: [
      sassPlugin({
        loadPaths: [
          "./node_modules/@uswds",
          "./node_modules/@uswds/uswds/packages",
          "./node_modules/anchor-js/",
        ],
      }),
    ],
    bundle: true,
  })
  .then(() => createAssetPaths())
  .then(() => {
    console.log("Assets have been built!");
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
