'use strict';

import {spawn} from 'child_process';
import gulp from 'gulp';
import del from 'del';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import extend from 'xtend';

const $ = gulpLoadPlugins();

const src = {
    html: ['./src/**/*.html'],
    sass: ['./src/sass/**/*.scss'],
    js: ['./src/js/**/*.js'],
    images: ['./src/images/**/*.jpg', './src/images/**/*.png', './src/images/**/*.mov', './src/images/**/*.mp4']
};

const build = {
    dir: './build',
    html: './build/html',
    js: './build/js',
    css: './build/css',
    lib: './build/lib',
    images: './build/images'
};

const dest = './build';

gulp.task('help', $.taskListing);

gulp.task('bower:module', function() {
    return gulp.src('./bower.json')
        .pipe($.mainBowerFiles())
        .pipe(gulp.dest('./tests/lib'))
});

gulp.task('html:module', function() {
    return gulp.src('./src-module/admin-template.html')
        .pipe($.nginclude())
        .pipe($.rename('admin-template-merged.html'))
        .pipe(gulp.dest('./src-module'))
});

gulp.task('sass:module', function() {
    return gulp.src(['./node_modules/angular-bootstrap-calendar/dist/css/angular-bootstrap-calendar.min.css','./src-module/sass/index.scss'])
        .pipe($.sass().on('error', $.sass.logError))
        .pipe($.concat('angular-leadgen.css'))
        .pipe(gulp.dest('./dist-module'));
});

gulp.task('dist:module', ['bower:module', 'fonts:module', 'html:module', 'sass:module'], function() {
    return gulp.src(['./src-module/angular-leadgen.js', './src-module/**/*.js'])
        .pipe($.angularEmbedTemplates())
        .pipe($.concat('angular-leadgen-min.js'))
        .pipe(gulp.dest('./dist-module'))
});

gulp.task('watch:module', function() {
    gulp.watch('./src-module/**/*.js', ['dist:module']);
    gulp.watch('./src-module/**/*.scss', ['dist:module']);
    gulp.watch('./src-module/**/*.html', ['dist:module']);
});

gulp.task('fonts:module', function () {
    gulp.src(['./src-module/**/*.eot','./src-module/**/*.ttf','./src-module/**/*.woff','./src-module/**/*.woff'])
    .pipe(gulp.dest('./dist-module'))
});

gulp.task('clean:bower', () => {
    return del(['lib/**/*']);
});

gulp.task('bower', cb =>
    gulp.src('./src/bower.json')
    .pipe($.mainBowerFiles())
    .pipe(gulp.dest('build/lib')));

gulp.task('scripts', cb =>
    gulp.src(src.js)
    .pipe($.babel({
        presets: ['es2015', 'react']
    }))
    .pipe(gulp.dest(build.js))
    .pipe($.if(browserSync.active, browserSync.stream()))
);

gulp.task('copy:html', cb =>
    gulp.src(src.html)
    .pipe($.if(process.env.NODE_ENV === 'production', $.useref()))
    .pipe(gulp.dest(build.dir))
);

// these are one liners b/c they're copies
gulp.task('copy:images', cb => gulp.src(src.images).pipe(gulp.dest(build.images)));
gulp.task('copy:mainproc', cb => gulp.src('./src/main.js').pipe(gulp.dest(build.dir)));

// this copies the package json and does a production npm install
gulp.task('copy:json', () => {
    gulp.src('package.json')
        .pipe(gulp.dest(build.dir))
        .pipe($.exec('cd ' + build.dir + ' && npm prune && npm install --production --quiet'))
        .pipe($.exec.reporter());
});

gulp.task('copy', ['copy:images', 'copy:html', 'copy:mainproc', 'copy:json']);

gulp.task('styles', () =>
    gulp.src("./src/sass/index.scss")
    .pipe($.sass().on('error', $.sass.logError))
    .pipe(gulp.dest(build.css))
    .pipe($.if(browserSync.active, browserSync.stream()))
);

gulp.task('build', ['copy', 'styles', 'bower', 'scripts', 'dist:module']);

function runElectronApp(path, env = {}) {
    const electron = require('electron-prebuilt');
    const options = {
        env: extend({
            NODE_ENV: 'development'
        }, env, process.env),
        stdio: 'inherit'
    };
    return spawn(electron, [path], options);
}

gulp.task('serve', ['build'], () => {
    runElectronApp(dest);
});

gulp.task('watch', ['build'], cb => {
    function getRootUrl(options) {
        const port = options.get('port');
        return `http://localhost:${port}`;
    }

    function getClientUrl(options) {
        const connectUtils = require('browser-sync/lib/connect-utils');
        const pathname = connectUtils.clientScript(options);
        return getRootUrl(options) + pathname;
    }

    const options = {
        ui: false,
        port: 35829,
        ghostMode: false,
        open: false,
        notify: false,
        logSnippet: false,
        socket: {
            // Use the actual port here.
            domain: getRootUrl
        }
    };

    gulp.start('watch:module');

    browserSync.init(options, (err, bs) => {
        if (err) {
            return cb(err);
        }

        runElectronApp(dest + '/main.js', {
            BROWSER_SYNC_CLIENT_URL: getClientUrl(bs.options)
        });

        browserSync.watch(src.js)
            .on('change', () => gulp.start('scripts'));
        browserSync.watch(src.html)
            .on('change', () => gulp.start('copy:html', browserSync.reload));

        browserSync.watch(src.sass)
            .on('change', () => gulp.start('styles'));

        cb();
    });
});