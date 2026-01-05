const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'log.csv');

const HEADER = 'Agent,Time,Method,Resource,Version,Status\n';
const MAX_LINES = 20;   // includes header
const MAX_FILES = 5;    // log1..log5

// serialize writes to prevent rotation races
let chain = Promise.resolve();

async function ensureLogFile() {
  await fs.promises.mkdir(LOG_DIR, { recursive: true });

  try {
    await fs.promises.access(LOG_FILE, fs.constants.F_OK);
  } catch {
    await fs.promises.writeFile(LOG_FILE, HEADER, 'utf8');
  }
}

async function countLines() {
  const data = await fs.promises.readFile(LOG_FILE, 'utf8');
  return data.split('\n').filter(Boolean).length;
}

async function rotateLogs() {
  // delete the oldest if it exists (log5.csv)
  const oldest = path.join(LOG_DIR, `log${MAX_FILES}.csv`);
  await fs.promises.unlink(oldest).catch(() => {});

  // shift: log4 -> log5, ... log1 -> log2
  for (let i = MAX_FILES - 1; i >= 1; i--) {
    const src = path.join(LOG_DIR, `log${i}.csv`);
    const dst = path.join(LOG_DIR, `log${i + 1}.csv`);
    await fs.promises.rename(src, dst).catch(() => {});
  }

  // move current log.csv -> log1.csv
  const log1 = path.join(LOG_DIR, 'log1.csv');
  await fs.promises.rename(LOG_FILE, log1);

  // start fresh log.csv with header
  await fs.promises.writeFile(LOG_FILE, HEADER, 'utf8');
}

async function appendLine(line) {
  await ensureLogFile();

  const lines = await countLines();
  if (lines >= MAX_LINES) {
    await rotateLogs();
  }

  await fs.promises.appendFile(LOG_FILE, line + '\n', 'utf8');
}

function logLogger(req, res, next) {
  const agentRaw = req.headers['user-agent'] || '';
  const agent = agentRaw.replace(/,/g, ''); // Option B: strip commas
  const time = new Date().toISOString();
  const method = req.method;
  const resource = req.path;
  const version = `HTTP/${req.httpVersion}`;
  

  // Wait until response is finished so statusCode is correct for 404
  res.on('finish', () => {  
    const status = res.statusCode;

  const line = `${agent},${time},${method},${resource},${version},${status}`;

  console.log(line);

  chain = chain
    .then(() => appendLine(line))
    .catch((err) => console.error('Log error:', err));
  });

  next();
}

module.exports = { logLogger, LOG_FILE, HEADER };
