// const path = require("path");
// module.exports = {
// 	mode: "development",
// 	entry: "./index.js",
// 	output: {
// 		path: path.resolve(__dirname, "dist"),
// 		filename: "bundle.js",
// 	},
// 	experiments: {
// 		asyncWebAssembly: true,
// 	},
// };

const path = require("path");

module.exports = {
	entry: "./ts/index.ts",
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	output: {
		filename: "noWorkersBundle.js",
		path: path.resolve(__dirname, "dist"),
	},
	experiments: {
		asyncWebAssembly: true,
	},
};
