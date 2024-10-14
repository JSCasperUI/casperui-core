const fs = require("fs");
const path = require("path");
const {HTMLParser} = require("./xml/HTMLParser");
const {xml2Tree} = require("./xml/XMLTree");
const {xml2TreeContent} = require("./xml/XMLTreeContent");

let byteData = fs.readFileSync("P:\\dayz_dev\\dev_missions\\dayzOffline.chernarusplus\\mapgroupcluster03.xml","utf-8");


let parser = new HTMLParser()
parser.mInput = byteData
let node = xml2TreeContent(parser)
console.log(node)