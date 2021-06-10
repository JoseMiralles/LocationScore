const saveAsExcelFile = (data) => {
    const reader = require("xlsx");
    const file = reader.readFile("./output/locationScores.xlsx");
    const ws = reader.utils.json_to_sheet(data);
    reader.utils.book_append_sheet(file, ws);
    reader.writeFile(file, "./output/locationScores.xlsx");
};

module.exports = {
    saveAsExcelFile
};