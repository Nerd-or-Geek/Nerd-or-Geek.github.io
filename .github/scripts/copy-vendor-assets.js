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
    },
    {
        source: path.join(projectRoot, "node_modules", "leaflet", "dist", "leaflet.js"),
        target: path.join(vendorDir, "leaflet.js")
    },
    {
        source: path.join(projectRoot, "node_modules", "leaflet", "dist", "leaflet.css"),
        target: path.join(vendorDir, "leaflet.css")
    }
];

fs.mkdirSync(vendorDir, { recursive: true });

for (const file of vendorFiles) {
    fs.copyFileSync(file.source, file.target);
}

// Copy Leaflet's marker/control images so the CSS relative paths resolve correctly
const leafletImgSrc = path.join(projectRoot, "node_modules", "leaflet", "dist", "images");
const leafletImgDst = path.join(vendorDir, "images");
fs.mkdirSync(leafletImgDst, { recursive: true });
for (const img of fs.readdirSync(leafletImgSrc)) {
    fs.copyFileSync(path.join(leafletImgSrc, img), path.join(leafletImgDst, img));
}

console.log("Vendor assets copied.");
