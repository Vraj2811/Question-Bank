#!/usr/bin/env python3
"""
Test script to verify the Question Bank System functionality
"""

import sqlite3
import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from paper_generation import PaperGeneration

def test_database_connection():
    """Test database connection and schema"""
    print("Testing database connection...")
    
    try:
        conn = sqlite3.connect('question_bank.db')
        cursor = conn.cursor()
        
        # Check if questions table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'")
        table_exists = cursor.fetchone() is not None
        
        if table_exists:
            print("✓ Questions table exists")
            
            # Check table schema
            cursor.execute("PRAGMA table_info(questions)")
            columns = [row[1] for row in cursor.fetchall()]
            
            required_columns = [
                'id', 'title', 'question_type', 'subject', 'topic', 'subtopic',
                'difficulty_level', 'estimated_time', 'bloom_level', 
                'is_ai_generated', 'ai_generation_notes', 'parent_question_id', 'created_at'
            ]
            
            missing_columns = [col for col in required_columns if col not in columns]
            if missing_columns:
                print(f"✗ Missing columns: {missing_columns}")
                return False
            else:
                print("✓ All required columns present")
                
            # Check if there are any questions
            cursor.execute("SELECT COUNT(*) FROM questions")
            count = cursor.fetchone()[0]
            print(f"✓ Database contains {count} questions")
            
        else:
            print("✗ Questions table does not exist")
            return False
            
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Database error: {e}")
        return False

def test_paper_generation():
    """Test paper generation functionality"""
    print("\nTesting paper generation...")
    
    try:
        paper_gen = PaperGeneration('question_bank.db')
        
        # Test getting subjects
        subjects = paper_gen.get_available_subjects()
        print(f"✓ Found {len(subjects)} subjects: {subjects}")
        
        if subjects:
            # Test getting topics for first subject
            topics = paper_gen.get_topics_for_subject(subjects[0])
            print(f"✓ Found {len(topics)} topics for '{subjects[0]}': {topics}")
            
            if topics:
                # Test getting subtopics
                subtopics = paper_gen.get_subtopics_for_topic(subjects[0], topics[0])
                print(f"✓ Found {len(subtopics)} subtopics for '{subjects[0]} > {topics[0]}': {subtopics}")
        
        # Test paper generation with minimal criteria
        criteria = {
            'total_questions': 5,
            'include_ai_generated': True
        }
        
        result = paper_gen.generate_paper(criteria)
        
        if result['status'] in ['success', 'warning']:
            print(f"✓ Paper generation successful: {result['message']}")
            print(f"  Generated {len(result['questions'])} questions")
            print(f"  Total time: {result['metadata']['total_time_minutes']} minutes")
            return True
        else:
            print(f"✗ Paper generation failed: {result['message']}")
            return False
            
    except Exception as e:
        print(f"✗ Paper generation error: {e}")
        return False

def test_file_structure():
    """Test file structure and dependencies"""
    print("\nTesting file structure...")
    
    required_files = [
        'app.py',
        'ai.py', 
        'paper_generation.py',
        'templates/index.html',
        'templates/teacher.html',
        'templates/practice.html',
        'templates/create_paper.html',
        'static/css/style.css',
        'static/js/teacher.js',
        'static/js/practice.js',
        'static/js/create_paper.js'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
        else:
            print(f"✓ {file_path}")
    
    if missing_files:
        print(f"✗ Missing files: {missing_files}")
        return False
    else:
        print("✓ All required files present")
        return True

def test_imports():
    """Test Python imports"""
    print("\nTesting Python imports...")
    
    try:
        import flask
        print("✓ Flask imported")
        
        import sqlite3
        print("✓ SQLite3 imported")
        
        from ai import QuestionGenerator
        print("✓ QuestionGenerator imported")
        
        from paper_generation import PaperGeneration
        print("✓ PaperGeneration imported")
        
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

def create_sample_data():
    """Create some sample data for testing"""
    print("\nCreating sample data...")
    
    try:
        conn = sqlite3.connect('question_bank.db')
        cursor = conn.cursor()
        
        # Check if we already have data
        cursor.execute("SELECT COUNT(*) FROM questions")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"✓ Database already contains {count} questions")
            conn.close()
            return True
        
        # Insert sample questions
        sample_questions = [
            ("Binary Search Implementation", "Coding", "Data Structures", "Arrays", "Binary Search", "Medium", 15, "Apply", False, None, None),
            ("Sorting Algorithm Analysis", "Descriptive", "Algorithms", "Sorting", "Comparison Sorts", "Hard", 25, "Analyze", False, None, None),
            ("Basic Python Syntax", "MCQ", "Programming", "Python Basics", "Variables", "Easy", 5, "Recall", False, None, None),
            ("Graph Traversal", "Coding", "Data Structures", "Graphs", "DFS/BFS", "Medium", 20, "Apply", False, None, None),
            ("Time Complexity", "Short Answer", "Algorithms", "Analysis", "Big O Notation", "Medium", 10, "Understand", False, None, None)
        ]
        
        for question in sample_questions:
            cursor.execute('''
                INSERT INTO questions (title, question_type, subject, topic, subtopic,
                                     difficulty_level, estimated_time, bloom_level, 
                                     is_ai_generated, ai_generation_notes, parent_question_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', question)
        
        conn.commit()
        conn.close()
        
        print(f"✓ Created {len(sample_questions)} sample questions")
        return True
        
    except Exception as e:
        print(f"✗ Error creating sample data: {e}")
        return False

def main():
    """Run all tests"""
    print("Question Bank System Test Suite")
    print("=" * 40)
    
    tests = [
        ("File Structure", test_file_structure),
        ("Python Imports", test_imports),
        ("Database Connection", test_database_connection),
        ("Sample Data Creation", create_sample_data),
        ("Paper Generation", test_paper_generation)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        print("-" * 20)
        if test_func():
            passed += 1
        else:
            print(f"✗ {test_name} failed")
    
    print("\n" + "=" * 40)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✓ All tests passed! System is ready to use.")
        print("\nTo start the application, run:")
        print("python app.py")
        print("\nThen visit:")
        print("- http://localhost:5000 (Home page)")
        print("- http://localhost:5000/teacher (Teacher portal)")
        print("- http://localhost:5000/practice (Student practice)")
        print("- http://localhost:5000/create_paper (Paper generation)")
    else:
        print("✗ Some tests failed. Please check the errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
