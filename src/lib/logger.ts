import bunyan = require('bunyan');

const stream: bunyan.Stream = {
    level: (process.env.LOGLEVEL || "info") as bunyan.LogLevel,
    stream: process.stdout,
};

export default bunyan.createLogger({ name: 'LinkedIn-RSC-Cloudwatch-Rule-POC', serializers: { err: bunyan.stdSerializers.err }, streams: [stream] });
