const express = require("express");
const app = express();

express.static.mime.types["wasm"] = "application/wasm";
app.use(express.static("./dist"));
app.listen(3000, () => console.log("Serving at http://localhost:3000"));
