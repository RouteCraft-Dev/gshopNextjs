"use client";
import { useState } from 'react';
import { useGlobal } from '@/context/CartContext';
import { useParams } from 'next/navigation';
import './product.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { productos, addToCart, isMaintenance } = useGlobal();
  const [displayImage, setDisplayImage] = useState<string | null>(null);

  const product = productos.find((p: any) => String(p.id) === String(id));

  if (!product) {
    return <div className="glitch">[!] PRODUCTO NO ENCONTRADO</div>;
  }

  // CASTEAMOS A 'any' PARA EVITAR ERRORES DE COMPILACIÓN CON TYPESCRIPT
  const prod = product as any;

  const mainImg = displayImage || prod.image_url;
  
  // Mapeo flexible para nombres de propiedades sin error de TypeScript
  const basePrice = Number(prod.price ?? prod.precio ?? 0);
  const discount = Number(prod.discount_percentage ?? prod.discountPercentage ?? prod.descuento ?? 0);
  
  // Evaluamos si está en oferta
  const rawOnSale = prod.on_sale ?? prod.onSale ?? prod.en_oferta;
  const isOnSale = (
    rawOnSale === true || 
    rawOnSale === 'true' || 
    rawOnSale === 1 || 
    rawOnSale === '1' ||
    rawOnSale === 'on'
  ) && discount > 0;

  const finalPrice = isOnSale ? basePrice * (1 - discount / 100) : basePrice;
  const stockCount = Number(prod.stock) || 0;

  return (
    <div className="product-layout">
      <div className="product-detail-container" style={{ paddingTop: '120px', paddingBottom: '60px' }}>
        <div className="product-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* COLUMNA IZQUIERDA: IMÁGENES */}
          <div className="image-sector">
            <div className="main-image-container glass">
              <img src={mainImg} alt={prod.name} className="main-product-img" />
            </div>
            
            <div className="gallery-grid" style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
              <img 
                src={prod.image_url} 
                className={`gallery-thumb ${mainImg === prod.image_url ? 'active' : ''}`}
                style={{ width: '80px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => setDisplayImage(prod.image_url)}
              />
              {(Array.isArray(prod.images_extras) ? prod.images_extras : prod.images_extras?.split(',') || [])
                .filter((url: string) => url.trim() !== "")
                .map((url: string, idx: number) => (
                  <img key={idx} src={url.trim()} className={`gallery-thumb ${mainImg === url.trim() ? 'active' : ''}`}
                    style={{ width: '80px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setDisplayImage(url.trim())} />
                ))
              }
            </div>
          </div>

          {/* COLUMNA DERECHA: INFO */}
          <div className="info-sector">
            <div className={`stock-tag ${stockCount > 5 ? 'in-stock' : stockCount > 0 ? 'low-stock' : 'no-stock'}`}>
              {stockCount > 0 ? `DISPONIBLE: ${stockCount} UNIDADES` : 'FUERA DE SERVICIO'}
            </div>

            <h1 className="glow-title" style={{ fontSize: '3rem', marginBottom: '10px', fontFamily: 'var(--font-orbitron)' }}>
              {prod.name}
            </h1>
            
            <p style={{ color: 'var(--electric-blue)', fontFamily: 'var(--font-orbitron)', fontSize: '14px', marginBottom: '20px' }}>
              SERIAL_NUMBER: #{prod.id} // CAT: {prod.cat}
            </p>

            {/* SECCIÓN DE PRECIO CON MEJOR CONTRASTE Y LECTURA */}
            <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              {isOnSale ? (
                <>
                  <span 
                    style={{ 
                      textDecoration: 'line-through', 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '1.6rem',
                      fontWeight: 'bold',
                      textShadow: '0 0 8px rgba(0,0,0,0.8)'
                    }}
                  >
                    ${basePrice.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '2.5rem', color: 'var(--neon-cyan)', fontWeight: 'bold', fontFamily: 'var(--font-orbitron)' }}>
                    ${finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <div className="discount-badge-home">
                    -{discount}% OFF
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '2.5rem', color: 'var(--neon-cyan)', fontWeight: 'bold', fontFamily: 'var(--font-orbitron)' }}>
                  ${basePrice.toLocaleString()}
                </span>
              )}
            </div>

            <p className="glass" style={{ padding: '25px', borderRadius: '12px', border: '1px solid var(--glass-border)', lineHeight: '1.8', color: 'var(--text-dim)', marginBottom: '30px' }}>
              {prod.description || 'Sin descripción técnica disponible para este modelo.'}
            </p>

            <button 
              className="btn-primary" 
              style={{ width: '100%', height: '70px', fontSize: '1.2rem' }}
              disabled={stockCount <= 0 || isMaintenance}
              onClick={() => addToCart(product)}
            >
              {stockCount > 0 ? 'ADQUIRIR EQUIPAMIENTO' : 'UNIDADES AGOTADAS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}