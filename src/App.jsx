import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import './index.css';

// --- MOCK DATA ---
const DEFAULT_MENU = [
  { id: 1, name: 'אספרסו', icon: '☕', category: 'קפה חם', options: ['קצר', 'כפול קצר', 'ארוך', 'כפול ארוך'] },
  { id: 2, name: 'אמריקנו', icon: '☕', category: 'קפה חם', options: ['חם', 'קר'] },
  { id: 3, name: 'קפה קר', icon: '🧋', category: 'קפה קר' },
  { id: 4, name: 'שוקו', icon: '🍫', category: 'שתייה חמה', options: ['חם', 'קר'] },
  { id: 5, name: 'תה חם', icon: '🍵', category: 'שתייה חמה' },
  { id: 6, name: 'ברד', icon: '🍧', category: 'ברד', options: ['פסיפלורה', 'פטל', 'משמש', 'אבטיח'] },
  { id: 7, name: 'אייס קפה', icon: '🥤', category: 'אייסים' },
  { id: 8, name: 'אייס וניל', icon: '🥤', category: 'אייסים' },
  { id: 9, name: 'גלידה', icon: '🍦', category: 'מתוקים' },
  { id: 10, name: 'לימונדה', icon: '🍋', category: 'שתייה קרה' },
  { id: 11, name: 'טוסט עם גבינה', icon: '🥪', category: 'אוכל' }
];

export default function App() {
  // Use URL parameter to determine view. E.g. /?role=shirel
  const isShirel = window.location.search.includes('shirel');
  const [view, setView] = useState(isShirel ? 'barista' : 'customer'); 
  
  // App State
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // Fetch from Firebase in real-time
  useEffect(() => {
    // 1. Listen to products
    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const prodsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (prodsData.length === 0) {
          // If empty in DB (or just started), just use the local DEFAULT_MENU for now
          // to avoid a blank screen while setting up Firebase
          setProducts(DEFAULT_MENU);
        } else {
          setProducts(prodsData);
        }
      },
      (error) => {
        console.error("Firebase permissions/read error (products):", error);
        // Fallback to local default if Firebase is not yet fully configured
        setProducts(DEFAULT_MENU);
      }
    );

    // 2. Listen to orders
    const unsubscribeOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersData);
      },
      (error) => {
        console.error("Firebase permissions/read error (orders):", error);
        setOrders([]);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, []);

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
    const newItem = {
      cartId: Math.random().toString(36).substr(2, 9),
      product: product,
      selectedOption: product.options ? product.options[0] : null
    };
    setCart([...cart, newItem]);
  };

  const updateCartItemOption = (cartId, newOption) => {
    setCart(cart.map(item => item.cartId === cartId ? { ...item, selectedOption: newOption } : item));
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || cart.length === 0) return;
    
    // Check if there's any coffee/drink in cart to mention the milk
    const orderItems = cart.map(item => {
      return item.selectedOption ? `${item.product.name} (${item.selectedOption})` : item.product.name;
    });
    
    // Check if any item needs milk
    const needsMilk = cart.some(item => 
      item.product.name.includes('אספרסו') || 
      item.product.name.includes('אמריקנו') || 
      item.product.name.includes('שוקו') || 
      (item.product.name.includes('קפה') && !item.product.name.includes('אייס'))
    );

    const finalMilkType = needsMilk ? milkType : 'ללא';

    const newOrder = {
      customerName,
      items: orderItems,
      milk: finalMilkType,
      status: 'pending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now() // to sort orders
    };

    try {
      await addDoc(collection(db, 'orders'), newOrder);
      setCart([]);
      setCustomerName('');
      setMilkType('רגיל');
      alert('ההזמנה נשלחה בהצלחה לשיראל!');
    } catch (err) {
      console.error(err);
      alert('שגיאה בשליחת ההזמנה.');
    }
  };

  const completeOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.error(err);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    
    const newProduct = {
      name: newProductName,
      icon: newProductIcon
    };
    
    try {
      await addDoc(collection(db, 'products'), newProduct);
      setNewProductName('');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (id) => {
    if(window.confirm('האם למחוק פריט זה מהתפריט?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.error(err);
      }
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
                    {cart.map((item) => (
                      <li key={item.cartId}>
                        <div className="cart-item-details">
                          <span className="cart-item-name">{item.product.icon} {item.product.name}</span>
                          {item.product.options && (
                            <select 
                              className="cart-inline-select"
                              value={item.selectedOption} 
                              onChange={(e) => updateCartItemOption(item.cartId, e.target.value)}
                            >
                              {item.product.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <button className="btn-remove" onClick={() => removeFromCart(item.cartId)}>❌</button>
                      </li>
                    ))}
                  </ul>
                </div>
              
                <form onSubmit={submitOrder} className="order-form-vertical">
                  {cart.some(item => 
                    item.product.name.includes('אספרסו') || 
                    item.product.name.includes('אמריקנו') || 
                    item.product.name.includes('שוקו') || 
                    (item.product.name.includes('קפה') && !item.product.name.includes('אייס'))
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
