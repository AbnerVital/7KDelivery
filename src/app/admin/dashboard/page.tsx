'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Pizza, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  Settings,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Navigation,
  Loader2,
  Search
} from 'lucide-react';
import GoogleMapsAutocomplete from '@/components/ui/google-maps-autocomplete';
import Map from '@/components/ui/map';

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    whatsappNumber: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
    };
  }>;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  createdAt: string;
}

interface Settings {
  id: string;
  minimumOrder: number;
  workingHours: any;
  whatsappNumber: string;
  phone?: string;
  email?: string;
  // Store location for delivery calculations
  storeAddress?: string;
  storeLat?: number;
  storeLng?: number;
  // Delivery fee calculation - simplified to per KM only
  deliveryFeePerKm: number;
  minimumDeliveryFee?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    todayOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: ''
  });
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  
  // Location states for store address
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [storeAddressSearch, setStoreAddressSearch] = useState('');
  const [storeAddressSuggestions, setStoreAddressSuggestions] = useState<any[]>([]);
  const [selectedStorePlace, setSelectedStorePlace] = useState<any>(null);
  const [showStoreMap, setShowStoreMap] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/admin/me');
      if (!response.ok) {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const loadData = async () => {
    try {
      const [ordersRes, productsRes, settingsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/settings')
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders);
        calculateStats(ordersData.orders);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (ordersData: Order[]) => {
    const today = new Date().toDateString();
    const todayOrders = ordersData.filter(order => 
      new Date(order.createdAt).toDateString() === today
    );
    
    const pendingOrders = ordersData.filter(order => 
      ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)
    );

    const totalRevenue = ordersData.reduce((sum, order) => sum + order.totalAmount, 0);

    setStats({
      totalOrders: ordersData.length,
      pendingOrders: pendingOrders.length,
      totalRevenue,
      todayOrders: todayOrders.length
    });
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const addProduct = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price)
        })
      });

      if (response.ok) {
        setNewProduct({
          name: '',
          description: '',
          price: '',
          category: '',
          imageUrl: ''
        });
        setIsAddProductOpen(false);
        loadData();
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Function to get current location for store address
  const getStoreLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get address from coordinates
          const response = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              address: `${latitude}, ${longitude}` 
            })
          });

          if (response.ok) {
            const data = await response.json();
            
            // Create a place details object
            const placeDetails = {
              place_id: 'current_location',
              formatted_address: data.address,
              address: {
                street: '',
                number: '',
                neighborhood: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
              },
              coordinates: { lat: latitude, lng: longitude }
            };
            
            setSelectedStorePlace(placeDetails);
            setStoreAddressSearch(data.address);
            
            // Update settings with new address and coordinates
            if (settings) {
              setSettings({
                ...settings,
                storeAddress: data.address,
                storeLat: latitude,
                storeLng: longitude
              });
            }
            
            setShowStoreMap(true);
            alert('Localização obtida com sucesso! Endereço e coordenadas atualizados.');
          }
        } catch (error) {
          alert('Não foi possível obter o endereço da sua localização');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        alert('Não foi possível obter sua localização');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Function to search for store address suggestions
  const searchStoreAddress = async (query: string) => {
    if (!query.trim()) {
      setStoreAddressSuggestions([]);
      return;
    }

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: query })
      });

      if (response.ok) {
        const data = await response.json();
        setStoreAddressSuggestions([data]); // For now, just return the single result
      }
    } catch (error) {
      console.error('Address search error:', error);
    }
  };

  // Function to handle store address selection
  const handleStoreAddressSelect = (placeDetails: any) => {
    setSelectedStorePlace(placeDetails);
    setStoreAddressSearch(placeDetails.formatted_address);
    setStoreAddressSuggestions([]);
    setShowStoreMap(true);
    
    if (settings) {
      setSettings({
        ...settings,
        storeAddress: placeDetails.formatted_address,
        storeLat: placeDetails.coordinates?.lat,
        storeLng: placeDetails.coordinates?.lng
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PREPARING': return 'bg-orange-100 text-orange-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'DELIVERING': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />;
      case 'PREPARING': return <Pizza className="h-4 w-4" />;
      case 'READY': return <CheckCircle className="h-4 w-4" />;
      case 'DELIVERING': return <TrendingUp className="h-4 w-4" />;
      case 'DELIVERED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleLogout = () => {
    document.cookie = 'admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Pizza className="h-8 w-8 text-red-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Todos os pedidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando ação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total de vendas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayOrders}</div>
              <p className="text-xs text-muted-foreground">
                Hoje
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Cardápio</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Pedidos</CardTitle>
                <CardDescription>
                  Acompanhe e gerencie todos os pedidos em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.user.name}</div>
                            <div className="text-sm text-gray-500">
                              {order.user.whatsappNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {order.items.map((item, index) => (
                              <div key={item.id}>
                                {item.quantity}x {item.product.name}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          R$ {order.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span>{order.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pendente</SelectItem>
                              <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                              <SelectItem value="PREPARING">Preparando</SelectItem>
                              <SelectItem value="READY">Pronto</SelectItem>
                              <SelectItem value="DELIVERING">Entregando</SelectItem>
                              <SelectItem value="DELIVERED">Entregue</SelectItem>
                              <SelectItem value="CANCELLED">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Gerenciamento de Cardápio</CardTitle>
                    <CardDescription>
                      Adicione, edite e remova produtos do cardápio
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddProductOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-500">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="font-medium">
                          R$ {product.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.available ? "default" : "secondary"}>
                            {product.available ? "Disponível" : "Indisponível"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Add Product Dialog */}
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Produto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Pizza de Calabresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Deliciosa pizza com calabresa, cebola e queijo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Preço</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="29.90"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="Pizzas Salgadas"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imageUrl">URL da Imagem (opcional)</Label>
                    <Input
                      id="imageUrl"
                      value={newProduct.imageUrl}
                      onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                  <Button onClick={addProduct} className="w-full">
                    Adicionar Produto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Loja</CardTitle>
                <CardDescription>
                  Configure taxas de entrega, endereço da loja e regras de cálculo de frete
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settings && (
                  <div className="space-y-6">
                    {/* Basic Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <Settings className="h-5 w-5 mr-2" />
                        Configurações Básicas
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="minimumOrder">Pedido Mínimo (R$)</Label>
                          <Input
                            id="minimumOrder"
                            type="number"
                            step="0.01"
                            value={settings.minimumOrder}
                            onChange={(e) => setSettings({ ...settings, minimumOrder: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="whatsappNumber">WhatsApp</Label>
                          <Input
                            id="whatsappNumber"
                            value={settings.whatsappNumber}
                            onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Store Address */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Endereço da Loja
                      </h3>
                      
                      {/* Google Maps Autocomplete */}
                      <div>
                        <Label>Buscar Endereço da Loja</Label>
                        <GoogleMapsAutocomplete
                          onAddressSelect={handleStoreAddressSelect}
                          onLocationSelect={(coordinates) => {
                            if (coordinates) {
                              setShowStoreMap(true);
                            }
                          }}
                          placeholder="Digite o endereço da loja ou clique no ícone de localização"
                          className="mt-1"
                        />
                      </div>

                      {/* Map Visualization */}
                      {showStoreMap && selectedStorePlace && selectedStorePlace.coordinates && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Localização da Loja no Mapa
                          </Label>
                          <Map
                            center={selectedStorePlace.coordinates}
                            markers={[
                              {
                                position: selectedStorePlace.coordinates,
                                title: selectedStorePlace.formatted_address
                              }
                            ]}
                            className="w-full h-64"
                          />
                        </div>
                      )}

                      {/* Selected Address Display */}
                      {selectedStorePlace && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-blue-900">Endereço da Loja Selecionado</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                {selectedStorePlace.formatted_address}
                              </p>
                              {selectedStorePlace.coordinates && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Coordenadas: {selectedStorePlace.coordinates.lat.toFixed(6)}, {selectedStorePlace.coordinates.lng.toFixed(6)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Location Status */}
                      {(settings.storeLat && settings.storeLng) && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <MapPin className="h-5 w-5 text-green-600 mr-2" />
                            <div>
                              <p className="font-medium text-green-900">Localização da loja configurada</p>
                              <p className="text-sm text-green-700">
                                Coordenadas: {settings.storeLat.toFixed(6)}, {settings.storeLng.toFixed(6)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delivery Rules */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Cálculo de Taxa de Entrega por Distância (KM)
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-blue-900">Cálculo Automático por Quilômetro</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              A taxa de entrega será calculada automaticamente com base na distância entre a loja e o endereço de entrega do cliente.
                            </p>
                            <p className="text-xs text-blue-600 mt-2">
                              Fórmula: Taxa de Entrega = (Distância em KM) × (Valor por KM)
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="deliveryFeePerKm">Valor por Quilômetro (R$)</Label>
                          <Input
                            id="deliveryFeePerKm"
                            type="number"
                            step="0.01"
                            value={settings.deliveryFeePerKm}
                            onChange={(e) => setSettings({ ...settings, deliveryFeePerKm: parseFloat(e.target.value) })}
                            placeholder="5.00"
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            Ex: R$ 5,00 por KM
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="minimumDeliveryFee">Taxa Mínima de Entrega (R$)</Label>
                          <Input
                            id="minimumDeliveryFee"
                            type="number"
                            step="0.01"
                            value={settings.minimumDeliveryFee || 0}
                            onChange={(e) => setSettings({ ...settings, minimumDeliveryFee: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            Valor mínimo cobrado mesmo para distâncias curtas
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Informações de Contato</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={settings.phone || ''}
                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={settings.email || ''}
                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={() => {
                      fetch('/api/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(settings)
                      }).then(() => {
                        alert('Configurações salvas com sucesso!');
                      });
                    }}>
                      Salvar Configurações
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}