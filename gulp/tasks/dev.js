var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require("webpack");
var webpackConfig = require("../../webpack.config.js");
var WebpackDevServer = require('webpack-dev-server');

gulp.task('dev', ['sass', 'copy', 'config', 'fonts', 'images', 'svg', 'jqueryUndupe'], function () {
    var devConfig = Object.create(webpackConfig);
    devConfig.devtool = "eval";
    devConfig.debug = true;

    // Start a webpack-dev-server
    var server = new WebpackDevServer(webpack(devConfig), {
        //TODO: Pick one of the versions below
        //AML version
        publicPath: "/dist/assets",
        //Vistronix version
        //contentBase: "./dist",
        //publicPath: "/assets",
        stats: {
            colors: true
        }
    });

    server.listen(8000, "0.0.0.0", function (err) {
        if(err) throw new gutil.PluginError("webpack-dev-server", err);
        gutil.log("[webpack-dev-server]", "http://localhost:8000/webpack-dev-server/dist");
                                  //TODO: ^^^Here^^^, change to just "http://localhost:8000"?
    });

    // refresh app on sass, images and html changes
    gulp.watch(['app/styles/**/*'], ['sass', reloadApp]);

    gulp.watch(['app/images/**/*', 'app/index.html'], ['copy', reloadApp]);

    // refersh app manually
    function reloadApp () {
        //TODO: Comment out the next line?
        server.io.sockets.emit('ok');
    }
});
