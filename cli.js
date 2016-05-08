
var fs = require('fs');
var midiTiming = require('./midi');

var args = process.argv.slice(2);
if (args.length < 1) {
  console.log('need an input midi file as first argument...');
  return;
}

var midiFile = args[0];
var outFile = args.length > 1 ? args[1] : 'timing.json';

var midiData = fs.readFileSync(midiFile, 'binary');

var timing = midiTiming(midiData);

fs.writeFileSync(outFile, JSON.stringify(timing));
