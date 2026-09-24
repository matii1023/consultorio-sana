const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const specialtiesRoutes = require('./routes/specialties.routes');
const doctorsRoutes = require('./routes/doctors.routes');
const patientsRoutes = require('./routes/patients.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const medicalRecordsRoutes = require('./routes/medicalRecords.routes');
const usersRoutes = require('./routes/users.routes');
const auditRoutes = require('./routes/audit.routes');
const prescriptionsRoutes = require('./routes/prescriptions.routes');
const backupRoutes = require('./routes/backup.routes');
const settingsRoutes = require('./routes/settings.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const waitlistRoutes = require('./routes/waitlist.routes');  
const whatsappTemplatesRoutes = require('./routes/whatsappTemplates.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: '+sana backend', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/specialties', specialtiesRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/whatsapp-templates', whatsappTemplatesRoutes);

app.use(errorHandler);

module.exports = app;