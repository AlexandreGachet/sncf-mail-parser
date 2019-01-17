// Import required libraries
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

// Init parser attributes
let _$, _result;
let _node = "#main-column";

// Helper function to parse price (315,50 € => 315.5)
const _parsePrice = strPrice => {
  return parseFloat(strPrice.split(" ")[0].replace(",", "."));
};

// Parser definition
const parser = {
  // Define search node from HTML file
  init: filename => {
    try {
      // Load HTML file
      const filePath = fs.readFileSync(path.join(__dirname, filename), "utf8");

      // Clean escaped chars
      const content = filePath
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "")
        .replace(/\\r/g, "");

      // Load content
      _$ = cheerio.load(content);

      // Load node
      _node = _$(_node);

      // In case we load a new node, reset result
      _result = undefined;
    } catch (err) {
      const error = new Error(err);
      error.field = "init";
      throw error;
    }
  },

  // Retrieve client name
  getName: () => {
    try {
      const text = _node
        .find(".pnr-name")
        .last()
        .text();
      const name = text.split(":")[1].trim();
      return name;
    } catch (err) {
      const error = new Error(err);
      error.field = "name";
      throw error;
    }
  },

  // Retrieve reservation code
  getCode: () => {
    try {
      const text = _node
        .find(".pnr-ref")
        .last()
        .text();
      const code = text.split(":")[1].trim();
      return code;
    } catch (err) {
      const error = new Error(err);
      error.field = "code";
      throw error;
    }
  },

  // Retrieve total price
  getPrice: () => {
    try {
      const rawPrice = _node
        .find(".very-important")
        .text()
        .trim();
      return _parsePrice(rawPrice);
    } catch (err) {
      const error = new Error(err);
      error.field = "price";
      throw error;
    }
  },

  // Retrieve prices list
  getPrices: () => {
    try {
      const prices = _node
        .find(".product-header")
        .map((_i, el) => {
          let lastCell = _$(el)
            .find("td")
            .eq(-1)
            .text()
            .trim();
          return _parsePrice(lastCell);
        })
        .get();
      return prices.map(price => {
        return { value: price };
      });
    } catch (err) {
      const error = new Error(err);
      error.field = "prices";
      throw error;
    }
  },

  // Retrieve travel dates
  _getDates: () => {
    try {
      const dateList = [];
      _node.find(".pnr-summary").each((_i, el) => {
        let text = _$(el)
          .text()
          .trim();
        text.match(/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/g).forEach(date => {
          let splitDate = date.split("/");
          let formattedDate = new Date(
            [splitDate[2], splitDate[1], splitDate[0]].join("-")
          )
            .toISOString()
            .replace("T", " ");
          dateList.push(formattedDate);
        });
      });
      return dateList;
    } catch (err) {
      const error = new Error(err);
      error.field = "dates";
      throw error;
    }
  },

  // Retrieve trips
  getRoundtrips: () => {
    try {
      const dates = parser._getDates();
      const tripsItems = _node.find(".product-details");

      // Check number of trips vs. number of dates
      if (tripsItems.length != dates.length) {
        throw "Mismatch between travel dates and trips items";
      }

      const trips = tripsItems
        .map((i, el) => {
          // Initilialize trip
          let trip = {};

          // Set trip type
          trip.type = _$(el)
            .find("tr")
            .first()
            .find("td")
            .first()
            .text()
            .trim();

          // Set trip date
          trip.date = dates[i];

          // Set trains details
          const train = {
            departureTime: _$(el)
              .find("tr")
              .first()
              .find("td")
              .eq(1)
              .text()
              .trim()
              .replace("h", ":"),
            departureStation: _$(el)
              .find("tr")
              .first()
              .find("td")
              .eq(2)
              .text()
              .trim(),
            arrivalTime: _$(el)
              .find("tr")
              .last()
              .find("td")
              .first()
              .text()
              .trim()
              .replace("h", ":"),
            arrivalStation: _$(el)
              .find("tr")
              .last()
              .find("td")
              .last()
              .text()
              .trim(),
            type: _$(el)
              .find("tr")
              .first()
              .find("td")
              .eq(3)
              .text()
              .trim(),
            number: _$(el)
              .find("tr")
              .first()
              .find("td")
              .eq(4)
              .text()
              .trim()
          };
          // Provide passengers details for last trip
          if (i === tripsItems.length - 1) {
            const passengersItems = _$(el)
              .next()
              .find("tr")
              .filter((i, el) => {
                return i % 2 == 1;
              });
            train.passengers = passengersItems
              .map((i, el) => {
                // Retrieve passenger age
                let ageContent = _$(el)
                  .find("td")
                  .eq(1)
                  .after("br")
                  .text();
                let age = ageContent.match(/(\(.*\))/g)[0];

                // Retrieve ticket type
                let fareContent = _$(el)
                  .find("td")
                  .eq(2)
                  .text();
                let type = fareContent.includes("Billet échangeable")
                  ? "échangeable"
                  : "non échangeable";
                return {
                  type: type,
                  age: age
                };
              })
              .get();
          }
          trip.trains = [train];
          return trip;
        })
        .get();

      return trips;
    } catch (err) {
      const error = new Error(err);
      error.field = "roundtrips";
      throw error;
    }
  },

  // Format parsing result
  parse: () => {
    try {
      // Parse required data
      const name = parser.getName();
      const code = parser.getCode();
      const price = parser.getPrice();
      const prices = parser.getPrices();
      const roundTrips = parser.getRoundtrips();

      // Build result
      _result = {
        status: "ok",
        result: {
          trips: [
            {
              code: code,
              name: name,
              details: {
                price: price,
                roundTrips: roundTrips
              }
            }
          ],
          custom: {
            prices: prices
          }
        }
      };
    } catch (err) {
      // Send custom result with "fail" status, impacted field, and reason
      _result = {
        status: "fail",
        field: err.field,
        result: err.message
      };
    }
  },

  // Save result in file
  saveResult: filename => {
    // Check parsing has been run
    if (!_result) {
      throw "No parse result found... Make sure to run 'parse' before";
    }

    // Dump result file
    fs.writeFile(filename, JSON.stringify(_result, null, 2), err => {
      if (err) throw err;
      console.log(filename + " successfully saved");
    });
  }
};

// Just to make sure we do not affect our parser from the outside
Object.freeze(parser);

// Export parser
module.exports = parser;
