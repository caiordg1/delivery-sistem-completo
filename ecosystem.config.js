module.exports = {
  apps: [
    {
      name: 'delivery-backend',
      script: './backend/src/index.js',
      cwd: '/root/delivery-system',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'delivery-bot',
      script: './bot-whatsapp/src/index.js',
      cwd: '/root/delivery-system',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/bot-error.log',
      out_file: './logs/bot-out.log',
      log_file: './logs/bot-combined.log',
      time: true
    },
    {
      name: 'delivery-menu',
      script: 'serve',
      args: '-s dist -l 5173',
      cwd: '/root/delivery-system/frontend-menu',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/menu-error.log',
      out_file: './logs/menu-out.log',
      log_file: './logs/menu-combined.log',
      time: true
    }
  ]
}
