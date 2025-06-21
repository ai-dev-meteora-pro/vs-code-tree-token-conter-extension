// This is a JavaScript file for testing token counting
function calculateTokens() {
    const message = "Hello, world! This is a test function for token counting.";
    console.log(message);
    
    // The extension should analyze this file and show token count
    for (let i = 0; i < 10; i++) {
        console.log(`Iteration ${i}: ${message}`);
    }
    
    return message.length;
}

// Export the function
module.exports = calculateTokens;

// This file contains code comments, strings, and logic
// Token count should be higher than plain text due to code structure