import xml2js from "xml2js";
import fs from "fs";
import xlsx from "node-xlsx";


interface IWageDataPoint {
    wageCoefficient: number;
    area: string,
    areaCode: string,
    averageWeeklyWage: number
}

/**
 * Parses the wages xml file to get the service industry average weekly wages for each county code.
 * @returns A dictionary like object that look like:
 * {'01141': { areaCode: '01141', averageWeeklyWage: 807, wageCoefficient: 65.62 }, ...}
 */
const getWorkforceWages = (): {[indexer: string]: IWageDataPoint} => {
    const parser = new xml2js.Parser({ attrkey: "ATTR" });
    let xml_string = fs.readFileSync("./data/US_St_Cn_Table_Workforce_Wages.xml", "utf8");

    const res: {[indexer: string]: IWageDataPoint} = {};
    let highestWage = Number.MIN_VALUE;
    let lowestWage = Number.MAX_VALUE;

    // Parse xml document and create data points.
    parser.parseString(xml_string, function (error: string, result: any) {
        if (error === null) {
            result["state-county-wage-data"].record.forEach((x: any) => {

                // Check if this datapoint is for a service industry entry.
                if (x.Industry[0].startsWith("102 ")
                && !x["Area"][0].includes("Unknown Or Undefined")
                && parseInt(x["Annual_Average_Weekly_Wage"][0]) > 0) {

                    // Create a new datapoint with the relevant data.
                    const dataPoint: IWageDataPoint = {
                        area: x.Area[0],
                        areaCode: x.Area_Code[0],
                        averageWeeklyWage: parseInt(x["Annual_Average_Weekly_Wage"][0].replace("_", "")),
                        wageCoefficient: 0
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


interface ITaxRateDataPoint {
    taxRateCoefficient: number;
    areaCode: string,
    localTaxRate: number
}

/**
 * Parses the County_Tax_Rate.xlsx file.
 * @returns A dictionary like with area codes as keys, and relevant metrics as values.
 */
const getTaxRates = (): {[Indexer: string]: ITaxRateDataPoint} => {
    const data = xlsx.parse("./data/County_Tax_Rate.xlsx")[0].data;

    const res: {[Indexer: string]: ITaxRateDataPoint} = {};
    let lowestRate = Number.MAX_VALUE;
    let highestRate = Number.MIN_VALUE;

    for (let i = 1; i < data.length; i++) {
        const el: any = data[i];

        // If the tax rate exists, and it is bigger than 0.
        if (el[3] !== "None"
        && parseFloat(el[3]) > 0) {
            //Geo_id example: 0500000US01001
            const dataPoint: ITaxRateDataPoint = {
                areaCode: el[0].slice(el[0].lastIndexOf("US") + 2),
                localTaxRate: parseFloat(el[3]),
                taxRateCoefficient: 0
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


interface IUnemploymentRateDataPoint {
    areaCode: string,
    unemploymentRate: number,
    unemploymentRateCoefficient: number
}

/**
 * Parses Unemployment_By_County.xlsx and gathers data from it.
 * @returns A dictionary with area codes as keys, and IUnemploymentRateDataPoints as values.
 */
const getUnemploymentRates = (): {[Indexer: string]: IUnemploymentRateDataPoint} => {

    const data = xlsx.parse("./data/Unemployment_By_County.xlsx")[0].data;
    const res: {[Indexer: string]: IUnemploymentRateDataPoint} = {};
    let lowestRate = Number.MAX_VALUE;
    let highestRate = Number.MIN_VALUE;

    for (let i = 1; i < data.length; i++) {
        const el: any = data[i];
        const dataPoint: IUnemploymentRateDataPoint = {
            areaCode: el[1] + el[2],
            unemploymentRate: parseFloat(el[8]),
            unemploymentRateCoefficient: 0
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


interface IMedianIncomeNumbers {
    areaCode: string,
    medianIncome: number,
    county: number,
    medianIncomeCoefficient: number
}

const getMedianIncomeNumbers = (): {[Indexer: string]: IMedianIncomeNumbers} => {

    const data = JSON.parse(fs.readFileSync("./data/Median_Income_County.json", "utf8"));
    const res: {[Indexer: string]: IMedianIncomeNumbers} = {};
    let lowestIncome = Number.MAX_VALUE;
    let highestIncome = Number.MIN_VALUE;

    for (let i = 1; i < data.length; i++) {
        const el = data[i];
        if (el[1]) {
            const dataPoint: IMedianIncomeNumbers = {
                areaCode: el[2] + el[3],
                medianIncome: parseInt(el[1]),
                county: el[0],
                medianIncomeCoefficient: 0
            };
            if (dataPoint.medianIncome < lowestIncome) lowestIncome = dataPoint.medianIncome;
            if (dataPoint.medianIncome > highestIncome) highestIncome = dataPoint.medianIncome;
            res[dataPoint.areaCode] = dataPoint;
        }
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

const generateScore = (...coefficients: number[]): number => {
    let res = 0;
    coefficients.forEach(c => res += c);
    return res / coefficients.length;
};

interface IFinalDataPoint {
    county: number,
    area_code: string,
    score: number,
    average_weekly_wage: number,
    tax_rate: number,
    unemployment_rate: number,
    median_income: number
}

export const generateOutputArray = () => {

    // Generate dictionaries using datasates.
    const workForceWages = getWorkforceWages();
    const taxRates = getTaxRates();
    const unemploymentRates = getUnemploymentRates();
    const medianIncomes = getMedianIncomeNumbers();

    // Merge all of these dictionaries into a single array,
    // and assign a score to each county.
    const merged: IFinalDataPoint[] = [];
    Object.keys(workForceWages).forEach(k => {

        // Make sure that each county has all metrics before adding it.
        if (taxRates[k]
            && unemploymentRates[k]
            && medianIncomes[k]) {

            const dataPoint: IFinalDataPoint = {
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
            };

            merged.push(dataPoint);
        }
    });

    // Sort the array by score, in descending order.
    merged.sort((a, b) => a.score > b.score ? -1 : 1);

    return merged;
};

// const res = getWorkforceWages();
// const res = getTaxRates();
// const res = getUnemploymentRates();
// const res = getMedianIncomeNumbers();
// Object.values(res).forEach(x => console.log(x));

// const res = generateOutputArray();
// res.forEach(x => console.log(x));
