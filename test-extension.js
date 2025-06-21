const fs = require('fs');
const path = require('path');

// Test script to verify the extension files
console.log('Testing Token Counter Extension Structure...\n');

// Check if all required files exist
const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'src/extension.ts',
    'src/tokenCountingService.ts',
    'src/tokenCounterProvider.ts',
    'src/fileWatcher.ts'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
        allFilesExist = false;
    }
});

// Check if compiled files exist
const compiledPath = path.join(__dirname, 'out');
if (fs.existsSync(compiledPath)) {
    console.log('\n✅ Compiled output directory exists');
    
    const compiledFiles = fs.readdirSync(compiledPath);
    console.log(`📁 Compiled files: ${compiledFiles.join(', ')}`);
} else {
    console.log('\n❌ Compiled output directory missing');
    allFilesExist = false;
}

// Check package.json structure
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('\n📦 Package.json validation:');
    console.log(`   Name: ${packageJson.name}`);
    console.log(`   Version: ${packageJson.version}`);
    console.log(`   Main: ${packageJson.main}`);
    console.log(`   VSCode Engine: ${packageJson.engines.vscode}`);
    
    if (packageJson.contributes && packageJson.contributes.configuration) {
        console.log('   ✅ Configuration contributions found');
    } else {
        console.log('   ❌ Configuration contributions missing');
    }
    
    if (packageJson.dependencies) {
        console.log(`   📋 Dependencies: ${Object.keys(packageJson.dependencies).join(', ')}`);
    }
    
} catch (error) {
    console.log('\n❌ Error reading package.json:', error.message);
    allFilesExist = false;
}

// Check test files
console.log('\n📄 Test files:');
const testFiles = ['test-files/sample.txt', 'test-files/sample.js', 'test-files/sample.md', 'test-files/large-sample.py'];
testFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`   ✅ ${file} (${stats.size} bytes)`);
    } else {
        console.log(`   ❌ ${file} missing`);
    }
});

console.log('\n' + '='.repeat(50));
if (allFilesExist) {
    console.log('🎉 Extension structure is complete!');
    console.log('\nNext steps:');
    console.log('1. Open this folder in VSCode');
    console.log('2. Press F5 to run the extension in a new Extension Development Host window');
    console.log('3. The token counts should appear next to file names in the explorer');
} else {
    console.log('⚠️  Some files are missing. Please check the setup.');
}