const fs = require('fs');
const {program} = require('commander');
const variantConfig = {
    5: {
        filterField: 'mpg',
        compare: (val, limit) => val < limit
    }
};
const currentVariant = variantConfig[5];

program
    .option('-i, --input <path>', 'path to input file')
    .option('-o, --output <path>', 'path to output file')
    .option('-d, --display [fields]', 'display result (can specify comma-separated fields)')
    .option('-f, --filter <value>', 'filter value for the main numeric field');

program.parse(process.argv);
const options = program.opts();

if (!options.input) {
    console.error("Please, specify input file");
    process.exit(1);
}

if (!fs.existsSync(options.input)) {
    console.error("Cannot find input file");
    process.exit(1);
}

try {
    const rawData = fs.readFileSync(options.input, 'utf8');
    let data = JSON.parse(rawData);

    if (data.length === 0) {
        console.log("File is empty");
        process.exit(0);
    }

    let fieldsToShow;
    if (typeof options.display === 'string') {
        fieldsToShow = options.display.split(',').map(f => f.trim());
    } else {
        fieldsToShow = Object.keys(data[0]);
    }

    let filteredData = data;

    if (options.filter) {
        const limit = parseFloat(options.filter);
        filteredData = data.filter(item =>
            currentVariant.compare(item[currentVariant.filterField], limit)
        );
    }

    const getWidth = (field) => (field === 'model' ? 25 : 10);

    const header = fieldsToShow
        .map(field => field.toUpperCase().padEnd(getWidth(field)))
        .join(' | ');

    const separator = fieldsToShow
        .map(field => '-'.repeat(getWidth(field)))
        .join('-|-');

    const resultStrings = filteredData.map(item => {
        return fieldsToShow
            .map(field => {
                const value = String(item[field] ?? '');
                return value.padEnd(getWidth(field));
            })
            .join(' | ');
    });

    const finalOutput = [header, separator, ...resultStrings].join('\n');

    if (options.display) console.log(finalOutput);
    if (options.output) fs.writeFileSync(options.output, finalOutput, "utf8");

} catch (err) {
    console.error("Error processing file");
    process.exit(1);
}