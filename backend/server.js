const path = require('path');
const path = require('path');
const { loadEnvFile } = require('./loadEnv');

loadEnvFile();

const { createApp } = require('./app');

const app = createApp({ serveStatic: true });
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('Mr. Crown Fancy Dosa is running at http://localhost:' + PORT);
  console.log('Admin panel: http://localhost:' + PORT + '/admin.html');
});
