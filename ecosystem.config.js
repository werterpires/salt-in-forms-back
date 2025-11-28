require('dotenv').config()
 
module.exports = {
  apps: [
    {
      name: 'saltInformsBack',
      script: './dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: { ...process.env }
    }
  ]
}
