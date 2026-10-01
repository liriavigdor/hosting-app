import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import './index.css';

// --- MOCK DATA ---
const DEFAULT_MENU = [
  { id: 1, name: 'אספרסו', icon: '☕', category: 'קפה חם', options: ['קצר', 'כפול קצר', 'ארוך', 'כפול ארוך'] },
  { id: 2, name: 'אמריקנו', icon: '☕', category: 'קפה חם', options: ['חם', 'קר'] },
  { id: 3, name: 'קפה קר', icon: '🥤', category: 'קפה קר' },
  { id: 4, name: 'שוקו חם', icon: '🍫', category: 'שתייה חמה' },
  { id: 5, name: 'תה חם', icon: '🍵', category: 'שתייה חמה' },
  { id: 6, name: 'ברד', icon: '🍧', category: 'ברד', options: ['פסיפלורה', 'פטל', 'משמש', 'אבטיח'] },
  { id: 7, name: 'אייס קפה', icon: '🥤', category: 'אייסים' },
  { id: 8, name: 'אייס וניל', icon: '🧋', category: 'אייסים' },
  { id: 9, name: 'גלידה', icon: '🍦', category: 'מתוקים' },
  { id: 10, name: 'לימונדה', icon: '🍋', category: 'שתייה קרה' },
  { id: 11, name: 'טוסט עם גבינה', icon: '🥪', category: 'אוכל' },
  { id: 12, name: 'שוקו קר', icon: '🍫', category: 'שתייה קרה' }
];

// --- HELPER FUNCTIONS ---
const getIcon = (iconStr) => {
  const map = {
    'svg_espresso': '☕',
    'svg_coffee': '☕',
    'svg_mug': '☕',
    'svg_cold': '🥤',
    'svg_boba': '🧋',
    'svg_teapot': '🫖',
    'svg_croissant': '🥐',
    'svg_cake': '🧁',
    'svg_sandwich': '🥪',
    'svg_icecream': '🍦'
  };
  return map[iconStr] || iconStr;
};

const getMainCategory = (product) => {
  const icon = product.icon || '';
  const name = product.name || '';
  const cat = product.category || '';
  
  if (name.includes('חם') || cat.includes('חם')) return 'חם';
  if (name.includes('קר') || cat.includes('קר') || cat === 'אייסים' || cat === 'ברד') return 'קר';
  
  if (['☕', '🍵', '🫖'].includes(icon)) return 'חם';
  if (['🥤', '🧋', '🧊', '🍧', '🥛', '🧃', '🧉', '🍹', '🍷', '🍻', '🍋', '🍉', '🍎', '🍊', '🍓', '🍒', '🍑', '🥭', '🍍', '🥥'].includes(icon)) return 'קר';
  if (['🍦', '🍨', '🥪', '🥐', '🍫', '🍩', '🍪', '🍰', '🧁', '🥨', '🌯', '🥗', '🍬', '🍭', '🍯'].includes(icon)) return 'אוכל';
  
  return 'אוכל';
};

const EMOJI_OPTIONS = (
  <>
    <optgroup label="שתייה חמה">
      <option value="☕">☕ ספל קפה/שוקו</option>
      <option value="🍵">🍵 כוס תה</option>
      <option value="🫖">🫖 קנקן תה</option>
    </optgroup>
    <optgroup label="שתייה קרה">
      <option value="🥤">🥤 כוס עם קש (קפה קר/קולה)</option>
      <option value="🧋">🧋 בובה / שייק</option>
      <option value="🧊">🧊 קוביות קרח</option>
      <option value="🍧">🍧 ברד</option>
      <option value="🥛">🥛 כוס חלב</option>
      <option value="🧃">🧃 מיץ טרופית</option>
      <option value="🧉">🧉 מאטה / תה קר</option>
      <option value="🍹">🍹 קוקטייל פירות</option>
    </optgroup>
    <optgroup label="מאפים ומתוקים">
      <option value="🥐">🥐 קרואסון</option>
      <option value="🍩">🍩 דונאט</option>
      <option value="🍪">🍪 עוגייה</option>
      <option value="🍰">🍰 פרוסת עוגה</option>
      <option value="🧁">🧁 קאפקייק</option>
      <option value="🍫">🍫 שוקולד</option>
      <option value="🍬">🍬 סוכריה</option>
      <option value="🍭">🍭 סוכריה על מקל</option>
      <option value="🍯">🍯 דבש / סילאן</option>
    </optgroup>
    <optgroup label="אוכל">
      <option value="🥪">🥪 כריך / טוסט</option>
      <option value="🥨">🥨 בייגלה</option>
      <option value="🌯">🌯 בוריטו / טורטיה</option>
      <option value="🥗">🥗 סלט</option>
      <option value="🍦">🍦 גלידה אמריקאית</option>
      <option value="🍨">🍨 כדור גלידה</option>
    </optgroup>
    <optgroup label="פירות וטעמים">
      <option value="🍋">🍋 לימון</option>
      <option value="🍉">🍉 אבטיח</option>
      <option value="🍓">🍓 תות</option>
      <option value="🍒">🍒 דובדבן</option>
      <option value="🍑">🍑 אפרסק</option>
      <option value="🥭">🥭 מנגו</option>
      <option value="🍍">🍍 אננס</option>
      <option value="🥥">🥥 קוקוס</option>
      <option value="🍎">🍎 תפוח</option>
      <option value="🍊">🍊 תפוז</option>
    </optgroup>
  </>
);

export default function App() {
  // Use URL parameter to determine view. E.g. /?role=shirel
  const isShirel = window.location.search.includes('shirel');
  const [view, setView] = useState(isShirel ? 'barista' : 'customer'); 
  
  // App State
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  
  const initialOrdersLoaded = useRef(false);

  useEffect(() => {
    if (isShirel && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, [isShirel]);

  // Fetch from Firebase in real-time
  useEffect(() => {
    // 1. Listen to products
    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const prodsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Auto-cleanup old "שוקו" product
        prodsData.forEach(p => {
          if (p.name === 'שוקו') {
            deleteDoc(doc(db, 'products', p.id)).catch(e => console.error(e));
          }
        });

        setProducts(prodsData);
      },
      (error) => {
        console.error("Firebase permissions/read error (products):", error);
        setProducts([]);
      }
    );

    // 2. Listen to orders
    const unsubscribeOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        let hasNewOrder = false;
        let newCustomerName = '';
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            hasNewOrder = true;
            newCustomerName = change.doc.data().customerName;
          }
        });

        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        ordersData.sort((a, b) => a.timestamp - b.timestamp);
        
        if (initialOrdersLoaded.current && hasNewOrder && isShirel) {
          // Play loud notification sound
          const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
          audio.play().catch(e => console.log('Audio play failed:', e));
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('הזמנה חדשה התקבלה! ☕', {
              body: `הזמנה חדשה מאת ${newCustomerName}`,
              icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135694.png'
            });
          }
        }
        initialOrdersLoaded.current = true;
        
        setOrders(ordersData);
      },
      (error) => {
        console.error("Firebase permissions/read error (orders):", error);
        setOrders([]);
      }
    );

    // 3. Listen to global milk settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'milk'), (docSnap) => {
      if (docSnap.exists()) {
        setMilkSettings(docSnap.data());
      } else {
        setMilkSettings({ regular: true, soy: true });
      }
    });

    // 4. Listen to global slush settings
    const unsubscribeSlush = onSnapshot(doc(db, 'settings', 'slush'), (docSnap) => {
      if (docSnap.exists()) {
        setSlushSettings(docSnap.data());
      } else {
        setSlushSettings({ passion: true, raspberry: true, apricot: true, watermelon: true });
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeSettings();
      unsubscribeSlush();
    };
  }, []);

  // Barista View State
  const [baristaTab, setBaristaTab] = useState('orders'); // 'orders', 'menu'
  const [newProductName, setNewProductName] = useState('');
  const [newProductIcon, setNewProductIcon] = useState('☕');

  // Customer State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('הכל');
  const [shakeInput, setShakeInput] = useState(false);
  const [milkSettings, setMilkSettings] = useState({ regular: true, soy: true });
  const [slushSettings, setSlushSettings] = useState({ passion: true, raspberry: true, apricot: true, watermelon: true });
  const [isCartOpen, setIsCartOpen] = useState(true);

  const toggleMilkSetting = async (type) => {
    const newSettings = { ...milkSettings, [type]: !milkSettings[type] };
    setMilkSettings(newSettings); // optimistic UI
    await setDoc(doc(db, 'settings', 'milk'), newSettings);
  };

  const toggleSlushSetting = async (type) => {
    const newSettings = { ...slushSettings, [type]: !slushSettings[type] };
    setSlushSettings(newSettings); // optimistic UI
    await setDoc(doc(db, 'settings', 'slush'), newSettings);
  };

  const addToCart = (product) => {
    const name = product.name || '';
    const isDrinkWithMilk = name.includes('אספרסו') || 
                            name.includes('אמריקנו') || 
                            name.includes('שוקו') || 
                            name.includes('קפוצ\'ינו') ||
                            name.includes('קפוצינו') ||
                            name.includes('הפוך') ||
                            name.includes('לאטה') ||
                            (name.includes('קפה') && !name.includes('אייס'));
                            
    let defaultMilk = null;
    if (isDrinkWithMilk) {
      if (milkSettings && milkSettings.regular) defaultMilk = 'חלב רגיל';
      else if (milkSettings && milkSettings.soy) defaultMilk = 'חלב סויה';
      else defaultMilk = 'ללא חלב';
    }

    let defaultOption = product.options ? product.options[0] : null;
    if (product.name === 'ברד') {
      if (slushSettings && slushSettings.passion) defaultOption = 'פסיפלורה';
      else if (slushSettings && slushSettings.raspberry) defaultOption = 'פטל';
      else if (slushSettings && slushSettings.apricot) defaultOption = 'משמש';
      else if (slushSettings && slushSettings.watermelon) defaultOption = 'אבטיח';
      else defaultOption = '';
    }

    const newItem = {
      cartId: Math.random().toString(36).substr(2, 9),
      product: product,
      selectedOption: defaultOption,
      selectedMilk: defaultMilk
    };
    setCart([...cart, newItem]);
    setIsCartOpen(true);
  };

  const updateCartItemOption = (cartId, newOption) => {
    setCart(cart.map(item => item.cartId === cartId ? { ...item, selectedOption: newOption } : item));
  };

  const updateCartItemMilk = (cartId, newMilk) => {
    setCart(cart.map(item => item.cartId === cartId ? { ...item, selectedMilk: newMilk } : item));
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    if (!customerName.trim()) {
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      
      // We can also vibrate the device if supported
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      return;
    }
    const orderItems = cart.map(item => {
      let desc = item.product.name;
      const details = [];
      if (item.selectedOption) details.push(item.selectedOption);
      if (item.selectedMilk) details.push(item.selectedMilk);
      
      if (details.length > 0) {
        return `${desc} (${details.join(', ')})`;
      }
      return desc;
    });

    const newOrder = {
      customerName,
      items: orderItems,
      status: 'pending',
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: Date.now() // to sort orders
    };

    try {
      await addDoc(collection(db, 'orders'), newOrder);
      setCart([]);
      setCustomerName('');
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

      // Save to custom defaults in Firebase so "Load Default Menu" remembers it
      const customMenuRef = doc(db, 'settings', 'customMenu');
      const docSnap = await getDoc(customMenuRef);
      let customItems = [];
      if (docSnap.exists()) {
        customItems = docSnap.data().items || [];
      }
      customItems.push(newProduct);
      await setDoc(customMenuRef, { items: customItems });

    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (id) => {
    if(window.confirm('האם למחוק פריט זה מהתפריט לחלוטין?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleProductVisibility = async (product) => {
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        hidden: !product.hidden
      });
    } catch (err) {
      console.error('Error toggling visibility:', err);
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
                <button className={`pill ${selectedCategory === 'חם' ? 'active' : ''}`} onClick={() => setSelectedCategory('חם')}>🔥 חם</button>
                <button className={`pill ${selectedCategory === 'קר' ? 'active' : ''}`} onClick={() => setSelectedCategory('קר')}>🧊 קר</button>
                <button className={`pill ${selectedCategory === 'אוכל' ? 'active' : ''}`} onClick={() => setSelectedCategory('אוכל')}>🥪 אוכל</button>
              </div>
            </div>

            <div className="products-grid">
              {products
                .filter(p => !p.hidden)
                .filter(p => selectedCategory === 'הכל' || getMainCategory(p) === selectedCategory)
                .map(product => (
                <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                  <span className="product-icon">{getIcon(product.icon)}</span>
                  <h3>{product.name}</h3>
                </div>
              ))}
            </div>

            {cart.length > 0 && !isCartOpen && (
              <button 
                className="floating-cart-btn" 
                onClick={() => setIsCartOpen(true)}
              >
                🧾
                <span className="cart-badge">{cart.length}</span>
              </button>
            )}

            {cart.length > 0 && isCartOpen && (
              <div className="sticky-cart glass-panel">
                <div className="order-summary">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>ההזמנה שלי ({cart.length} פריטים)</h3>
                    <button onClick={() => setIsCartOpen(false)} className="btn-close-cart">
                      🔽 צמצם
                    </button>
                  </div>
                  <ul className="cart-list">
                    {cart.map((item) => (
                      <li key={item.cartId} className="cart-item-card">
                        <div className="cart-item-name">{getIcon(item.product.icon)} {item.product.name}</div>
                        <div className="cart-item-options">
                          {item.product.options && (
                            <select 
                              className="cart-select"
                              value={item.selectedOption} 
                              onChange={(e) => updateCartItemOption(item.cartId, e.target.value)}
                            >
                              {item.product.name === 'ברד' ? (
                                <>
                                  {slushSettings && slushSettings.passion && <option value="פסיפלורה">פסיפלורה</option>}
                                  {slushSettings && slushSettings.raspberry && <option value="פטל">פטל</option>}
                                  {slushSettings && slushSettings.apricot && <option value="משמש">משמש</option>}
                                  {slushSettings && slushSettings.watermelon && <option value="אבטיח">אבטיח</option>}
                                </>
                              ) : (
                                item.product.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))
                              )}
                            </select>
                          )}
                          {item.selectedMilk !== null && (
                            <select 
                              className="cart-select"
                              value={item.selectedMilk} 
                              onChange={(e) => updateCartItemMilk(item.cartId, e.target.value)}
                            >
                              {milkSettings.regular && <option value="חלב רגיל">חלב רגיל</option>}
                              {milkSettings.soy && <option value="חלב סויה">🥛 חלב סויה</option>}
                              <option value="ללא חלב">ללא חלב</option>
                            </select>
                          )}
                        </div>
                        <button className="btn-remove" onClick={() => removeFromCart(item.cartId)}>🗑️</button>
                      </li>
                    ))}
                  </ul>
                </div>
              
                <form onSubmit={submitOrder} className="order-form-vertical">

                  <div className={`form-group ${shakeInput ? 'shake-animation' : ''}`} style={{ marginTop: '10px' }}>
                    <label style={{ fontWeight: 'bold' }}>שם פרטי (חובה):</label>
                    <input 
                      type="text" 
                      placeholder="הקלד/י את השם שלך" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{ 
                        fontSize: '1.2rem', 
                        padding: '10px', 
                        borderRadius: '8px',
                        border: shakeInput ? '2px solid red' : '1px solid #ccc'
                      }}
                    />
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={submitOrder} 
                    className={`btn-primary btn-submit ${!customerName.trim() ? 'btn-gray' : ''}`}
                  >
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
                        
                        {order.milk && order.milk !== 'ללא' && (
                          <div className="order-milk-pref" style={{ background: 'rgba(255,200,200,0.4)', padding: '5px 10px', borderRadius: '8px', marginBottom: '10px', fontSize: '0.9rem', color: '#c0392b', fontWeight: '600' }}>
                            חלב: {order.milk}
                          </div>
                        )}

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
                      {EMOJI_OPTIONS}
                    </select>
                    <button type="submit" className="btn-primary">הוסף לתפריט</button>
                  </form>
                </div>

                <div className="current-menu-list">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>סוגי חלב זמינים ללקוחות:</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: 'rgba(255,255,255,0.7)', padding: '15px', borderRadius: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input 
                        type="checkbox" 
                        checked={milkSettings.regular} 
                        onChange={() => toggleMilkSetting('regular')} 
                        style={{ width: '20px', height: '20px' }}
                      />
                      חלב רגיל
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input 
                        type="checkbox" 
                        checked={milkSettings.soy} 
                        onChange={() => toggleMilkSetting('soy')} 
                        style={{ width: '20px', height: '20px' }}
                      />
                      🥛 חלב סויה
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>טעמי ברד זמינים ללקוחות:</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: 'rgba(255,255,255,0.7)', padding: '15px', borderRadius: '12px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={slushSettings.passion} onChange={() => toggleSlushSetting('passion')} style={{ width: '20px', height: '20px' }} />
                      פסיפלורה
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={slushSettings.raspberry} onChange={() => toggleSlushSetting('raspberry')} style={{ width: '20px', height: '20px' }} />
                      פטל
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={slushSettings.apricot} onChange={() => toggleSlushSetting('apricot')} style={{ width: '20px', height: '20px' }} />
                      משמש
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={slushSettings.watermelon} onChange={() => toggleSlushSetting('watermelon')} style={{ width: '20px', height: '20px' }} />
                      אבטיח
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>התפריט המוצג כרגע ללקוחות:</h3>
                    <button 
                      className="btn-reload" 
                      onClick={async () => {
                        if(window.confirm('זה יוסיף את מוצרי הבסיס החסרים (כולל אלה שהוספת בעבר). להמשיך?')) {
                          // Fetch any custom products Shirel added previously
                          let customItems = [];
                          try {
                            const customMenuRef = doc(db, 'settings', 'customMenu');
                            const docSnap = await getDoc(customMenuRef);
                            if (docSnap.exists()) {
                              customItems = docSnap.data().items || [];
                            }
                          } catch (e) { console.error(e) }

                          const fullMenu = [...DEFAULT_MENU, ...customItems];
                          const currentNames = new Set(products.map(p => p.name));
                          
                          for (const item of fullMenu) {
                            if (!currentNames.has(item.name)) {
                              try {
                                const { id, ...itemData } = item;
                                await addDoc(collection(db, 'products'), itemData);
                                currentNames.add(item.name);
                              } catch (e) { console.error(e) }
                            }
                          }
                          alert('תפריט בסיסי הושלם בהצלחה!');
                        }
                      }}
                    >
                      🔄 טען תפריט בסיסי
                    </button>
                  </div>
                  <div className="menu-items-table">
                    {products.map(product => (
                      <div key={product.id} className="menu-item-row" style={{ opacity: product.hidden ? 0.5 : 1 }}>
                        <div className="menu-item-info">
                          <div style={{ position: 'relative', display: 'inline-block', width: '30px', height: '30px', textAlign: 'center', lineHeight: '30px' }}>
                            <span style={{ fontSize: '1.2rem' }}>{getIcon(product.icon)}</span>
                            <select 
                              value={getIcon(product.icon)} 
                              onChange={async (e) => {
                                try {
                                  await updateDoc(doc(db, 'products', product.id), { icon: e.target.value });
                                } catch(err) { console.error('Error updating icon:', err); }
                              }}
                              title="לחץ לשינוי אייקון"
                              style={{ 
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                opacity: 0,
                                cursor: 'pointer',
                                appearance: 'none',
                                WebkitAppearance: 'none'
                              }}
                            >
                              {EMOJI_OPTIONS}
                            </select>
                          </div>
                          <span className="product-name" style={{ textDecoration: product.hidden ? 'line-through' : 'none', marginRight: '8px' }}>
                            {product.name} {product.hidden && '(מוסתר)'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            className={`toggle-visibility-btn ${product.hidden ? 'is-hidden' : 'is-visible'}`} 
                            onClick={() => toggleProductVisibility(product)}
                            title={product.hidden ? "מוסתר מלקוחות - לחץ להצגה" : "גלוי ללקוחות - לחץ להסתרה"}
                          >
                            <span style={{ fontSize: '1.2rem' }}>{product.hidden ? '🙈' : '👁️'}</span>
                            <span>{product.hidden ? 'מוסתר' : 'פעיל'}</span>
                          </button>
                          <button className="btn-danger" onClick={() => deleteProduct(product.id)} title="מחיקה סופית" style={{ padding: '8px 12px', border: 'none', background: '#ffebeb', borderRadius: '12px' }}>
                            🗑️
                          </button>
                        </div>
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
