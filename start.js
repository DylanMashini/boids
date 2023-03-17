const express = require("express");
const app = express();

express.static.mime.types["wasm"] = "application/wasm";
app.use((req, res, next) => {
	res.set("Cross-Origin-Opener-Policy", "same-origin");
	res.set("Cross-Origin-Embedder-Policy", "require-corp");
	next();
});

app.use(express.static("./dist"));
app.listen(3001, () => console.log("Serving at http://localhost:3001"));
