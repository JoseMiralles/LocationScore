import {generateOutputArray} from "./DataLoaders";
import { saveIntoExcelFileAsNewSheet } from "./Writers";

const res = generateOutputArray();
// res.forEach(x => console.log(x));
saveIntoExcelFileAsNewSheet(res);