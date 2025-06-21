const fs = require('fs');
const path = require('path');

// Test the tokenizers directly
async function testTokenizers() {
    console.log('Testing tokenizer libraries...\n');
    
    const testText = "Hello world! This is a test sentence for token counting. How many tokens will this be?";
    
    // Test Anthropic tokenizer
    try {
        const { countTokens } = require('@anthropic-ai/tokenizer');
        const anthropicTokens = countTokens(testText);
        console.log(`✅ Anthropic tokenizer: ${anthropicTokens} tokens`);
    } catch (error) {
        console.log(`❌ Anthropic tokenizer error:`, error.message);
    }
    
    // Test tiktoken
    try {
        const tiktoken = require('tiktoken');
        const encoder = tiktoken.get_encoding('cl100k_base');
        const tokens = encoder.encode(testText);
        encoder.free();
        console.log(`✅ OpenAI tiktoken: ${tokens.length} tokens`);
    } catch (error) {
        console.log(`❌ OpenAI tiktoken error:`, error.message);
    }
    
    // Test with sample files
    console.log('\n📄 Testing with sample files:');
    
    const testFiles = [
        'test-files/sample.txt',
        'test-files/sample.js',
        'test-files/sample.md'
    ];
    
    for (const file of testFiles) {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            const stats = fs.statSync(file);
            
            console.log(`\n📁 ${file} (${stats.size} bytes):`);
            
            // Test Anthropic
            try {
                const { countTokens } = require('@anthropic-ai/tokenizer');
                const anthropicTokens = countTokens(content);
                console.log(`   Anthropic: ${anthropicTokens} tokens`);
            } catch (error) {
                console.log(`   Anthropic error: ${error.message}`);
            }
            
            // Test tiktoken
            try {
                const tiktoken = require('tiktoken');
                const encoder = tiktoken.get_encoding('cl100k_base');
                const tokens = encoder.encode(content);
                encoder.free();
                console.log(`   OpenAI: ${tokens.length} tokens`);
            } catch (error) {
                console.log(`   OpenAI error: ${error.message}`);
            }
        }
    }
}

testTokenizers().catch(console.error);