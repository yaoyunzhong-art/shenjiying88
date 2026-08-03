const fs = require('fs');
const execSync = require('child_process').execSync;

const legacyFiles = execSync('find apps/admin-web/app -name "*-legacy.tsx"').toString().trim().split('\n').filter(Boolean);

for (const legacy of legacyFiles) {
  const client = legacy.replace('-legacy.tsx', '-client.tsx');
  const hasClient = fs.existsSync(client);
  console.log(`${legacy} -> Has Client: ${hasClient}`);
}
