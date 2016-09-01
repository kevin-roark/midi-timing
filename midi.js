
var midiConverter = require('midi-converter');

module.exports = function(midiSong) {
  var jsonSong = midiConverter.midiToJson(midiSong);

  var tempoMap = getTempoMap(jsonSong);

  var musicTracks = getMusicTracks(jsonSong.tracks);

  var timingTracks = [];
  musicTracks.forEach(function(track) {
    timingTracks.push(getTimingTrack(track));
  });

  return {
    tracks: timingTracks
  };

  function getTempoMap(song) {
    let tempos = [];

    let track = song.tracks[0];
    let currentTime = 0;
    let currentMicroSecondsPerBeat = 500000; // default idk

    track.forEach(el => {
      currentTime += ticksToMS(el.deltaTime, currentMicroSecondsPerBeat);

      if (el.subtype === 'setTempo') {
        let tempo = {
          microsecondsPerBeat: el.microsecondsPerBeat,
          bpm: round((1 / el.microsecondsPerBeat) * 1000000 * 60, 2),
          time: round(currentTime, 2),
          human: humanTime(currentTime)
        };
        tempos.push(tempo);

        currentMicroSecondsPerBeat = el.microsecondsPerBeat;
      }
    });

    if (tempos.length === 0) {
      tempos.push({
        microsecondsPerBeat: 500000,
        time: 0
      });
    }

    return tempos;
  }

  function getTimingTrack (track) {
    var timedTrack = [];
    var activeElsByNoteNumber = {};

    var currentTime = 0;
    var currentTempoIndex = 0;
    var currentUSPB = tempoMap[currentTempoIndex].microsecondsPerBeat;
    var currentProgramNumber = 1;

    // we go tick-by-tick to not miss tempo changes LOL
    var currentTicks = 0;
    while (track.length > 0) {
      while (track.length > 0 && currentTicks === track[0].deltaTime) {
        currentTicks = 0;
        var el = track.shift();

        switch (el.subtype) {
          case 'noteOn':
            el.__currentTime = currentTime;
            el.__currentProgramNumber = currentProgramNumber;
            activeElsByNoteNumber[el.noteNumber] = el;
            break;

          case 'noteOff':
            var correspondingEl = activeElsByNoteNumber[el.noteNumber];
            if (correspondingEl) {
              var timeEl = {
                time: round(correspondingEl.__currentTime, 2),
                duration: round(currentTime - (correspondingEl.__currentTime), 2),
                noteNumber: el.noteNumber,
                velocity: correspondingEl.velocity,
                programNumber: correspondingEl.__currentProgramNumber
              };
              timedTrack.push(timeEl);

              delete activeElsByNoteNumber[el.noteNumber];
            }
            break;

          case 'programChange':
            currentProgramNumber = el.programNumber;
            break;
        }
      }

      currentTicks += 1;
      currentTime += ticksToMS(1, currentUSPB);
      while (currentTempoIndex < tempoMap.length - 1 && currentTime >= tempoMap[currentTempoIndex + 1].time) {
        currentTempoIndex += 1;
        let tempo = tempoMap[currentTempoIndex];
        currentUSPB = tempo.microsecondsPerBeat;
      }
    }

    return timedTrack;
  }

  function ticksToMS (ticks, microsecondsPerBeat) {
    var beats = ticks / jsonSong.header.ticksPerBeat;
    var microseconds = microsecondsPerBeat * beats;
    var ms = microseconds / 1000;
    return ms;
  }

  function msToTicks (ms, microsecondsPerBeat) {
    var microseconds = ms * 1000;
    var beats = microseconds / microsecondsPerBeat;
    var ticks = jsonSong.header.ticksPerBeat * beats;
    return Math.round(ticks);
  }
};

function getMusicTracks(tracks) {
  var musicTracks = [];

  tracks.forEach(function(track, idx) {
    for (var i = 0; i < track.length; i++) {
      var el = track[i];
      if (el.noteNumber) {
        musicTracks.push(track);
        return;
      }
    }
  });

  return musicTracks;
}

function round (n, places = 2) {
  let d = Math.pow(10, places);
  return Math.round(n * d) / d;
}

function humanTime (ms) {
  let s = ms / 1000;
  let minutes = Math.floor((s / 60)) + '';
  let seconds = Math.round((s % 60)) + '';
  if (seconds.length === 1) seconds = '0' + seconds;
  let humanTime = minutes + ':' + seconds;
  return humanTime;
}
