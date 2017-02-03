(function () {

  console.log("%c                                               \n                  ♡ 𝔩𝔞𝔰𝔞𝔤𝔫𝔞 ♡                   \n                                               ", "color: red; background-color: pink;")

  // HELPERS
  // =======

  var each = function (obj, iteratee, ctx) {
    if (!obj) return obj;
    var i, length;
    if (typeof obj.length === 'number' && obj.length >= 0) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee.call(ctx, obj[i], i, obj);
      }
    } else {
      var keys = Object.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee.call(ctx, obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  var extend = Object.assign;


  // INITIALIZATION
  // ==============

  // check for dependencies
  // ----------------------

  var missing_dependency = false;
  each(['PIXI', 'AUDIOPLAYER', 'Events'], function (lib) {
    if (!window[lib]) {
      console.warn('ABORTING! Couldn\'t load dependency:', lib);
      missing_dependency = true;
    }
  });
  if (missing_dependency) return;


  // LASAGNA!!!!!!
  // -------------
  window.LASAGNA = {};


  // BOWL
  // ====

  LASAGNA.BOWL = function (el) {
    if (!el) {
      console.warn('Couldn\'t init a bowl without a DOM element!');
    }

    // renderig stuff
    this.rendererPX = new PIXI.autoDetectRenderer(null, null, {
      view: el,
      antialias: false,
      transparent: true,
      resolution: 1
    });
    this.makeRendererFullScreen();
    this.containerPX = new PIXI.Container();
    this.layers = [];

    // default filename
    this.setName('be more childish');

    window.addEventListener('resize', this.makeRendererFullScreen.bind(this));

    // audio stuff
    this.audioplayer = AUDIOPLAYER();


    // bind update
    this.on('update', this.updateLayers);

    // context bindings
    this.loop = this.loop.bind(this);
    this.toDataObject = this.toDataObject.bind(this);
  };


  LASAGNA.BOWL.prototype = {

    // back to initial clean state
    clear: function () {
      while (this.layers.length)
        this.removeLAYER(this.layers[0]);
    },

    // RENDERING STUFF
    // ---------------

    loop: function () {
      this.trigger('update');
      this.rendererPX.render(this.containerPX);
      requestAnimationFrame(this.loop);
    },

    resizeRenderer: function (w, h) {
      this.rendererPX.resize(w, h);
      each(this.layers, function (l) {
        l.updateSpritePXposition();
      });
      if (this.background_layer)
        this.makeLAYERSizeCover(this.background_layer);
    },

    makeRendererFullScreen: function () {
      this.resizeRenderer(
        document.body.offsetWidth,
        document.body.offsetHeight
      );
    },


    // LAYERS STUFF
    // ------------

    newLAYER: function (options) {
      var layer = new LASAGNA.LAYER(options, this);
      this.layers.push(layer);
      this.containerPX.addChild(layer.spritePX);
      return layer;
    },

    removeLAYER: function (l) {
      this.containerPX.removeChild(l.spritePX);
      this.layers.splice(
        this.layers.indexOf(l),
        1
      );
      if (this.background_layer === l) {
        this.background_layer = null;
      }
    },

    setLAYERindex: function (l, i) {
      if (i === 0 && this.background_layer) {
        console.warn(
          'index 0 is reserved for background layer.\n'+
          'you can set a background layer with setBackgroundLAYER\n'+
          'or you can remove the background layer and use index 0'
        );
        return;
      }
      this.containerPX.setChildIndex(l.spritePX, i);
      this.layers.splice(
        this.layers.indexOf(l),
        1
      );
      this.layers = this.layers
        .slice(0, i)
        .concat([l])
        .concat(this.layers.slice(
          i,
          this.layers.length - 1
        ));
    },

    getLAYERbyId: function (id) {
      if (!Number.isInteger(id)) {
        console.warn('cannot get layer by id if no id is provided');
        return null;
      }
      var match = null;
      for (var i = 0; i < this.layers.length - 1; i++) {
        if (this.layers[i].id === id) {
          match = this.layers[i];
          break;
        }
      }
      if (!match)
        console.warn('couldn\'t find layer with id ' + id);
      return match;
    },

    setBackgroundLAYER: function (l) {
      if (this.background_layer === l) return;
      if (this.background_layer) {
        this.unsetBackgroundLAYER(this.background_layer);
      }
      this.containerPX.setChildIndex(l.spritePX, 0);
      this.layers.splice(
        this.layers.indexOf(l),
        1
      );
      this.layers.unshift(l);
      this.background_layer = l;
      l.x = '50%';
      l.y = '50%';
      l.updateSpritePXposition();
      this.makeLAYERSizeCover(l);
    },

    unsetBackgroundLAYER: function () {
      var l = this.background_layer;
      this.background_layer = null;
      this.setLAYERindex(l, this.layers.length - 1);
      l.spritePX.scale.x = 1;
      l.spritePX.scale.y = 1;
    },

    makeLAYERSizeCover: function (l) {
      var baseTexturePX = l.spritePX.texture.baseTexture;
      var width = baseTexturePX.realWidth;
      var height = baseTexturePX.realHeight;
      var renderer_width = this.rendererPX.width;
      var renderer_height = this.rendererPX.height;
      var width_scale = renderer_width / width;
      var height_scale = renderer_height / height;
      var scale = Math.max(width_scale, height_scale);
      scale *= 1.2; // some xtra because of fxs padding
      l.spritePX.scale.x = scale;
      l.spritePX.scale.y = scale;
    },

    updateLayers: function () {
      each(this.layers, function (l) {
        l.trigger('update');
      });
      if (this.background_layer)
        this.background_layer.trigger('update');
    },


    // AUDIO STUFF
    // -----------

    setTrackFromUrl: function (url) {
      this.audioplayer.load(
        url,
        (function (sound) {
          this.track_url = url;
          this.setName(sound.title);
          this.trigger('track:load', sound);
        }).bind(this),
        (function (err) {
          this.trigger('track:error', err);
        }).bind(this)
      );
    },

    togglePlayTrack: function () {
      if (this.audioplayer.isPlaying()) this.audioplayer.pause();
      else this.audioplayer.play();
    },

    // WAVES STUFF
    // -----------
    getWaveValue: function (name) {
      if (name === 'Identity') {
        return 1;
      }
      if (name === 'MainTrack') {
        return 0.0005 * this.audioplayer.getCurrentVolume();
      }

    },

    // FILES STUFF
    // -----------

    toJSON: function () {
      return JSON.stringify(this.toDataObject());
    },

    fromJSON: function (json) {
      this.fromDataObject(JSON.parse(json));
    },

    toDataObject: function () {
      return {
        track_url: this.track_url,
        background_layer_id:
          this.background_layer ? this.background_layer.id : null,
        layers: this.layersToDataArray(),
        cover_img: this.cover_img,
        saved_at: Date.now()
      };
    },

    fromDataObject: function (obj) {
      this.setTrackFromUrl(obj.track_url);
      this.layersFromDataArray(obj.layers);
      var background_layer = this.getLAYERbyId(obj.background_layer_id);
      if (background_layer)
        setTimeout((function () {
          this.setBackgroundLAYER(background_layer);
        }).bind(this))
    },

    layersToDataArray: function () {
      return this.layers.map(function (l) {
        return l.toDataObject();
      });
    },

    layersFromDataArray: function (data_array) {
      each(data_array, function (data_obj) {
        this.newLAYER(data_obj);
      }, this);
    },

    setName: function (name_string) {
      name_string = name_string
        .replace(/\s/gi, ' ')
        .replace(/[^a-z\s\-]/gi, '')
        .toLowerCase();
      var weird_string = [];
      each(name_string, function (origin, i) {
        var at = name_string.charCodeAt(i) - 97;
        weird_string.push('𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷'.at(at * 2));
        if (origin === ' ') weird_string.push('-');
      });
      weird_string = weird_string.join('');
      this.filename = weird_string + '.♡';
    },

    generateCoverImage: function () {
      this.resizeRenderer(564, 564);
      this.rendererPX.render(this.containerPX);
      this.cover_img = this.rendererPX.view.toDataURL("image/png");
      setTimeout((function () {
        this.makeRendererFullScreen();
        this.rendererPX.render(this.containerPX);
      }).bind(this), 0)
    }

  };

  extend(LASAGNA.BOWL.prototype, Events);


  // LAYER
  // =====

  var layer_id = 0;


  LASAGNA.LAYER = function (data_obj, BOWL) {
    data_obj = data_obj || {};
    this.id = data_obj.id || layer_id++; // TODO...
    this.x = data_obj.x || '50%';
    this.y = data_obj.y || '50%';
    this.BOWL = BOWL;
    this.image_data = data_obj.image_data;
    this.texturePX = new PIXI.Texture.fromImage(
      data_obj.image_data
    );
    this.spritePX = new PIXI.Sprite(this.texturePX);
    this.spritePX.anchor.set(0.5);

    this.updateSpritePXposition();

    this.fxs = [];
    this.fxsFromDataArray(data_obj.fxs);

    // bind update
    this.on('update', this.updateFxs);
  };


  LASAGNA.LAYER.prototype = {

    // RENDERING STUFF
    // ---------------
    updateSpritePXposition: function () {
      var p = this.positionToWorld();
      this.spritePX.position.set(p.x, p.y);
    },

    // about positioning used in .x and .y:
    // - percentages are relative to top left.
    //   ie x: 20% means 20% of width from left
    // - absolute numbers are for paddings, positives
    //   are for top/left, negatives are for bottom/right
    //   ie
    //   - x: +20 means 20px distance from left
    //   - y: -10 means 10px distance from bottom
    positionToWorld: function () {
      var renderer_width = this.BOWL.rendererPX.width;
      var renderer_height = this.BOWL.rendererPX.height;
      var result = {};
      each(['x', 'y'], function (axis) {
        var p = this[axis];
        var size = (axis === 'x') ?
          renderer_width : renderer_height;
        if (typeof p === 'string') {
          if (p.match('%').length) {
            result[axis] = size;
            result[axis] *= parseInt(p.replace('%', ''), 10) / 100;
          } else {
            p = parseInt(p, 10);
          }
        }
        if (typeof p === 'number') {
          result[axis] = p;
          if (p < 0) result[axis] += size;
        }
      }, this);
      return result;
    },


    // FILTERS STUFF
    // -------------

    newFx: function (data_obj) {
      var fx = new LASAGNA.FX(data_obj, this.BOWL);
      this.fxs.push(fx);
      this.spritePX.filters = [fx.filterPX];
    },

    updateFxs: function () {
      each(this.fxs, function (fx) {
        fx.updateUniformsValues();
      });
    },


    // FILES STUFF
    // -----------

    toDataObject: function () {
      return {
        id: this.id,
        image_data: this.image_data,
        x: this.x,
        y: this.y,
        fxs: this.fxsToDataArray()
      };
    },

    fxsToDataArray: function () {
      return this.fxs.map(function (fx) {
        return fx.toDataObject();
      });
    },

    fxsFromDataArray: function (data_array) {
      each(data_array, function (data_obj) {
        this.newFx(data_obj);
      }, this);
    }

  };

  extend(LASAGNA.LAYER.prototype, Events);


  // FX
  // ==

  LASAGNA.FX = function (data_obj, BOWL) {
    data_obj = data_obj || {};
    this.type = data_obj.type;
    this.BOWL = BOWL;
    this.uniforms = data_obj.uniforms || this.getDefaultUniforms(this.type);
    this.filterPX = new PIXI.filters[this.type]();
    this.updateUniformsValues(data_obj.uniforms);
  };

  LASAGNA.FX.prototype = {

    // UNIFORMS STUFF
    // --------------
    getDefaultUniforms: function (type) {
      var uniforms = {};
      var uniforms_def = PIXI.filters[type].uniforms_def;
      each(uniforms_def, function (u_def, name) {
        if (name[0] === '_') return;
        uniforms[name] = {
          w: 'Identity',
          off: 0,
          s: 0.05,
          add: false
        };
      }, this);
      return uniforms;
    },

    updateUniformsValues: function () {
      each(this.uniforms, function (val, name) {
        this.updateUniformValue(name);
      }, this);
    },

    updateUniformValue: function (name) {
      this.filterPX.uniforms[name] =
        this.getUniformValue(name);
    },

    getUniformValue: function (name) {
      var u = this.uniforms[name];
      var wave_value = this.BOWL.getWaveValue(u.w);
      return u.off + u.s * wave_value;
    },


    // FILES STUFF
    // -----------

    toDataObject: function () {
      return {
        type: this.type,
        uniforms: this.uniforms
      };
    }
  };

})();
