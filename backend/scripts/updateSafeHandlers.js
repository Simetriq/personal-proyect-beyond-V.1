const fs = require('fs');
const path = require('path');

const handlersDir = path.join(__dirname, '../src/sockets/handlers');
const files = fs.readdirSync(handlersDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(handlersDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/safeHandler\(\s*(async\s*\()?/g, (match) => {
    return `safeHandler(socket, ` + match.slice(12);
  });
  fs.writeFileSync(filePath, content, 'utf-8');
});

console.log("Updated safeHandlers in handlers");
