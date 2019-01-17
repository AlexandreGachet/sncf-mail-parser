// Import required libraries
const run = require("./index").run;
const path = require("path");
const fs = require("fs");

// Define paths to JSON files
const resultPath = path.join(__dirname, "result.json");
const testResultPath = path.join(__dirname, "test-result.json");

// Test input files
describe("Check input files are present", () => {
  // Check test-result.json is present
  it("Check test-result.json file exists", () => {
    expect(
      fs.existsSync(path.join(__dirname, "test-result.json"))
    ).toBeTruthy();
  });

  // Check test.html is present
  it("Check test.html file exists", () => {
    expect(fs.existsSync(path.join(__dirname, "test.html"))).toBeTruthy();
  });
});

// Test script execution
describe("Script execution works", () => {
  it("Run function is defined", () => {
    expect(typeof run).toEqual("function");
  });
});

// Compare JSON files
describe("Generated result matches example file", () => {
  // Load results files into objects
  const result = JSON.parse(fs.readFileSync(resultPath));
  const testResult = JSON.parse(fs.readFileSync(testResultPath));

  // Check status
  it("Status is ok", () => {
    expect(result.status).toEqual("ok");
  });

  // Check code
  it("Has the same code", () => {
    expect(result.result.trips[0].code).toEqual(
      testResult.result.trips[0].code
    );
  });

  // Check number of roundtrips
  it("Has the same number of roundtrips", () => {
    expect(result.result.trips[0].details.roundTrips).toHaveLength(
      testResult.result.trips[0].details.roundTrips.length
    );
  });

  // (...or any other comparison test)
});
