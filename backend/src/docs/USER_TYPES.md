# Sistema de Tipos de Usuários

## Tipos Disponíveis

A aplicação possui dois tipos de usuários:

- **presidente**: Usuário com privilégios administrativos
- **avaliador**: Usuário padrão com permissões limitadas

## Como Registrar um Usuário

### Registrar como AVALIADOR (padrão)
```json
POST /register
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123"
}
```
Por padrão, novos usuários são criados como "avaliador".

### Registrar como PRESIDENTE
```json
POST /register
{
  "nome": "Maria Santos",
  "email": "maria@example.com",
  "senha": "senha123",
  "tipo": "presidente"
}
```

## Como Fazer Login

```json
POST /login
{
  "email": "joao@example.com",
  "senha": "senha123"
}
```

**Resposta:**
```json
{
  "user": {
    "id": "uuid-aqui",
    "nome": "João Silva",
    "email": "joao@example.com",
    "tipo": "avaliador"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Proteger Rotas por Tipo de Usuário

Use o middleware `checkRole()` para proteger rotas por tipo de usuário.

### Exemplo 1: Apenas para PRESIDENTE
```javascript
import { checkRole } from '../middlewares/role.middleware';

routes.delete('/usuario/:id', authMiddleware, checkRole('presidente'), (req, res) => {
  // Apenas presidentes podem deletar usuários
});
```

### Exemplo 2: Apenas para AVALIADOR
```javascript
routes.post('/avaliacao', authMiddleware, checkRole('avaliador'), (req, res) => {
  // Apenas avaliadores podem criar avaliações
});
```

### Exemplo 3: Para AMBOS os tipos
```javascript
routes.get('/meu-perfil', authMiddleware, checkRole('presidente', 'avaliador'), (req, res) => {
  // Ambos os tipos podem acessar seu perfil
});
```

## Fluxo de Autenticação e Autorização

1. **POST /register** - Criar novo usuário com tipo especificado
2. **POST /login** - Fazer login e receber token JWT com tipo de usuário
3. **GET /painel** + Header `Authorization: Bearer <token>` - Acessar rota protegida
4. Middleware `authMiddleware` valida o token
5. Middleware `checkRole()` valida o tipo de usuário (se aplicável)

## Dados Necessários no Banco

A tabela `usuario` deve ter as seguintes colunas:

```sql
- id (UUID, Primary Key)
- nome (VARCHAR)
- email (VARCHAR, Unique)
- senha (VARCHAR) -- armazenado com hash bcrypt
- tipo (VARCHAR) -- valores: 'presidente' ou 'avaliador'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```
