const xml2js = require("xml2js");
const fs = require("fs");
const xlsx = require("node-xlsx").default;


/**
 * Parses the wages xml file to get the service industry average weekly wages for each county code.
 * @returns A dictionary that look like: '01141': { countyCode: '01141', averageWeeklyWage: 807, wageCoefficient: 65.62 }
 */
const getWorkforceWages = () => {
    const parser = new xml2js.Parser({ attrkey: "ATTR" });
    let xml_string = fs.readFileSync("./data/US_St_Cn_Table_Workforce_Wages.xml", "utf8");

    const res = {};
    let highestWage = Number.MIN_VALUE;
    let lowestWage = Number.MAX_VALUE;

    // Parse xml document and create data points.
    parser.parseString(xml_string, function (error, result) {
        if (error === null) {
            result["state-county-wage-data"].record.forEach(x => {

                // Check if this datapoint is for a service industry entry.
                if (x.Industry[0].startsWith("102 ") && !x["Area"][0].includes("Unknown Or Undefined")) {

                    // Create a new datapoint with the relevant data.
                    const dataPoint = {
                        area: x.Area[0],
                        areaCode: x.Area_Code[0],
                        averageWeeklyWage: parseInt(x["Annual_Average_Weekly_Wage"][0].replace("_", ""))
                    };

                    // Update highest and lowest wage.
                    if (highestWage < dataPoint.averageWeeklyWage) highestWage = dataPoint.averageWeeklyWage;
                    if (lowestWage > dataPoint.averageWeeklyWage) lowestWage = dataPoint.averageWeeklyWage;

                    res[dataPoint.areaCode] = dataPoint;
                };
            });
        } else {
            console.log(error);
        }
    });

    const difference = highestWage - lowestWage;

    Object.keys(res).forEach(x => {
        let coefficient = 0.0
        coefficient = res[x].averageWeeklyWage - lowestWage;
        coefficient = 100 - (coefficient / difference * 100);
        res[x].wageCoefficient = coefficient;
    });

    return res;
};


const getTaxRates = () => {
    const data = xlsx.parse("./data/County_Tax_Rate.xlsx")[0].data;

    const res = {};
    let lowestRate = Number.MAX_VALUE;
    let highestRate = Number.MIN_VALUE;

    for (let i = 1; i < data.length; i++) {
        const el = data[i];
        if (el[3] !== "None") {
            //Geo_id example: 0500000US01001
            const dataPoint = {
                areaCode: el[0].slice(el[0].lastIndexOf("US") + 2),
                localTaxRate: el[3]
            };
            res[dataPoint.areaCode] = dataPoint;

            if (dataPoint.localTaxRate < lowestRate) lowestRate = dataPoint.localTaxRate;
            if (dataPoint.localTaxRate > highestRate) highestRate = dataPoint.localTaxRate;
        }
    }

    // Calculate and assign coefficients based on lowest and highest rates.
    const difference = highestRate - lowestRate;
    Object.keys(res).forEach(k => {
        let coefficient = 0.0
        coefficient = res[k].localTaxRate - lowestRate;
        coefficient = 100 - (coefficient / difference * 100);
        res[k].taxRateCoefficient = coefficient;
    });

    return res;
};



// const wages = getWorkforceWagesArray();
const res = getTaxRateArray();
Object.values(res).forEach(x => console.log(x));

module.exports = {
    getWorkforceWages,
    getTaxRates
};