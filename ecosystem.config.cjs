const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "nova-api",
      cwd: path.resolve(__dirname, "apps/api"),
      script: "dist/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        DATA_DIR: path.resolve(__dirname, "data"),
        BACKUP_DIR: path.resolve(__dirname, "backups"),
      },
    },
    {
      name: "nova-web",
      cwd: path.resolve(__dirname, "apps/web"),
      script: path.resolve(__dirname, "node_modules/next/dist/bin/next"),
      args: "start -p 3001",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        INTERNAL_API_URL: "http://127.0.0.1:3002",
      },
    },
  ],
};
