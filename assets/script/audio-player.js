(function () {

  // helpers
  // -------

  var each = function (obj, iterator) {
    [].forEach.call(obj, iterator);
  };

  var extend = Object.assign;


  // check for dependencies
  // ----------------------

  var missing_dependency = false;
  each(['SC'], function (lib) {
    if (!window[lib]) {
      console.warn('ABORTING! Couldn\'t load dependency:', lib);
      missing_dependency = true;
    }
  });
  if (missing_dependency) return;


  // init SC
  // -------
  SC.initialize({
    client_id: '681dc2b4a25c5df7fa06967667ee9596'
  });
  var sound = SC.stream("/tracks/293", function(sound){
    sound.play();
  });


  // Note: mostly copy pasted from:
  // https://github.com/michaelbromley/soundcloud-visualizer/blob/master/js/app.js
  var SoundCloudAudioSource = function(player) {
    var self = this;
    var analyser;
    var audioCtx = new (window.AudioContext || window.webkitAudioContext);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    player.crossOrigin = "anonymous";
    var source = audioCtx.createMediaElementSource(player);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    var sampleAudioStream = function() {
      analyser.getByteFrequencyData(self.streamData);
      // calculate an overall volume value
      var total = 0;
      for (var i = 0; i < 80; i++) { // get the volume from the first 80 bins, else it gets too loud with treble
          total += self.streamData[i];
      }
      self.volume = total;
    };
    setInterval(sampleAudioStream, 20);
    // public properties and methods
    this.volume = 0;
    this.streamData = new Uint8Array(128);
    this.playStream = function(streamUrl) {
      // get the input stream from the audio element
      player.addEventListener('ended', function(){
        self.directStream('coasting');
      });
      player.setAttribute('src', streamUrl);
      player.play();
    }
  };

  /**
  * Makes a request to the Soundcloud API and returns the JSON data.
  */
  var SoundcloudLoader = function(player,uiUpdater) {
    var self = this;
    var client_id = "681dc2b4a25c5df7fa06967667ee9596";
    this.sound = {};
    this.streamUrl = "";
    this.errorMessage = "";
    this.player = player;
    this.uiUpdater = uiUpdater;

    /**
     * Loads the JSON stream data object from the URL of the track (as given in the location bar of the browser when browsing Soundcloud),
     * and on success it calls the callback passed to it (for example, used to then send the stream_url to the audiosource object).
     * @param track_url
     * @param callback
     */
    this.loadStream = function(track_url, successCallback, errorCallback) {
      SC.initialize({
        client_id: client_id
      });
      SC.get('/resolve', { url: track_url }, function(sound) {
        if (sound.errors) {
          self.errorMessage = "";
          for (var i = 0; i < sound.errors.length; i++) {
            self.errorMessage += sound.errors[i].error_message + ' // ';
          }
          self.errorMessage += 'Make sure the URL has the correct format: https://soundcloud.com/user/title-of-the-track';
          errorCallback();
        } else {
          if(sound.kind=="playlist"){
            self.sound = sound;
            self.streamPlaylistIndex = 0;
            self.streamUrl = function(){
              return sound.tracks[self.streamPlaylistIndex].stream_url + '?client_id=' + client_id;
            };
            successCallback();
          } else {
            self.sound = sound;
            self.streamUrl = function(){ return sound.stream_url + '?client_id=' + client_id; };
            successCallback();
          }
        }
      });
    };


    this.directStream = function(direction){
      if(direction=='toggle'){
        if (this.player.paused) {
          this.player.play();
        } else {
          this.player.pause();
        }
      }
      else if(this.sound.kind=="playlist"){
        if (direction=='coasting') {
          this.streamPlaylistIndex++;
        } else if (direction=='forward') {
          if (this.streamPlaylistIndex>=this.sound.track_count-1) this.streamPlaylistIndex = 0;
          else this.streamPlaylistIndex++;
        }else{
          if (this.streamPlaylistIndex<=0) this.streamPlaylistIndex = this.sound.track_count-1;
          else this.streamPlaylistIndex--;
        }
        if (this.streamPlaylistIndex>=0 && this.streamPlaylistIndex<=this.sound.track_count-1) {
         this.player.setAttribute('src',this.streamUrl());
         this.uiUpdater.update(this);
         this.player.play();
        }
      }
    }
  };

  // AUDIOPLAYER!!!!!!
  // -----------------
  window.AUDIOPLAYER = function () {
    var player = document.createElement('audio');
    //player.setAttribute('autoplay', true);
    player.setAttribute('preload', true);
    player.setAttribute('autobuffer', true);
    var loader = new SoundcloudLoader(player);
    var audioSource = new SoundCloudAudioSource(player);
    var playing = 0;
    var update = function () {
      //console.log(audioSource.volume);
      requestAnimationFrame(update);
    };
    update();
    return {
      load: function (url, cb, err) {
        loader.loadStream(
          url,
          function() {
            audioSource.playStream(loader.streamUrl());
            cb && cb(loader.sound);
            playing = 1;
          },
          function() {
            console.warn("Error", loader.errorMessage);
            err && err(loader.errorMessage);
        });
      },
      play: function () {
        playing = 1;
        player.play();
      },
      pause: function () {
        playing = 0;
        player.pause();
      },
      isPlaying: function () {
        return playing;
      },
      getCurrentVolume: function () {
        return audioSource.volume;
      }
    }
  };

})();
