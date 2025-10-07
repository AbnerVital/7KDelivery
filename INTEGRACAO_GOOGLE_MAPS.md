# Integração Google Maps para 7KDelivery

Este documento descreve a integração do Google Maps implementada para o sistema de delivery de comida 7KDelivery.

## Visão Geral

O sistema agora utiliza as APIs do Google Maps para fornecer:
- **Detecção de localização precisa** com coordenadas GPS de alta precisão
- **Autocompletar inteligente de endereços** usando Google Places API
- **Visualização interativa de mapas** para seleção de endereços
- **Geocodificação confiável** para conversão de endereço em coordenadas

## Funcionalidades Implementadas

### 1. Google Maps Geocoding API (`/api/geocode`)

**Objetivo**: Converter endereços em coordenadas e vice-versa com alta precisão.

**Funcionalidades**:
- Geocodificação direta: Endereço → Coordenadas
- Geocodificação reversa: Coordenadas → Endereço
- Alta precisão usando o serviço oficial de geocodificação do Google
- Suporte ao idioma português para endereços brasileiros

**Uso**:
```javascript
// Geocodificação direta
const response = await fetch('/api/geocode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: 'Av. Paulista, 1000, São Paulo' })
});

// Geocodificação reversa
const response = await fetch('/api/geocode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: '-23.550520, -46.633308' })
});
```

### 2. Google Places Autocomplete API (`/api/places/autocomplete`)

**Objetivo**: Fornecer sugestões inteligentes de endereços enquanto os usuários digitam.

**Funcionalidades**:
- Sugestões de endereços em tempo real
- Foco em endereços brasileiros (country:br)
- Filtragem por tipo de endereço (apenas endereços)
- Formatação estruturada com texto principal e secundário

**Uso**:
```javascript
const response = await fetch('/api/places/autocomplete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: 'Av. Paulista' })
});
```

### 3. Google Places Details API (`/api/places/details`)

**Objetivo**: Obter informações detalhadas sobre um local selecionado.

**Funcionalidades**:
- Extração completa de componentes de endereço
- Coordenadas precisas
- Endereço formatado
- Place ID para referência futura

**Uso**:
```javascript
const response = await fetch('/api/places/details', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ place_id: 'ChIJ0WGkg4FEzpQRrlsz_whLqOsk' })
});
```

### 4. Componente Google Maps Autocomplete

**Localização**: `/src/components/ui/google-maps-autocomplete.tsx`

**Funcionalidades**:
- Busca inteligente com requisições debounced
- Detecção de localização atual com alta precisão
- Interface limpa e intuitiva com estados de carregamento
- Funcionalidade de fechar ao clicar fora
- Design responsivo

**Props**:
```typescript
interface GoogleMapsAutocompleteProps {
  onAddressSelect: (address: PlaceDetails) => void;
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}
```

### 5. Componente de Mapa Interativo

**Localização**: `/src/components/ui/map.tsx`

**Funcionalidades**:
- Carregamento dinâmico de mapa
- Marcadores personalizados para locais
- Funcionalidade de clicar para selecionar
- Dimensionamento responsivo
- Estilização limpa

**Props**:
```typescript
interface MapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
  }>;
  onMapClick?: (position: { lat: number; lng: number }) => void;
  className?: string;
}
```

## Instruções de Configuração

### 1. Configuração do Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative as seguintes APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
4. Crie uma chave de API com restrições apropriadas
5. Adicione seu domínio aos referenciadores permitidos

### 2. Configuração do Ambiente

Atualize seu arquivo `.env.local`:

```bash
# Configuração da API Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_api_aqui
GOOGLE_MAPS_API_KEY=sua_chave_api_aqui
```

### 3. APIs e Cotas Necessárias

Certifique-se de que seu projeto Google Cloud tem estas APIs ativadas:
- **Maps JavaScript API**: Para mapas interativos
- **Places API**: Para autocompletar endereços
- **Geocoding API**: Para conversão de coordenadas

## Melhorias na Experiência do Usuário

### 1. Detecção de Localização Aprimorada

- **GPS de Alta Precisão**: Usa `enableHighAccuracy: true` para localização precisa
- **Timeout Inteligente**: Timeout de 10 segundos sem locais em cache
- **Melhor Tratamento de Erros**: Feedback claro para o usuário sobre problemas de localização
- **Análise Automática de Endereço**: Extrai componentes do endereço a partir de coordenadas

### 2. Entrada Inteligente de Endereço

- **Sugestões de Autocompletar**: Sugestões em tempo real enquanto o usuário digita
- **Botão de Localização Atual**: Detecção de localização com um clique
- **Feedback Visual**: Estados de carregamento e indicadores claros
- **Visualização do Mapa**: Mostra a localização selecionada no mapa interativo

### 3. Integração Perfeita

- **Preenchimento Automático de Formulário**: Endereços selecionados preenchem os campos do formulário
- **Armazenamento de Coordenadas**: Coordenadas precisas salvas com os endereços
- **Cálculo de Taxa de Entrega**: Usa coordenadas precisas para cálculo de distância
- **Fallback de Erro**: Degradação elegante se o Google Maps não estiver disponível

## Detalhes da Implementação Técnica

### Gerenciamento de Estado

O sistema usa estado React para gerenciar:
- `selectedPlace`: Detalhes do Google Place atualmente selecionado
- `showMap`: Se deve mostrar a visualização do mapa
- `deliveryFee`: Taxa de entrega calculada com base nas coordenadas
- `isGettingLocation`: Estado de carregamento para detecção de localização

### Integração de API

Todas as chamadas de API do Google Maps são do lado do servidor para proteger as chaves de API:
- Geocodificação acontece via `/api/geocode`
- Autocompletar de lugares via `/api/places/autocomplete`
- Detalhes do lugar via `/api/places/details`

### Tratamento de Erros

O tratamento abrangente de erros inclui:
- Validação de chave de API
- Tratamento de erros de rede
- Fallbacks graciosos
- Mensagens de erro amigáveis para o usuário

## Benefícios

### Para Usuários

1. **Precisão**: Detecção de localização precisa e correspondência de endereços
2. **Velocidade**: Autocompletar rápido com sugestões inteligentes
3. **Comodidade**: Detecção de localização atual com um clique
4. **Visualização**: Mapa interativo para confirmar a localização
5. **Confiabilidade**: Infraestrutura robusta de mapeamento do Google

### Para o Negócio

1. **Experiência Profissional**: Serviços de localização modernos e alimentados pelo Google
2. **Redução de Erros**: Endereços e coordenadas precisas
3. **Melhor Entrega**: Dados de localização precisos para planejamento de entrega
4. **Escalabilidade**: Infraestrutura de nível empresarial do Google
5. **Confiança**: Os usuários reconhecem e confiam no Google Maps

## Solução de Problemas

### Problemas Comuns

1. **Chave de API Não Funcionando**
   - Verifique se a chave de API está configurada corretamente em `.env.local`
   - Certifique-se de que todas as APIs necessárias estão ativadas
   - Verifique as restrições de domínio no Google Cloud Console

2. **Falha na Detecção de Localização**
   - Verifique as permissões de localização do navegador
   - Certifique-se da conexão HTTPS (necessária para geolocalização)
   - Verifique se o usuário tem serviços de localização ativados

3. **Mapa Não Carregando**
   - Verifique o console do navegador em busca de erros JavaScript
   - Verifique se a Maps JavaScript API está ativada
   - Certifique-se de que a chave de API tem restrições adequadas

### Modo de Depuração

Para habilitar o log de depuração, verifique o console do navegador em busca de:
- Respostas da API Google Maps
- Resultados de geocodificação
- Status da detecção de localização
- Mensagens de erro

## Melhorias Futuras

Melhorias potenciais para versões futuras:

1. **Visualização de Rota**: Mostrar rota de entrega da loja ao cliente
2. **Estimativa de Tempo de Entrega**: Calcular ETA com base na distância e tráfego
3. **Múltiplas Paradas**: Suporte para rotas de entrega complexas
4. **Cerca Geográfica**: Definir áreas de entrega com limites visuais
5. **Suporte Offline**: Cache de mapas e locais para uso offline

## Considerações de Segurança

1. **Proteção de Chave de API**: Chamadas de API do lado do servidor protegem as chaves de exposição
2. **Limitação de Taxa**: Limitação de taxa integrada previne abuso
3. **Restrições de Domínio**: Chaves de API restritas a domínios autorizados
4. **Validação de Entrada**: Todas as entradas do usuário são validadas e sanitizadas
5. **Tratamento de Erros**: Nenhuma informação sensível exposta em mensagens de erro

---

Esta integração fornece um sistema de localização profissional e confiável que aprimora a experiência do usuário e melhora a precisão da entrega.