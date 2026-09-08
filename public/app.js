const API_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
let selectedVideoId = null;
let selectedConfig = {};
let currentRatingId = null;

// TELAS
function showInitialScreen() {
  document.getElementById('initialScreen').classList.remove('hidden');
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('editorScreen').classList.add('hidden');
  document.getElementById('ownerPanel').classList.add('hidden');
  document.getElementById('processingScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
}

function showLoginScreen() {
  document.getElementById('initialScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

function showEditorScreen() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('editorScreen').classList.remove('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('processingScreen').classList.add('hidden');
}

function showOwnerPanel() {
  if (!currentUser.isOwner) {
    alert('Acesso negado');
    return;
  }
  document.getElementById('editorScreen').classList.add('hidden');
  document.getElementById('ownerPanel').classList.remove('hidden');
  loadOwnerData();
}

function closeOwnerPanel() {
  document.getElementById('ownerPanel').classList.add('hidden');
  document.getElementById('editorScreen').classList.remove('hidden');
}

function switchTab(tabName) {
  document.querySelectorAll('.owner-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(tabName + 'Tab').classList.add('active');
  event.target.classList.add('active');
}

// AUTENTICAÇÃO
async function verifyKey() {
  const keyInput = document.getElementById('keyInput');
  const key = keyInput.value.trim();
  
  if (!key) {
    alert('Digite a key');
    return;
  }

  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('verifyScreen').classList.remove('hidden');

  try {
    const response = await fetch(`${API_URL}/auth/verify-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'neyftbl', key })
    });

    const data = await response.json();

    if (data.success) {
      authToken = data.token;
      currentUser = { username: data.username, isOwner: data.isOwner };
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      setTimeout(() => {
        document.getElementById('verifyScreen').classList.add('hidden');
        showEditorScreen();
      }, 1000);
    } else {
      setTimeout(() => {
        document.getElementById('verifyScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        alert('Key errada, tente novamente');
        keyInput.value = '';
      }, 1000);
    }
  } catch (err) {
    alert('Erro ao verificar key: ' + err.message);
    document.getElementById('verifyScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
  }
}

// VÍDEO
async function selectVideo() {
  const videoInput = document.getElementById('videoInput');
  
  if (!videoInput.files.length) {
    alert('Selecione um vídeo');
    return;
  }

  const file = videoInput.files[0];
  const formData = new FormData();
  formData.append('video', file);

  try {
    const response = await fetch(`${API_URL}/editor/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: formData
    });

    const data = await response.json();
    if (data.success) {
      selectedVideoId = data.videoId;
      document.getElementById('videoStatus').textContent = 'Clip selecionado ✓';
      
      const fileURL = URL.createObjectURL(file);
      document.getElementById('videoPreview').src = fileURL;
      document.getElementById('advancedControls').style.display = 'block';
    }
  } catch (err) {
    alert('Erro ao enviar vídeo: ' + err.message);
  }
}

// OPÇÕES DE EDIÇÃO
function toggleOption(element, option) {
  element.classList.toggle('selected');
  
  if (element.classList.contains('selected')) {
    selectedConfig[option] = true;
  } else {
    selectedConfig[option] = false;
  }
}

function updateBlur(value) {
  document.getElementById('blurValue').textContent = value;
  selectedConfig.blurIntensity = parseFloat(value);
}

function updateZoom(value) {
  document.getElementById('zoomValue').textContent = value;
  selectedConfig.zoomLevel = parseFloat(value);
}

function updateSlow(value) {
  document.getElementById('slowValue').textContent = value;
  selectedConfig.slowMotionFactor = parseFloat(value);
}

// GERAR VÍDEO
async function generateVideo() {
  if (!selectedVideoId) {
    alert('Selecione um vídeo primeiro');
    return;
  }

  const confirmed = confirm('Tem certeza que deseja gerar?');
  if (!confirmed) return;

  document.getElementById('editorScreen').classList.add('hidden');
  document.getElementById('processingScreen').classList.remove('hidden');

  try {
    const response = await fetch(`${API_URL}/videos/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        videoId: selectedVideoId,
        config: selectedConfig
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Simular progresso enquanto processa
      let progress = 10;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        document.getElementById('processingPercent').textContent = `Processando ${Math.floor(progress)}%`;
      }, 500);

      // Aguardar processamento (simular 5-10 segundos)
      setTimeout(() => {
        clearInterval(progressInterval);
        document.getElementById('processingPercent').textContent = 'Processando 100%';
        
        setTimeout(() => {
          document.getElementById('processingScreen').classList.add('hidden');
          document.getElementById('resultScreen').classList.remove('hidden');
          currentRatingId = selectedVideoId;
          
          const hasReverse = selectedConfig.reverse ? 'Geramos seu reverse🔥' : 'Geramos o que você pediu🔥';
          document.getElementById('resultMessage').textContent = hasReverse;
        }, 500);
      }, 5000 + Math.random() * 5000);
    }
  } catch (err) {
    alert('Erro ao processar: ' + err.message);
    document.getElementById('processingScreen').classList.add('hidden');
    document.getElementById('editorScreen').classList.remove('hidden');
  }
}

// DOWNLOAD
function downloadVideo() {
  if (!selectedVideoId) return;
  window.location.href = `${API_URL}/videos/download/${selectedVideoId}`;
}

// AVALIAÇÃO
let selectedStars = 0;

function rateApp(stars) {
  selectedStars = stars;
  document.querySelectorAll('.star').forEach((star, index) => {
    if (index < stars) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

async function submitRating() {
  if (selectedStars === 0) {
    alert('Selecione uma classificação');
    return;
  }

  const comment = document.getElementById('ratingComment').value;

  try {
    const response = await fetch(`${API_URL}/ratings/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        videoId: currentRatingId,
        stars: selectedStars,
        comment: comment
      })
    });

    const data = await response.json();
    if (data.success) {
      alert('Avaliação enviada!');
      selectedStars = 0;
      document.getElementById('ratingComment').value = '';
    }
  } catch (err) {
    alert('Erro ao enviar avaliação');
  }
}

// FEEDBACK
function showFeedbackModal() {
  document.getElementById('feedbackModal').classList.remove('hidden');
}

function closeFeedbackModal() {
  document.getElementById('feedbackModal').classList.add('hidden');
}

async function submitFeedback() {
  const message = document.getElementById('feedbackText').value.trim();
  
  if (!message) {
    alert('Digite uma mensagem');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/feedback/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        type: 'feedback',
        message: message
      })
    });

    const data = await response.json();
    if (data.success) {
      alert('Feedback enviado!');
      document.getElementById('feedbackText').value = '';
      closeFeedbackModal();
    }
  } catch (err) {
    alert('Erro ao enviar feedback');
  }
}

// PAINEL DO DONO
async function loadOwnerData() {
  try {
    const response = await fetch(`${API_URL}/owner/dashboard`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await response.json();
    console.log('Dados do painel:', data);
    
    // Carregar lista de usuários
    const usersResponse = await fetch(`${API_URL}/users/list`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const users = await usersResponse.json();
    displayUsers(users);
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
  }
}

function displayUsers(users) {
  const usersList = document.getElementById('usersList');
  usersList.innerHTML = '';
  
  users.forEach(user => {
    const userEl = document.createElement('div');
    userEl.className = 'user-item';
    userEl.innerHTML = `
      <div class="user-info">
        <h4>${user.username}</h4>
        <p>${user.tiktok}</p>
        <p>Status: ${user.status} | Banido: ${user.is_banned ? 'Sim' : 'Não'}</p>
      </div>
      <div class="user-actions">
        <button class="action-btn" onclick="banUser(${user.id})">Banir</button>
        <button class="action-btn" onclick="revokeAccess(${user.id})">Revogar</button>
      </div>
    `;
    usersList.appendChild(userEl);
  });
}

async function banUser(userId) {
  if (!confirm('Tem certeza que deseja banir este usuário?')) return;
  
  try {
    const response = await fetch(`${API_URL}/owner/ban-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ userId })
    });
    const data = await response.json();
    if (data.success) {
      alert('Usuário banido!');
      loadOwnerData();
    }
  } catch (err) {
    alert('Erro ao banir usuário');
  }
}

async function revokeAccess(userId) {
  if (!confirm('Revogar acesso deste usuário?')) return;
  
  try {
    const response = await fetch(`${API_URL}/users/revoke-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ userId })
    });
    const data = await response.json();
    if (data.success) {
      alert('Acesso revogado!');
      loadOwnerData();
    }
  } catch (err) {
    alert('Erro ao revogar acesso');
  }
}

async function grantAccess() {
  const tiktok = document.getElementById('tikTokInput').value.trim();
  const days = parseInt(document.getElementById('daysSelect').value);
  
  if (!tiktok) {
    alert('Digite o TikTok');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/owner/grant-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ tiktok, days })
    });
    const data = await response.json();
    if (data.success) {
      alert('Usuário liberado🔥');
      document.getElementById('tikTokInput').value = '';
      loadOwnerData();
    }
  } catch (err) {
    alert('Erro ao liberar acesso');
  }
}

// MODALS
function showPaymentModal() {
  document.getElementById('paymentModal').classList.remove('hidden');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.add('hidden');
}

// INICIALIZAR
window.addEventListener('load', () => {
  if (authToken) {
    showEditorScreen();
  } else {
    showInitialScreen();
  }
});
