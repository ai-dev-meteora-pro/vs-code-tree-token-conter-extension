"""
Large Python file for testing token counting performance.
This file contains various Python constructs to test tokenization.
"""

import os
import sys
import json
from typing import List, Dict, Optional

class TokenCounterTest:
    """Test class for token counting functionality."""
    
    def __init__(self, name: str, config: Dict[str, any]):
        self.name = name
        self.config = config
        self.results = []
    
    def process_data(self, data: List[Dict]) -> Optional[Dict]:
        """Process input data and return results."""
        if not data:
            return None
        
        processed = {}
        for item in data:
            if 'id' in item and 'content' in item:
                processed[item['id']] = {
                    'content': item['content'],
                    'length': len(item['content']),
                    'tokens': self.estimate_tokens(item['content'])
                }
        
        return processed
    
    def estimate_tokens(self, text: str) -> int:
        """Rough token estimation for testing."""
        # Simple word-based estimation
        words = text.split()
        return int(len(words) * 1.3)  # Rough token-to-word ratio
    
    def generate_test_data(self, count: int = 100) -> List[Dict]:
        """Generate test data for processing."""
        test_data = []
        
        for i in range(count):
            item = {
                'id': f'item_{i}',
                'content': f'This is test content for item {i}. ' * (i % 10 + 1),
                'metadata': {
                    'created': f'2024-01-{i % 28 + 1:02d}',
                    'category': f'category_{i % 5}',
                    'priority': i % 3
                }
            }
            test_data.append(item)
        
        return test_data
    
    def run_performance_test(self):
        """Run a performance test with large dataset."""
        print(f"Running performance test for {self.name}")
        
        # Generate large dataset
        data = self.generate_test_data(1000)
        
        # Process the data
        results = self.process_data(data)
        
        if results:
            total_tokens = sum(item['tokens'] for item in results.values())
            print(f"Processed {len(results)} items with {total_tokens} total tokens")
        
        return results

def main():
    """Main function to run token counter tests."""
    config = {
        'tokenizer': 'anthropic',
        'max_file_size': 2097152,
        'file_extensions': ['.py', '.js', '.txt', '.md'],
        'concurrency': 8
    }
    
    # Create test instance
    tester = TokenCounterTest("Python Test File", config)
    
    # Run the test
    results = tester.run_performance_test()
    
    # Output results
    if results:
        print(f"Test completed successfully with {len(results)} processed items")
    else:
        print("Test failed - no results generated")

if __name__ == "__main__":
    main()

# This Python file should have a significant number of tokens
# Including docstrings, comments, code, and string literals
# The token counter extension should process this file and display the count