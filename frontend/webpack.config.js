const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// Requests to /api are proxied to Django, so the frontend can use relative
// URLs and there's no CORS configuration to think about. Override the target
// with API_PROXY_TARGET if your backend isn't on port 8000.
const apiTarget = process.env.API_PROXY_TARGET || "http://localhost:8000";

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash:8].js",
    publicPath: "/",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          // Types are checked by `npm run typecheck` / `npm run build`, which
          // keeps the dev-server rebuild fast.
          options: { transpileOnly: true },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "./public/index.html" }),
  ],
  devtool: "source-map",
  devServer: {
    port: 3000,
    open: false,
    hot: true,
    // So client-side routes don't 404 if you add a router.
    historyApiFallback: true,
    proxy: [
      {
        context: ["/api"],
        target: apiTarget,
        changeOrigin: true,
      },
    ],
  },
};
