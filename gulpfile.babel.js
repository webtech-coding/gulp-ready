import gulp from 'gulp'
import sass from 'gulp-sass'
import cleanCSS from 'gulp-clean-css'
import yargs from 'yargs'
import gulpif from 'gulp-if'
import sourcemaps from 'gulp-sourcemaps'
import named from 'vinyl-named'
import webpack from 'webpack-stream'
import uglify from 'gulp-uglify'
import imagemin from 'gulp-imagemin'
import del from 'del'
import browserSync from 'browser-sync'

sass.compiler=require('node-sass')

const PRODUCTION =yargs.argv.prod

const browser=browserSync.create()

const serve=(done)=>{
    browser.init({
        proxy:'http://localhost/gulp-ready/'
    })

    done()
}

const reload=(done)=>{
    browser.reload()
    done()
}

/**
 * SET SOURCE,DESTINATION FOR CSS/JS/IMAGES
 */
const filePath={
    css:{
        source:'./src/scss/main.scss',
        destination:'./dist/css'        
    },
    scripts:{
        source:'./src/js/main.js',
        destination:'./dist/js'
    },
    images:{
        source:'./src/images/**/*.{jpg,JPG,jpeg,JPEG,svg,png,gif}',
        destination:'./dist/images'
    },
    others:{
        source:['./src/**/*','!src/{images,js,scss}','!src/{images,js,scss}/**/*'],
        destination:'./dist'
    }
}

/**
* SASS COMPILER - SET SOURCE MAP ON DEV MODE
*/

const styles=()=>{
    return gulp.src(filePath.css.source)
        .pipe(gulpif(PRODUCTION,sourcemaps.init()))
        .pipe(sass().on('error',sass.logError))
        .pipe(gulpif(PRODUCTION,cleanCSS({compatibility:'1e8'})))
        .pipe(gulpif(PRODUCTION,sourcemaps.write()))
        .pipe(gulp.dest(filePath.css.destination))
}

/**
* SCRIPTS TRANSPILER - UGLIFY THE SCRIPTS FOR PRODUCTION
*/

const scripts=()=>{
    return gulp.src(filePath.scripts.source)
        .pipe(named())
        .pipe(webpack({
            mode:'development',
            module:{
                rules:[
                    {   test:/\.js$/,
                        use:{
                            loader:'babel-loader',
                            options:{
                                presets:['@babel/preset-env']
                            }
                        }
                    }
                ]
            },
            output:{
                filename:'[name].js'
            },
            devtool:!PRODUCTION ? 'inline-source-map':false 
        }))
        .pipe(gulpif(PRODUCTION,uglify()))
        .pipe(gulp.dest(filePath.scripts.destination))
}

/**
 * COPY AND MINIFY IMAGE
 */

const images=()=>{
    return gulp.src(filePath.images.source)
        .pipe(gulpif(PRODUCTION,imagemin()))
        .pipe(gulp.dest(filePath.images.destination))
}

/**
 * REMOVE ENTIRE DIST DIRECTOR
 */
const clean=()=>{
    return del(['./dist'])
}

/**
 * RECREATE THE DIST DIRECTORY FROM SRC
 */
const copy=()=>{
    return gulp.src(filePath.others.source)
        .pipe(gulp.dest(filePath.others.destination))
}

/**
 * WATHCER FOR ALL THE FILES CHANGES
 */
const watch=()=>{
    return gulp.watch('./src/scss/**/*.scss',gulp.series(styles,reload)),
        gulp.watch(filePath.images.source, gulp.series(images, reload)),
        gulp.watch('./src/js/**/*.js',gulp.series(scripts,reload)),
        gulp.watch(filePath.others.source, gulp.series(copy,reload)),
        gulp.watch('./**/*.php', reload)
}

const build=gulp.series(
    clean,
    gulp.parallel(
        styles,
        scripts,
        images,
        copy       
    )
)

const dev=gulp.series(
    clean,
    gulp.parallel(
        styles,
        scripts,
        images,
        copy
    ),
    serve,
    watch
)

export default dev

exports.styles=styles
