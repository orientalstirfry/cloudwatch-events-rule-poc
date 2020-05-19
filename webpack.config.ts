import webpack from 'webpack';
import { join } from 'path';

const config: webpack.Configuration = {
  mode: 'production',
  entry: {
    'create-event-schedule': join(__dirname, './src/handlers', 'create-event-schedule'),
    'scheduled-event': join(__dirname, './src/handlers', 'scheduled-event')
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },
  output: {
    libraryTarget: 'commonjs',
    path: join(__dirname, 'dist'),
    filename: '[name].js',
  },
  target: 'node',
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader' },
    ],
  },  
}

export = config;