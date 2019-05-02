/* "use strict"; */

const gulp = require("gulp");
const pug = require("gulp-pug");
const less = require("gulp-less");
const plumber = require("gulp-plumber");  // не прерывает работу вотчера елси есть ошибки сборки
const postcss = require("gulp-postcss");  // позволяет подключить автопрефиксер
const autoprefixer = require("autoprefixer");  // раставляем вендорные префиксы
const server = require("browser-sync").create();
const csso = require("gulp-csso");  // минифицируем CSS
const rename = require("gulp-rename"); // используем что бы переименовать файл
const imagemin = require("gulp-imagemin"); // сжимает jpeg png gif svg
const webp = require("gulp-webp"); // png jpg конвертим в webp
const svgstore = require("gulp-svgstore"); // создаем svg спрайт
const posthtml = require("gulp-posthtml");  // позволяет подключить posthtml-include
const include = require("posthtml-include");// вставляем в разметку SVG спрайт с помощью тега include
const del = require("del"); // удаляем папку build перед новой сборкой
const uglify = require("gulp-uglify"); // сжимает JS минифицирует
const pump = require('pump'); //помогает uglify работать без ошибок
const htmlmin = require("gulp-htmlmin"); // сжимает html минифицирует
const sourcemaps = require("gulp-sourcemaps"); // добавим карты CSS блоков

gulp.task("pug", function () {
  return gulp.src("source/pug/pages/*.pug")
    .pipe(
      plumber({
        errorHandler: notify.onError(function(err) {
          return {
            title: "Pug",
            message: err.message
          }
        })
      })
    )
    .pipe(pug({
      pretty:true // создает несжатый файл html
    }))
    .pipe(gulp.dest("source"));
});

gulp.task("css", function () {
  return gulp.src("source/less/style.less")
  .pipe(plumber(
    {
      errorHandler: notify.onError(function(err) {
        return {
          title: "Styles",
          message: err.message
        }
      })
    }
  ))
  .pipe(sourcemaps.init())
  .pipe(less())
  .pipe(postcss([
    autoprefixer()  // Расставляем вендорные префиксы
  ]))
  .pipe(gulp.dest("build/css"))
  .pipe(csso())  // минифицируем CSS
  .pipe(rename("style.min.css")) // меняем имя файла на style.min.css в разметке указать его
  .pipe(sourcemaps.write("."))  // создаем sourcemap
  .pipe(gulp.dest("build/css"))
  .pipe(server.stream());
});

gulp.task('js', function (cb) { // Сжимаем файлы JS
  pump([
    gulp.src('source/js/*.js'),
    uglify(),
    gulp.dest('build/js')
    ],
    cb
  );
});

gulp.task('minify', function() {
  return gulp.src('build/*.html')  // Сжимаем файлы html
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest('build'));
});

gulp.task("images", function() {  // сжимаем картинки можно делать паралельно !
  return gulp.src("source/img/**/*.{png,jpg,svg}")
  .pipe(imagemin([
    imagemin.optipng({optimizationLevel: 3}),
    imagemin.jpegtran({progressive: true}),
    imagemin.svgo()
  ]))
  .pipe(gulp.dest("source/img"));
});

gulp.task("webp", function() {  // конвертируем изобрежиня в webp формат
  return gulp.src("source/img/**/*.{png,jpg}")
  .pipe(webp({quality: 90}))
  .pipe(gulp.dest("source/img"));
});

gulp.task("sprite", function () { // создаем svg спрайт
  return gulp.src("source/img/icon-*.svg")
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename("sprite.svg"))
  .pipe(gulp.dest("build/img"));
});

gulp.task("html", function () {  // вставляем svg спрайт в разметку
  return gulp.src("source/*.html")
  .pipe(posthtml([
    include()
  ]))
  .pipe(gulp.dest("build"));
});

gulp.task("copy", function () {  // копируем все файлы проекта в папку build
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/img/**",
    "source/js/**",
    "source/**/*.html"
  ], {
    base: "source"
  })
  .pipe(gulp.dest("build"));
});

gulp.task("clean", function () {  // удаелеяем папку с содежимым build перед каждой новой сборкой
  return del("build");
});

gulp.task("build", gulp.series(  // собираем проект запуская таски
  "clean",
  "pug",
  "copy",
  "css",
  "sprite",
  "html",
  'minify',
  'js'
));

gulp.task("server", function () {  // отслеживаем изменения в файлах и пересобираем проект
  server.init({
    server: "build/",
  });

  gulp.watch("source/js/main.js", gulp.series("js", "refresh"));
  gulp.watch("source/less/**/*.less", gulp.series("css"));
  gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/pug/pages/*.pug", gulp.series("pug", "refresh"));
  gulp.watch("source/*.html", gulp.series("html", "refresh"));
});

gulp.task("refresh", function (done){
  server.reload();
  done();
});

gulp.task("start", gulp.series("build", "server"));
