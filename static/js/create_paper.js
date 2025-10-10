// Create Paper Interface JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the interface
    loadSubjects();
    
    // Form elements
    const form = document.getElementById('paperForm');
    const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    
    // Event listeners
    form.addEventListener('submit', handleFormSubmit);
    form.addEventListener('reset', handleFormReset);
    document.getElementById('save-paper-btn').addEventListener('click', savePaper);
    
    // Global variables
    let currentPaperData = null;
    let selectedSubjects = new Set();
    let selectedTopics = new Set();
    let selectedSubtopics = new Set();
});

/**
 * Load available subjects
 */
async function loadSubjects() {
    try {
        const response = await fetch('/api/paper/subjects');
        const result = await response.json();
        
        if (result.status === 'success') {
            renderSubjects(result.subjects);
        } else {
            showError('Failed to load subjects: ' + result.message);
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

/**
 * Render subjects as checkboxes
 */
function renderSubjects(subjects) {
    const container = document.getElementById('subjects-container');
    container.innerHTML = '';
    
    if (subjects.length === 0) {
        container.innerHTML = '<div class="text-muted">No subjects available</div>';
        return;
    }
    
    const row = document.createElement('div');
    row.className = 'row';
    
    subjects.forEach((subject, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-2';
        
        col.innerHTML = `
            <div class="form-check">
                <input class="form-check-input subject-check" type="checkbox" 
                       id="subject_${index}" value="${subject}">
                <label class="form-check-label" for="subject_${index}">
                    ${subject}
                </label>
            </div>
        `;
        
        row.appendChild(col);
    });
    
    container.appendChild(row);
    
    // Add event listeners to subject checkboxes
    document.querySelectorAll('.subject-check').forEach(checkbox => {
        checkbox.addEventListener('change', handleSubjectChange);
    });
}

/**
 * Handle subject selection change
 */
function handleSubjectChange() {
    // Update selected subjects
    selectedSubjects.clear();
    document.querySelectorAll('.subject-check:checked').forEach(checkbox => {
        selectedSubjects.add(checkbox.value);
    });
    
    // Load topics for selected subjects
    if (selectedSubjects.size > 0) {
        loadTopics();
    } else {
        clearTopics();
        clearSubtopics();
    }
}

/**
 * Load topics for selected subjects
 */
async function loadTopics() {
    try {
        const topicsContainer = document.getElementById('topics-container');
        topicsContainer.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm"></div> Loading topics...</div>';
        
        const allTopics = new Set();
        
        // Load topics for each selected subject
        for (const subject of selectedSubjects) {
            const response = await fetch(`/api/paper/topics?subject=${encodeURIComponent(subject)}`);
            const result = await response.json();
            
            if (result.status === 'success') {
                result.topics.forEach(topic => allTopics.add(topic));
            }
        }
        
        renderTopics(Array.from(allTopics).sort());
        
    } catch (error) {
        showError('Error loading topics: ' + error.message);
    }
}

/**
 * Render topics as checkboxes
 */
function renderTopics(topics) {
    const container = document.getElementById('topics-container');
    container.innerHTML = '';
    
    if (topics.length === 0) {
        container.innerHTML = '<div class="text-muted">No topics available for selected subjects</div>';
        return;
    }
    
    const row = document.createElement('div');
    row.className = 'row';
    
    topics.forEach((topic, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-2';
        
        col.innerHTML = `
            <div class="form-check">
                <input class="form-check-input topic-check" type="checkbox" 
                       id="topic_${index}" value="${topic}">
                <label class="form-check-label" for="topic_${index}">
                    ${topic}
                </label>
            </div>
        `;
        
        row.appendChild(col);
    });
    
    container.appendChild(row);
    
    // Add event listeners to topic checkboxes
    document.querySelectorAll('.topic-check').forEach(checkbox => {
        checkbox.addEventListener('change', handleTopicChange);
    });
}

/**
 * Handle topic selection change
 */
function handleTopicChange() {
    // Update selected topics
    selectedTopics.clear();
    document.querySelectorAll('.topic-check:checked').forEach(checkbox => {
        selectedTopics.add(checkbox.value);
    });
    
    // Load subtopics for selected topics
    if (selectedTopics.size > 0) {
        loadSubtopics();
    } else {
        clearSubtopics();
    }
}

/**
 * Load subtopics for selected subjects and topics
 */
async function loadSubtopics() {
    try {
        const subtopicsContainer = document.getElementById('subtopics-container');
        subtopicsContainer.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm"></div> Loading subtopics...</div>';
        
        const allSubtopics = new Set();
        
        // Load subtopics for each combination of selected subjects and topics
        for (const subject of selectedSubjects) {
            for (const topic of selectedTopics) {
                const response = await fetch(`/api/paper/subtopics?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`);
                const result = await response.json();
                
                if (result.status === 'success') {
                    result.subtopics.forEach(subtopic => allSubtopics.add(subtopic));
                }
            }
        }
        
        renderSubtopics(Array.from(allSubtopics).sort());
        
    } catch (error) {
        showError('Error loading subtopics: ' + error.message);
    }
}

/**
 * Render subtopics as checkboxes
 */
function renderSubtopics(subtopics) {
    const container = document.getElementById('subtopics-container');
    container.innerHTML = '';
    
    if (subtopics.length === 0) {
        container.innerHTML = '<div class="text-muted">No subtopics available for selected topics</div>';
        return;
    }
    
    const row = document.createElement('div');
    row.className = 'row';
    
    subtopics.forEach((subtopic, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-2';
        
        col.innerHTML = `
            <div class="form-check">
                <input class="form-check-input subtopic-check" type="checkbox" 
                       id="subtopic_${index}" value="${subtopic}">
                <label class="form-check-label" for="subtopic_${index}">
                    ${subtopic}
                </label>
            </div>
        `;
        
        row.appendChild(col);
    });
    
    container.appendChild(row);
}

/**
 * Clear topics section
 */
function clearTopics() {
    document.getElementById('topics-container').innerHTML = '<div class="text-muted">Select subjects first to see available topics</div>';
}

/**
 * Clear subtopics section
 */
function clearSubtopics() {
    document.getElementById('subtopics-container').innerHTML = '<div class="text-muted">Select topics first to see available subtopics</div>';
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    // Add validation classes
    const form = document.getElementById('paperForm');
    form.classList.add('was-validated');

    // Check if form is valid
    if (!form.checkValidity()) {
        return;
    }

    // Collect form data
    const criteria = collectFormData();

    // Validate criteria
    if (criteria.total_questions <= 0) {
        showError('Please specify a valid number of questions');
        return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating Paper...';

    try {
        const response = await fetch('/api/paper/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(criteria)
        });

        const result = await response.json();

        if (result.status === 'success' || result.status === 'warning') {
            currentPaperData = result;
            displayResults(result);
            resultsModal.show();
        } else {
            showError('Failed to generate paper: ' + result.message);
        }

    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Collect form data into criteria object
 */
function collectFormData() {
    const criteria = {};

    // Basic settings
    criteria.total_questions = parseInt(document.getElementById('total_questions').value) || 10;
    const maxTime = document.getElementById('max_time').value;
    if (maxTime) {
        criteria.max_time = parseInt(maxTime);
    }
    criteria.include_ai_generated = document.getElementById('include_ai_generated').checked;

    // Selected subjects, topics, subtopics
    criteria.subjects = Array.from(document.querySelectorAll('.subject-check:checked')).map(cb => cb.value);
    criteria.topics = Array.from(document.querySelectorAll('.topic-check:checked')).map(cb => cb.value);
    criteria.subtopics = Array.from(document.querySelectorAll('.subtopic-check:checked')).map(cb => cb.value);

    // Difficulty distribution
    const difficultyDistribution = {};
    document.querySelectorAll('.difficulty-input').forEach(input => {
        const level = input.id.replace('difficulty_', '');
        const count = parseInt(input.value) || 0;
        if (count > 0) {
            difficultyDistribution[level.charAt(0).toUpperCase() + level.slice(1)] = count;
        }
    });
    if (Object.keys(difficultyDistribution).length > 0) {
        criteria.difficulty_distribution = difficultyDistribution;
    }

    // Question types
    criteria.question_types = Array.from(document.querySelectorAll('.question-type-check:checked')).map(cb => cb.value);

    // Bloom levels
    criteria.bloom_levels = Array.from(document.querySelectorAll('.bloom-level-check:checked')).map(cb => cb.value);

    return criteria;
}

/**
 * Display generation results
 */
function displayResults(result) {
    const container = document.getElementById('modal-results');

    let html = '';

    // Status message
    if (result.status === 'warning') {
        html += `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> ${result.message}</div>`;
    } else {
        html += `<div class="alert alert-success"><i class="bi bi-check-circle"></i> ${result.message}</div>`;
    }

    // Metadata
    const metadata = result.metadata;
    html += `
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Paper Statistics</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Total Questions:</strong> ${metadata.total_questions}</p>
                        <p><strong>Total Time:</strong> ${metadata.total_time_minutes} minutes</p>
                        <p><strong>AI Generated:</strong> ${metadata.ai_generated_count}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Difficulty Distribution</h6>
                    </div>
                    <div class="card-body">
    `;

    for (const [difficulty, count] of Object.entries(metadata.difficulty_distribution)) {
        html += `<p><strong>${difficulty}:</strong> ${count}</p>`;
    }

    html += `
                    </div>
                </div>
            </div>
        </div>
    `;

    // Questions list
    html += `
        <div class="card">
            <div class="card-header">
                <h6 class="mb-0">Selected Questions</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Subject</th>
                                <th>Topic</th>
                                <th>Difficulty</th>
                                <th>Time</th>
                                <th>AI</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    result.questions.forEach((question, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${question.title}</td>
                <td>${question.question_type}</td>
                <td>${question.subject}</td>
                <td>${question.topic}</td>
                <td>${question.difficulty_level}</td>
                <td>${question.estimated_time}m</td>
                <td>${question.is_ai_generated ? '<i class="bi bi-robot text-primary"></i>' : ''}</td>
            </tr>
        `;
    });

    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Save paper to file
 */
async function savePaper() {
    if (!currentPaperData) {
        showError('No paper data to save');
        return;
    }

    try {
        const filename = prompt('Enter filename (without extension):', `paper_${new Date().toISOString().slice(0, 10)}`);
        if (!filename) return;

        const response = await fetch('/api/paper/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paper_data: currentPaperData,
                filename: filename,
                format: 'markdown'
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert(`Paper saved successfully to: ${result.file_path}`);
        } else {
            showError('Failed to save paper: ' + result.message);
        }

    } catch (error) {
        showError('Error saving paper: ' + error.message);
    }
}

/**
 * Handle form reset
 */
function handleFormReset() {
    setTimeout(() => {
        selectedSubjects.clear();
        selectedTopics.clear();
        selectedSubtopics.clear();
        clearTopics();
        clearSubtopics();
        document.getElementById('paperForm').classList.remove('was-validated');
    }, 10);
}

/**
 * Show error message
 */
function showError(message) {
    alert(message); // Simple fallback - could be improved with toast notifications
}
