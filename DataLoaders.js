const xml2js = require("xml2js");
const fs = require("fs");


const getWorkforceWagesArray = () => {
    const parser = new xml2js.Parser({ attrkey: "ATTR" });
    let xml_string = fs.readFileSync("./data/US_St_Cn_Table_Workforce_Wages.xml", "utf8");

    parser.parseString(xml_string, function (error, result) {
        if (error === null) {
            for (let i = 0; i <= 10; i++) {
                console.log(result["state-county-wage-data"].record[i]);
            }
        } else {
            console.log(error);
        }
    });
};

module.exports = {
    getWorkforceWagesArray
};