"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchInventory, handleAuthDB } from '@/app/actions';

export interface Producto {
  id: number | string;
  name: string;
  price: number | string;
  image_url: string;
  cat: string; 
  sub_cat?: string;
  description?: string;
  on_sale?: boolean;
  stock: number;
  quantity?: number;
  discount_percentage?: number;
  images_extras?: string | string[];
}

interface User {
  email: string;
  id?: number;
}

interface CartContextType {
  cart: Producto[];
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  user: User | null;
  loading: boolean;
  isMaintenance: boolean; 
  setIsMaintenance: (val: boolean) => void;
  addToCart: (producto: Producto) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  login: (email: string) => Promise<void>; 
  logout: () => void;
  refreshProducts: () => Promise<void>;
  updateSingleProductInState: (updatedProd: Producto) => void;
}

// 📌 SOLO 2 PRODUCTOS PERFECTOS (SWITCH EN OFERTA Y PS5 CONSOLA)
const DEFAULT_PRODUCTS: Producto[] = [
  {
    id: "def-nintendo-switch",
    name: "Nintendo Switch OLED - Mario Red Edition",
    price: 349990,
    stock: 5,
    description: "Consola Nintendo Switch Edición Especial Mario Red con pantalla OLED de 7 pulgadas, almacenamiento de 64 GB y base con puerto LAN por cable integrados.",
    cat: "CONSOLAS",
    sub_cat: "NINTENDO",
    on_sale: true,
    discount_percentage: 15,
    image_url: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800",
    images_extras: [
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800"
    ]
  },
  {
    id: "def-ps5-console",
    name: "PlayStation 5 Slim Standard Edition 1TB",
    price: 649990,
    stock: 3,
    description: "Consola PS5 modelo Slim con lector de discos Ultra HD Blu-ray, disco SSD ultrarrápido de 1TB y mando inalámbrico DualSense incluido.",
    cat: "CONSOLAS",
    sub_cat: "SONY",
    on_sale: false,
    discount_percentage: 0,
    image_url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800",
    images_extras: []
  }
];

// Helper para limpiar ítems del carrito evitando objetos pesados/anidados o Base64
const sanitizeCartItem = (producto: Producto, quantity: number = 1): Producto => {
  const basePrice = Number(producto.price) || 0;
  const discount = Number(producto.discount_percentage) || 0;
  
  return {
    id: String(producto.id),
    name: String(producto.name || ''),
    price: basePrice,
    image_url: typeof producto.image_url === 'string' ? producto.image_url : '',
    cat: String(producto.cat || ''),
    sub_cat: producto.sub_cat ? String(producto.sub_cat) : '',
    on_sale: Boolean(producto.on_sale),
    discount_percentage: discount,
    stock: Number(producto.stock) || 0,
    quantity: Math.max(1, quantity)
  };
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Producto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);

  // 1. CARGA INICIAL
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar Usuario
      const userGuardado = localStorage.getItem('user_gamer');
      if (userGuardado) setUser(JSON.parse(userGuardado));

      // Cargar Carrito Persistente de forma segura
      const cartGuardado = localStorage.getItem('cart_gamer');
      if (cartGuardado) {
        const parsed = JSON.parse(cartGuardado);
        if (Array.isArray(parsed)) {
          const cleanCart = parsed.map(item => sanitizeCartItem(item, item.quantity));
          setCart(cleanCart);
        }
      }

      // Cargar Estado de Mantenimiento
      const maintenanceSaved = localStorage.getItem('app_maintenance');
      if (maintenanceSaved) setIsMaintenance(JSON.parse(maintenanceSaved));

      // Cargar Inventario usando la clave v3
      const localInventory = localStorage.getItem('inventory_gamer_v3');
      if (localInventory) {
        const parsed = JSON.parse(localInventory);
        if (Array.isArray(parsed) && parsed.length === 0) {
          setProductos(DEFAULT_PRODUCTS);
          try {
            localStorage.setItem('inventory_gamer_v3', JSON.stringify(DEFAULT_PRODUCTS));
          } catch (err) {
            console.warn("No se pudo guardar DEFAULT_PRODUCTS en localStorage:", err);
          }
        } else {
          setProductos(parsed);
        }
      } else {
        setProductos(DEFAULT_PRODUCTS);
        try {
          localStorage.setItem('inventory_gamer_v3', JSON.stringify(DEFAULT_PRODUCTS));
        } catch (err) {
          console.warn("No se pudo guardar DEFAULT_PRODUCTS en localStorage:", err);
        }
      }

    } catch (error) {
      console.error("Error en carga inicial:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. PERSISTENCIA AUTOMÁTICA DEL CARRITO (SANEADA)
  useEffect(() => {
    if (!loading) {
      try {
        const cleanCart = cart.map(item => sanitizeCartItem(item, item.quantity));
        localStorage.setItem('cart_gamer', JSON.stringify(cleanCart));
      } catch (err) {
        console.warn("No se pudo guardar el carrito en localStorage:", err);
      }
    }
  }, [cart, loading]);

  // Funciones del Carrito Saneadas
  const addToCart = (producto: Producto) => {
    setCart(prev => {
      const existenteIndex = prev.findIndex(
        p => String(p.id) === String(producto.id)
      );

      if (existenteIndex !== -1) {
        return prev.map((p, idx) => {
          if (idx === existenteIndex) {
            const currentQty = Number(p.quantity) || 1;
            return sanitizeCartItem(p, currentQty + 1);
          }
          return p;
        });
      }

      return [...prev, sanitizeCartItem(producto, 1)];
    });
  };

  const removeFromCart = (indexToRemove: number) => {
    setCart(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart_gamer');
  };

  // Autenticación
  const login = async (email: string) => {
    try {
      const res = await handleAuthDB(email, true); 
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('user_gamer', JSON.stringify(res.user));
      }
    } catch (error) {
      console.error("Error login:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_gamer');
  };

  // Sincronizar cambios individuales
  const updateSingleProductInState = (updatedProd: Producto) => {
    setProductos(prev => {
      let nextState: Producto[];
      const existe = prev.some(p => String(p.id) === String(updatedProd.id));
      if (existe) {
        nextState = prev.map(p => String(p.id) === String(updatedProd.id) ? updatedProd : p);
      } else {
        nextState = [...prev, updatedProd];
      }

      try {
        localStorage.setItem('inventory_gamer_v3', JSON.stringify(nextState));
      } catch (error) {
        console.warn('⚠️ Exceso de capacidad en localStorage. Guardando versión optimizada...');
        try {
          const lightState = nextState.map(({ images_extras, description, ...rest }) => rest);
          localStorage.setItem('inventory_gamer_v3', JSON.stringify(lightState));
        } catch (innerError) {
          console.error('❌ No se pudo sincronizar el localStorage (memoria llena):', innerError);
        }
      }

      return nextState;
    });
  };

  // Recargar productos
  const refreshProducts = async () => {
    const localInventory = localStorage.getItem('inventory_gamer_v3');
    if (localInventory) {
      setProductos(JSON.parse(localInventory));
    } else {
      setProductos(DEFAULT_PRODUCTS);
      try {
        localStorage.setItem('inventory_gamer_v3', JSON.stringify(DEFAULT_PRODUCTS));
      } catch (err) {
        console.warn("No se pudo guardar DEFAULT_PRODUCTS en localStorage:", err);
      }
    }
  };

  // Sincronizar estado de mantenimiento
  const updateMaintenance = (val: boolean) => {
    setIsMaintenance(val);
    try {
      localStorage.setItem('app_maintenance', JSON.stringify(val));
    } catch (err) {
      console.warn("No se pudo guardar app_maintenance en localStorage:", err);
    }
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      productos, 
      setProductos,
      user, 
      loading, 
      isMaintenance, 
      setIsMaintenance: updateMaintenance,
      addToCart, 
      removeFromCart, 
      clearCart, 
      login, 
      logout, 
      refreshProducts,
      updateSingleProductInState
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useGlobal debe usarse dentro de un CartProvider");
  return context;
};