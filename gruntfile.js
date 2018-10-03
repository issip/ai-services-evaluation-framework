module.exports = function(grunt) {
	//project configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify: {
			dist:{
				src: ['client/src/ng/app.js','client/src/ng/**/*.js'],
				dest: 'client/build/bundle.js',
				options: {
					browserifyOptions: {
						paths: ['./node_modules']
					},
					transform: ['bulkify']
				},
			}
		},
		concat: {
			dist: {
				files:{
				}
			},
			options: {
				sourceMap: true
			}
		},
		copy: { //File copier
			main:{
				files: [{
					cwd: 'client/src',
					src: ['css/**/*.css','fonts/**','img/**','html/**'],
					dest: 'client/build',
					expand: true
				}]
			}
		},
		uglify: { //Code obfuscator to minimise code
			my_target: {
				files: {
				}
			}
		},
		watch: { //Delta watcher that copies files over to the build folder.
			copy: {
				files: ['client/src/css/**','client/src/libs/**','client/src/fonts/**','client/src/img/**','client/src/html/**'],
				tasks: ['copy']
			},
			compile: {
				files: ['client/src/ng/**'],
				tasks: ['browserify']
			},
		}
	});

	//Load the plugin tasks
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-sass');
	//grunt.loadNpmTasks('grunt-contrib-uglify'); //Turn off when debugging.
	grunt.loadNpmTasks('grunt-contrib-watch');

	//Default tasks
	grunt.registerTask('default', ['clean','browserify','concat','copy','sass','watch']);
}
