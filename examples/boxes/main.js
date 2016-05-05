
(function() {
  var mp3 = './test_midi_song.mp3';
  var timing = require('./test_tracks.json');

  var trackOne = timing.tracks[0];

  var audio = document.createElement('audio');
  audio.src = mp3;

  setTimeout(start, 1000);

  function start() {
    audio.play();

    trackOne.forEach(function(el) {
      setTimeout(function() {
        var box = document.createElement('div');
        box.style.position = 'absolute';
        box.style.left = Math.random() * 90 + '%';
        box.style.width = box.style.height = '50px';
        box.style.backgroundColor = randomBrightColor();
        box.style.top = ((128 - el.noteNumber) / 128 * 100) + '%';
        document.body.appendChild(box);

        setTimeout(function() {
          box.parentNode.removeChild(box);
        }, el.duration);
      }, el.time);
    });
  }

  function randomBrightColor() {
      var key = Math.floor(Math.random() * 6);

      if (key === 0)
        return "rgb(" + "0,255," + v() + ")";
      else if (key === 1)
        return "rgb(" + "0," + v() + ",255)";
      else if (key === 2)
        return "rgb(" + "255, 0," + v() + ")";
      else if (key === 3)
        return "rgb(" + "255," + v() + ",0)";
      else if (key === 4)
        return "rgb(" + v() + ",255,0)";
      else
        return "rgb(" + v() + ",0,255)";

      function v() {
        return Math.floor(Math.random() * 256);
      }
    }
})();
