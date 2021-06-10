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
                localTaxRate: parseFloat(el[3])
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
        coefficient = (coefficient / difference * 100);
        res[k].taxRateCoefficient = coefficient;
    });

    return res;
};

const getUnemploymentRates = () => {

    const data = xlsx.parse("./data/Unemployment_By_County.xlsx")[0].data;
    const res = {};
    let lowestRate = Number.MAX_VALUE;
    let highestRate = Number.MIN_VALUE;

    for (let i = 1; i < data.length; i++) {
        const el = data[i];
        const dataPoint = {
            areaCode: el[1] + el[2],
            unemploymentRate: parseFloat(el[8])
        };
        if (dataPoint.unemploymentRate < lowestRate) lowestRate = dataPoint.unemploymentRate;
        if (dataPoint.unemploymentRate > highestRate) highestRate = dataPoint.unemploymentRate;
        res[dataPoint.areaCode] = dataPoint;
    }

    // Calculate and assign coefficients based on lowest and highest rates.
    const difference = highestRate - lowestRate;
    Object.keys(res).forEach(k => {
        let coefficient = 0.0
        coefficient = res[k].unemploymentRate - lowestRate;
        coefficient = (coefficient / difference * 100);
        res[k].unemploymentRateCoefficient = coefficient;
    });

    return res;
};

const getMedianIncomeNumbers = () => {

    const data = JSON.parse(fs.readFileSync("./data/Median_Income_County.json", "utf8"));
    const res = {};
    let lowestIncome = Number.MAX_VALUE;
    let highestIncome = Number.MIN_VALUE;
    
    for (let i = 1; i < data.length; i++){
        const el = data[i];
        const dataPoint = {
            areaCode: el[2] + el[3],
            medianIncome: parseInt(el[1]),
            county: el[0]
        };
        if (dataPoint.medianIncome < lowestIncome) lowestIncome = dataPoint.medianIncome;
        if (dataPoint.medianIncome > highestIncome) highestIncome = dataPoint.medianIncome;
        res[dataPoint.areaCode] = dataPoint;
    }

    const difference = highestIncome - lowestIncome;
    Object.keys(res).forEach(k => {
        let coefficient = 0.0;
        coefficient = res[k].medianIncome - lowestIncome;
        coefficient = (coefficient / difference * 100);
        res[k].medianIncomeCoefficient = coefficient;
    });

    return res;
};

const generateScore = (...coefficients) => {
    let res = 0;
    coefficients.forEach(c => res += c);
    return res / coefficients.length;
};

const generateOutputArray = () => {

    const workForceWages = getWorkforceWages();
    const taxRates = getTaxRates();
    const unemploymentRates = getUnemploymentRates();
    const medianIncomes = getMedianIncomeNumbers();

    const merged = [];
    Object.keys(workForceWages).forEach(k => {
        if ( taxRates[k]
            && unemploymentRates[k]
            && medianIncomes[k] ){

            merged.push({
                county: medianIncomes[k].county, 
                area_code: workForceWages[k].areaCode,
                score: generateScore(
                    workForceWages[k].wageCoefficient,
                    taxRates[k].taxRateCoefficient,
                    unemploymentRates[k].unemploymentRateCoefficient,
                    medianIncomes[k].medianIncomeCoefficient
                ),
                average_weekly_wage: workForceWages[k].averageWeeklyWage,
                tax_rate: taxRates[k].localTaxRate,
                unemployment_rate: unemploymentRates[k].unemploymentRate,
                median_income: medianIncomes[k].medianIncome
            });
        }
    });

    merged.sort((a, b) => a.score > b.score ? -1 : 1);

    return merged;
};

// const res = getWorkforceWages();
// const res = getTaxRates();
// const res = getUnemploymentRates();
// const res = getMedianIncomeNumbers();
// Object.values(res).forEach(x => console.log(x));

const res = generateOutputArray();
res.forEach(x => console.log(x));

module.exports = {
    getWorkforceWages,
    getTaxRates
};