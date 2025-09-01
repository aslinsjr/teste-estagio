// Sistema de timer
let startTime = Date.now();
let totalElapsed = 0;
let timerInterval;
let isActive = true;

// Variáveis para armazenar dados em memória (fallback para localStorage)
let formData = {};

// Função para carregar tempo salvo (com fallback)
function loadSavedTime() {
    try {
        const savedTime = localStorage.getItem('questionario_tempo');
        if (savedTime) {
            totalElapsed = parseInt(savedTime);
        }
    } catch (e) {
        console.log('LocalStorage não disponível, usando armazenamento temporário');
    }
}

// Função para salvar tempo (com fallback)
function saveTime(time) {
    try {
        localStorage.setItem('questionario_tempo', time.toString());
    } catch (e) {
        formData.tempo = time;
    }
}

// Função para formatar tempo
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Função para atualizar o timer
function updateTimer() {
    if (isActive) {
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000) + totalElapsed;
        const timerDisplay = document.getElementById('timerDisplay');
        const tempoTotalInput = document.getElementById('tempoTotalInput');
        
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(currentElapsed);
        }
        if (tempoTotalInput) {
            tempoTotalInput.value = formatTime(currentElapsed);
        }
        
        saveTime(currentElapsed);
    }
}

// Iniciar timer
function startTimer() {
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

// Pausar timer quando a página perde o foco
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        isActive = false;
        totalElapsed += Math.floor((Date.now() - startTime) / 1000);
        saveTime(totalElapsed);
    } else {
        isActive = true;
        startTime = Date.now();
    }
});

// Função para mostrar indicador de salvamento
function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    if (indicator) {
        indicator.classList.add('show');
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }
}

// Função para salvar dados (com fallback)
function saveData() {
    const form = document.getElementById('questionsForm');
    if (!form) return;
    
    const formDataObj = new FormData(form);
    
    try {
        for (let [key, value] of formDataObj.entries()) {
            if (key !== 'tempo_total') {
                localStorage.setItem(`questionario_${key}`, value);
            }
        }
    } catch (e) {
        for (let [key, value] of formDataObj.entries()) {
            if (key !== 'tempo_total') {
                formData[key] = value;
            }
        }
    }
    
    showSaveIndicator();
}

// Função para carregar dados salvos (com fallback)
function loadSavedData() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (!input.name) return;
        
        let savedValue = null;
        
        try {
            savedValue = localStorage.getItem(`questionario_${input.name}`);
        } catch (e) {
            savedValue = formData[input.name];
        }
        
        if (savedValue) {
            input.value = savedValue;
        }
    });
}

// Função de debounce para otimizar salvamento
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadSavedTime();
    loadSavedData();
    startTimer();

    const debouncedSave = debounce(saveData, 1000);

    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', debouncedSave);
        input.addEventListener('blur', saveData);
    });

    const form = document.getElementById('questionsForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            const currentElapsed = Math.floor((Date.now() - startTime) / 1000) + totalElapsed;
            const tempoTotalInput = document.getElementById('tempoTotalInput');
            if (tempoTotalInput) {
                tempoTotalInput.value = formatTime(currentElapsed);
            }
            
            saveData();
            
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#e53e3e';
                } else {
                    field.style.borderColor = '#e2e8f0';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('Por favor, preencha todos os campos obrigatórios.');
            }
            // Não bloquear o envio se válido, permitindo que o FormSubmit processe
        });
    }
});

window.addEventListener('beforeunload', function() {
    saveData();
    totalElapsed += Math.floor((Date.now() - startTime) / 1000);
    saveTime(totalElapsed);
});

function clearSavedData() {
    try {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('questionario_'));
        keys.forEach(key => localStorage.removeItem(key));
    } catch (e) {
        formData = {};
    }
    console.log('Dados salvos foram limpos');
}