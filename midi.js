
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

  function getTempoMap(jsonSong) {
    var tempos = [];

    jsonSong.tracks[0].forEach(function(el) {
      if (el.subtype === 'setTempo') {
        tempos.push({
          microsecondsPerBeat: el.microsecondsPerBeat,
          time: tempos.length === 0 ? 0 : ticksToMS(el.deltaTime, tempos[tempos.length - 1].microsecondsPerBeat)
        });
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

  function getTimingTrack(track) {
    var timedTrack = [];
    var activeElsByNoteNumber = {};

    var currentTime = 0;
    var currentTempoIndex = 0;
    var currentProgramNumber = 1;

    for (var i = 0; i < track.length; i++) {
      var el = track[i];

      currentTime += ticksToMS(el.deltaTime, tempoMap[currentTempoIndex].microsecondsPerBeat);

      if (currentTempoIndex < tempoMap.length - 1 && currentTime >= tempoMap[currentTempoIndex + 1].time) {
        currentTempoIndex += 1;
      }

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
              time: correspondingEl.__currentTime,
              duration: currentTime - (correspondingEl.__currentTime),
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

    return timedTrack;
  }

  function ticksToMS(ticks, microsecondsPerBeat) {
    var beats = ticks / jsonSong.header.ticksPerBeat;
    var microseconds = microsecondsPerBeat * beats;
    var ms = microseconds / 1000;
    return ms;
  }
};

function getMusicTracks(tracks) {
  var musicTracks = [];

  tracks.forEach(function(track) {
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
