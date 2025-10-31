// fix-charat-errors.js
// Fixes all charAt() errors in Flourish Fitness codebase

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing charAt() errors in Flourish Fitness...\n');

// Files that need fixing
const filesToFix = [
  {
    path: 'src/components/admin/AdminClientAnalytics.jsx',
    fixes: [
      {
        search: /client\.name\.charAt\(0\)/g,
        replace: '(client.firstName?.charAt(0) || client.email?.charAt(0) || "?")',
        description: 'Fix client.name.charAt(0) with safe access'
      }
    ]
  },
  {
    path: 'src/components/admin/ManageClients.jsx',
    fixes: [
      {
        search: /client\.name\.charAt\(0\)/g,
        replace: '(client.firstName?.charAt(0) || client.email?.charAt(0) || "?")',
        description: 'Fix client.name.charAt(0) with safe access'
      }
    ]
  },
  {
    path: 'src/components/admin/WorkoutBuilder.jsx',
    fixes: [
      {
        search: /client\.name\.charAt\(0\)/g,
        replace: '(client.firstName?.charAt(0) || client.email?.charAt(0) || "?")',
        description: 'Fix client.name.charAt(0) with safe access'
      }
    ]
  },
  {
    path: 'src/components/admin/AdminPhotos.jsx',
    fixes: [
      {
        search: /client\.name\.charAt\(0\)/g,
        replace: '(client.firstName?.charAt(0) || client.email?.charAt(0) || "?")',
        description: 'Fix client.name.charAt(0) with safe access'
      }
    ]
  },
  {
    path: 'src/components/admin/AdminNutrition.jsx',
    fixes: [
      {
        search: /client\.name\.charAt\(0\)/g,
        replace: '(client.firstName?.charAt(0) || client.email?.charAt(0) || "?")',
        description: 'Fix client.name.charAt(0) with safe access'
      }
    ]
  }
];

// Create backup directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + Date.now();
const backupDir = `.backups/${timestamp}`;

if (!fs.existsSync('.backups')) {
  fs.mkdirSync('.backups');
}
fs.mkdirSync(backupDir);

console.log(`📁 Backup directory: ${backupDir}\n`);

let fixedCount = 0;
let errorCount = 0;

// Process each file
filesToFix.forEach(fileConfig => {
  const filePath = fileConfig.path;
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${filePath} (not found)`);
      return;
    }
    
    console.log(`\n🔨 Processing: ${filePath}`);
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Backup original file
    const backupPath = path.join(backupDir, path.basename(filePath));
    fs.writeFileSync(backupPath, content);
    console.log(`  ✓ Backed up to: ${backupPath}`);
    
    // Apply each fix
    let changesCount = 0;
    fileConfig.fixes.forEach(fix => {
      const beforeLength = content.length;
      content = content.replace(fix.search, fix.replace);
      const afterLength = content.length;
      
      if (beforeLength !== afterLength) {
        changesCount++;
        console.log(`  ✓ ${fix.description}`);
      }
    });
    
    // Write updated content if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Fixed ${changesCount} issue(s) in ${path.basename(filePath)}`);
      fixedCount++;
    } else {
      console.log(`  ℹ️  No changes needed`);
    }
    
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    errorCount++;
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Summary:');
console.log('='.repeat(60));
console.log(`✅ Files fixed: ${fixedCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📁 Backups saved to: ${backupDir}`);
console.log('='.repeat(60));

if (fixedCount > 0) {
  console.log('\n🎉 Success! Your app should work now.');
  console.log('\n💡 Next steps:');
  console.log('  1. Restart your development server');
  console.log('  2. Refresh your browser');
  console.log('  3. Try clicking the button again');
  console.log('\nIf something goes wrong, restore from backups:');
  console.log(`  cp ${backupDir}/* src/components/admin/`);
} else {
  console.log('\nℹ️  No changes were made. The files might already be fixed.');
}

console.log('');
