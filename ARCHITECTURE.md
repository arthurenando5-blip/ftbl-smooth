# Estrutura do Projeto FTBL SMOOTH

```
ftbl-smooth/
├── server.js                 # Servidor principal (Express)
├── package.json              # Dependências do projeto
├── .env                      # Configurações de ambiente
├── README.md                 # Documentação
│
├── src/
│   ├── database.js           # Inicialização do SQLite
│   ├── videoProcessor.js     # Processamento FFmpeg real
│   │
│   └── routes/
│       ├── auth.js           # Autenticação e verificação de keys
│       ├── users.js          # Gerenciar usuários (admin)
│       ├── editor.js         # Upload de vídeos
│       ├── videos.js         # Processamento e download
│       ├── ratings.js        # Avaliações
│       ├── owner.js          # Painel do Dono 🕵️
│       ├── feedback.js       # Feedback dos usuários
│       └── comments.js       # Comentários e curtidas
│
├── public/
│   ├── index.html            # FTBL Smooth (Editor Principal)
│   ├── ratings.html          # Avaliações 🔥👀
│   ├── app.js                # JavaScript funcional
│   └── style.css             # Design responsivo
│
├── data/
│   └── ftbl.db              # Banco de dados SQLite
│
├── uploads/
│   └── [vídeos enviados]    # Vídeos originais dos usuários
│
└── outputs/
    └── [vídeos processados] # Vídeos após edição com FFmpeg
```

---

## Fluxo de Dados

```
USUÁRIO
   ↓
[FRONTEND - index.html]
   ↓
[AUTENTICAÇÃO - auth.js]
   ↓ (Token JWT)
[EDITOR - app.js]
   ↓
[UPLOAD - multer - editor.js]
   ↓
[BANCO DE DADOS - database.js]
   ↓
[PROCESSAMENTO FFmpeg - videoProcessor.js]
   ↓
[RESULTADO - videos.js]
   ↓
[AVALIAÇÕES - ratings.js]
   ↓
[PAINEL DO DONO - owner.js]
```

---

## Endpoints da API

### Autenticação
- `POST /api/auth/verify-key` → Verificar key
- `GET /api/auth/verify-session` → Verificar sessão

### Usuários
- `GET /api/users/me` → Dados do usuário
- `GET /api/users/list` → Listar todos (apenas owner)
- `POST /api/users/ban` → Banir usuário
- `POST /api/users/unban` → Desbanir
- `POST /api/users/grant-access` → Liberar acesso
- `POST /api/users/revoke-access` → Revogar acesso

### Editor
- `POST /api/editor/upload` → Upload de vídeo
- `GET /api/editor/my-videos` → Meus vídeos
- `POST /api/editor/save-processing` → Salvar config de edição

### Vídeos
- `POST /api/videos/process` → Processar com FFmpeg
- `GET /api/videos/status/:videoId` → Status do processamento
- `GET /api/videos/download/:videoId` → Download do vídeo

### Avaliações
- `POST /api/ratings/create` → Criar avaliação
- `GET /api/ratings/all` → Obter todas avaliações

### Painel do Dono
- `GET /api/owner/dashboard` → Dashboard
- `POST /api/owner/ban-user` → Banir usuário
- `POST /api/owner/grant-access` → Liberar acesso
- `POST /api/owner/copy-config` → Copiar configurações
- `GET /api/owner/reports` → Denúncias
- `POST /api/owner/remove-comment` → Remover comentário

### Feedback
- `POST /api/feedback/send` → Enviar feedback

### Comentários
- `POST /api/comments/create` → Criar comentário
- `GET /api/comments/rating/:ratingId` → Obter comentários
- `POST /api/comments/like` → Curtir/descurtir
- `POST /api/comments/report` → Denunciar comentário

---

## Status do Desenvolvimento

✅ Backend completo  
✅ Rotas de API implementadas  
✅ Banco de dados estruturado  
✅ Processamento FFmpeg real  
✅ Frontend responsivo  
✅ Sistema de autenticação  
✅ Painel do Dono  
✅ Sistema de avaliações  
✅ Sistema de comentários  

🔧 **Pronto para usar!**
