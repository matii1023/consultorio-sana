require('dotenv').config();
const app = require('./src/app');
const { startJobs } = require('./src/jobs/reminders.job');

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  console.log(`🚀 Servidor +sana corriendo en puerto ${PORT}`);

  if (process.env.NODE_ENV === 'development') {
    startJobs();
    console.log('⏰ Cron jobs iniciados (solo en desarrollo)');
  } else {
    console.log('⏰ Cron jobs deshabilitados en producción');
  }
});