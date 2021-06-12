import { IFinalDataPoint } from "./DataLoaders";

/**
 * Writes the given data into a new sheet in "locationScores.xlsx"
 * @param data An array of IFinalDataPoints
 */
export const saveIntoExcelFileAsNewSheet = (data: IFinalDataPoint[]): void => {
    const reader = require("xlsx");
    const file = reader.readFile("./output/locationScores.xlsx");
    const ws = reader.utils.json_to_sheet(data);
    reader.utils.book_append_sheet(file, ws);
    reader.writeFile(file, "./output/locationScores.xlsx");
};

export const saveAsSQLiteDatabase = (data: IFinalDataPoint): void => {
    var sql = require("sqlite3").verbose();
    var db = new sql.Database("./output/locationScores");
    db.serialize(function () {
        db.run("CREATE TABLE counties");
        var stmt = db.prepare("INSERT INTO counties VALUES (?)");
        for (let i = 0; i < 10; i++) {
            stmt.run("counties " + i);
        }
        stmt.finalize();
    });
    db.close();
};
