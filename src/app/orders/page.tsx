'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useOrderSocket } from '@/hooks/use-order-socket';
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard,
  Pizza,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
  price: number;
  customizations?: string;
}

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  deliveryFee: number;
  deliveryType: 'DELIVERY' | 'PICKUP';
  deliveryAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    zipCode: string;
  } | null;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

const statusSteps = [
  { key: 'PENDING', label: 'Pendente', icon: Clock, description: 'Pedido recebido' },
  { key: 'CONFIRMED', label: 'Confirmado', icon: CheckCircle, description: 'Pedido confirmado' },
  { key: 'PREPARING', label: 'Preparando', icon: Pizza, description: 'Preparando seu pedido' },
  { key: 'READY', label: 'Pronto', icon: Package, description: 'Pronto para entrega' },
  { key: 'DELIVERING', label: 'Entregando', icon: Truck, description: 'A caminho' },
  { key: 'DELIVERED', label: 'Entregue', icon: MapPin, description: 'Pedido entregue' },
];

const getStatusProgress = (status: string) => {
  const statusIndex = statusSteps.findIndex(step => step.key === status);
  return ((statusIndex + 1) / statusSteps.length) * 100;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-gray-500';
    case 'CONFIRMED':
      return 'bg-blue-500';
    case 'PREPARING':
      return 'bg-yellow-500';
    case 'READY':
      return 'bg-orange-500';
    case 'DELIVERING':
      return 'bg-purple-500';
    case 'DELIVERED':
      return 'bg-green-500';
    case 'CANCELLED':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Handle real-time order status updates
  const handleStatusUpdate = (update: { orderId: string; status: string; timestamp: string }) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === update.orderId 
          ? { ...order, status: update.status as Order['status'] }
          : order
      )
    );

    if (selectedOrder && selectedOrder.id === update.orderId) {
      setSelectedOrder(prev => 
        prev ? { ...prev, status: update.status as Order['status'] } : null
      );
    }

    toast({
      title: 'Atualização de Status',
      description: `Seu pedido #${update.orderId.slice(-6)} foi atualizado para: ${
        statusSteps.find(step => step.key === update.status)?.label
      }`,
    });
  };

  // Subscribe to socket updates for the selected order
  useOrderSocket(selectedOrder?.id || '', handleStatusUpdate);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        if (data.orders.length > 0) {
          setSelectedOrder(data.orders[0]);
        }
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar seus pedidos',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus pedidos',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
            <p className="text-gray-600 mb-6">Você ainda não fez nenhum pedido.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o cardápio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Pizza className="h-8 w-8 text-red-600 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">7KDelivery</h1>
              </Link>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pedidos</CardTitle>
                <CardDescription>Selecione um pedido para ver os detalhes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                      <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Pedido #{order.id.slice(-6)}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={order.deliveryType === 'DELIVERY' ? 'default' : 'secondary'}>
                            {order.deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada'}
                          </Badge>
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {statusSteps.find(step => step.key === order.status)?.label}
                      </Badge>
                    </div>
                    <p className="font-medium text-lg">
                      {formatCurrency(order.totalAmount + order.deliveryFee)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2">
            {selectedOrder && (
              <div className="space-y-6">
                {/* Status Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status do Pedido</CardTitle>
                    <CardDescription>Acompanhe em tempo real o andamento do seu pedido</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Progress 
                        value={getStatusProgress(selectedOrder.status)} 
                        className="h-2"
                      />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {statusSteps.map((step, index) => {
                          const isActive = statusSteps.findIndex(s => s.key === selectedOrder.status) >= index;
                          const Icon = step.icon;
                          return (
                            <div
                              key={step.key}
                              className={`flex flex-col items-center p-3 rounded-lg border ${
                                isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                              }`}
                            >
                              <Icon className={`h-6 w-6 mb-2 ${
                                isActive ? 'text-green-600' : 'text-gray-400'
                              }`} />
                              <p className={`text-sm font-medium ${
                                isActive ? 'text-green-600' : 'text-gray-500'
                              }`}>
                                {step.label}
                              </p>
                              <p className="text-xs text-gray-500 text-center mt-1">
                                {step.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Itens do Pedido</CardTitle>
                    <CardDescription>Produtos solicitados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                            {item.customizations && (
                              <p className="text-sm text-gray-600 mt-1">
                                Obs: {item.customizations}
                              </p>
                            )}
                          </div>
                          <p className="font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa de entrega:</span>
                          <span>{selectedOrder.deliveryFee === 0 ? 'Grátis' : formatCurrency(selectedOrder.deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-lg">
                          <span>Total:</span>
                          <span>{formatCurrency(selectedOrder.totalAmount + selectedOrder.deliveryFee)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedOrder.deliveryType === 'DELIVERY' && selectedOrder.deliveryAddress && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2" />
                          Endereço de Entrega
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.number}
                          </p>
                          <p className="text-gray-600">
                            {selectedOrder.deliveryAddress.neighborhood}
                          </p>
                          <p className="text-gray-600">
                            {selectedOrder.deliveryAddress.city} - {selectedOrder.deliveryAddress.zipCode}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {selectedOrder.deliveryType === 'PICKUP' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2" />
                          Retirada no Local
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          <p className="font-medium">Venha buscar seu pedido na nossa loja</p>
                          <p className="text-gray-600">Endereço da loja disponível no cardápio</p>
                          <p className="text-green-600 font-medium">Taxa de entrega: Grátis</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="font-medium">{selectedOrder.paymentMethod}</p>
                        <p className="text-sm text-gray-600">
                          Pedido realizado em {formatDate(selectedOrder.createdAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}