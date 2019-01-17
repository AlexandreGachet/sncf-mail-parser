// Import parser
const parser = require("./parser");
const path = require('path')

// Define run function
const run = () => {
  // Init parser with provided HTML
  parser.init("test.html");

  // Parse file
  parser.parse();

  // Save parse result in JSON file
  parser.saveResult("result.json");
};

// Export run function
module.exports.run = run;
