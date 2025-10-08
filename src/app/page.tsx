'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Pizza, ShoppingCart, User, MapPin, Clock, Phone, Navigation, Search, Loader2, Menu } from 'lucide-react';
import GoogleMapsAutocomplete from '@/components/ui/google-maps-autocomplete';
import Map from '@/components/ui/map';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  customizations?: string;
}

interface Address {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  zipCode: string;
  lat: number;
  lng: number;
}

interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface User {
  id: string;
  name: string;
  whatsappNumber: string;
  addresses: Address[];
}

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [loginForm, setLoginForm] = useState({ name: '', whatsappNumber: '' });
  const [newAddress, setNewAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    zipCode: ''
  });
  
  // Location and delivery fee states
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [showMap, setShowMap] = useState(false);
  
  const { toast } = useToast();

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
            const data = await response.json();
            setProducts(data.products || []);
        } else {
            toast({
              title: 'Erro',
              description: 'Não foi possível carregar o cardápio',
              variant: 'destructive'
            });
            setProducts([]); // Define como array vazio em caso de erro
        }
      } catch (error) {
        setProducts([]); // Define como array vazio em caso de erro de rede
        toast({
          title: 'Erro de Rede',
          description: 'Não foi possível conectar ao servidor para carregar o cardápio.',
          variant: 'destructive'
        });
      }
    };

    loadProducts();
  }, [toast]);

  // Auto-calculate delivery fee when checkout opens and address is selected
  useEffect(() => {
    const autoCalculateDelivery = async () => {
      if (isCheckoutOpen && selectedAddress && user && deliveryFee === null && !isCalculatingDelivery) {
        const address = user.addresses.find(addr => addr.id === selectedAddress);
        if (address) {
          await calculateDeliveryFee(address);
        }
      }
    };

    autoCalculateDelivery();
  }, [isCheckoutOpen, selectedAddress, user, deliveryFee, isCalculatingDelivery]);

  // Auto-select first address when user logs in or when checkout opens
  useEffect(() => {
    const autoSelectAddress = async () => {
      if (user && user.addresses.length > 0 && !selectedAddress) {
        const firstAddress = user.addresses[0];
        setSelectedAddress(firstAddress.id);
        
        if (isCheckoutOpen && deliveryFee === null && !isCalculatingDelivery) {
          await calculateDeliveryFee(firstAddress);
        }
      }
    };

    autoSelectAddress();
  }, [user, isCheckoutOpen, selectedAddress, deliveryFee, isCalculatingDelivery]);

  // Reset delivery fee and type when checkout closes
  useEffect(() => {
    if (!isCheckoutOpen) {
      setDeliveryFee(null);
      setDeliveryType('DELIVERY');
    }
  }, [isCheckoutOpen]);

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsLoginModalOpen(false);
        setLoginForm({ name: '', whatsappNumber: '' });
        toast({
          title: 'Sucesso',
          description: 'Login realizado com sucesso!'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.error || 'Falha no login',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha no login',
        variant: 'destructive'
      });
    }
  };

  const handleAddAddress = async () => {
    try {
      let addressWithCoords = { ...newAddress, lat: 0, lng: 0 };
      
      if (selectedPlace && selectedPlace.coordinates) {
        addressWithCoords.lat = selectedPlace.coordinates.lat;
        addressWithCoords.lng = selectedPlace.coordinates.lng;
      } else {
        try {
          const response = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              address: `${newAddress.street}, ${newAddress.number}, ${newAddress.neighborhood}, ${newAddress.city}` 
            })
          });

          if (response.ok) {
            const data = await response.json();
            addressWithCoords.lat = data.coordinates.lat;
            addressWithCoords.lng = data.coordinates.lng;
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }

      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressWithCoords)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = user ? {
          ...user,
          addresses: [...user.addresses, data.address]
        } : null;
        setUser(updatedUser);
        
        setSelectedAddress(data.address.id);
        await calculateDeliveryFee(data.address);
        
        setNewAddress({
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          zipCode: ''
        });
        setSelectedPlace(null);
        setShowMap(false);
        setIsAddAddressOpen(false);
        
        toast({
          title: 'Sucesso',
          description: 'Endereço adicionado e selecionado com sucesso!'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.error || 'Falha ao adicionar endereço',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar endereço',
        variant: 'destructive'
      });
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId: product.id, product, quantity: 1 }];
    });
    toast({
      title: 'Adicionado',
      description: `${product.name} adicionado ao carrinho`
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Erro',
        description: 'Geolocalização não é suportada pelo seu navegador',
        variant: 'destructive'
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              address: `${latitude}, ${longitude}` 
            })
          });

          if (response.ok) {
            const data = await response.json();
            
            const placeDetails: PlaceDetails = {
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
            
            setSelectedPlace(placeDetails);
            
            if (data.addressComponents) {
              const getComponent = (type: string) => {
                const component = data.addressComponents.find((comp: any) => comp.types.includes(type));
                return component ? component.long_name : '';
              };
              
              setNewAddress({
                street: getComponent('route') || '',
                number: getComponent('street_number') || '',
                neighborhood: getComponent('sublocality') || getComponent('administrative_area_level_2') || '',
                city: getComponent('administrative_area_level_2') || getComponent('locality') || '',
                zipCode: getComponent('postal_code') || ''
              });
            }
            
            toast({
              title: 'Localização obtida',
              description: 'Endereço detectado automaticamente com alta precisão'
            });
          }
        } catch (error) {
          toast({
            title: 'Erro',
            description: 'Não foi possível obter o endereço da sua localização',
            variant: 'destructive'
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        toast({
          title: 'Erro',
          description: 'Não foi possível obter sua localização',
          variant: 'destructive'
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleAddressSelect = async (placeDetails: PlaceDetails) => {
    setSelectedPlace(placeDetails);
    
    setNewAddress({
      street: placeDetails.address.street,
      number: placeDetails.address.number,
      neighborhood: placeDetails.address.neighborhood,
      city: placeDetails.address.city,
      zipCode: placeDetails.address.zipCode
    });
    
    if (placeDetails.coordinates) {
      setShowMap(true);
    }
  };

  const calculateDeliveryFee = async (addressData: any) => {
    let coordinates = addressData.coordinates || null;
    
    if (selectedPlace && selectedPlace.coordinates) {
      coordinates = selectedPlace.coordinates;
    }
    
    if (!coordinates) {
      if (!addressData.lat || !addressData.lng) {
        try {
          const response = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              address: `${addressData.street}, ${addressData.number}, ${addressData.neighborhood}, ${addressData.city}` 
            })
          });

          if (response.ok) {
            const data = await response.json();
            coordinates = data.coordinates;
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      } else {
        coordinates = {
          lat: addressData.lat,
          lng: addressData.lng
        };
      }
    }

    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      toast({
        title: 'Erro',
        description: 'Não foi possível determinar as coordenadas do endereço',
        variant: 'destructive'
      });
      return;
    }

    setIsCalculatingDelivery(true);
    try {
      const response = await fetch('/api/delivery/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deliveryAddress: {
            ...addressData,
            lat: coordinates.lat,
            lng: coordinates.lng
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveryFee(data.deliveryFee);
        toast({
          title: 'Frete calculado',
          description: `${data.calculationMethod} - R$ ${data.deliveryFee.toFixed(2)}`
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Erro no cálculo do frete',
          description: error.error || 'Não foi possível calcular o valor do frete',
          variant: 'destructive'
        });
        setDeliveryFee(null);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível calcular o valor do frete',
        variant: 'destructive'
      });
      setDeliveryFee(null);
    } finally {
      setIsCalculatingDelivery(false);
    }
  };

  const handleAddressChange = async (addressId: string) => {
    setSelectedAddress(addressId);
    
    if (user && addressId) {
      const address = user.addresses.find(addr => addr.id === addressId);
      if (address) {
        await calculateDeliveryFee(address);
      }
    } else {
      setDeliveryFee(null);
    }
  };

  const handleRemoveAddress = async (addressId: string) => {
    if (!user) return;

    const address = user.addresses.find(addr => addr.id === addressId);
    if (!address) return;

    if (confirm(`Tem certeza de que deseja remover o endereço:\n${address.street}, ${address.number} - ${address.neighborhood}?`)) {
      try {
        const response = await fetch(`/api/addresses/${addressId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          const updatedUser = {
            ...user,
            addresses: user.addresses.filter(addr => addr.id !== addressId)
          };
          setUser(updatedUser);

          if (selectedAddress === addressId) {
            setSelectedAddress('');
            setDeliveryFee(null);
          }

          toast({
            title: 'Endereço removido',
            description: 'Endereço removido com sucesso'
          });
        } else {
          const error = await response.json();
          toast({
            title: 'Erro',
            description: error.error || 'Não foi possível remover o endereço',
            variant: 'destructive'
          });
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível remover o endereço',
          variant: 'destructive'
        });
      }
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (cart.length === 0) {
      toast({ title: 'Erro', description: 'Seu carrinho está vazio', variant: 'destructive' });
      return;
    }

    if (deliveryType === 'DELIVERY' && !selectedAddress) {
      toast({ title: 'Endereço necessário', description: 'Por favor, adicione e selecione um endereço de entrega', variant: 'destructive' });
      return;
    }

    if (!paymentMethod) {
      toast({ title: 'Forma de pagamento', description: 'Selecione uma forma de pagamento', variant: 'destructive' });
      return;
    }

    try {
      let deliveryAddress: Address | null = null;
      let calculatedDeliveryFee = 0;

      if (deliveryType === 'DELIVERY') {
        const address = user.addresses.find(addr => addr.id === selectedAddress);
        if (!address) return;
        
        deliveryAddress = address;
        calculatedDeliveryFee = deliveryFee || 0;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            customizations: item.customizations
          })),
          deliveryType,
          deliveryAddress,
          paymentMethod
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCart([]);
        setSelectedAddress('');
        setPaymentMethod('');
        setDeliveryType('DELIVERY');
        setIsCheckoutOpen(false);
        toast({
          title: 'Pedido realizado',
          description: `Seu pedido #${data.order.id} foi realizado com sucesso!`
        });
        setTimeout(() => {
          router.push('/orders');
        }, 1500);
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.error || 'Não foi possível realizar o pedido',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar o pedido',
        variant: 'destructive'
      });
    }
  };
  
  const groupedProducts = (products || []).reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Pizza className="h-8 w-8 text-red-600 mr-2" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">7KDelivery</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/orders')}
                  >
                    Meus Pedidos
                  </Button>
                  <span className="text-sm text-gray-700">Olá, {user.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUser(null);
                      document.cookie = 'customer-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }}
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      Entrar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Entrar ou Cadastrar</DialogTitle>
                      <DialogDescription>
                        Digite seu nome e número de WhatsApp para acessar sua conta
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Seu Nome Completo</Label>
                        <Input
                          id="name"
                          value={loginForm.name}
                          onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                          placeholder="João Silva"
                        />
                      </div>
                      <div>
                        <Label htmlFor="whatsapp">Seu Número de WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={loginForm.whatsappNumber}
                          onChange={(e) => setLoginForm({ ...loginForm, whatsappNumber: e.target.value })}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <Button onClick={handleLogin} className="w-full h-11">
                        Entrar ou Cadastrar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="relative h-11 w-11 md:h-auto md:w-auto p-2 md:p-2">
                    <ShoppingCart className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">Carrinho</span>
                    {cart.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                        {cart.reduce((total, item) => total + item.quantity, 0)}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Seu Carrinho</DialogTitle>
                  </DialogHeader>
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-500">Seu carrinho está vazio</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                            <p className="text-sm text-gray-500">
                              R$ {item.product.price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span>{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-4">
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>R$ {getTotalAmount().toFixed(2)}</span>
                        </div>
                        <Button onClick={() => setIsCheckoutOpen(true)} className="w-full mt-4 h-11">
                          Finalizar Pedido
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center">
              <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-11 w-11">
                    <ShoppingCart className="h-6 w-6" />
                    {cart.length > 0 && (
                      <Badge className="absolute top-1 right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                        {cart.reduce((total, item) => total + item.quantity, 0)}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Seu Carrinho</DialogTitle>
                  </DialogHeader>
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-500">Seu carrinho está vazio</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                            <p className="text-sm text-gray-500">
                              R$ {item.product.price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span>{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                               className="h-9 w-9"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-4">
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>R$ {getTotalAmount().toFixed(2)}</span>
                        </div>
                        <Button onClick={() => setIsCheckoutOpen(true)} className="w-full mt-4 h-11">
                          Finalizar Pedido
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle className="sr-only">Menu</SheetTitle>
                        <SheetDescription className="sr-only">Opções de navegação e usuário</SheetDescription>
                    </SheetHeader>
                  <div className="flex flex-col space-y-4 pt-8">
                    {user ? (
                      <>
                        <span className="text-lg font-medium text-center">Olá, {user.name}</span>
                        <Button
                          variant="outline"
                          onClick={() => router.push('/orders')}
                          className="h-11"
                        >
                          Meus Pedidos
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUser(null);
                            document.cookie = 'customer-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                          }}
                          className="h-11"
                        >
                          Sair
                        </Button>
                      </>
                    ) : (
                       <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="h-11">
                            <User className="h-4 w-4 mr-2" />
                            Entrar ou Cadastrar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Entrar ou Cadastrar</DialogTitle>
                            <DialogDescription>
                              Digite seu nome e número de WhatsApp para acessar sua conta
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="name-mobile">Seu Nome Completo</Label>
                              <Input
                                id="name-mobile"
                                value={loginForm.name}
                                onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                                placeholder="João Silva"
                              />
                            </div>
                            <div>
                              <Label htmlFor="whatsapp-mobile">Seu Número de WhatsApp</Label>
                              <Input
                                id="whatsapp-mobile"
                                value={loginForm.whatsappNumber}
                                onChange={(e) => setLoginForm({ ...loginForm, whatsappNumber: e.target.value })}
                                placeholder="(11) 99999-9999"
                              />
                            </div>
                            <Button onClick={handleLogin} className="w-full h-11">
                              Entrar ou Cadastrar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-6 md:p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Bem-vindo à 7KDelivery</h2>
            <p className="text-lg md:text-xl mb-6">As melhores pizzas da cidade, na sua porta</p>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-8 text-sm">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span>Entrega rápida</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                <span>Ampla área de entrega</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                <span>Atendimento 24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-4">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    )}
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span>{product.name}</span>
                        <Badge variant="secondary">
                          R$ {product.price.toFixed(2)}
                        </Badge>
                      </CardTitle>
                      {product.description && (
                        <CardDescription>{product.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => addToCart(product)}
                        className="w-full h-11"
                        disabled={!product.available}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.available ? 'Adicionar ao Carrinho' : 'Indisponível'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Finalizar Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Tipo de Retirada</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Button
                  variant={deliveryType === 'DELIVERY' ? 'default' : 'outline'}
                  onClick={() => setDeliveryType('DELIVERY')}
                  className="flex flex-col items-center space-y-2 h-auto py-4"
                >
                  <Navigation className="h-6 w-6" />
                  <span className="font-medium">Entregar</span>
                  <span className="text-xs text-gray-500">Receber no endereço</span>
                </Button>
                <Button
                  variant={deliveryType === 'PICKUP' ? 'default' : 'outline'}
                  onClick={() => setDeliveryType('PICKUP')}
                  className="flex flex-col items-center space-y-2 h-auto py-4"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span className="font-medium">Retirar</span>
                  <span className="text-xs text-gray-500">Buscar no local</span>
                </Button>
              </div>
            </div>

            {deliveryType === 'DELIVERY' && (
              <div>
                <Label>Endereço de Entrega</Label>
              <div className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {user?.addresses.map((address) => (
                    <div key={address.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3 flex-1">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {address.street}, {address.number}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {address.neighborhood} - {address.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={selectedAddress === address.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAddressChange(address.id)}
                          className="text-xs h-9"
                        >
                          {selectedAddress === address.id ? "Selecionado" : "Selecionar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAddress(address.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-9 w-9"
                          title="Remover endereço"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {(!user?.addresses || user.addresses.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Você ainda não possui endereços cadastrados
                  </p>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddAddressOpen(true)}
                  className="w-full h-11"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Adicionar Novo Endereço
                </Button>
              </div>
            </div>
            )}

            {deliveryType === 'PICKUP' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Retirada no Local</p>
                    <p className="text-sm text-green-700">
                      Venha buscar seu pedido na nossa loja. Taxa de entrega gratuita!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {deliveryType === 'DELIVERY' && (
              <>
                {isCalculatingDelivery && (
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="text-sm">Calculando frete...</span>
                  </div>
                )}

                {deliveryFee !== null && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">Valor do Frete</p>
                        <p className="text-sm text-blue-700">Calculado automaticamente</p>
                      </div>
                      <p className="text-lg font-bold text-blue-900">
                        R$ {deliveryFee.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {deliveryType === 'PICKUP' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">Taxa de Entrega</p>
                    <p className="text-sm text-green-700">Grátis para retirada no local</p>
                  </div>
                  <p className="text-lg font-bold text-green-900">
                    R$ 0,00
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {getTotalAmount().toFixed(2)}</span>
              </div>
              {deliveryType === 'DELIVERY' && deliveryFee !== null && (
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {deliveryType === 'PICKUP' && (
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span className="text-green-600">Grátis</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg border-t pt-2">
                <span>Total:</span>
                <span>
                  R$ {deliveryType === 'DELIVERY' && deliveryFee !== null 
                    ? (getTotalAmount() + deliveryFee).toFixed(2) 
                    : getTotalAmount().toFixed(2)
                  }
                </span>
              </div>
              <Button 
                onClick={handleCheckout} 
                className="w-full mt-4 h-11"
                disabled={
                  (deliveryType === 'DELIVERY' && (isCalculatingDelivery || deliveryFee === null || !selectedAddress)) ||
                  (deliveryType === 'PICKUP' && !paymentMethod)
                }
              >
                {isCalculatingDelivery ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  'Confirmar Pedido'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddAddressOpen} onOpenChange={(open) => {
        setIsAddAddressOpen(open);
        if (!open) {
          setSelectedPlace(null);
          setShowMap(false);
          setNewAddress({
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            zipCode: ''
          });
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Endereço</DialogTitle>
            <DialogDescription>
              Cadastre um novo endereço para entrega com busca inteligente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Buscar Endereço</Label>
              <GoogleMapsAutocomplete
                onAddressSelect={handleAddressSelect}
                onLocationSelect={(coordinates) => {
                  if (coordinates) {
                    setShowMap(true);
                  }
                }}
                placeholder="Digite o endereço ou clique no ícone de localização"
                className="mt-1"
              />
            </div>

            {showMap && selectedPlace && selectedPlace.coordinates && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Localização no Mapa
                </Label>
                <Map
                  center={selectedPlace.coordinates}
                  markers={[
                    {
                      position: selectedPlace.coordinates,
                      title: selectedPlace.formatted_address
                    }
                  ]}
                  className="w-full h-64"
                />
              </div>
            )}

            {selectedPlace && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900">Endereço Selecionado</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedPlace.formatted_address}
                    </p>
                    {selectedPlace.coordinates && (
                      <p className="text-xs text-blue-600 mt-1">
                        Coordenadas: {selectedPlace.coordinates.lat.toFixed(6)}, {selectedPlace.coordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Detalhes do Endereço</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    placeholder="Rua das Flores"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    value={newAddress.number}
                    onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                    placeholder="123"
                    required
                  />
                </div>
              <div>
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={newAddress.neighborhood}
                  onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                  placeholder="Centro"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  placeholder="São Paulo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={newAddress.zipCode}
                  onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                  placeholder="01234-567"
                />
              </div>
            </div>
            </div>

            <Button 
              onClick={handleAddAddress} 
              className="w-full h-11"
              disabled={!newAddress.street || !newAddress.number || !newAddress.neighborhood || !newAddress.city}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Adicionar Endereço
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}