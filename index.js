var Metalsmith        = require('metalsmith');
var markdown          = require('metalsmith-markdown');
var layouts           = require('metalsmith-layouts');
var permalinks        = require('metalsmith-permalinks');
var watch             = require('metalsmith-watch');
var browserSync       = require('metalsmith-browser-sync');
var metalsmithExpress = require('metalsmith-express');
var assets            = require('metalsmith-assets');
var sass              = require('metalsmith-sass');
var debug             = require('debug')('metalsmith-myplugin');
var chalk             = require('chalk');
var fs                = require('fs');
var dataUriToBuffer   = require('data-uri-to-buffer');


Metalsmith(__dirname)
  .metadata({
    title: "childsplay",
    description: "It's about saying »Hello« to the World.",
    url: "http://localhost:3000"
  })
  .source('./src')
  .destination('./build')
  .clean(true)
  .use(remove_hidden())
  .use(log_files())
  .use(markdown())
  .use(permalinks({
    relative: false
  }))
  .use(lasagna())
  .use(log_files())
  .use(layouts({
    engine: 'pug'
  }))
  .use(sass())
  .use(assets({
    source: './assets'
  }))
  .use(metalsmithExpress())
  .use(browserSync({
    files: [
      'src/**/*',
      'layouts/**/*',
      'assets/**/*'
    ]
  }))
  .build(function(err, files) {
    if (err) { throw err; }
  });

// Custom plugins
function remove_hidden () {
  return function (files, metalsmith, done) {
    setImmediate(done);
    var filenames = Object.keys(files);
    filenames.forEach(function (filename) {
      var hidden = false;
      var slices = filename.split('/');
      slices.forEach(function (slice) {
        if (!!slice.match(/^\./)) hidden = true;
      });
      if (hidden) delete files[filename];
    });
  };
}
function lasagna () {
  return function (files, metalsmith, done) {
    setImmediate(done);
    var filenames = Object.keys(files);
    var lasagna_files = [];
    metalsmith._metadata.lasagna_files = [];
    filenames.forEach(function (filename) {
      if (filename.match('♡')) lasagna_files.push(filename);
    });
    // Add to metadata
    lasagna_files.forEach(function (filename) {
      var file = files[filename];
      var content = JSON.parse(file.contents.toString('utf8'));

      // add basic data
      content.track_name = filename.replace(/^tracks\//, '');
      content.link = '/tracks/#' + content.track_name;

      // create cover image
      if (content.cover_img) {
        var img_file = {
          contents: dataUriToBuffer(content.cover_img)
        };
        files['covers/' + content.track_name.replace('♡', 'png')] = img_file;
        content.cover_url = '/covers/' + content.track_name.replace('♡', 'png');
        delete content.cover_img;
        console.log(
          chalk.gray('[lasagna] ') +
          chalk.green('✔︎ ') +
          'created png cover for #name'
          .replace('#name', content.track_name)
        );
      } else {
        content.cover_url = '/covers/placeholder.png';
        console.log(
          chalk.gray('[lasagna] ') +
          chalk.green('✔︎ ') +
          'couldn\'t create png cover for #name'
          .replace('#name', content.track_name)
        );
      }

      metalsmith._metadata.lasagna_files.push(content);
    });

    // sort by saved_at
    metalsmith._metadata.lasagna_files.sort(function (a, b) {
      return b.saved_at - a.saved_at;
    });

    console.log(
      chalk.gray('[lasagna] ') +
      chalk.green('✔︎ ') +
      'Added #fn lasagna files to metadata.lasagna_files'
      .replace('#fn', lasagna_files.length)
    );
    // Copy files to files/
    lasagna_files.forEach(function (filename) {
      var file = files[filename];
      files[filename.replace('tracks', 'files')] = file;
      delete files[filename];
    });
    console.log(
      chalk.gray('[lasagna] ') +
      chalk.green('✔︎ ') +
      'Copied #fn lasagna files to files/'
      .replace('#fn', lasagna_files.length)
    );
  };
}

function log_files () {
  return function (files, metalsmith, done) {
    setImmediate(done);
    var filenames = Object.keys(files);
    //console.log(filenames);
  };
};
