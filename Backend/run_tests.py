#!/usr/bin/env python3
"""
Test runner script for OCR Expense API tests.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_tests():
    """Run all tests with proper configuration."""
    
    # Change to project directory
    project_dir = Path(__file__).parent
    os.chdir(project_dir)
    
    print("🧪 Running OCR Expense API Tests...")
    print("=" * 50)
    
    # Test commands
    test_commands = [
        {
            "name": "Unit Tests",
            "cmd": ["pytest", "tests/test_ocr_service.py", "-v", "--tb=short"],
            "description": "Testing OCR service logic"
        },
        {
            "name": "Integration Tests", 
            "cmd": ["pytest", "tests/test_ocr_api.py", "-v", "--tb=short"],
            "description": "Testing OCR API endpoints"
        },
        {
            "name": "Chat Integration Tests",
            "cmd": ["pytest", "tests/test_chat_ocr_integration.py", "-v", "--tb=short"],
            "description": "Testing Chat + OCR integration"
        },
        {
            "name": "All Tests",
            "cmd": ["pytest", "tests/", "-v", "--tb=short", "--color=yes"],
            "description": "Running all tests"
        }
    ]
    
    results = []
    
    for test in test_commands:
        print(f"\n🔍 {test['name']}: {test['description']}")
        print("-" * 40)
        
        try:
            result = subprocess.run(
                test["cmd"],
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )
            
            if result.returncode == 0:
                print(f"✅ {test['name']} PASSED")
                results.append(True)
            else:
                print(f"❌ {test['name']} FAILED")
                print("STDOUT:", result.stdout)
                print("STDERR:", result.stderr)
                results.append(False)
                
        except subprocess.TimeoutExpired:
            print(f"⏰ {test['name']} TIMEOUT")
            results.append(False)
        except Exception as e:
            print(f"💥 {test['name']} ERROR: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("💥 Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
