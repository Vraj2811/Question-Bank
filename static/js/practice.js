// Student Practice Interface JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the practice interface
    loadQuestionTree();
    
    // Global variables
    let currentQuestions = [];
    let currentSelection = {
        subject: null,
        topic: null,
        subtopic: null
    };
});

/**
 * Load the question tree structure
 */
async function loadQuestionTree() {
    try {
        const response = await fetch('/api/practice/tree');
        const result = await response.json();
        
        if (result.status === 'success') {
            renderQuestionTree(result.tree);
            document.getElementById('loading-tree').style.display = 'none';
            document.getElementById('question-tree').style.display = 'block';
        } else {
            showError('Failed to load question tree: ' + result.message);
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

/**
 * Render the question tree in the sidebar
 */
function renderQuestionTree(tree) {
    const container = document.getElementById('question-tree');
    container.innerHTML = '';
    
    for (const [subject, topics] of Object.entries(tree)) {
        const subjectElement = createTreeNode(subject, 'subject', () => {
            // Subject click - could expand/collapse
        });
        
        const topicsContainer = document.createElement('div');
        topicsContainer.className = 'ms-3';
        
        for (const [topic, subtopics] of Object.entries(topics)) {
            const topicElement = createTreeNode(topic, 'topic', () => {
                // Topic click - could expand/collapse
            });
            
            const subtopicsContainer = document.createElement('div');
            subtopicsContainer.className = 'ms-3';
            
            for (const [subtopic, count] of Object.entries(subtopics)) {
                const subtopicElement = createTreeNode(
                    `${subtopic} (${count})`, 
                    'subtopic', 
                    () => loadQuestions(subject, topic, subtopic)
                );
                subtopicsContainer.appendChild(subtopicElement);
            }
            
            topicElement.appendChild(subtopicsContainer);
            topicsContainer.appendChild(topicElement);
        }
        
        subjectElement.appendChild(topicsContainer);
        container.appendChild(subjectElement);
    }
}

/**
 * Create a tree node element
 */
function createTreeNode(text, type, clickHandler) {
    const node = document.createElement('div');
    node.className = `tree-node tree-${type} p-2 mb-1 rounded`;
    
    const icon = getIconForType(type);
    node.innerHTML = `<i class="bi ${icon} me-2"></i>${text}`;
    
    if (type === 'subtopic') {
        node.style.cursor = 'pointer';
        node.addEventListener('click', () => {
            // Remove active class from all nodes
            document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active'));
            // Add active class to clicked node
            node.classList.add('active');
            clickHandler();
        });
        
        node.addEventListener('mouseenter', () => {
            if (!node.classList.contains('active')) {
                node.style.backgroundColor = 'rgba(88, 166, 255, 0.1)';
            }
        });
        
        node.addEventListener('mouseleave', () => {
            if (!node.classList.contains('active')) {
                node.style.backgroundColor = '';
            }
        });
    }
    
    return node;
}

/**
 * Get icon for tree node type
 */
function getIconForType(type) {
    switch (type) {
        case 'subject': return 'bi-book';
        case 'topic': return 'bi-bookmark';
        case 'subtopic': return 'bi-bookmark-fill';
        default: return 'bi-circle';
    }
}

/**
 * Load questions for selected category
 */
async function loadQuestions(subject, topic, subtopic) {
    try {
        // Update current selection
        currentSelection = { subject, topic, subtopic };
        
        // Show loading
        showWelcomeMessage(false);
        showQuestionList(false);
        showQuestionDetail(false);
        
        const params = new URLSearchParams({
            subject: subject,
            topic: topic,
            subtopic: subtopic
        });
        
        const response = await fetch(`/api/practice/questions?${params}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            currentQuestions = result.questions;
            renderQuestionList(result.questions, subject, topic, subtopic);
            showQuestionList(true);
        } else {
            showError('Failed to load questions: ' + result.message);
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

/**
 * Render the question list
 */
function renderQuestionList(questions, subject, topic, subtopic) {
    const container = document.getElementById('questions-container');
    const countBadge = document.getElementById('question-count-badge');
    
    countBadge.textContent = `${questions.length} question${questions.length !== 1 ? 's' : ''}`;
    
    container.innerHTML = `
        <div class="mb-3">
            <h6><i class="bi bi-folder"></i> ${subject} > ${topic} > ${subtopic}</h6>
        </div>
    `;
    
    if (questions.length === 0) {
        container.innerHTML += `
            <div class="text-center text-muted">
                <i class="bi bi-inbox display-4"></i>
                <p class="mt-2">No questions found in this category.</p>
            </div>
        `;
        return;
    }
    
    questions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'card mb-3 question-card';
        questionCard.style.cursor = 'pointer';
        
        questionCard.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="card-title">${question.title}</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <small class="text-muted">
                                    <i class="bi bi-tag"></i> ${question.question_type}
                                </small>
                            </div>
                            <div class="col-md-6">
                                <small class="text-muted">
                                    <i class="bi bi-speedometer2"></i> ${question.difficulty_level}
                                </small>
                            </div>
                        </div>
                        <div class="row mt-1">
                            <div class="col-md-6">
                                <small class="text-muted">
                                    <i class="bi bi-clock"></i> ${question.estimated_time} min
                                </small>
                            </div>
                            <div class="col-md-6">
                                <small class="text-muted">
                                    <i class="bi bi-diagram-3"></i> ${question.bloom_level}
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="ms-3">
                        <i class="bi bi-arrow-right text-primary"></i>
                    </div>
                </div>
            </div>
        `;
        
        questionCard.addEventListener('click', () => loadQuestionDetail(question.id));
        
        questionCard.addEventListener('mouseenter', () => {
            questionCard.style.transform = 'translateY(-2px)';
            questionCard.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        });
        
        questionCard.addEventListener('mouseleave', () => {
            questionCard.style.transform = '';
            questionCard.style.boxShadow = '';
        });
        
        container.appendChild(questionCard);
    });
}

/**
 * Load and display question detail
 */
async function loadQuestionDetail(questionId) {
    try {
        // Show loading modal
        const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
        loadingModal.show();
        
        const response = await fetch(`/api/practice/question/${questionId}`);
        const result = await response.json();
        
        loadingModal.hide();
        
        if (result.status === 'success') {
            renderQuestionDetail(result.question);
            showQuestionDetail(true);
            showQuestionList(false);
        } else {
            showError('Failed to load question: ' + result.message);
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

/**
 * Render question detail view
 */
function renderQuestionDetail(question) {
    document.getElementById('question-title').textContent = question.title;
    document.getElementById('question-type-detail').textContent = question.question_type;
    document.getElementById('question-difficulty-detail').textContent = question.difficulty_level;
    document.getElementById('question-time-detail').textContent = question.estimated_time;
    document.getElementById('question-bloom-detail').textContent = question.bloom_level;
    
    // Render markdown content
    const contentContainer = document.getElementById('question-content');
    try {
        const htmlContent = marked.parse(question.content);
        contentContainer.innerHTML = htmlContent;
    } catch (error) {
        contentContainer.innerHTML = `<div class="alert alert-danger">Error rendering question content: ${error.message}</div>`;
    }
}

/**
 * Go back to question list
 */
function goBackToList() {
    showQuestionDetail(false);
    showQuestionList(true);
}

/**
 * Show/hide welcome message
 */
function showWelcomeMessage(show) {
    document.getElementById('welcome-message').style.display = show ? 'block' : 'none';
}

/**
 * Show/hide question list
 */
function showQuestionList(show) {
    document.getElementById('question-list').style.display = show ? 'block' : 'none';
}

/**
 * Show/hide question detail
 */
function showQuestionDetail(show) {
    document.getElementById('question-detail').style.display = show ? 'block' : 'none';
}

/**
 * Show error message
 */
function showError(message) {
    // You could implement a toast notification or modal here
    console.error(message);
    alert(message); // Simple fallback
}

// Add CSS for tree nodes and question cards
const style = document.createElement('style');
style.textContent = `
    .tree-node {
        transition: all 0.3s ease;
        border: 1px solid transparent;
    }
    
    .tree-node.active {
        background-color: rgba(88, 166, 255, 0.2) !important;
        border-color: #58a6ff;
    }
    
    .tree-subject {
        font-weight: 600;
        color: #58a6ff;
    }
    
    .tree-topic {
        font-weight: 500;
        color: #79c0ff;
    }
    
    .tree-subtopic {
        color: #e6edf3;
    }
    
    .question-card {
        transition: all 0.3s ease;
        border: 1px solid #30363d;
    }
    
    .question-card:hover {
        border-color: #58a6ff;
    }
`;
document.head.appendChild(style);
