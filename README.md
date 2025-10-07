# 🍕 7KDelivery - Sistema de Delivery de Pizzaria

Um sistema completo de delivery de pizzaria com áreas distintas para clientes e administradores, construído com tecnologias modernas e seguras.

## ✨ Funcionalidades

### 🛒 Área do Cliente
- **Catálogo de Produtos**: Visualização completa do cardápio com categorias
- **Carrinho de Compras**: Adicionar, remover e atualizar quantidades
- **Autenticação Simplificada**: Login com nome e WhatsApp (sem senhas)
- **Gerenciamento de Endereços**: Múltiplos endereços de entrega
- **Acompanhamento de Pedidos**: Status em tempo real dos pedidos
- **Formas de Pagamento**: Dinheiro, cartão e PIX

### 👨‍💼 Área Administrativa
- **Login Seguro**: Autenticação com Google OAuth 2.0
- **Dashboard com KPIs**: Métricas de vendas e pedidos
- **Gerenciamento de Pedidos**: Kanban visual com atualização de status
- **Gerenciamento de Cardápio**: Adicionar, editar e remover produtos
- **Configurações da Loja**: Taxas, horários e informações de contato
- **Notificações em Tempo Real**: Alertas sonoros para novos pedidos

## 🚀 Tecnologia Utilizada

### Frontend
- **⚡ Next.js 15** - Framework React com App Router
- **📘 TypeScript 5** - Tipagem segura para melhor desenvolvimento
- **🎨 Tailwind CSS 4** - Framework CSS utilitário
- **🧩 shadcn/ui** - Componentes UI acessíveis e modernos

### Backend
- **🗄️ Prisma ORM** - Banco de dados SQLite com type-safety
- **🔐 JWT Authentication** - Tokens seguros para sessões
- **🌐 RESTful API** - Endpoints bem estruturados
- **🔌 Socket.io** - Comunicação em tempo real

### Autenticação
- **👥 Clientes**: JWT com nome e WhatsApp
- **🔑 Administradores**: Google OAuth 2.0
- **🍪 Cookies HTTP-Only**: Segurança adicional

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### 1. Clonar o Projeto
```bash
git clone <repositorio>
cd 7kdelivery
```

### 2. Instalar Dependências
```bash
npm install
```

### 4. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL="file:./dev.db"

# JWT Secrets
JWT_SECRET="sua-chave-secreta-aqui-mude-isso-em-producao"

# Google OAuth (Para admin - DESATIVADO TEMPORARIAMENTE PARA TESTES)
# GOOGLE_CLIENT_ID="seu-google-client-id"
# GOOGLE_CLIENT_SECRET="seu-google-client-secret"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Outras configurações
NODE_ENV="development"
```

### 5. Inicializar Banco de Dados
```bash
# Push do schema para o banco
npm run db:push

# Gerar Prisma Client
npm run db:generate
```

### 6. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

O aplicativo estará disponível em [http://localhost:3000](http://localhost:3000)

## 🌐 Rotas da Aplicação

### Públicas
- `/` - Página inicial com cardápio (cliente)
- `/admin/login` - Login do administrador

### Protegidas (Admin)
- `/admin/dashboard` - Painel administrativo
- `/admin/pedidos` - Gerenciamento de pedidos
- `/admin/cardapio` - Gerenciamento de cardápio
- `/admin/configuracoes` - Configurações da loja

## 🔌 API Endpoints

### Autenticação de Clientes
- `POST /api/auth/access` - Login/cadastro unificado

### Autenticação de Administradores
- `POST /api/auth/admin/simple` - Login simples com usuário/senha (para testes)
- `GET /api/auth/admin/me` - Obter dados do admin logado
- `GET /api/auth/admin/google` - Iniciar OAuth Google (DESATIVADO TEMPORARIAMENTE)
- `GET /api/auth/admin/google/callback` - Callback OAuth Google (DESATIVADO TEMPORARIAMENTE)

### Produtos
- `GET /api/products` - Listar produtos disponíveis
- `POST /api/products` - Criar produto (admin)
- `PUT /api/products/[id]` - Atualizar produto (admin)
- `DELETE /api/products/[id]` - Excluir produto (admin)

### Pedidos
- `GET /api/orders` - Listar pedidos (cliente/admin)
- `POST /api/orders` - Criar pedido (cliente)
- `GET /api/orders/[id]` - Obter pedido específico
- `PUT /api/orders/[id]` - Atualizar status (admin)

### Configurações
- `GET /api/settings` - Obter configurações da loja
- `PUT /api/settings` - Atualizar configurações (admin)

## 🗃️ Estrutura do Banco de Dados

### Modelos Principais
- **User**: Clientes com nome, WhatsApp e endereços
- **Admin**: Administradores com Google OAuth
- **Product**: Itens do cardápio com categorias
- **Order**: Pedidos com status e itens
- **Settings**: Configurações da loja
- **Address**: Endereços de entrega dos clientes

### Relacionamentos
- User → Address (um-para-muitos)
- User → Order (um-para-muitos)
- Order → OrderItem (um-para-muitos)
- Product → OrderItem (um-para-muitos)

## 🎨 Fluxo de Usuário

### Cliente
1. Acessa o site e visualiza o cardápio
2. Clica em "Entrar" e informa nome/WhatsApp
3. Se não existir, cria conta automaticamente
4. Adiciona produtos ao carrinho
5. Finaliza pedido selecionando endereço e pagamento
6. Acompanha status do pedido

### Administrador
1. Acesse `/admin/login`
2. Use as credenciais de teste:
   - **Usuário**: `admin`
   - **Senha**: `admin123`
3. Visualize dashboard com métricas
4. Gerencia pedidos atualizando status
5. Gerencia cardápio (adiciona/remove produtos)
6. Configura taxas e informações da loja

> **Nota**: O login com Google OAuth está temporariamente desativado para testes. Para reativar, comente as linhas do login simples e descomente as rotas do Google OAuth.

## 🚀 Build e Deploy

### Build para Produção
```bash
npm run build
```

### Iniciar Servidor de Produção
```bash
npm start
```

### Lint de Código
```bash
npm run lint
```

## 🔧 Configurações Adicionais

### Adicionar Produtos Iniciais
Você pode adicionar produtos iniciais diretamente pelo painel administrativo ou via API:

```javascript
// Exemplo de produto
{
  "name": "Pizza de Calabresa",
  "description": "Mussarela, calabresa, cebola e orégano",
  "price": 29.90,
  "category": "Pizzas Salgadas",
  "imageUrl": "https://exemplo.com/pizza-calabresa.jpg"
}
```

### Configurar WhatsApp Business
Para integração com WhatsApp Business, configure as variáveis de ambiente e utilize a API de notificações.

### Personalizar Tema
O tema pode ser personalizado através das variáveis do Tailwind CSS no arquivo `tailwind.config.ts`.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para dúvidas ou suporte:
- Abra uma issue no GitHub
- Entre em contato pelo WhatsApp configurado
- Envie um email para o suporte

---

Desenvolvido com ❤️ para a comunidade. Supercharge by Next.js e tecnologias modernas.
