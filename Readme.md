# Optimal Office Location

This is a project built during a hiring event by **Bank Of America** and [**NITW**](https://nitw.org/).

It consists of a Node.js app that merges different datasets into a single one, and also assings a score to each datapoint.

### Running:
Requires Node, npm, and TypeScript to be installed.
- `npm install`
- `npm start`

After this, `locationScores.xlsx` should have a new sheet with the generated data.

<br>

## Task

![File Visualisation](/Adobe/FilesGraph.png)

- Create a dataset to facilitate choosing a location (county) to open a new office.
- Create coefficient scores for each location for:
    - Lowest average weekly wage
    - Lowest tax Rate
    - Highest unemployment Rate
    - Highest median Income
- Derive these metrics from [4 different data files](data/).
    - Extensions: JSON, XML, and XLSX.
- Create an aggregate score for each location, derived from the 4 scores described above.
- Export this new dataset into an [Excel/XLSX file](output/locationScores.xlsx), with rows sorted by score in descending order.

### Expected output sample:
![Expected Output](/Adobe/TableExample.png)

<br>

## Parsing Files

- [Implemented 4 methods](src/DataLoaders.ts#L18) to parse each file, to then return a dictionary like object were each key is a county code, and each value an object with a metric, and a coefficient score.
- Coefficient scores were calculated using the highest and lowest values for each metric.

<br>

## Merging datasets / exporting file
- [Implemented a method that merges all of the dictionaries into a single array](src/DataLoaders.ts#L216) which contains relevant metrics, as well as a newly generated aggregate scores for each location.
- It then sorts the array by score in ascending order.
- Implemented a method which writes the contents of this array into a new sheet in an excel file.

<br>

## Result
The result is an [Excel file containing 660 counties](output/locationScores.xlsx) sorted by scores in descending order.
