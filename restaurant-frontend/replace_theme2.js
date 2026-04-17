const fs = require('fs');
const path = require('path');

const directoriesToScan = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'components')
];

let replacedCount = 0;

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  const replacements = [
    { regex: /background:\s*"#eef3ff"/g, replace: 'background: "var(--bg-tertiary)"' },
    { regex: /background:\s*"#f9fbff"/g, replace: 'background: "var(--bg-tertiary)"' },
    { regex: /background:\s*"#f8fafc"/g, replace: 'background: "var(--bg-tertiary)"' },
    { regex: /background:\s*"#fafafa"/g, replace: 'background: "var(--bg-tertiary)"' },
    { regex: /background:\s*"#ecf0f1"/g, replace: 'background: "var(--bg-secondary)"' },

    { regex: /color:\s*"#444"/g, replace: 'color: "var(--text-secondary)"' },
    { regex: /color:\s*"#777"/g, replace: 'color: "var(--text-secondary)"' },
    { regex: /color:\s*"#888"/g, replace: 'color: "var(--text-secondary)"' },
    
    // Auth pages specific dark text colors
    { regex: /color:\s*"#0f172a"/g, replace: 'color: "var(--text-primary)"' },
    { regex: /color:\s*"#334155"/g, replace: 'color: "var(--text-primary)"' },
    { regex: /color:\s*"#64748b"/g, replace: 'color: "var(--text-secondary)"' },
    
    // Auth pages backgrounds
    { regex: /background:\s*"#f1f5f9"/g, replace: 'background: "var(--bg-secondary)"' },
    
    // other border colors
    { regex: /border:\s*"1px solid #e2e8f0"/g, replace: 'border: "1px solid var(--border-color)"' },
    { regex: /borderBottom:\s*"1px solid #e2e8f0"/g, replace: 'borderBottom: "1px solid var(--border-color)"' },
    { regex: /border:\s*"1px solid #cbd5e1"/g, replace: 'border: "1px solid var(--border-color)"' }
  ];

  replacements.forEach(r => {
    content = content.replace(r.regex, r.replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
    replacedCount++;
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

directoriesToScan.forEach(scanDir);
console.log(`Additional theme variables applied to ${replacedCount} files.`);
