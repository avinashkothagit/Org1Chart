var Config = require('./config.js');

var browserifyTransforms = ['browserify-shim','browserify-ngmin'];

var buildJSTasks = ['browserify', 'clean', 'filerev', 'filerev_assets'];

if (!Config.isDevelopment()) {
    browserifyTransforms.push('uglifyify');
    buildJSTasks.push('compress');
}

var buildCSSTasks = ['less', 'autoprefixer', 'purifycss'];
if(!Config.isDevelopment()){
    buildCSSTasks.push('cssmin');
}

module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        isDev: Config.isDevelopment(),

        browserify: {
            './dist/js/bundle.js': ['./app/app.js'],
            options: {
                browserifyOptions: {
                    debug: '<%= isDev %>'
                },
                transform: browserifyTransforms
            }
        },

        uglify: {
            js: {
                options: {
                    mangle: false
                },
                files: {
                    'dist/js/bundle.js': ['dist/js/bundle.js']
                }
            }
        },

        filerev: {
            options: {
                encoding: 'utf8',
                algorithm: 'md5',
                length: 8
            },
            assets: {
                src: 'dist/{fonts,js,css,images}/*.{jpg,jpeg,gif,png,webp,css,js,woff}',
                dest: 'dist/compiled',
                filter: function(src){
                    return src.indexOf('<%= filerev.assets.dest %>') < 0;
                }
            }
        },
        clean: ['<%= filerev.assets.dest %>'],

        filerev_assets: {
            dist: {
                options: {
                    dest: '<%= filerev.assets.dest %>' + '/assetManifest.json',
                    prettyPrint: true,
                    cwd: 'app/'
                }
            }
        },

        less: {
            style: {
                files: {
                    "dist/css/style.css": "app/css/style.less"
                }
            }
        },

        autoprefixer: {
            options: {
                browsers: ["last 2 Chrome versions", "ios >= 7"]
            },
            dist: {
                files: {
                    'dist/css/style.css': 'dist/css/style.css'
                }
            }
        },

        cssmin: {
            css: {
                src: 'dist/css/style.css',
                dest: 'dist/css/style.css'
            }
        },

        purifycss: {
            options: {},
            target: {
                src: ['app/*.js', 'server/views/**/*.ejs'],
                css: ['dist/css/style.css'],
                dest: 'dist/css/style.css'
            }
        },

        watch: {
            css: {
                files: ['app/css/*'],
                tasks: ['buildCSS'],
                // NOTE: you need to install the livereload extension for chrome.
                options: {
                    livereload: true
                }
            },
            js: {
                files: ['app/*.js'],
                tasks: ['buildJavaScript']
            }
        },

        compress: {
            main: {
                options: {
                    mode: 'gzip',
                    level: '9'
                },
                src: ['dist/js/bundle.js'],
                dest: 'dist/js/bundle.js.gz'
            }
        }
    });

    grunt.registerTask('buildJavaScript', buildJSTasks);
    grunt.registerTask('buildCSS', buildCSSTasks);
    grunt.registerTask('default', ['buildCSS', 'buildJavaScript']);
    grunt.registerTask('deploy', ['buildCSS', 'cssmin', 'buildJavaScript', 'compress']);

    grunt.loadNpmTasks('grunt-contrib-less'         );
    grunt.loadNpmTasks('grunt-contrib-watch'        );
    grunt.loadNpmTasks('grunt-contrib-cssmin'       );
    grunt.loadNpmTasks('grunt-autoprefixer'         );
    grunt.loadNpmTasks('grunt-browserify'           );
    grunt.loadNpmTasks('grunt-contrib-compress'     );
    grunt.loadNpmTasks('grunt-filerev'              );
    grunt.loadNpmTasks('grunt-filerev-assets'       );
    grunt.loadNpmTasks('grunt-contrib-clean'        );
    grunt.loadNpmTasks('grunt-purifycss'            );

};
