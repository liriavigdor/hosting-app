import React, { useState, useEffect } from 'react';
import './index.css';

// --- MOCK DATA ---
const DEFAULT_MENU = [
  { id: 1, name: 'אספרסו קצר', icon: '☕', category: 'קפה חם' },
  { id: 2, name: 'אספרסו כפול קצר', icon: '☕', category: 'קפה חם' },
  { id: 3, name: 'אספרסו ארוך', icon: '☕', category: 'קפה חם' },
  { id: 4, name: 'אספרסו כפול ארוך', icon: '☕', category: 'קפה חם' },
  { id: 5, name: 'אמריקנו חם', icon: '☕', category: 'קפה חם' },
  { id: 6, name: 'אמריקנו קר', icon: '🧊', category: 'קפה קר' },
  { id: 7, name: 'קפה קר', icon: '🧋', category: 'קפה קר' },
  { id: 8, name: 'שוקו חם', icon: '🍫', category: 'קפה חם' },
  { id: 9, name: 'שוקו קר', icon: '🧋', category: 'קפה קר' },
  { id: 10, name: 'תה חם', icon: '🍵', category: 'קפה חם' },
  { id: 11, name: 'ברד פסיפלורה', icon: '🍧', category: 'ברד' },
  { id: 12, name: 'ברד פטל', icon: '🍧', category: 'ברד' },
  { id: 13, name: 'ברד משמש', icon: '🍧', category: 'ברד' },
  { id: 14, name: 'ברד אבטיח', icon: '🍉', category: 'ברד' },
  { id: 15, name: 'אייס קפה', icon: '🥤', category: 'אייסים' },
  { id: 16, name: 'אייס וניל', icon: '🥤', category: 'אייסים' },
  { id: 17, name: 'גלידה', icon: '🍦', category: 'מתוקים' },
  { id: 18, name: 'לימונדה', icon: '🍋', category: 'שתייה קרה' },
  { id: 19, name: 'טוסט עם גבינה', icon: '🥪', category: 'אוכל' }
];

export default function App() {
  // Use URL parameter to determine view. E.g. /?role=shirel
  const isShirel = window.location.search.includes('shirel');
  const [view, setView] = useState(isShirel ? 'barista' : 'customer'); 
  
  // Persist state to localStorage so it syncs across tabs
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('barista_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('barista_products');
    return saved ? JSON.parse(saved) : DEFAULT_MENU;
  });

  // Sync state between tabs dynamically
  useEffect(() => {
    const handleStorageChange = () => {
      const savedOrders = localStorage.getItem('barista_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedProducts = localStorage.getItem('barista_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('barista_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('barista_products', JSON.stringify(products));
  }, [products]);

  // Barista View State
  const [baristaTab, setBaristaTab] = useState('orders'); // 'orders', 'menu'
  const [newProductName, setNewProductName] = useState('');
  const [newProductIcon, setNewProductIcon] = useState('☕');

  // Customer State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [milkType, setMilkType] = useState('רגיל'); // רגיל / סויה
  const [selectedCategory, setSelectedCategory] = useState('הכל');

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, idx) => idx !== indexToRemove));
  };

  const submitOrder = (e) => {
    e.preventDefault();
    if (!customerName.trim() || cart.length === 0) return;
    
    // Check if there's any coffee/drink in cart to mention the milk
    const orderItems = cart.map(item => item.name);
    
    // Check if any item needs milk
    const needsMilk = cart.some(item => 
      item.name.includes('אספרסו') || 
      item.name.includes('אמריקנו') || 
      item.name.includes('שוקו') || 
      (item.name.includes('קפה') && !item.name.includes('אייס'))
    );

    const finalMilkType = needsMilk ? milkType : 'ללא';

    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      customerName,
      items: orderItems,
      milk: finalMilkType,
      status: 'pending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setOrders([...orders, newOrder]);
    setCart([]);
    setCustomerName('');
    setMilkType('רגיל');
    alert('ההזמנה נשלחה בהצלחה לשיראל!');
  };

  const completeOrder = (orderId) => {
    setOrders(orders.filter(order => order.id !== orderId));
  };

  const addProduct = (e) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    
    const newProduct = {
      id: Date.now(),
      name: newProductName,
      icon: newProductIcon
    };
    
    setProducts([...products, newProduct]);
    setNewProductName('');
  };

  const deleteProduct = (id) => {
    if(window.confirm('האם למחוק פריט זה מהתפריט?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="app-container" dir="rtl">
      <div className="main-content">
        
        {view === 'customer' && (
          <div className="customer-view">
            <div className="customer-header glass-panel">
              <h1 className="title">מה תרצו לשתות? ☕</h1>
              
              <div className="category-pills">
                <button className={`pill ${selectedCategory === 'הכל' ? 'active' : ''}`} onClick={() => setSelectedCategory('הכל')}>הכל</button>
                {Array.from(new Set(products.map(p => p.category || 'כללי'))).map(cat => (
                  <button key={cat} className={`pill ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="products-grid">
              {products.filter(p => selectedCategory === 'הכל' || (p.category || 'כללי') === selectedCategory).map(product => (
                <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                  <span className="product-icon">{product.icon}</span>
                  <h3>{product.name}</h3>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="sticky-cart glass-panel">
                <div className="order-summary">
                  <h3>ההזמנה שלי ({cart.length} פריטים)</h3>
                <ul className="cart-list">
                  {cart.map((item, idx) => (
                    <li key={idx}>
                      <span>{item.icon} {item.name}</span>
                      <button className="btn-remove" onClick={() => removeFromCart(idx)}>❌</button>
                    </li>
                  ))}
                </ul>
              )}
              
              <form onSubmit={submitOrder} className="order-form-vertical">
                {cart.some(item => 
                  item.name.includes('אספרסו') || 
                  item.name.includes('אמריקנו') || 
                  item.name.includes('שוקו') || 
                  (item.name.includes('קפה') && !item.name.includes('אייס'))
                ) && (
                  <div className="form-group">
                    <label>סוג חלב (לקפה/שוקו):</label>
                    <select value={milkType} onChange={(e) => setMilkType(e.target.value)}>
                      <option value="רגיל">חלב רגיל</option>
                      <option value="סויה">חלב סויה</option>
                      <option value="ללא">ללא חלב</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>שם פרטי (כדי שנדע למי לקרוא):</label>
                  <input 
                    type="text" 
                    placeholder="למשל: דוד" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
                
                  <button type="submit" disabled={cart.length === 0 || !customerName.trim()} className="btn-primary btn-submit">
                    שלח הזמנה לשיראל!
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {view === 'barista' && (
          <div className="barista-view glass-panel">
            <h1 className="title">העמדה של שיראל ✨</h1>
            
            <div className="barista-tabs">
              <button className={baristaTab === 'orders' ? 'active' : ''} onClick={() => setBaristaTab('orders')}>
                הזמנות פתוחות ({orders.length})
              </button>
              <button className={baristaTab === 'menu' ? 'active' : ''} onClick={() => setBaristaTab('menu')}>
                ניהול תפריט
              </button>
            </div>

            {baristaTab === 'orders' && (
              <div className="tab-content">
                {orders.length === 0 ? (
                  <div className="empty-state">
                    <p>אין הזמנות כרגע. אפשר לשתות קפה בשקט! 🎉</p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(order => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <h2>{order.customerName}</h2>
                          <span className="order-time">{order.time}</span>
                        </div>
                        
                        <div className="order-milk-pref">
                          {order.milk !== 'ללא' && <strong>חלב: {order.milk}</strong>}
                        </div>

                        <ul className="order-items">
                          {order.items.map((item, idx) => (
                            <li key={idx}>🔸 {item}</li>
                          ))}
                        </ul>
                        <button className="btn-success" onClick={() => completeOrder(order.id)}>
                          סיימתי! ✅
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {baristaTab === 'menu' && (
              <div className="tab-content menu-management">
                <div className="add-product-form">
                  <h3>הוספת פריט חדש לתפריט</h3>
                  <form onSubmit={addProduct}>
                    <input 
                      type="text" 
                      placeholder="שם הפריט (למשל: סחלב חם)" 
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      required
                    />
                    <select value={newProductIcon} onChange={(e) => setNewProductIcon(e.target.value)}>
                      <option value="☕">☕ קפה</option>
                      <option value="🍵">🍵 תה</option>
                      <option value="🥤">🥤 קר</option>
                      <option value="🧋">🧋 מיוחד</option>
                      <option value="🧊">🧊 קרח</option>
                      <option value="🍫">🍫 שוקולד</option>
                      <option value="🍧">🍧 ברד</option>
                      <option value="🍦">🍦 גלידה</option>
                      <option value="🍉">🍉 פרי</option>
                      <option value="🍋">🍋 לימון</option>
                      <option value="🥪">🥪 אוכל</option>
                      <option value="🥐">🥐 מאפה</option>
                    </select>
                    <select name="category" required onChange={(e) => setNewProductName(newProductName + ' | ' + e.target.value)} style={{display: 'none'}}>
                       {/* Simplified for pilot */}
                    </select>
                    <button type="submit" className="btn-primary">הוסף לתפריט</button>
                  </form>
                </div>

                <div className="current-menu-list">
                  <h3>התפריט המוצג כרגע ללקוחות:</h3>
                  <div className="menu-items-table">
                    {products.map(product => (
                      <div key={product.id} className="menu-item-row">
                        <div className="menu-item-info">
                          <span>{product.icon}</span>
                          <span className="product-name">{product.name}</span>
                        </div>
                        <button className="btn-danger" onClick={() => deleteProduct(product.id)}>מחק פריט</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
