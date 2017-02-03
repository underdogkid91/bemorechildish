(function () {

  window.EDITOR = {};

  // HELPERS
  // =======

  var each = function (obj, iteratee, ctx) {
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

  var createElement = function (tag, css, text) {
    var el = document.createElement(tag);
    extend(el.style, css);
    if (text) el.innerText = text;
    return el;
  };

  // show errors in dom
  // ------------------

  var msg_reg = createElement('div', {
    position:        'absolute',
    right:           '10px',
    top:             '10px',
    width:           '35%'
  });
  document.body.appendChild(msg_reg);
  var showMessage = EDITOR.showMessage = function (text) {
    var msg_item = createElement('div', {
      padding:                  '5px 10px',
      'margin-bottom':          '5px',
      backgroundColor:          'black',
      color:                    'white',
      cursor:                   'pointer'
    }, text);
    msg_item.addEventListener('click', function () {
      msg_reg.removeChild(msg_item);
    });
    msg_reg.appendChild(msg_item);
  };


  // invisible paste
  // ---------------

  var pressed_v = false;
  var onInvisiblePaste = function () {};
  var paste_textarea = createElement('textarea', {
    position: 'absolute',
    left: '-200%'
  });
  document.body.appendChild(paste_textarea);
  document.body.addEventListener('keydown', function (e) {
    if (e.key === 'Meta') {
      paste_textarea.value = '';
      paste_textarea.focus();
    }
    if (e.code === 'KeyV') {
      pressed_v = true;
    }
  });
  paste_textarea.addEventListener('keyup', function (e) {
    if (pressed_v) {
      onInvisiblePaste(paste_textarea.value);
    }
    pressed_v = false;
  });


  // local storage
  // -------------

  var saveFileToLocalStorage = EDITOR.saveFileToLocalStorage = function () {
    localStorage.setItem(
      'working_file',
      BOWL.toJSON()
    );
  };


  // INITIALIZATION
  // ==============

  // check for dependencies
  // ----------------------

  var missing_dependency = false;
  each(['LASAGNA'], function (lib) {
    if (!window[lib]) {
      console.warn('ABORTING! Couldn\'t load dependency:', lib);
      missing_dependency = true;
    }
  });
  if (missing_dependency) return;


  // renderer
  // --------

  window.BOWL = new LASAGNA.BOWL(document.querySelectorAll('.player')[0]);
  BOWL.loop();


  // LAYERS STUFF
  // ============

  // make layers interactive
  // -----------------------

  var active_layer = null;
  extend(LASAGNA.LAYER.prototype, {
    makeInteractive: function () {
      this.spritePX.interactive = true;
      this.spritePX
        .on('mousedown',       this.onDragStart.bind(this))
        .on('touchstart',      this.onDragStart.bind(this))
        .on('mousemove',       this.onDragMove.bind(this))
        .on('touchmove',       this.onDragMove.bind(this))
        .on('mouseup',         this.onDragEnd.bind(this))
        .on('touchend',        this.onDragEnd.bind(this))
        .on('mouseupoutside',  this.onDragEnd.bind(this))
        .on('touchendoutside', this.onDragEnd.bind(this));
    },
    onDragStart: function (e) {
      active_layer = this;
      if (BOWL.background_layer === this) return;
      this.dragging = true;
      this.event_data = e.data;
      this.mousedown_position = e.data.getLocalPosition(this.spritePX);
      var index = this.spritePX.parent.children.length - 1;
      this.BOWL.setLAYERindex(this, index);
    },
    onDragMove: function (e) {
      if (!this.dragging) return;
      this.spritePX.alpha = 0.5;
      var new_position = this.event_data.getLocalPosition(this.spritePX.parent);
      this.spritePX.position.set(
        new_position.x - this.mousedown_position.x,
        new_position.y - this.mousedown_position.y
      );
    },
    onDragEnd: function (e) {
      this.dragging = false;
      this.event_data = null;
      this.mousedown_position = null;
      this.spritePX.alpha = 1;

      // generate position from world coordinates
      var p = this.worldToPosition();
      this.x = p.x;
      this.y = p.y;
      this.updateSpritePXposition();

      saveFileToLocalStorage();
    },
    worldToPosition: function () {
      var world = {
        x: this.spritePX.position.x,
        y: this.spritePX.position.y
      };
      var renderer_width = this.BOWL.rendererPX.width;
      var renderer_height = this.BOWL.rendererPX.height;
      var result = {};
      each(['x', 'y'], function (axis) {
        var p = world[axis];
        var size = (axis === 'x') ?
          renderer_width : renderer_height;
        // constraints
        if (p < 0) p = 0;
        if (p > size) p = size - 1;
        var percentage = (p / size) * 100;
        if (percentage < 25) { // padding left
          result[axis] = p;
        } else if (percentage > 75) { // padding right
          result[axis] = -1 * (size - p);
        } else { // percentage
          result[axis] = percentage + '%';
        }
      });
      return result;
    }
  });


  // add images by dropping files
  // ----------------------------

  var addLAYERfromImageData = function (data) {
    var l = BOWL.newLAYER({
      image_data: data
    });
    l.makeInteractive.call(l);
    l.newFx({ type: 'WaveWarp' });
    saveFileToLocalStorage();
  };

  document.body.addEventListener('dragover', function (e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  document.body.addEventListener('drop', function (e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;

    if (files.length === 1 && files[0].name.match('.♡')) {
      if (!confirm('wanna open file?\nif you wanna save the current file press `cancel` and then the `s` key.'))
        return;
      var reader = new FileReader();
      reader.onload = function (e) {
        BOWL.clear();
        BOWL.fromJSON(e.target.result);
        saveFileToLocalStorage();
      };
      reader.readAsText(files[0]);
    } else {
      each(files, function (f) {
        if (!f.type.match('image.*')) {
          showMessage('dropped file is not an image!');
          return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
          addLAYERfromImageData(reader.result);
        };
        reader.readAsDataURL(f);
      });
    }
  });


  // remove images by pressing D key
  // -------------------------------

  document.body.addEventListener('keydown', function (e) {
    if (e.code === 'KeyD' && active_layer) {
      if (!confirm('really wanna remove this layer?'))
        return;
      BOWL.removeLAYER(active_layer);
      saveFileToLocalStorage();
    }
  });


  // set background layer by pressing B key
  // --------------------------------------

  document.body.addEventListener('keydown', function (e) {
    if (e.code === 'KeyB' && active_layer) {
      if (BOWL.background_layer === active_layer) {
        BOWL.unsetBackgroundLAYER();
      } else {
        BOWL.setBackgroundLAYER(active_layer);
      }
      saveFileToLocalStorage();
    }
  });


  // show fx editor by pressing enter
  // --------------------------------

  document.body.addEventListener('keydown', function (e) {
    if (e.code === 'Enter' && active_layer) {
      showLayerFxs(active_layer);
    }
  });

  document.body.addEventListener('keydown', function (e) {
    if (e.code === 'Escape' && active_layer) {
      hideLayerFxs();
    }
  });


  // FX STUFF
  // ========

  // fx ui in dom
  // ------------

  var wave_names = ['Identity', 'MainTrack', '- - -', 'LowPass', 'HighPass'];
  var fx_reg = createElement('div', {
    position:                'fixed',
    left:                    '0',
    bottom:                  '0',
    'max-width':             '100%',
    padding:                 '10px',
    'white-space':           'nowrap',
    overflow:                'scroll'
  });
  document.body.appendChild(fx_reg);
  var createWaveUniformInput = function (params) {
    var container = createElement('div', {
      position:              'relative'
    });
    var value = createElement('div', {}, params.w);
    var select = createElement('select', {
      display:               'block',
      width:                 '100%',
      opacity:               '0',
      position:              'absolute',
      top:                   '0'
    });
    each(wave_names, function (wave, i) {
      var option = createElement('option', {}, wave);
      option.value = wave;
      if (i > 1) option.disabled = true;
      select.appendChild(option);
    });
    select.value = params.w;
    select.addEventListener('change', function () {
      value.innerText = select.value;
      params.w = select.value;
      saveFileToLocalStorage();
    });

    container.appendChild(value);
    container.appendChild(select);
    return container;
  };
  var createOffsetUniformInput = function (params) {
    var input = createElement('input');
    input.type = 'number';
    input.step = '1';
    input.value = params.off;
    input.value *= 1000;
    input.addEventListener('keydown', function (e) {
      e.stopPropagation();
    });
    input.addEventListener('change', function () {
      params.off = input.value / 1000;
      saveFileToLocalStorage();
    });
    return input;
  };
  var createStrengthUniformInput = function (params) {
    var input = createElement('input');
    input.type = 'number';
    input.step = '1';
    input.value = params.s;
    input.value *= 1000;
    input.addEventListener('keydown', function (e) {
      e.stopPropagation();
    });
    input.addEventListener('change', function () {
      params.s = input.value / 1000;
      saveFileToLocalStorage();
    });
    return input;
  };
  var createAddUniformInput = function () {
    return createElement('div', {}, '---');
  };
  var createUniformElement = function (name, params) {
    var uniform_container = createElement('div', {
      padding:               '10px'
    });
    var uniform_title = createElement('div', {
      'text-transform':      'capitalize'
    }, name);
    var uniform_params = createElement('div');

    each(['wave', 'offset', 'strength', 'add'], function (name, i) {
      var param = createElement('div', {
        display:             'inline-block',
        width:               (i === 0) ? '40%' : '20%'
      });
      var param_title = createElement('div', {
        'font-size':         '10px'
      }, name);
      var param_value = createElement('div', {
        'font-style':        'normal',
        padding:             '5px 0',
        height:              '20px'
      });
      var input;
      if (i === 0) {
        input = createWaveUniformInput(params);
      } else if (i === 1) {
        input = createOffsetUniformInput(params);
      } else if (i === 2) {
        input = createStrengthUniformInput(params);
      } else if (i === 3) {
        input = createAddUniformInput(params);
      }
      param_value.appendChild(input);
      param.appendChild(param_title);
      param.appendChild(param_value);
      uniform_params.appendChild(param);
    });

    uniform_container.appendChild(uniform_title);
    uniform_container.appendChild(uniform_params);
    return uniform_container;
  };
  var addFxElement = function (fx) {
    var fx_container = document.createElement('div');
    extend(fx_container.style, {
      background:            'black',
      color:                 'white',
      'font-size':           '16px',
      height:                '270px',
      width:                 '300px',
      overflow:              'hidden',
      position:              'relative',
      display:               'inline-block'
    });
    var fx_title = document.createElement('div');
    extend(fx_title.style, {
      'font-size':           '26px',
      'white-space':         'nowrap',
      'transform':           'rotate(-90deg) translate(-270px)',
      'transform-origin':    '52%',
      'width':               '30px',
      'text-transform':      'uppercase',
      'position':            'absolute'
    });
    fx_title.innerText = ' - - - - - - - ' + fx.type + ' - - - - - - - ';
    var fx_uniforms = document.createElement('div');
    extend(fx_uniforms.style, {
      'margin-left':         '30px',
      overflow:              'scroll',
      height:                '100%'
    });
    each(fx.uniforms, function (params, name) {
      if (name[0] === '_') return;
      fx_uniforms.appendChild(createUniformElement(name, params));
    });

    fx_container.appendChild(fx_title);
    fx_container.appendChild(fx_uniforms);
    fx_reg.appendChild(fx_container);
  };

  var hideLayerFxs = function () {
    while(fx_reg.children.length) fx_reg.removeChild(fx_reg.children[0]);
  };

  var showLayerFxs = EDITOR.showLayerFxs = function (layer) {
    hideLayerFxs();
    each(layer.fxs, addFxElement);
  };



  // AUDIO STUFF
  // ===========

  onInvisiblePaste = function (value) {
    if (BOWL.track_url)
      if (!confirm('wanna overwrite track?'))
        return;
    BOWL.setTrackFromUrl(value);
  };
  BOWL.on('track:load', function (sound_data) {
    showMessage('Track added: ' + sound_data.title);
    saveFileToLocalStorage();
  });
  BOWL.on('track:error', function (err_msg) {
    showMessage(err_msg);
  });


  // toggle audio with space key
  // ---------------------------

  document.body.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
      BOWL.togglePlayTrack();
    }
  });


  // show messages in dom
  // --------------------

  var waves = {};
  var waves_reg = document.createElement('div');
  extend(waves_reg.style, {
    position:        'absolute',
    left:            '10px',
    top:             '10px',
    width:           '35%',
    overflow:        'hidden'
  });
  document.body.appendChild(waves_reg);
  var createWaveElement = function (name) {
    // dom element
    var wave_item = document.createElement('div');
    extend(wave_item.style, {
      padding:                  '5px 10px',
      'margin-bottom':          '5px',
      backgroundColor:          'black',
      color:                    'white'
    });
    var wave_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    extend(wave_item.style, {
      width:                    '100%',
      height:                   '40px',
      stroke:                   'white',
      fill:                     'none',
      'stroke-width':           '3px',
      'stroke-linejoin':        'round'
    });
    var wave_line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    wave_line.setAttribute('points', '0, 0');
    wave_svg.appendChild(wave_line);
    extend(wave_svg.style, {
      position:                  'absolute',
      left:                      '100%',
      width:                     '200%',
      overflow:                  'visible'
    });
    wave_item.appendChild(wave_svg);
    waves_reg.appendChild(wave_item);
    waves[name] = {
      el: wave_item,
      svg: wave_svg,
      polyline: wave_line,
      history: [],
      last_t: Date.now(),
      last_x: 0
    };
  };
  var updateWaveElement = function (name, val) {
    if (!waves[name]) createWaveElement(name);
    var wave = waves[name];
    var points = wave.polyline.getAttribute('points');
    var now = Date.now();
    var dt = now - wave.last_t;
    if (dt === 0) return;
    var x = wave.last_x + dt * 0.05;
    wave.polyline.style.transform = 'translateX(-' + x + 'px)';
    wave.polyline.setAttribute('points', points + ' ' + x + ', ' + (40 - val));
    wave.last_t = now;
    wave.last_x = x;
  };


  // FILES STUFF
  // ===========

  // load working file from localstorage
  // -----------------------------------

  var file = localStorage.getItem('working_file');
  if (file) BOWL.fromJSON(file);
  each(BOWL.layers, function (l) {
    l.makeInteractive.call(l);
  });


  // save file when pressing s key
  // -----------------------------

  var saveFileToFileSystem = EDITOR.saveFileToFileSystem = function () {
    BOWL.generateCoverImage();
    //BOWL.generateModiefiedDate();
    var file = new File([BOWL.toJSON()],
      BOWL.filename,
      {
      type: "application/json;charset=utf-8"
    });
    saveAs(file);
  };

  document.body.addEventListener('keydown', function (e) {
    if (e.code === 'KeyS') {
      if (!confirm('download file?'))
        return;
      saveFileToFileSystem();
    }
  });

})();
