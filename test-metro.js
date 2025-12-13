try {
    const { withNativeWind } = require("nativewind/metro");
    console.log("Success: nativewind/metro loaded");
} catch (e) {
    console.error("Error loading nativewind/metro:", e);
}

try {
    const config = require("./metro.config.js");
    console.log("Success: metro.config.js loaded");
} catch (e) {
    console.error("Error loading metro.config.js:", e);
}
