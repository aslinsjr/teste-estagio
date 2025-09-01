// Sistema de timer (mesmo código anterior)
let startTime = Date.now();
let totalElapsed = 0;
let timerInterval;
let isActive = true;

const savedTime = localStorage.getItem('questionario_tempo');
if (savedTime) {
    totalElapsed = parseInt(savedTime);
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimer() {
    if (isActive) {
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000) + totalElapsed;
        document.getElementById('timerDisplay').textContent = formatTime(currentElapsed);
        document.getElementById('tempoTotalInput').value = formatTime(currentElapsed);
        localStorage.setItem('questionario_tempo', currentElapsed.toString());
    }
}

function startTimer() {
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        isActive = false;
        totalElapsed += Math.floor((Date.now() - startTime) / 1000);
        localStorage.setItem('questionario_tempo', totalElapsed.toString());
    } else {
        isActive = true;
        startTime = Date.now();
    }
});

// Função para mostrar indicador de salvamento
function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.classList.add('show');
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

// Função para salvar dados no localStorage
function saveData() {
    const form = document.getElementById('questionsForm');
    const formData = new FormData(form);
    
    for (let [key, value] of formData.entries()) {
        if (key !== 'tempo_total') {
            localStorage.setItem(`questionario_${key}`, value);
        }
    }
    
    showSaveIndicator();
}

// Função para carregar dados salvos do localStorage
function loadSavedData() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        const savedValue = localStorage.getItem(`questionario_${input.name}`);
        if (savedValue) {
            input.value = savedValue;
        }
    });
}

// Funções para modals
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function clearSavedData() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('questionario_'));
    keys.forEach(key => {
        localStorage.removeItem(key);
    });
}

// Função para enviar via EmailJS
function sendEmail(formData) {
    const templateParams = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        tempo_total: formData.get('tempo_total'),
        questao_1: formData.get('questao_1'),
        questao_2: formData.get('questao_2'),
        questao_3: formData.get('questao_3'),
        questao_4: formData.get('questao_4'),
        questao_5: formData.get('questao_5'),
        data_envio: new Date().toLocaleString('pt-BR')
    };

    // SUBSTITUIR PELOS SEUS IDs do EmailJS
    return emailjs.send('service_tvv0fmr', 'template_m2cp2qf', templateParams);
}

// Event listeners principais
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    startTimer();

    // Salvar dados quando o usuário digita
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(saveData, 1000);
        });
    });

    // Interceptar envio do formulário para EmailJS
    document.getElementById('questionsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Atualizar tempo final
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000) + totalElapsed;
        document.getElementById('tempoTotalInput').value = formatTime(currentElapsed);
        
        // Desabilitar botão
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
        // Preparar dados
        const formData = new FormData(this);
        
        // Enviar via EmailJS
        sendEmail(formData)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            showModal('successModal');
            clearSavedData();
        })
        .catch(function(error) {
            console.error('FAILED...', error);
            showModal('errorModal');
        })
        .finally(function() {
            // Reabilitar botão
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
    });

    // Event listeners para modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});

// Salvar dados quando a página é fechada
window.addEventListener('beforeunload', function() {
    saveData();
    totalElapsed += Math.floor((Date.now() - startTime) / 1000);
    localStorage.setItem('questionario_tempo', totalElapsed.toString());
});