module.exports = {
  apps: [
    {
      name: 'anyformat',
      script: '.next/standalone/server.js',
      cwd: __dirname,
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
        HOSTNAME: '0.0.0.0',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
