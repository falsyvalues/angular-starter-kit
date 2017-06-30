import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const isProd = process.env.NODE_ENV === 'production';

export default (function makeWebpackConfig() {
	const config = {};

	/**
	 * Configuration begins here
	 * Reference: http://webpack.github.io/docs/configuration.html
	 */

	// Cache generated modules and chunks to improve performance for multiple incremental builds.
	// Reference: http://webpack.github.io/docs/configuration.html#cache
	config.cache = true;

	// Mapping entry point
	// More: https://github.com/webpack/webpack/issues/1189
	config.entry = {
		// This will map entry point to destination path related to output.path
		'dist/app': './src/app/app.js'
	};

	// Options affecting the output of the compilation.
	// Reference: http://webpack.github.io/docs/configuration.html#output
	// Additional notes:
	// http://webpack.github.io/docs/long-term-caching.html
	// https://medium.com/@okonetchnikov/long-term-caching-of-static-assets-with-webpack-1ecb139adb95
	config.output = {
		path: path.resolve(__dirname, 'dist'),
		publicPath: './',
		filename: isProd ? '[name].[chunkhash].js' : '[name].bundle.js',
		// This is probably a bug, since chunks doesn't respect entry mapping in config
		chunkFilename: isProd ? 'dist/[name].[chunkhash].js' : 'dist/[name].bundle.js'
	};

	// Choose a developer tool to enhance debugging.
	// Reference: https://webpack.js.org/configuration/devtool/#devtool
	config.devtool = 'source-map';

	/**
	 * Loaders definition
	 * Reference: http://webpack.github.io/docs/configuration.html#module-loaders
	 * List: http://webpack.github.io/docs/list-of-loaders.html
	 * This handles most of the magic responsible for converting modules
	 */

	config.module = {
		rules: [
			{
				// JS LOADER
				// Reference: https://github.com/babel/babel-loader
				// Transpile .js files using babel-loader (compile ES6 and ES7 into ES5 code)
				test: /\.js$/,
				exclude: /node_modules/,
				// We may use ng-annotate module later
				// Reference: https://github.com/jeffling/ng-annotate-webpack-plugin
				loader: 'babel-loader',
				options: {
					// By default Babel is injecting helpers into each file that requires it.
					// Require the babel runtime as a separate module to avoid the duplication.
					// Reference: https://github.com/babel/babel-loader#babel-is-injecting-helpers-into-each-file-and-bloating-my-code
					plugins: ['transform-runtime']
				}
			},
			{
				test: /\.s?css$/,
				use: ExtractTextPlugin.extract({
					// STYLE LOADER
					// Reference: https://github.com/webpack-contrib/style-loader
					fallback: 'style-loader',
					use: [
						{
							// CSS LOADER
							// Reference: https://github.com/webpack-contrib/css-loader
							loader: 'css-loader',
							options: {
								importLoader: true,
								// Enable CSS minification, this option has no connection to config.devtool
								// Reference: https://github.com/webpack/webpack/issues/189
								minimize: true,
								sourceMap: true
							}
						},
						{
							// SASS LOADER
							// Reference: https://github.com/webpack-contrib/sass-loader
							loader: 'sass-loader',
							options: {}
						},
						{
							// POSTCSS LOADER
							// Reference: https://github.com/postcss/postcss-loader
							loader: 'postcss-loader'
						}
					]
				})
			},
			{
				// HTML LOADER
				// Reference: https://github.com/webpack/raw-loader
				// Allow loading html through js
				test: /\.html$/,
				exclude: /node_modules/,
				loader: 'raw-loader'
			}
		]
	};

	/**
	 * Add additional plugins to the compiler
	 * Reference: https://webpack.js.org/configuration/plugins/
	 * List: https://webpack.js.org/plugins/
	 * More: https://github.com/webpack-contrib/awesome-webpack#webpack-plugins
	 */

	config.plugins = [];

	// HtmlWebpackPlugin
	// Injects bundles in your main file instead of wiring all manually.
	// Reference: https://github.com/ampedandwired/html-webpack-plugin
	config.plugins.push(
		new HtmlWebpackPlugin({
			filename: 'index.html',
			inject: 'head'
		})
	);

	// ExtractTextPlugin
	// Extracting css chunks into a separate file
	// Reference: https://github.com/webpack-contrib/extract-text-webpack-plugin
	config.plugins.push(
		new ExtractTextPlugin(isProd ? 'dist/style.[chunkhash].css' : 'dist/style.css')
	);

	// Automatically move all modules defined outside of application directory to vendor bundle.
	// If you are using more complicated project structure, consider to specify common chunks manually.
	// Reference: http://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin
	config.plugins.push(
		new webpack.optimize.CommonsChunkPlugin({
			// Destination path (entry config) mapping is also needed here
			name: 'dist/vendor',
			minChunks(module, count) {
				return module.resource && (
					module.resource.indexOf(path.resolve(__dirname, 'src', 'app')) === -1
				);
			}
		})
	);

	if (isProd) {
		config.plugins.push(
			// Minimize all JavaScript output of chunks. Loaders are switched into minimizing mode.
			// Reference: https://github.com/webpack-contrib/uglifyjs-webpack-plugin
			new webpack.optimize.UglifyJsPlugin({
				mangle: false
			})
		);
	}

	// Dev server configuration
	// Reference: https://webpack.js.org/configuration/dev-server/#devserver
	config.devServer = {
		contentBase: config.output.path,
		compress: true,
		port: 3000
	};

	return config;
})();