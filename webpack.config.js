// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'development',            // "production" for minified builds
  entry: './src/main.js',         // The entry point for your orb code
  output: {
    filename: 'bundle.js',        // The output bundle file
    path: path.resolve(__dirname, 'dist'), // Output folder (will be created if it doesn’t exist)
  },
  devServer: {
    // Serve files from the "public" folder and the output "dist" folder
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 8089, // or any open port you prefer
    open: true  // automatically open the browser
  },
  module: {
    rules: [
      // Optional Babel Loader (remove if not needed)
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          // Babel config (modern JS -> older JS)
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
