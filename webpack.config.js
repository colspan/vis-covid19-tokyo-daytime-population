const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    app: './src/index.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ]
      },
      {
        test: /\.png$/,
        use: [
          'file-loader',
        ]
      }
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "initial",
        },
      },
    },
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    compress: true,
    host: '0.0.0.0',
    disableHostCheck: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
  ]
};
