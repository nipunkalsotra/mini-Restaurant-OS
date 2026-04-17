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

  // Replacements
  const replacements = [
    { regex: /"#fff"/g, replace: '"var(--bg-primary)"' },
    { regex: /"#ffffff"/g, replace: '"var(--bg-primary)"' },
    
    // Using string matching for exact color replacements in styles
    { regex: /background:\s*"#f7f8fa"/g, replace: 'background: "var(--bg-secondary)"' },
    { regex: /background:\s*"#f9fafb"/g, replace: 'background: "var(--bg-secondary)"' },
    
    { regex: /background:\s*"#f8faff"/g, replace: 'background: "var(--bg-tertiary)"' },
    { regex: /background:\s*"#fafbfc"/g, replace: 'background: "var(--bg-tertiary)"' },
    { regex: /background:\s*"#eceff3"/g, replace: 'background: "var(--bg-tertiary)"' },
    { regex: /background:\s*"#f5f5f5"/g, replace: 'background: "var(--bg-tertiary)"' },

    { regex: /color:\s*"#222"/g, replace: 'color: "var(--text-primary)"' },
    { regex: /color:\s*"#333"/g, replace: 'color: "var(--text-primary)"' },
    { regex: /color:\s*"#111827"/g, replace: 'color: "var(--text-primary)"' },
    { regex: /color:\s*"#1f2937"/g, replace: 'color: "var(--text-primary)"' },
    { regex: /color:\s*"#000"/g, replace: 'color: "var(--text-primary)"' },
    
    { regex: /color:\s*"#666"/g, replace: 'color: "var(--text-secondary)"' },
    { regex: /color:\s*"#555"/g, replace: 'color: "var(--text-secondary)"' },
    
    { regex: /border:\s*"1px solid #eef1f5"/g, replace: 'border: "1px solid var(--border-color)"' },
    { regex: /border:\s*"1px solid #e8eefc"/g, replace: 'border: "1px solid var(--border-color)"' },
    { regex: /border:\s*"1px solid #d7dce5"/g, replace: 'border: "1px solid var(--border-color)"' },
    { regex: /border:\s*"1px solid #e5e7eb"/g, replace: 'border: "1px solid var(--border-color)"' },

    { regex: /borderBottom:\s*"1px solid #eef1f5"/g, replace: 'borderBottom: "1px solid var(--border-color)"' },
    { regex: /borderBottom:\s*"1px solid #d7dce5"/g, replace: 'borderBottom: "1px solid var(--border-color)"' },

    { regex: /borderRight:\s*"1px solid #eef1f5"/g, replace: 'borderRight: "1px solid var(--border-color)"' },
    
    { regex: /boxShadow:\s*"0 4px 14px rgba\(0,0,0,0.08\)"/g, replace: 'boxShadow: "var(--shadow-sm)"' },
    { regex: /boxShadow:\s*"0 2px 8px rgba\(0,0,0,0.06\)"/g, replace: 'boxShadow: "var(--shadow-sm)"' },
    
    // Other common patterns used for active active/inactive tabs
    { regex: /background:\s*active\s*\?\s*"#333"\s*:\s*"#eceff3"/g, replace: 'background: active ? "var(--text-primary)" : "var(--bg-tertiary)"' },
    { regex: /color:\s*active\s*\?\s*"#fff"\s*:\s*"#222"/g, replace: 'color: active ? "var(--bg-primary)" : "var(--text-primary)"' },
    { regex: /background:\s*selected[a-zA-Z]* === [a-zA-Z]*\s*\?\s*"#333"\s*:\s*"#eceff3"/g, replace: function(match) {
        return match.replace('"#333"', '"var(--text-primary)"').replace('"#eceff3"', '"var(--bg-tertiary)"');
    }},
    { regex: /color:\s*selected[a-zA-Z]* === [a-zA-Z]*\s*\?\s*"#fff"\s*:\s*"#222"/g, replace: function(match) {
        return match.replace('"#fff"', '"var(--bg-primary)"').replace('"#222"', '"var(--text-primary)"');
    }}
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
console.log(`Global theme variables applied to ${replacedCount} files.`);
