'use strict';

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.loadNpmTasks('grunt-google-fonts');

  var srcDir = 'src';
  var distDir = 'dist';

  grunt.initConfig({
    clean: {
      files: distDir,
      options: {
        force: true
      }
    },
    useminPrepare: {
      html: [
        srcDir+'/annie.html'
      ],
      options: {
        dest: distDir,
        flow: {
          steps: {
            'css': ['concat','cssmin'],
            'js': ['concat','uglify']
          },
          post: {}
        }
      }
    },
    usemin: {
      html: [
        distDir+'/annie.html'
      ]
    },
    copy: {
      html: {
        expand: true,
        cwd: srcDir,
        src: [
          './*.html'
        ],
        dest: distDir,
        options : {
          noProcess: '**/*.{png,gif,jpg,ico,svg,eot,ttf,woff,woff2}',
          process: function (content) {
            return content.replace(/<!-- dev -->.*<!-- enddev -->\n?/g, '')
              .replace(/<!-- mustache /g, '')
              .replace(/ end mustache -->\n?/g, '');
          }
        }
      },
      js: {
        expand: true,
        cwd: srcDir,
        src: [
          'js/*.js'
        ],
        dest: distDir
      },
      css: {
        expand: true,
        cwd: srcDir,
        src: [
          'css/*.css'
        ],
        dest: distDir
      },
      bootstrapfonts: {
        expand: true,
        cwd: 'node_modules/bootstrap/dist',
        src: [
          './fonts/**'
        ],
        dest: distDir+'/'
      },
      fontawesomefonts: {
        expand: true,
        cwd: 'node_modules/font-awesome',
        src: [
          './fonts/**'
        ],
        dest: distDir+'/'
      },
      images: {
        expand: true,
        cwd: srcDir,
        src: [
          './*.png'
        ],
        dest: distDir+'/'
      },
      favicon: {
        expand: true,
        cwd: srcDir,
        src: [
          './favicon/**'
        ],
        dest: distDir+'/'
      }
    },
    googlefonts: {
      dest: {
        options: {
          fontPath: distDir+'/fonts/',
          httpPath: '../fonts/',
          cssFile: distDir+'/css/fonts.css',
          fonts: [
            {
              family: 'Poppins',
              styles: [
                400
              ]
            }
          ]
        }
      }
    }
  });

  grunt.registerTask('default', [
    'build'
  ]);

  grunt.registerTask('build', [
    'clean',
    'useminPrepare',
    'concat',
    'uglify',
    'cssmin',
    'copy',
    'googlefonts',
    'usemin'
  ]);
};
