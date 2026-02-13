//@ts-check

"use strict";
const path = require("path");
const { defineConfig } = require("@rspack/cli");

module.exports = defineConfig({
  target: "node", // vscode extensions run in a Node.js-context
  mode: "none", // this leaves the source code as close as possible to the original
  entry: "./src/extension.ts", // the entry point of this extension
  output: {
    // the bundle is stored in the 'dist' folder
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    library: {
      type: "commonjs2",
    },
  },
  externals: {
    vscode: "commonjs vscode", // the vscode-module must be excluded
    // modules added here also need to be added in the .vsceignore file
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  },
  resolve: {
    // support reading TypeScript and JavaScript files
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                },
              },
            },
          },
        ],
      },
    ],
  },
  devtool: "nosources-source-map",
});
