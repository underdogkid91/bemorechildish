// Gruntfile.js

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-surge');

  grunt.initConfig({
    surge: {
      'childsplay': {
        options: {
          project: 'build/',
          domain: 'bemorechildish.surge.sh'
        }
      }
    }
  });
};
