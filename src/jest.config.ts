module.exports = {
    preset: "ts-jest/presets/default-esm", // Use this preset for ESM support
    testEnvironment: "jest-environment-node", // Use Node environment
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    transform: {
        // Transform files with '.ts' or '.js' extension using 'babel-jest'
        "^.+\\.(ts|js)$": "babel-jest",
    },
    transformIgnorePatterns: ["/node_modules/(?!(axios)/)"],
    jest: {
        moduleNameMapper: {
            axios: "<rootDir>/node_modules/axios/dist/node/axios.cjs",
        },
    },
    // testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    // globals: {
    //     "ts-jest": {
    //         tsconfig: "tsconfig.json",
    //         useESM: true,
    //     },
    // },
    // extensionsToTreatAsEsm: [".ts"], // Treat .ts files as ESM
};
