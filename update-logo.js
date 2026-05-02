const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('========================================');
console.log('  AFH Logo Updater');
console.log('========================================\n');

console.log('INSTRUCTIONS:');
console.log('1. Right-click on the professional logo in the chat');
console.log('2. Save it to your Desktop or Downloads folder\n');

rl.question('Enter the full path to the saved logo image (e.g., C:\\Users\\YourName\\Desktop\\logo.png): ', (sourcePath) => {
  const destPath = path.join(__dirname, 'public', 'logo.png');

  // Remove quotes if user included them
  sourcePath = sourcePath.replace(/^["']|["']$/g, '').trim();

  if (!fs.existsSync(sourcePath)) {
    console.log('\n❌ Error: File not found at: ' + sourcePath);
    console.log('Please check the path and try again.\n');
    rl.close();
    return;
  }

  try {
    // Copy file to destination
    fs.copyFileSync(sourcePath, destPath);
    console.log('\n✅ SUCCESS! Logo updated successfully!');
    console.log('📁 Saved to: ' + destPath);
    console.log('\n🔄 Please refresh your browser to see the new logo.\n');
  } catch (err) {
    console.log('\n❌ Error copying file: ' + err.message);
  }

  rl.close();
});
