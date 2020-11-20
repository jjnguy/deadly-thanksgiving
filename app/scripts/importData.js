const fs = require('fs');
const parse = require('csv-parse/lib/sync');

fs.readFile('app/resources/covid_confirmed_usafacts.csv', (err, data) => {
  if (err) throw err;
  let records = parse(data, {
    skip_empty_lines: true
  });

  let resultData = [];

  let key = records[0];

  let twoWeeksAgo = new Date(Date.now() - 12096e5);

  for (let i = 1; i < records.length; i++) {
    let record = records[i];

    var prev = 0;
    let county = record[1];
    let state = record[2];

    let infectionCount = 0;
    let recordCount = 0;

    for (let j = 4; j < record.length; j++) {
      let date = formatDate(key[j]);

      if (Date.parse(date) < twoWeeksAgo) continue;

      let next = parseInt(record[j]);

      infectionCount += next - prev;
      recordCount++;

      prev = next;
    }

    resultData.push({
      state: state,
      county: county,
      avgInfected: parseFloat(infectionCount / recordCount),
    });
  }

  fs.writeFile("app/src/covid_infections.json", JSON.stringify(resultData, null, '  '), function (err) {
    console.log('Done loading infections');
  });
})

fs.readFile('app/resources/covid_county_population_usafacts.csv', (err, data) => {
  if (err) throw err;
  let records = parse(data, {
    skip_empty_lines: true
  });

  let resultData = [];

  for (let i = 1; i < records.length; i++) {
    let record = records[i];

    resultData.push({ county: record[1], state: record[2], pop: parseInt(record[3]) });
  }

  fs.writeFile("app/src/covid_populations.json", JSON.stringify(resultData, null, '  '), function (err) {
    console.log('Done loading populations');
  });
});

function formatDate(csvDate) {
  let splitDate = csvDate.split('/');

  let dateNum = (num) => (parseInt(num)).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

  return `20${splitDate[2]}-${dateNum(splitDate[0])}-${dateNum(splitDate[1])}`;
}