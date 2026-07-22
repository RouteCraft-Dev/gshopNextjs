"use client";

import { useGlobal } from '@/context/CartContext';
import { processStockUpdate, registrarVenta } from '@/app/actions';
import Link from 'next/link';
import { useState } from 'react';
import './cart.css'; 

export default function CartPage() {
  const globalContext = useGlobal() as any;
  const { cart, user, removeFromCart, clearCart, refreshProducts, setProductos } = globalContext;
  
  const [deliveryMethod, setDeliveryMethod] = useState<'sucursal' | 'domicilio'>('sucursal');
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const cartItems = Array.isArray(cart) ? cart : [];

  const calcularPrecioItem = (item: any) => {
    const precioBase = Number(item.price) || 0;
    if (item.on_sale === true && Number(item.discount_percentage) > 0) {
      return precioBase * (1 - Number(item.discount_percentage) / 100);
    }
    return precioBase;
  };

  const total = cartItems.reduce((acc, item: any) => acc + (calcularPrecioItem(item) * (item.quantity || 1)), 0);
  const formatCurrency = (val: number) => 
    val.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const ejecutarCompra = async (metodo: string) => {
    if (isProcessing || cartItems.length === 0) return;

    setIsProcessing(true);

    try {
      // 1. LLAMADA PREVENTIVA AL SERVIDOR (Para stock si no es WhatsApp)
      if (metodo !== "WhatsApp") {
        const stockRes = await processStockUpdate(cartItems);
        if (stockRes.success === false) {
          throw new Error("Error actualizando stock en el servidor simulado.");
        }
      }

      // 2. REGISTRAR EN EL SERVIDOR
      const ventaRes = await registrarVenta({
        productos: cartItems,
        total: total,
        metodo: metodo,
        cliente_email: user?.email || "Invitado", 
      });

      if (ventaRes.success === false) {
        alert("No se pudo registrar el pedido en el servidor.");
        return;
      }

      // 3. GUARDAR EL LOG DE VENTAS EN LOCALSTORAGE (Optimizado y liviano)
      const productosOptimizados = cartItems.map((item: any) => ({
        id: String(item.id),
        name: String(item.name || ''),
        price: calcularPrecioItem(item),
        quantity: Number(item.quantity) || 1
      }));

      const nuevaVenta = {
        fecha: new Date().toISOString(),
        cliente_email: user?.email || "Invitado",
        productos: productosOptimizados,
        total: total,
        metodo_pago: metodo
      };

      try {
        const ventasGuardadas = JSON.parse(
          localStorage.getItem("gshop_ventas") || "[]"
        );
        
        // Mantener solo las últimas 20 ventas para no agotar la cuota de localStorage
        const ventasActualizadas = [nuevaVenta, ...ventasGuardadas].slice(0, 20);
        localStorage.setItem("gshop_ventas", JSON.stringify(ventasActualizadas));
      } catch (storageErr) {
        console.warn("⚠️ No se pudo guardar la venta en localStorage por cuota excedida:", storageErr);
        // Resguardo: guardar solo la venta actual si falló el historial
        try {
          localStorage.setItem("gshop_ventas", JSON.stringify([nuevaVenta]));
        } catch (e) {
          console.error("Error crítico de almacenamiento:", e);
        }
      }

      // 4. ACTUALIZAR INVENTARIO
      if (typeof setProductos === "function") {
        setProductos((prevProductos: any[]) => {
          const stockActualizado = prevProductos.map((p: any) => {
            const itemEnCarrito = cartItems.find(
              (item: any) => String(item.id) === String(p.id)
            );

            if (!itemEnCarrito) return p;

            return {
              ...p,
              stock: Math.max(
                0,
                Number(p.stock) - Number(itemEnCarrito.quantity || 1)
              )
            };
          });

          try {
            localStorage.setItem(
              "inventory_gamer_v3",
              JSON.stringify(stockActualizado)
            );
          } catch (e) {
            console.warn("No se pudo persistir inventario actualizado en localStorage:", e);
          }

          return stockActualizado;
        });
      }

      // 5. ACCIÓN FINAL SEGÚN EL MÉTODO DE PAGO
      if (metodo === "WhatsApp") {
        const phoneNumber = "5491100000000"; // Cambiar por número real
        let message = `🎮 *NUEVO PEDIDO*%0A%0A`;

        cartItems.forEach((item: any) => {
          const pFinal = calcularPrecioItem(item);
          message += `- ${item.name} (x${item.quantity || 1}) - ${formatCurrency(pFinal)}%0A`;
        });

        message += `%0A*TOTAL FINAL:* ${formatCurrency(total)}%0A*ENTREGA:* ${
          deliveryMethod === "sucursal" ? "Retiro en Local" : address
        }`;

        window.open(
          `https://wa.me/${phoneNumber}?text=${message}`,
          "_blank"
        );
      } else {
        alert(
          "💳 Pago procesado con éxito (Simulación Mercado Pago) y Stock Descontado"
        );
      }

      // 6. LIMPIEZA DEL CARRITO Y REFRESH
      clearCart();

      if (typeof refreshProducts === "function") {
        await refreshProducts();
      }

    } catch (error: any) {
      console.error("[FRONTEND] Error procesando la compra:", error);
      alert(`Hubo un error al procesar tu pedido:\n${error?.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cart-page-container glass" style={{ marginTop: '100px', padding: '40px', maxWidth: '1000px', margin: '100px auto', color: 'white' }}>
      <h1 className="cart-title">TU <span>INVENTARIO</span></h1>
      
      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Mochila vacía. ¿Buscas loot?</p>
          <Link href="/" className="nav-btn" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>VOLVER A LA TIENDA</Link>
        </div>
      ) : (
        <div className="cart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' }}>
          
          {/* LISTA DE PRODUCTOS */}
          <div className="cart-items-list">
            {cartItems.map((item: any, index: number) => {
              const precioBase = Number(item.price) || 0;
              const precioFinal = calcularPrecioItem(item);
              const tieneDescuento = item.on_sale === true && Number(item.discount_percentage) > 0;

              return (
                <div key={index} className="cart-item glass" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', marginBottom: '15px', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <img src={item.image_url} alt={item.name} width={70} height={70} style={{ objectFit: 'cover', borderRadius: '5px' }} />
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{item.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {tieneDescuento ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>{formatCurrency(precioBase)}</span>
                            <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>{formatCurrency(precioFinal)}</span>
                            <span style={{ background: 'var(--neon-pink)', color: 'white', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '3px' }}>-{item.discount_percentage}%</span>
                          </>
                        ) : (
                          <span style={{ color: 'var(--neon-green)' }}>{formatCurrency(precioBase)}</span>
                        )}
                      </div>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.7 }}>Cantidad: {item.quantity || 1}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(index)} style={{ background: 'rgba(255,0,110,0.1)', border: '1px solid #ff006e', color: '#ff006e', cursor: 'pointer', padding: '5px 10px', borderRadius: '5px' }}>✕</button>
                </div>
              );
            })}
          </div>

          {/* RESUMEN DE COMPRA */}
          <div className="cart-summary glass" style={{ padding: '25px', border: '1px solid var(--neon-blue)', height: 'fit-content' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(0,210,255,0.3)', paddingBottom: '10px' }}>RESUMEN DE MISIÓN</h3>
            
            <div style={{ margin: '20px 0' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--neon-blue)' }}>MÉTODO DE ENTREGA</label>
              <select className="admin-input" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', color: 'white', marginTop: '5px' }} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value as any)}>
                <option value="sucursal">RETIRO EN PUNTO DE GUARDADO (LOCAL)</option>
                <option value="domicilio">ENVÍO POR MENSAJERÍA</option>
              </select>
              
              {deliveryMethod === 'domicilio' && (
                <input type="text" placeholder="Tu dirección de entrega..." className="admin-input" style={{ width: '100%', marginTop: '12px', padding: '12px' }} value={address} onChange={(e) => setAddress(e.target.value)} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', padding: '15px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '1.2rem' }}>TOTAL:</span>
              <span style={{ color: 'var(--neon-green)', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 0 10px rgba(57,255,20,0.3)' }}>{formatCurrency(total)}</span>
            </div>

            <button onClick={() => ejecutarCompra('WhatsApp')} disabled={isProcessing} className="nav-btn" style={{ width: '100%', background: '#25D366', color: 'black', marginBottom: '15px', padding: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              {isProcessing ? 'PROCESANDO...' : 'PEDIR POR WHATSAPP'}
            </button>
            
            <button onClick={() => ejecutarCompra('Mercado Pago')} disabled={isProcessing} className="nav-btn" style={{ width: '100%', background: '#009EE3', padding: '15px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
              PAGAR CON MERCADO PAGO
            </button>
          </div>

        </div>
      )}
    </div>
  );
}