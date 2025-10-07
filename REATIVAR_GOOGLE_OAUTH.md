# 🔄 Como Reativar o Login com Google OAuth

Este guia explica como reativar o login com Google OAuth para administradores quando terminar a fase de testes.

## 📋 Passos para Reativar

### 1. Descomentar as rotas do Google OAuth no README.md

No arquivo `README.md`, descomente as seguintes linhas:

```env
# Google OAuth (Para admin)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"
```

E remova o comentário "(DESATIVADO TEMPORARIAMENTE PARA TESTES)".

### 2. Configurar as variáveis de ambiente no .env

Adicione as credenciais do Google OAuth ao seu arquivo `.env`:

```env
# Google OAuth (Para admin)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Configurar o Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API Google+ API
4. Vá para "Credenciais" → "Tela de permissão OAuth"
5. Configure o consentimento (nome do app, logo, etc.)
6. Crie credenciais OAuth 2.0
7. Adicione URLs de redirecionamento autorizados:
   - `http://localhost:3000/api/auth/admin/google/callback`

### 4. Restaurar a página de login original

Substitua o conteúdo de `/src/app/admin/login/page.tsx` pela versão original com Google OAuth:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pizza } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if admin is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/admin/me');
        if (response.ok) {
          router.push('/admin/dashboard');
        }
      } catch (error) {
        // Not logged in, continue
      }
    };

    checkAuth();
  }, [router]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/admin/google';
  };

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'access_denied':
        return 'Acesso negado. Você precisa permitir o acesso à conta Google.';
      case 'missing_code':
        return 'Código de autenticação não encontrado.';
      case 'token_failed':
        return 'Falha ao obter token de acesso do Google.';
      case 'server_error':
        return 'Erro interno do servidor. Tente novamente.';
      default:
        return 'Ocorreu um erro durante o login. Tente novamente.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16">
              <Pizza className="h-16 w-16 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Acesso Restrito ao Painel</CardTitle>
          <CardDescription>
            Faça login com sua conta Google para acessar o painel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Entrar com o Google
          </Button>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Apenas administradores autorizados podem acessar este painel.</p>
            <p className="mt-2">
              Precisa de ajuda?{' '}
              <a href="#" className="text-red-600 hover:text-red-700">
                Entre em contato
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5. Remover a API de login simples (opcional)

Para maior segurança, você pode remover o arquivo:
```
/src/app/api/auth/admin/simple/route.ts
```

Ou mantê-lo como backup, mas desative-o no código.

### 6. Atualizar a documentação

Atualize o README.md para refletir o retorno ao Google OAuth:

- Remova as menções ao login simples
- Atualize as instruções de acesso ao admin
- Remova a nota sobre desativação temporária

## 🔐 Segurança Recomendada

Ao reativar o Google OAuth:

1. **Use um domínio personalizado** em produção, não localhost
2. **Configure corretamente as URLs de redirecionamento** no Google Cloud Console
3. **Limite o acesso** a emails específicos de administradores
4. **Use variáveis de ambiente seguras** para as credenciais
5. **Revogue tokens** antigos regularmente

## 🚀 Testes Após Reativação

Após reativar o Google OAuth, teste:

1. **Logout do admin atual**
2. **Acesso a `/admin/login`**
3. **Redirecionamento para o Google**
4. **Autenticação e retorno ao dashboard**
5. **Verificação se o admin está logado corretamente**

---

**Importante**: Mantenha o login simples como backup durante o período de transição para garantir que você sempre tenha acesso ao painel administrativo.