/** @type {import('vite').UserConfig} */
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import wasmPack from "vite-plugin-wasm-pack";

export default {
	// config options
	publicDir: "./static",
	plugins: [
		{
			name: "configure-response-headers",
			configureServer: server => {
				server.middlewares.use((_req, res, next) => {
					res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
					res.setHeader(
						"Cross-Origin-Embedder-Policy",
						"require-corp"
					);
					next();
				});
			},
		},
		wasmPack("rs"),
	],
	build: {
		minify: false,
	},
};
