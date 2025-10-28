#!/usr/bin/env python3
"""
Test script để verify system prompt được load đúng
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.modules.chat.prompt_registry import prompt_registry

def test_system_prompt():
    """Test load system prompt"""
    print("🧪 Testing System Prompt Loading...")
    
    try:
        system_prompt = prompt_registry.load_system_prompt("system")
        print("✅ System prompt loaded successfully!")
        print(f"📝 Content:\n{system_prompt}")
        
        # Verify key sections of current prompt content
        assert "CHUYÊN VIÊN TƯ VẤN KINH TẾ" in system_prompt
        for token in [
            "Mục tiêu",
            "Nguyên tắc trả lời",
            "Định dạng",
            "Ví dụ"
        ]:
            assert token in system_prompt
        
        print("✅ All content checks passed!")
        
        # Test cache
        system_prompt2 = prompt_registry.load_system_prompt("system")
        assert system_prompt == system_prompt2
        print("✅ Cache working correctly!")
        
        # pytest tests should not return a value
        return None
        
    except Exception as e:
        print(f"❌ Error: {e}")
        # let pytest fail via exception instead of returning False
        raise

if __name__ == "__main__":
    print("🚀 Starting System Prompt Test...")
    
    if test_system_prompt():
        print("\n🎉 ALL TESTS PASSED! System prompt working correctly!")
    else:
        print("\n❌ TEST FAILED!")
        exit(1)
