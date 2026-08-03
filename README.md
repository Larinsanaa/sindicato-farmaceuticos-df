# Sindicato Farmacêuticos DF

## Objetivo do projeto

Este projeto é uma aplicação web para apoiar o Sindicato dos Farmacêuticos do DF no acompanhamento, cadastro e análise de avaliações de farmácias e drogarias.

A plataforma foi pensada para:

- centralizar avaliações realizadas por avaliadores;
- permitir a visualização de um dashboard com métricas e filtros;
- gerar relatórios resumidos para análise administrativa;
- separar acessos entre usuários com perfil de presidente e avaliador.

## O que a aplicação faz

### Backend
- API REST em Node.js + Express;
- autenticação com JWT;
- cadastro e login de usuários;
- cadastro de avaliadores e geração de link para primeira senha;
- redefinição de senha via token;
- listagem e criação de avaliações;
- suporte a modo demonstração para testes sem Supabase.

### Frontend
- interface web em React + Vite;
- login e navegação protegida;
- dashboard com métricas e filtros;
- telas de nova avaliação, histórico e cadastro de avaliador;
- histórico e visualização de relatórios.

## Tecnologias utilizadas

### Backend
- Node.js
- Express
- JWT
- bcrypt
- Supabase (opcional, para banco real)
- dotenv

### Frontend
- React
- Vite
- React Router
- Tailwind CSS

## Estrutura do projeto

```text
backend/          # API e regras de negócio
frontend/         # Interface web
```

## Pré-requisitos

Antes de rodar o projeto, você precisa ter instalado:

- Node.js 18 ou superior
- npm ou yarn
- Git

## Como rodar o projeto

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd sindicato-farmaceuticos-df-main
```

### 2. Configure o backend

Entre na pasta do backend:

```bash
cd backend
npm install
```

Crie um arquivo `.env` dentro de `backend/` com o conteúdo abaixo:

```env
PORT=3001
JWT_SECRET=troque-esta-chave-por-uma-mais-segura

# Modo demonstração (opcional)
USE_DEMO_MODE=true

# Se você quiser usar o Supabase real, configure também:
# SUPABASE_URL=https://SEU-PROJETO.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY
```

> Se `USE_DEMO_MODE=true`, o backend usará dados de demonstração e não precisará de Supabase para rodar localmente.

Inicie o backend:

```bash
npm run dev
```

O servidor ficará disponível em:

```text
http://localhost:3001
```

---

### 3. Configure o frontend

Abra outro terminal e entre na pasta do frontend:

```bash
cd frontend
npm install
```

Crie um arquivo `.env` dentro de `frontend/` com:

```env
VITE_API_URL=http://localhost:3001
```

Inicie o frontend:

```bash
npm run dev
```

A interface ficará disponível em:

```text
http://localhost:5173
```

---

### 4. Acesse a aplicação

Abra o navegador em:

```text
http://localhost:5173
```

Se estiver usando o modo demonstração (`USE_DEMO_MODE=true`), você pode testar com as credenciais abaixo:

- E-mail: `avaliador@sindicatodf.com.br`
- Senha: `avaliador123`

Também há um usuário administrador de exemplo:

- E-mail: `admin@sindicatodf.com.br`
- Senha: `admin123`

## Endpoints principais da API

O backend expõe os seguintes endpoints principais:

### Autenticação
- `POST /api/cadastro`
- `POST /api/login`
- `GET /api/meu-perfil`
- `POST /api/avaliadores` (cadastro de avaliador)
- `GET /api/avaliadores` (listagem de avaliadores)
- `PATCH /api/avaliadores/:id/status` (ativar/desativar avaliador)
- `POST /api/avaliadores/:id/link-redefinicao` (gerar link de primeira senha)
- `PATCH /api/redefinir-senha` (redefinir senha via token)

### Avaliações
- `POST /api/avaliacoes`
- `GET /api/avaliacoes`
- `GET /api/avaliacoes/:id`

## Fluxo de uso típico

1. Faça login na interface.
2. Acesse o dashboard para visualizar avaliações e métricas.
3. Crie novas avaliações, quando permitido pelo perfil.
4. Consulte histórico e relatórios para análise administrativa.

## Dicas para desenvolvimento

- Para desenvolvimento rápido, mantenha `USE_DEMO_MODE=true`.
- Para uso real, configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no backend.
- O frontend lê a URL da API via `VITE_API_URL`, então ajuste esse valor se mudar a porta do backend.

## Observações importantes

- A autenticação utiliza JWT.
- O backend possui proteção por tipo de usuário (`presidente` e `avaliador`).
- O banco real pode ser integrado via Supabase, conforme o arquivo de configuração do backend.

## Contribuição

Se quiser colaborar com melhorias, faça um fork do projeto, crie uma branch e envie um pull request com as alterações.
