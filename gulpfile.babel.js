'use strict';

import fs from 'fs';
import path from 'path';
import buffer from 'vinyl-buffer';
import merge from 'merge-stream';
import del from 'del';
import browserSync from 'browser-sync';
import gulp from 'gulp';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import prompt from 'gulp-prompt';
import spritesmith from 'gulp.spritesmith';
import imagemin from 'gulp-imagemin';
import yargs from 'yargs';

const argv = yargs.argv;
const reload = browserSync.reload;

let paths = {
    baseDir: './',
    src: {
        html: 'src/html/',
        img: 'src/',
        sass: 'docs/',
        sprites: ''
    },
    dist: {
        all: 'dist/',
        css: 'docs/',
        map: './map/',
        sprites: ''
    },
    docs: 'docs/'
}

let serviceName, folderName;

function getFolderName(path, subFolder) {
    return fs.readdirSync(path).filter(function(file) {
        if (subFolder) {
            return fs.existsSync(path + '/' + file + subFolder);
        } else {
            return fs.statSync(path + '/' + file).isDirectory();
        }
    });
}

gulp.task('selectSprites', () => {
    return gulp.src('')
        .pipe(prompt.prompt({
            type: 'list',
            name: 'service',
            message: 'Select Service for CSS Sprites',
            choices: getFolderName(paths.src.img, '/sprites/')
        }, function(res) {
            serviceName = res.service;
            paths.src.sprites = paths.src.img + serviceName + '/sprites/';

            return gulp.src('')
                .pipe(prompt.prompt({
                    type: 'list',
                    name: 'folder',
                    message: 'Select Folder for CSS Sprites',
                    choices: getFolderName(paths.src.sprites)
                }, function(res) {
                    folderName = res.folder;
                    paths.src.sprites = paths.src.sprites + folderName + '/';
                    paths.dist.sprites = paths.dist.all + serviceName + '/sprites/' + folderName + '/';

                    del(paths.dist.sprites);
                    gulp.start('sprites');
                }));
        }))
});

gulp.task('sprites', () => {
    // Generate our spritesheet
    const spriteData = gulp.src(paths.src.sprites + '*.png').pipe(spritesmith({
        imgName: 'sp_' + folderName + '.png',
        imgPath: '/MW/img/' + serviceName + '/sprites/' + folderName + '/sp_' + folderName + '.png',
        cssName: 'sp_' + folderName + '.scss',
        cssTemplate: 'lib/scss-minimal.handlebars',
        cssVarMap: function(sprites) {
            sprites.name = 'sp_' + folderName + '_' + sprites.name;
        },
        padding: argv.padding || 10,
        algorithm: argv.algorithm || 'binary-tree' // binary-tree, top-down, left-right, diagonal, alt-diagonal
    }));

    // Pipe image stream through image optimizer and onto disk
    const imgStream = spriteData.img
        // DEV: We must buffer our stream into a Buffer for `imagemin`
        .pipe(buffer())
        .pipe(imagemin())
        .pipe(gulp.dest(paths.dist.sprites));

    console.log(paths.dist.sprites + folderName + '.png');

    // Pipe SCSS onto disk
    const scssStream = spriteData.css
        .pipe(gulp.dest(paths.dist.sprites));

    console.log(paths.dist.sprites + folderName + '.scss');

    // Return a merged stream to handle both `end` events
    return merge(imgStream, scssStream);
});

gulp.task('sass', () => {
    return gulp.src(paths.src.sass + '*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass.sync({
            outputStyle: 'expanded'
        }))
        .pipe(sourcemaps.write(paths.dist.map))
        .pipe(gulp.dest(paths.dist.css))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('serve', ['sass'], () => {
    browserSync({
        notify: true,
        port: 9000,
        startPath: 'docs/sprites.html',
        server: {
            baseDir: paths.baseDir,
            directory: true,
            routes: {
                '/MW/img': 'dist'
            }
        }
    });

    gulp.watch(paths.docs + '*.html').on('change', reload);
    gulp.watch(paths.src.sass + '*.scss', ['sass']);
});

gulp.task('default', ['selectSprites']);
