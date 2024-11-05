const path = require('path');
const rules = require('./webpack.rules.js');

module.exports = {
  mode: 'development', // or 'production' based on your environment
  entry: './src/index.jsx', // Adjust the entry point as needed
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/, // Add this rule to handle CSS files
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/, // Add this rule to handle font files
        use: ['file-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devServer: {
    contentBase: path.join(__dirname, 'build'),
    compress: true,
    port: 3000,
    historyApiFallback: true
  }
};
