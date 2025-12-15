try {
    const { withNativeWind } = require("nativewind/metro");

} catch (e) {
    console.error("Error loading nativewind/metro:", e);
}

try {
    const config = require("./metro.config.js");

} catch (e) {
    console.error("Error loading metro.config.js:", e);
}
