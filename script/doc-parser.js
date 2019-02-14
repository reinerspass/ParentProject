let rootDirectory = '../../'
let grammarFile = './grammar.peg'
let outputDir = './output/';
let outputFile = 'output-ios.json'
let githubLink = "https://github.com/freeletics/fl-lib-uilibrary-ios/blob/773fb23578e0d539af0a279999abfe204f5d9afe/"

const fs = require('fs');
const peg = require("pegjs");
const glob = require("glob");

const CON = "CON"
const MRK = "MRK"
const CLS = "CLS"

var result = []
var ready = 1
var timeout = 100

// Creates output folder if missing
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

// reads files, parses content and transforms it
fs.readFile(grammarFile, 'utf8', function (err, grammar) {
	if (err) {
		return console.log(err);
	}
	let parser = peg.generate(grammar);
	glob(rootDirectory + '/**/*', function(err, fileNames) {
		swiftFileNames = fileNames.filter(function(fileName){ 
			return fileName.endsWith("swift") 
		})
		ready = swiftFileNames.length
		swiftFileNames.forEach(function(fileName) {
			fs.readFile(fileName, 'utf8', function (err, file) {
				let commentObject = handleData(file, parser, fileName)
				if (commentObject.length > 0) {
					result = result.concat(commentObject)
				}
				ready -= 1
			})
		})
	});
});

// wait for transformation and write output to file
var check = function() {
    if (ready <= 0) {
		writeObject(convertListToObject(result))
        return;
    } else if (timeout == 0) {
    	console.log("Failed")
    	return
    }
    setTimeout(check, 10);
    timeout -= 1;
}

check();

// takes all output from parser and transforms it to comment objects
function handleData(fileContent, parser, fileName) {
	let parserOutput = parser.parse(fileContent);
	let nice = JSON.stringify(parserOutput, null, 2)

	// only further process elements containing marker
	return content = parserOutput.map(function (item) {
		if (item.find(function(element) {
			return element[MRK]!= null
		})) {
			return convertDocObject(item, fileName)
		}
	}).filter(function (el) { // remove all undefined values
		return el != null;
	});
}

// converts parser output entity and transforms it to comment object
function convertDocObject(item, fileName) {
	let comment = item.flatMap(function(element) {
		return element[CON]
	}).join('\n')
	let marker = item.find(function(element) {
		return element[MRK]!= null
	})[MRK]
	let clazz = item.find(function(element) {
		return element[CLS]!= null
	})[CLS]

	docObject = {
		marker: marker,
		description: comment,
		entityName: clazz,
		link: linkFor(fileName)
	}
	return docObject
}

const reg = /^[\.\/]*/
// transforms relative to absolute github link
function linkFor(fileName) {
	return githubLink + fileName.replace(reg, "")
}

// converts list of comment objects to the needed output format
function convertListToObject(list) {
	var object = {}

	list.forEach(function(element){
		let marker = element["marker"]
		delete element["marker"]
		object[marker] = element
	})

	return object
}

// writes output to file
function writeObject(object) {
	let string = JSON.stringify(object, null, 2)
	fs.writeFile(outputDir + outputFile, string, function(err) {
	    if(err) {
	        return console.log(err);
	    }
	    console.log("The file was saved!");
	}); 
}
