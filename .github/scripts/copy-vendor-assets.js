const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", "..");
const vendorDir = path.join(projectRoot, "dist", "vendor");

const vendorFiles = [
    {
        source: path.join(projectRoot, "node_modules", "marked", "lib", "marked.esm.js"),
        target: path.join(vendorDir, "marked.esm.js")
    },
    {
        source: path.join(projectRoot, "node_modules", "dompurify", "dist", "purify.es.mjs"),
        target: path.join(vendorDir, "purify.es.mjs")
    }
];

fs.mkdirSync(vendorDir, { recursive: true });

for (const file of vendorFiles) {
    fs.copyFileSync(file.source, file.target);
}

console.log("Vendor Markdown assets copied.");
