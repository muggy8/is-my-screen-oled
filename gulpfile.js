const { src, dest, series, parallel } = require('gulp')
const gulpTerser = require('gulp-terser')
const terser = require("terser")
const gulpCleanCSS = require('gulp-clean-css')
const CleanCSS = require('clean-css')
const htmlmin = require('gulp-htmlmin')
const jsonminify = require('gulp-jsonminify')
const replace = require('gulp-async-replace')

const sourceDir = "src"
const outputDir = "docs/"
const cleanCss = new CleanCSS({})

const copy = exports.copy = function() {
	return src([
		`${sourceDir}/**/*.*`,
		`!${sourceDir}/**/*.md`,
		`!${sourceDir}/**/*.png`,
		`!${sourceDir}/**/*.svg`,
		`!${sourceDir}/**/*.webp`,
	])
	.pipe(dest(outputDir))
}

const jsMinificationConfigs = {
	drop_console: true,
	// passes: 3,
}


const minifyJs = exports.minifyJs = function() {
	return src(`${sourceDir}/**/*.js`)
		.pipe(gulpTerser(jsMinificationConfigs, terser.minify))
		.pipe(replace(/(\\n)+(\\t)+/gm, " "))
		.pipe(dest(outputDir))
}

const minifyCss = exports.minifyCss = function() {
	return src(`${sourceDir}/**/*.css`)
		.pipe(gulpCleanCSS())
		.pipe(dest(outputDir))
}

const minifyHtml = exports.minifyHtml = function() {
	return src(`${sourceDir}/**/*.html`)
		.pipe(htmlmin({ collapseWhitespace: true }))
		.pipe(replace(/<style[^>]*>(.+?)<\/style>/gs, function(match, cssCode){
            // console.log("css replace", {match, cssCode})

			const cleanedCss = cleanCss.minify(cssCode)
			return match.replace(cssCode, cleanedCss.styles)
		}))
		.pipe(replace(/<script[^>]*>(.+?)<\/script>/gs, async function(match){
            let jsCode = match
                .replace(/<script[^>]*>/gs, '')
                .replace(/<\/script>/gs, '')

			const minifiedJs = await terser.minify(jsCode)
			return match.replace(jsCode, minifiedJs.code)
		}))
		.pipe(dest(outputDir))
}

const minifyJson = exports.minifyJson = function(){
	return src([
			`${sourceDir}/**/*.json`,
			`${sourceDir}/**/*.webmanifest`,
		])
		.pipe(jsonminify())
		.pipe(dest(outputDir))
}

exports.default = series(
	copy,
	parallel(
		minifyJs,
		minifyCss,
		minifyHtml,
		minifyJson,
	),
)