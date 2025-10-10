import sqlite3
import random
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

class PaperGeneration:
    def __init__(self, database_path: str):
        """
        Initialize the Paper Generation system
        
        Args:
            database_path: Path to the SQLite database
        """
        self.database_path = database_path
    
    def get_available_subjects(self) -> List[str]:
        """Get all available subjects from the database"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT DISTINCT subject FROM questions ORDER BY subject')
        subjects = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return subjects
    
    def get_topics_for_subject(self, subject: str) -> List[str]:
        """Get all topics for a given subject"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT DISTINCT topic FROM questions WHERE subject = ? ORDER BY topic', (subject,))
        topics = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return topics
    
    def get_subtopics_for_topic(self, subject: str, topic: str) -> List[str]:
        """Get all subtopics for a given subject and topic"""
        conn = sqlite3.connect(self.database_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT DISTINCT subtopic FROM questions 
            WHERE subject = ? AND topic = ? AND subtopic IS NOT NULL AND subtopic != ""
            ORDER BY subtopic
        ''', (subject, topic))
        subtopics = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return subtopics
    
    def generate_paper(self, criteria: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a question paper based on given criteria
        
        Args:
            criteria: Dictionary containing paper generation criteria
                - total_questions: int
                - subjects: List[str] (optional, if empty uses all)
                - topics: List[str] (optional, if empty uses all for selected subjects)
                - subtopics: List[str] (optional, if empty uses all for selected topics)
                - excluded_topics: List[str] (optional)
                - excluded_subtopics: List[str] (optional)
                - difficulty_distribution: Dict[str, int] (e.g., {"Easy": 2, "Medium": 3, "Hard": 1})
                - question_types: List[str] (optional, if empty uses all types)
                - bloom_levels: List[str] (optional, if empty uses all levels)
                - max_time: int (optional, maximum total time in minutes)
                - include_ai_generated: bool (default: True)
        
        Returns:
            Dictionary containing the generated paper and metadata
        """
        try:
            # Extract criteria
            total_questions = criteria.get('total_questions', 10)
            subjects = criteria.get('subjects', [])
            topics = criteria.get('topics', [])
            subtopics = criteria.get('subtopics', [])
            excluded_topics = criteria.get('excluded_topics', [])
            excluded_subtopics = criteria.get('excluded_subtopics', [])
            difficulty_distribution = criteria.get('difficulty_distribution', {})
            question_types = criteria.get('question_types', [])
            bloom_levels = criteria.get('bloom_levels', [])
            max_time = criteria.get('max_time', None)
            include_ai_generated = criteria.get('include_ai_generated', True)
            
            # Build the query
            query_conditions = []
            query_params = []
            
            # Subject filter
            if subjects:
                placeholders = ','.join(['?' for _ in subjects])
                query_conditions.append(f'subject IN ({placeholders})')
                query_params.extend(subjects)
            
            # Topic filter
            if topics:
                placeholders = ','.join(['?' for _ in topics])
                query_conditions.append(f'topic IN ({placeholders})')
                query_params.extend(topics)
            
            # Subtopic filter
            if subtopics:
                placeholders = ','.join(['?' for _ in subtopics])
                query_conditions.append(f'subtopic IN ({placeholders})')
                query_params.extend(subtopics)
            
            # Excluded topics
            if excluded_topics:
                placeholders = ','.join(['?' for _ in excluded_topics])
                query_conditions.append(f'topic NOT IN ({placeholders})')
                query_params.extend(excluded_topics)
            
            # Excluded subtopics
            if excluded_subtopics:
                placeholders = ','.join(['?' for _ in excluded_subtopics])
                query_conditions.append(f'(subtopic IS NULL OR subtopic NOT IN ({placeholders}))')
                query_params.extend(excluded_subtopics)
            
            # Question types filter
            if question_types:
                placeholders = ','.join(['?' for _ in question_types])
                query_conditions.append(f'question_type IN ({placeholders})')
                query_params.extend(question_types)
            
            # Bloom levels filter
            if bloom_levels:
                placeholders = ','.join(['?' for _ in bloom_levels])
                query_conditions.append(f'bloom_level IN ({placeholders})')
                query_params.extend(bloom_levels)
            
            # AI generated filter
            if not include_ai_generated:
                query_conditions.append('is_ai_generated = 0')
            
            # Build the final query
            base_query = '''
                SELECT id, title, question_type, subject, topic, subtopic,
                       difficulty_level, estimated_time, bloom_level, is_ai_generated
                FROM questions
            '''
            
            if query_conditions:
                base_query += ' WHERE ' + ' AND '.join(query_conditions)
            
            # Get all matching questions
            conn = sqlite3.connect(self.database_path)
            cursor = conn.cursor()
            cursor.execute(base_query, query_params)
            
            all_questions = []
            for row in cursor.fetchall():
                all_questions.append({
                    'id': row[0],
                    'title': row[1],
                    'question_type': row[2],
                    'subject': row[3],
                    'topic': row[4],
                    'subtopic': row[5],
                    'difficulty_level': row[6],
                    'estimated_time': row[7],
                    'bloom_level': row[8],
                    'is_ai_generated': bool(row[9])
                })
            
            conn.close()
            
            if not all_questions:
                return {
                    'status': 'error',
                    'message': 'No questions found matching the specified criteria'
                }
            
            # Select questions based on difficulty distribution
            selected_questions = self._select_questions_by_criteria(
                all_questions, total_questions, difficulty_distribution, max_time
            )
            
            if len(selected_questions) < total_questions:
                return {
                    'status': 'warning',
                    'message': f'Only {len(selected_questions)} questions available (requested {total_questions})',
                    'questions': selected_questions,
                    'metadata': self._generate_paper_metadata(selected_questions, criteria)
                }
            
            return {
                'status': 'success',
                'message': f'Successfully generated paper with {len(selected_questions)} questions',
                'questions': selected_questions,
                'metadata': self._generate_paper_metadata(selected_questions, criteria)
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error generating paper: {str(e)}'
            }
    
    def _select_questions_by_criteria(self, questions: List[Dict], total_questions: int, 
                                    difficulty_distribution: Dict[str, int], max_time: Optional[int]) -> List[Dict]:
        """Select questions based on difficulty distribution and time constraints"""
        selected = []
        
        if difficulty_distribution:
            # Select questions based on difficulty distribution
            for difficulty, count in difficulty_distribution.items():
                difficulty_questions = [q for q in questions if q['difficulty_level'] == difficulty]
                if difficulty_questions:
                    # Shuffle and select the required count
                    random.shuffle(difficulty_questions)
                    selected.extend(difficulty_questions[:count])
        else:
            # Random selection if no distribution specified
            random.shuffle(questions)
            selected = questions[:total_questions]
        
        # Apply time constraint if specified
        if max_time:
            selected = self._apply_time_constraint(selected, max_time)
        
        return selected[:total_questions]
    
    def _apply_time_constraint(self, questions: List[Dict], max_time: int) -> List[Dict]:
        """Filter questions to fit within time constraint"""
        # Sort by estimated time (ascending) to prioritize shorter questions
        questions.sort(key=lambda q: q['estimated_time'])
        
        selected = []
        total_time = 0
        
        for question in questions:
            if total_time + question['estimated_time'] <= max_time:
                selected.append(question)
                total_time += question['estimated_time']
            else:
                break
        
        return selected
    
    def _generate_paper_metadata(self, questions: List[Dict], criteria: Dict[str, Any]) -> Dict[str, Any]:
        """Generate metadata for the paper"""
        if not questions:
            return {}
        
        # Calculate statistics
        total_time = sum(q['estimated_time'] for q in questions)
        difficulty_counts = {}
        type_counts = {}
        bloom_counts = {}
        subject_counts = {}
        
        for question in questions:
            # Difficulty distribution
            diff = question['difficulty_level']
            difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
            
            # Question type distribution
            qtype = question['question_type']
            type_counts[qtype] = type_counts.get(qtype, 0) + 1
            
            # Bloom level distribution
            bloom = question['bloom_level']
            bloom_counts[bloom] = bloom_counts.get(bloom, 0) + 1
            
            # Subject distribution
            subject = question['subject']
            subject_counts[subject] = subject_counts.get(subject, 0) + 1
        
        return {
            'total_questions': len(questions),
            'total_time_minutes': total_time,
            'difficulty_distribution': difficulty_counts,
            'question_type_distribution': type_counts,
            'bloom_level_distribution': bloom_counts,
            'subject_distribution': subject_counts,
            'ai_generated_count': sum(1 for q in questions if q['is_ai_generated']),
            'generated_at': datetime.now().isoformat(),
            'criteria_used': criteria
        }
    
    def save_paper_to_file(self, paper_data: Dict[str, Any], filename: str, format_type: str = 'markdown') -> str:
        """
        Save the generated paper to a file
        
        Args:
            paper_data: The paper data from generate_paper()
            filename: Name of the file to save
            format_type: Format type ('markdown', 'html', 'txt')
        
        Returns:
            Path to the saved file
        """
        papers_folder = Path('Generated Papers')
        papers_folder.mkdir(exist_ok=True)
        
        if format_type == 'markdown':
            return self._save_as_markdown(paper_data, papers_folder / f"{filename}.md")
        elif format_type == 'html':
            return self._save_as_html(paper_data, papers_folder / f"{filename}.html")
        else:
            return self._save_as_text(paper_data, papers_folder / f"{filename}.txt")
    
    def _save_as_markdown(self, paper_data: Dict[str, Any], file_path: Path) -> str:
        """Save paper as markdown file"""
        content = f"""# Question Paper

**Generated on:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Total Questions:** {paper_data['metadata']['total_questions']}
**Estimated Time:** {paper_data['metadata']['total_time_minutes']} minutes

---

"""
        
        for i, question in enumerate(paper_data['questions'], 1):
            content += f"""## Question {i}

**Title:** {question['title']}
**Type:** {question['question_type']}
**Difficulty:** {question['difficulty_level']}
**Time:** {question['estimated_time']} minutes
**Bloom Level:** {question['bloom_level']}

---

"""
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return str(file_path)
    
    def _save_as_html(self, paper_data: Dict[str, Any], file_path: Path) -> str:
        """Save paper as HTML file"""
        # Implementation for HTML format
        # This would generate a formatted HTML document
        pass
    
    def _save_as_text(self, paper_data: Dict[str, Any], file_path: Path) -> str:
        """Save paper as plain text file"""
        # Implementation for plain text format
        pass
