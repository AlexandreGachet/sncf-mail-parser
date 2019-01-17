# SNCF email parser

## Description

This project in Node parses a confirmation email from SNCF to retrieve the order data

## Setup

In order to run the project locally, make sure to meet the following requirements:

* Have Node.js installed (>= 8.9.3)
* Make sure you have npm installed:

```bash
npm -v
```

* Run the following command to install required packages:

```bash
npm install
```

* The run the script, simply run:

```bash
npm run parse
```

* To run tests:
```bash
npm test
```


## Features

* In this project, we use cheerio package, which is an implementation of core jQuery designed specifically for the server, very useful for parsing HTML files (more information on https://cheerio.js.org/)
* Node.js version is set to 8.9.3
* We implemented basic error handling to catch parts of files where parsing might fail, and save it in the result file, like the following example:

```json
{
	"status": "fail",
	"field": "roundtrips",
	"result": "Mismatch between travel dates and trips items"
}
```
* Jest library is used to perform consistancy and comparison tests (https://facebook.github.io/jest/)