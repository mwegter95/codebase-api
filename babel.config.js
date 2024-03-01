module.exports = {
    presets: [
        [
            "@babel/preset-env", // Transpile ES6+ to a compatible version of JavaScript for Node.js
            {
                targets: {
                    node: "current", // Target the current version of Node.js
                },
            },
        ],
        "@babel/preset-typescript", // Add support for TypeScript
        // Add any other presets if necessary
    ],
    plugins: ["@babel/plugin-syntax-typescript"],
};
