# 🔥 FTBL SMOOTH - Editor Profissional de Vídeos

**Reverse smooth Edited in mobile smooth reverse 100% seguro**

Creator: **neyftbl**

---

## 🚀 Como Usar

### 1️⃣ Instalação

```bash
# Clonar repositório
git clone https://github.com/arthurenando5-blip/ftbl-smooth.git
cd ftbl-smooth

# Instalar dependências
npm install

# Instalar FFmpeg (necessário para processamento de vídeo)
# No Windows: choco install ffmpeg
# No Mac: brew install ffmpeg
# No Linux: sudo apt-get install ffmpeg
```

### 2️⃣ Rodar o App

```bash
npm start
```

O app estará disponível em: **http://localhost:3000**

---

## 🔐 Acesso

### Dono (neyftbl)
- **Key:** `Ftbl`
- Acesso ao: Painel do Dono 🕵️
- Controle total de usuários, banimentos, liberações

### Usuários Normais
- Precisam ser liberados pelo dono
- Podem usar o editor com suas keys
- Podem avaliar e comentar

---

## 📱 Funcionalidades

### Editor de Vídeos
✅ **Reverse** - Inverter sequência de frames  
✅ **Motion Blur** - Borão de movimento automático  
✅ **CC Dark AE** - Color grading cinematográfica  
✅ **Zoom** - Efeito de zoom com keyframes  
✅ **Slow Motion** - Câmera lenta com interpolação  
✅ **4K UHD** - Upscale para 3840x2160  
✅ **Processamento Real** - FFmpeg + GPU quando disponível  

### Painel do Dono 🕵️
✅ Listar e gerenciar usuários  
✅ Banir/Desbanir usuários  
✅ Liberar acesso por tempo  
✅ Copiar configurações de edição  
✅ Gerenciar denúncias  
✅ Moderar comentários  

### Avaliações 🔥👀
✅ Usuários avaliam o app (1-5 estrelas)  
✅ Sistema de comentários em avaliações  
✅ Curtidas em comentários  
✅ Denúncias de spam/ofensivo  
✅ Respostas do dono marcadas com ✓  

---

## 🎯 Fluxo Completo

```
1. Usuário abre FTBL SMOOTH
   ↓
2. Clica em "ENTRAR" e coloca a key
   ↓
3. Acessa o editor
   ↓
4. Seleciona vídeo + opções (Reverse, Motion Blur, etc)
   ↓
5. Clica "Gerar Reverse"
   ↓
6. FFmpeg processa com TODOS os efeitos reais
   ↓
7. Vídeo final está pronto para download
   ↓
8. Usuário avalia no app (1-5 ⭐)
   ↓
9. Avaliação aparece em Avaliações🔥👀
   ↓
10. Outros usuários comentam, curtem, denunciam
   ↓
11. Dono modera tudo pelo Painel 🕵️
```

---

## 📊 Estrutura do Banco de Dados

```
users              → Usuários do app
user_keys          → Keys de acesso
videos             → Vídeos processados
video_processing   → Configurações de edição
ratings            → Avaliações (1-5 ⭐)
comments           → Comentários em avaliações
likes              → Curtidas em comentários
feedback           → Feedback dos usuários
reports            → Denúncias de comentários
```

---

## 🎨 Design

- **Tema:** Preto + Azul-Ciano (#00d9ff)
- **Estilo:** Minimalista, profissional, premium
- **Responsivo:** 100% otimizado para mobile
- **Animações:** Suaves e fluidas
- **Cards:** Escuros com bordas azul-ciano

---

## 🔧 Configurações (.env)

```
PORT=3000
NODE_ENV=development
JWT_SECRET=ftbl_secret_key_2024
OWNER_USERNAME=neyftbl
OWNER_KEY=Ftbl
DB_PATH=./data/ftbl.db
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
```

---

## 📦 Dependências

- **express** - Backend HTTP
- **sqlite3** - Banco de dados
- **fluent-ffmpeg** - Processamento de vídeo
- **jsonwebtoken** - Autenticação
- **bcryptjs** - Hash de senhas
- **cors** - Requisições entre origens
- **multer** - Upload de arquivos

---

## 🛡️ Segurança

✅ Verificação de keys no backend  
✅ Tokens JWT para autenticação  
✅ Banimento de usuários com invalidação de sessão  
✅ Painel do Dono protegido no servidor  
✅ Verificação de permissões em todas as rotas  
✅ Validação de entrada em formulários  

---

## 🎬 Processamento de Vídeo (FFmpeg)

Cada efeito é aplicado **realmente** ao vídeo:

```javascript
// Exemplo de aplicação real
Reverse    → ffmpeg -vf reverse
Motion Blur → ffmpeg -vf boxblur
CC Dark    → ffmpeg -vf eq=contrast=1.2:brightness=-0.1
Zoom       → ffmpeg -vf scale=iw*zoom:ih*zoom
Slow Motion → ffmpeg -vf setpts=factor*PTS
4K         → ffmpeg -s 3840x2160
```

---

## 📱 URLs da Aplicação

| Página | URL |
|--------|-----|
| Editor | `http://localhost:3000/` |
| Avaliações | `http://localhost:3000/ratings` |
| API de Auth | `/api/auth` |
| API de Vídeos | `/api/videos` |
| API de Painel | `/api/owner` |

---

## 🚨 Troubleshooting

**FFmpeg não encontrado?**
```bash
# Verifique se está instalado
ffmpeg -version

# Se não, instale:
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg
```

**Erro de banco de dados?**
```bash
# Delete a pasta data/ e deixe recriar
rm -rf data/
```

**Porta 3000 já em uso?**
```bash
# Configure outra porta no .env
PORT=3001
```

---

## 📞 Suporte

Contate: **@arthur.cc3** no TikTok

Pagamento do app: **R$ 7,00**

---

## 📄 Licença

Proprietary - FTBL Smooth™

---

**Desenvolvido por:** neyftbl 🔥

**Status:** ✅ Funcional e Pronto para Uso
