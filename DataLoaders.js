const xml2js = require("xml2js");
const fs = require("fs");


/**
 * Parses the wages xml file to get the service industry average weekly wages for each county code.
 * @returns An array of objects that look like: { countyCode: '141', averageWeeklyWage: '807' }
 */
const getWorkforceWagesArray = () => {
    const parser = new xml2js.Parser({ attrkey: "ATTR" });
    let xml_string = fs.readFileSync("./data/US_St_Cn_Table_Workforce_Wages.xml", "utf8");

    const res = [];

    parser.parseString(xml_string, function (error, result) {
        if (error === null) {
            result["state-county-wage-data"].record.forEach(x => {
                if (x.Industry[0].startsWith("102 ")) {
                    res.push({
                        countyCode: x.Cnty[0],
                        averageWeeklyWage: parseInt(x["Annual_Average_Weekly_Wage"][0].replace("_", ""))
                    });
                };
            });
        } else {
            console.log(error);
        }
    });

    return res;
};

const filtered = getWorkforceWagesArray();
filtered.forEach(x => console.log(x));


module.exports = {
    getWorkforceWagesArray
};