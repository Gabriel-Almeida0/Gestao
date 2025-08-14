# Sistema de Gestão Financeira

Sistema completo de gestão financeira com dashboard, controle de pagamentos, despesas, atendentes e tripeiros.

## 🚀 Tecnologias

### Backend
- Node.js
- Express
- MySQL
- JWT Authentication
- Bcrypt

### Frontend
- React
- React Router
- Axios
- Lucide Icons
- Date-fns

## 📋 Pré-requisitos

- Node.js (v14 ou superior)
- XAMPP (para MySQL)
- NPM ou Yarn

## 🔧 Instalação

### 1. Clone o repositório
```bash
cd C:\Users\Complex\Downloads\gestao
```

### 2. Configure o MySQL

1. Inicie o XAMPP e ative o MySQL
2. Certifique-se de que o MySQL está rodando na porta 3306

### 3. Configure o Backend

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Edite o arquivo backend/.env se necessário

# Inicialize o banco de dados
npm run init-db

# Inicie o servidor
npm run dev
```

O backend estará disponível em: http://localhost:3333

### 4. Configure o Frontend

Em outro terminal:

```bash
# Entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie a aplicação
npm start
```

O frontend estará disponível em: http://localhost:3000

## 🔐 Credenciais de Acesso

**Usuário Admin Padrão:**
- Email: admin@gestao.com
- Senha: admin123

## 📁 Estrutura do Projeto

```
gestao/
├── backend/
│   ├── src/
│   │   ├── config/       # Configurações (database, etc)
│   │   ├── controllers/  # Controllers da API
│   │   ├── routes/       # Rotas da API
│   │   ├── middleware/   # Middlewares (auth, etc)
│   │   ├── database/     # Scripts SQL e migrations
│   │   └── server.js     # Arquivo principal do servidor
│   ├── .env             # Variáveis de ambiente
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── contexts/     # Contextos (Auth, etc)
│   │   ├── services/     # Serviços de API
│   │   └── App.js       # Componente principal
│   └── package.json
│
└── README.md
```

## 🎯 Funcionalidades

### Dashboard Principal (RF001)
- ✅ Indicadores de faturamento total
- ✅ Total de gastos
- ✅ Lucro líquido
- ✅ Variação percentual por período
- ✅ Seção de notas
- ✅ Seção de lembretes
- ✅ Top atendentes
- ✅ Últimos pagamentos
- ✅ Últimos gastos

### Gerenciamento (Em desenvolvimento)
- 🚧 Cadastro e gestão de pagamentos (RF002)
- 🚧 Cadastro e gestão de atendentes (RF003)
- 🚧 Cadastro e gestão de tripeiros (RF004)
- 🚧 Cadastro e gestão de despesas (RF005)
- 🚧 Registro de recebimentos (RF006)
- 🚧 Fechamento financeiro (RF007)
- 🚧 Painel administrativo (RF008-RF010)

## 🛠️ Scripts Disponíveis

### Backend
- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm start` - Inicia o servidor em produção
- `npm run init-db` - Inicializa o banco de dados

### Frontend
- `npm start` - Inicia a aplicação em modo desenvolvimento
- `npm run build` - Cria build de produção
- `npm test` - Executa testes

## 📝 Notas Importantes

1. **Banco de Dados**: O sistema usa MySQL. Certifique-se de que o XAMPP está rodando antes de iniciar o backend.

2. **Portas**: 
   - Backend: 3333
   - Frontend: 3000
   - MySQL: 3306

3. **Autenticação**: O sistema usa JWT para autenticação. O token é armazenado no localStorage do navegador.

4. **Dados Reais**: Conforme configurado no CLAUDE.md, o sistema NUNCA usa dados mocados. Todos os dados vêm do banco de dados real através da API.

## 🐛 Solução de Problemas

### Erro de conexão com o banco
- Verifique se o XAMPP está rodando
- Verifique se o MySQL está ativo
- Confirme as credenciais no arquivo `.env`

### Erro de autenticação
- Verifique se o backend está rodando
- Confirme que o banco foi inicializado com `npm run init-db`
- Use as credenciais corretas (admin@gestao.com / admin123)

### Porta em uso
- Se a porta 3333 ou 3000 estiver em uso, você pode alterá-las nos arquivos `.env` respectivos

## 📄 Licença

Este projeto é privado e de uso exclusivo.