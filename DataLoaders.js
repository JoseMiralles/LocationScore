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
    let highestWage = Number.MIN_VALUE;
    let lowestWage = Number.MAX_VALUE;

    // Parse xml document and create data points.
    parser.parseString(xml_string, function (error, result) {
        if (error === null) {
            result["state-county-wage-data"].record.forEach(x => {

                // Check if this datapoint is for a service industry entry.
                if (x.Industry[0].startsWith("102 ")) {

                    // Create a new datapoint with the relevant data.
                    const dataPoint = {
                        countyCode: x.Cnty[0],
                        averageWeeklyWage: parseInt(x["Annual_Average_Weekly_Wage"][0].replace("_", ""))
                    };

                    // Update highest and lowest wage.
                    if (highestWage < dataPoint.averageWeeklyWage) highestWage = dataPoint.averageWeeklyWage;
                    if (lowestWage > dataPoint.averageWeeklyWage) lowestWage = dataPoint.averageWeeklyWage;

                    res.push(dataPoint);
                };
            });
        } else {
            console.log(error);
        }
    });

    const difference = highestWage - lowestWage;

    // Iterate trough the list, and assign a coefficient to each datapoint.
    res.forEach((x, i) => {
        let coefficient = 0.0
        coefficient = x.averageWeeklyWage - lowestWage;
        coefficient = 100 - (coefficient / difference * 100);
        res[i].wageCoefficient = coefficient;
    });

    return res;
};


const getTaxRateArray = () => {
    
};


module.exports = {
    getWorkforceWagesArray
};