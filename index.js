const { generateOutputArray } = require("./DataLoaders");
const {saveAsExcelFile} = require("./Writers");

const res = generateOutputArray();
saveAsExcelFile(res);