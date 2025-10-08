const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(cors());
app.use(bodyParser.json({limit: '5mb'}));

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.post('/api/upload-backup', (req, res) => {
  try {
    const payload = req.body;
    if (!payload) return res.status(400).json({ error: 'No JSON body provided' });
    const fileName = `backup_${Date.now()}.json`;
    const filePath = path.join(DATA_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return res.json({ ok: true, file: fileName });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save backup' });
  }
});

app.get('/api/backups', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    return res.json({ backups: files });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list backups' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
