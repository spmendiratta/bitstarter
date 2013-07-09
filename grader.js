#!/usr/bin/env node
/* 
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2

sp-070813 Added URL processing
*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "???";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURLExists = function(url) {
    var url = url.toString();
    /* This is an asynchronous call - can not block
    rest.get(url).on('error', function(e) {
        console.log("Invalid URL: %s. Exiting.", url);
        process.exit(1);
    });
    */
    if (url.indexOf("http://") >= 0 || url.indexOf("https://") >= 0) 
        return url;
    else {
        console.log("Invalid URL: %s. Exiting.", url);
        process.exit(1);
    }
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var out = doChecks( $, checksfile );
    return out;
};

var checkURL = function(checksfile) {
    var process = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            $ = cheerio.load(result);
    	    // console.log("$ " , Object.prototype.toString.call($));
            // console.log("html ", $.html());
            var out = doChecks( $, checksfile );
            logJson(out);
        }
    };
    return process;
};

var doChecks = function($, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
          var present = $(checks[ii]).length > 0;
          out[checks[ii]] = present;
    }
    return out;
};


var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var logJson = function(checkJson) {
       var outJson = JSON.stringify(checkJson, null, 4);
       console.log(outJson);
};

if(require.main == module) {
    program
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        // --url [URL]', 'Path to optional URL'
        .option('-u, --url <URL>', 'Path to required URL', clone(assertURLExists), URL_DEFAULT)
        .parse(process.argv);

    if (program.url == "???") {
       var checkJson = checkHtmlFile(program.file, program.checks);
       logJson( checkJson );
    } else {
       var proc = checkURL(program.checks);
       rest.get(program.url).on('complete', proc);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
