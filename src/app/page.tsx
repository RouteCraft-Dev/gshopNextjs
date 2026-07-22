"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGlobal } from '@/context/CartContext';
import './page.css'; 

export default function Home() {
  const { productos, addToCart, cart, isMaintenance } = useGlobal();
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [page, setPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const itemsPerPage = 9;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="page-loader" />;
  }

  if (isMaintenance) {
    return (
      <main className="main-scrollable maintenance-main">
        <div className="glass maintenance-card">
          <h1 className="glitch maintenance-title">SISTEMA OFFLINE</h1>
          <div className="maintenance-divider"></div>
          <p className="hero-subtitle maintenance-text">
            Estamos recargando energía y loot. 
            <br />
            <span className="blue-highlight">Vuelve pronto, Player 1.</span>
          </p>
          <div className="loading-text maintenance-status">STATUS: MODO_VACACIONES_ACTIVO</div>
        </div>
      </main>
    );
  }

  // 1. Filtrado
  const filtered = productos.filter((p: any) => {
    const filtro = categoryFilter.toUpperCase();
    if (filtro === 'TODOS') return true;
    if (filtro === 'OFERTAS') return p.on_sale === true;
    if (filtro === 'NUEVOS PRODUCTOS') {
      const fechaCreacion = new Date(p.created_at || Date.now()).getTime();
      const sieteDias = 7 * 24 * 60 * 60 * 1000;
      return (Date.now() - fechaCreacion) < sieteDias;
    }
    return (p.cat || p.category)?.toUpperCase() === filtro;
  });

  // 2. ORDEN INVERSO
  const sortedProducts = [...filtered].reverse();

  // 3. Paginación
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const displayProducts = sortedProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const changeFilter = (cat: string) => {
    setCategoryFilter(cat);
    setPage(1);
  };

  return (
    <main className="main-scrollable">
      <div className="content-wrapper">
        
        <header className="hero-section">
          <h2 className="glitch">GAMER SHOP</h2>
          <p className="hero-subtitle">EL MEJOR LOOT PARA TU SETUP</p>
        </header>

        <div className="glass filter-container-home">
          {['TODOS', 'OFERTAS', 'NUEVOS PRODUCTOS'].map(cat => (
            <button 
              key={cat} 
              className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`} 
              onClick={() => changeFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="items-grid">
          {displayProducts.length > 0 ? (
            displayProducts.map((p: any) => {
              const discount = p.discount_percentage || 0;
              const priceNum = Number(p.price);
              const finalPrice = p.on_sale ? priceNum - (priceNum * discount / 100) : priceNum;
              const sinStock = p.stock <= 0;

              return (
                <div key={p.id} className="gamer-card">
                  <div className="price-container">
                    {p.on_sale ? (
                      <>
                        <span className="old-price">${priceNum}</span>
                        <span className="current-price sale-price">${finalPrice.toFixed(0)}</span>
                        <div className="discount-badge-home">-{discount}% OFF</div>
                      </>
                    ) : (
                      <span className="current-price">${priceNum}</span>
                    )}
                  </div>

                  <Link href={`/producto/${p.id}`} className="image-container">
                    <img 
                      src={p.image_url} 
                      alt={p.name} 
                      onError={(e: any) => { 
                        e.target.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400"; 
                      }}
                    />
                  </Link>

                  <h3>{p.name}</h3>
                  <p className="company">{p.cat || 'GEAR'}</p>

                  <button 
                    className={`buy-button ${sinStock ? 'no-stock' : ''}`} 
                    onClick={() => !sinStock && addToCart(p)}
                    disabled={sinStock}
                  >
                    {sinStock ? 'SIN STOCK' : 'ADQUIRIR'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="empty-results">
              <h2 className="loading-text">SIN REGISTROS EN ESTA CATEGORÍA</h2>
            </div>
          )}
        </div>

        {/* PAGINACIÓN VISIBLE */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="filter-btn" disabled={page === 1} onClick={() => { setPage(page - 1); window.scrollTo(0,0); }}>ATRÁS</button>
            <span className="hero-subtitle pagination-text">{page} / {totalPages}</span>
            <button className="filter-btn" disabled={page >= totalPages} onClick={() => { setPage(page + 1); window.scrollTo(0,0); }}>SIGUIENTE</button>
          </div>
        )}
      </div>
    </main>
  );
}