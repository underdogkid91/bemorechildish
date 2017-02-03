(function () {


  // WAVE WARP FILTER
  // ================

  var WaveWarpFilter = function () {
    var pixel_shader = document.getElementById('pxsh-wave-warp').innerHTML;
    PIXI.Filter.call(this, null, pixel_shader, WaveWarpFilter.uniforms_def);
    this.padding = 1000;

    // Move to main filter class
    this.uniforms._mappedMatrix = new PIXI.Matrix();
    this.uniforms._unmappedMatrix = new PIXI.Matrix();
  };

  WaveWarpFilter.uniforms_def = {
    waveform:       { type: 'f' },
    amplitude:      { type: 'f' },
    period:         { type: 'f' },
    angle:          { type: 'f' },
    _mappedMatrix:   { type: 'mat3' },
    _unmappedMatrix: { type: 'mat3' }
  };

  WaveWarpFilter.prototype = Object.create(PIXI.Filter.prototype);
  WaveWarpFilter.prototype.constructor = WaveWarpFilter;

  WaveWarpFilter.prototype.apply = function(filterManager, input, output) {
    filterManager.calculateNormalizedScreenSpaceMatrix(this.uniforms._mappedMatrix);
    this.uniforms._unmappedMatrix = this.uniforms._mappedMatrix.clone().invert();
    filterManager.applyFilter(this, input, output);
  };

  Object.defineProperties(WaveWarpFilter.prototype, {
    amplitude: {
      get: function () {
        return this.uniforms.amplitude;
      },
      set: function (value) {
        this.uniforms.amplitude = value;
      }
    },

    period: {
      get: function () {
        return this.uniforms.period;
      },
      set: function (value) {
        this.uniforms.period = value;
      }
    },

    rotation: {
      get: function () {
        return this.angle;
      },
      set: function (value) {
        this.uniforms.angle = value;
      }
    },

    waveform: {
      get: function () {
        return this.uniforms.waveform;
      },
      set: function (value) {
        this.uniforms.waveform = value;
      }
    }
  });

  PIXI.filters.WaveWarp = WaveWarpFilter;

})();
