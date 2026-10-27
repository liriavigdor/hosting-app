import React, { useState, useEffect, useRef, useMemo } from 'react';
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

const isFoodItem = (productOrName) => {
  if (!productOrName) return false;
  let name = typeof productOrName === 'string' ? productOrName : (productOrName.name || productOrName.text || '');
  let cat = typeof productOrName === 'object' ? (productOrName.category || '') : '';
  let icon = typeof productOrName === 'object' ? (productOrName.icon || '') : '';

  // Clean name from options like (קצר, חלב רגיל)
  name = name.split('(')[0].trim();

  // If category is food or drink
  if (cat.includes('אוכל') || cat.includes('מתוקים') || cat.includes('מאפים')) return true;
  if (cat.includes('שתייה') || cat.includes('קפה') || cat.includes('אייס') || cat.includes('ברד')) return false;

  // Food icons
  if (['🥪', '🥐', '🍫', '🍩', '🍪', '🍰', '🧁', '🥨', '🌯', '🥗', '🍬', '🍭', '🍯', '🍦', '🍨'].includes(icon)) return true;
  if (['☕', '🍵', '🫖', '🥤', '🧋', '🧊', '🍧', '🥛', '🧃', '🧉', '🍹', '🍷', '🍻', '🍋'].includes(icon)) return false;

  // Food keywords
  const foodKeywords = ['טוסט', 'כריך', 'סנדוויץ', 'סלט', 'קרואסון', 'דונאט', 'עוגייה', 'עוגה', 'קאפקייק', 'גלידה', 'בוריטו', 'בייגלה', 'אוכל', 'מתוקים', 'וופל', 'פנקייק'];
  for (const kw of foodKeywords) {
    if (name.includes(kw)) return true;
  }

  // Drink keywords
  const drinkKeywords = ['קפה', 'אספרסו', 'אמריקנו', 'הפוך', 'קפוצ\'ינו', 'קפוצינו', 'לאטה', 'תה', 'שוקו', 'ברד', 'אייס', 'לימונדה', 'מים', 'מיץ', 'סודה', 'שייק'];
  for (const kw of drinkKeywords) {
    if (name.includes(kw)) return false;
  }

  return false;
};

const parseOrderItem = (itemStrOrObj) => {
  if (typeof itemStrOrObj === 'object' && itemStrOrObj !== null) {
    const isFood = itemStrOrObj.isFood !== undefined 
      ? itemStrOrObj.isFood 
      : isFoodItem(itemStrOrObj.name || itemStrOrObj.text);
    return {
      id: itemStrOrObj.id || Math.random().toString(36).substr(2, 9),
      name: itemStrOrObj.name || (itemStrOrObj.text ? itemStrOrObj.text.split('(')[0].trim() : 'פריט'),
      icon: itemStrOrObj.icon || (isFood ? '🥪' : '☕'),
      milk: itemStrOrObj.milk || null,
      option: itemStrOrObj.option || null,
      text: itemStrOrObj.text || itemStrOrObj.name || '',
      isFood,
      completed: !!itemStrOrObj.completed
    };
  }

  const str = String(itemStrOrObj);
  const match = str.match(/^([^(]+)(?:\((.*)\))?$/);
  const name = match ? match[1].trim() : str;
  const rawDetails = match && match[2] ? match[2].split(',').map(s => s.trim()) : [];
  
  let milk = null;
  const options = [];
  
  rawDetails.forEach(d => {
    if (d.includes('חלב') || d === 'ללא חלב') {
      milk = d;
    } else {
      options.push(d);
    }
  });

  const isFood = isFoodItem(name);

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    icon: isFood ? '🥪' : '☕',
    milk,
    option: options.join(', ') || null,
    text: str,
    isFood,
    completed: false
  };
};

const processOrder = (order) => {
  const parsedItems = (order.items || []).map(parseOrderItem);
  const drinkItems = parsedItems.filter(i => !i.isFood);
  const foodItems = parsedItems.filter(i => i.isFood);
  
  const hasDrinks = drinkItems.length > 0;
  const hasFood = foodItems.length > 0;
  
  const drinksCompleted = hasDrinks ? !!order.drinksCompleted : true;
  const foodCompleted = hasFood ? !!order.foodCompleted : true;
  const isFullyCompleted = drinksCompleted && foodCompleted;

  return {
    ...order,
    parsedItems,
    drinkItems,
    foodItems,
    hasDrinks,
    hasFood,
    drinksCompleted,
    foodCompleted,
    isFullyCompleted
  };
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

const RATING_EMOJIS = [
  { level: 1, emoji: '😭', label: 'בוכה מאוד' },
  { level: 2, emoji: '🙁', label: 'לא משהו' },
  { level: 3, emoji: '😐', label: 'בסדר' },
  { level: 4, emoji: '😊', label: 'טוב מאוד' },
  { level: 5, emoji: '🤩', label: 'מושלם!' }
];


export default function App() {
  // Use URL parameter to determine view. E.g. /?role=shirel
  const isShirel = window.location.search.includes('shirel');
  const [view, setView] = useState(isShirel ? 'barista' : 'customer'); 
  
  // App State
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [showCustomerReviewModal, setShowCustomerReviewModal] = useState(false);
  const [showBaristaReviewModal, setShowBaristaReviewModal] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
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
          const audio = new Audio('/new-order.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
          
          try {
            if ('Notification' in window && window.Notification && Notification.permission === 'granted') {
              new Notification('הזמנה חדשה התקבלה! ☕', {
                body: `הזמנה חדשה מאת ${newCustomerName}`,
                icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135694.png'
              });
            }
          } catch (err) {
            console.log('Notification API check failed (expected on some mobile/kiosk browsers):', err);
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

    // 5. Listen to customer reviews
    const unsubscribeReviews = onSnapshot(
      collection(db, 'reviews'),
      (snapshot) => {
        const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        reviewsData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setReviews(reviewsData);
      },
      (error) => {
        console.error("Firebase permissions/read error (reviews):", error);
        setReviews([]);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeSettings();
      unsubscribeSlush();
      unsubscribeReviews();
    };
  }, [isShirel]);

  // Barista View State
  const [baristaTab, setBaristaTab] = useState('orders'); // 'orders', 'menu'
  const [newProductName, setNewProductName] = useState('');
  const [newProductIcon, setNewProductIcon] = useState('☕');

  // Memoized Processed Orders
  const processedOrders = useMemo(() => {
    return orders.map(processOrder);
  }, [orders]);

  // Filtered orders for display in the two columns
  const pendingDrinksOrders = useMemo(() => {
    return processedOrders.filter(o => !o.drinksCompleted && o.hasDrinks);
  }, [processedOrders]);

  const pendingFoodOrders = useMemo(() => {
    return processedOrders.filter(o => !o.foodCompleted && o.hasFood);
  }, [processedOrders]);

  // Aggregate coffee & drinks summary for the third column
  const coffeeSummary = useMemo(() => {
    const summary = {};

    pendingDrinksOrders.forEach(order => {
      order.drinkItems.forEach(item => {
        const name = item.name;
        if (!summary[name]) {
          summary[name] = {
            name,
            icon: item.icon || '☕',
            totalCount: 0,
            milkGroups: {}
          };
        }

        summary[name].totalCount += 1;

        let groupKey = item.milk;
        if (!groupKey) {
          groupKey = item.option ? item.option : 'רגיל / ללא חלב';
        }

        if (!summary[name].milkGroups[groupKey]) {
          summary[name].milkGroups[groupKey] = [];
        }

        summary[name].milkGroups[groupKey].push({
          customerName: order.customerName,
          option: item.option,
          milk: item.milk,
          orderTime: order.time
        });
      });
    });

    return Object.values(summary);
  }, [pendingDrinksOrders]);

  const totalDrinksToPrepare = useMemo(() => {
    return coffeeSummary.reduce((sum, item) => sum + item.totalCount, 0);
  }, [coffeeSummary]);

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
    const structuredItems = cart.map(item => {
      let desc = item.product.name;
      const details = [];
      if (item.selectedOption) details.push(item.selectedOption);
      if (item.selectedMilk) details.push(item.selectedMilk);
      
      const fullText = details.length > 0 ? `${desc} (${details.join(', ')})` : desc;
      const isFood = isFoodItem(item.product);

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: item.product.name,
        icon: getIcon(item.product.icon),
        option: item.selectedOption || null,
        milk: item.selectedMilk || null,
        isFood: isFood,
        text: fullText,
        completed: false
      };
    });

    const hasDrinks = structuredItems.some(i => !i.isFood);
    const hasFood = structuredItems.some(i => i.isFood);

    const newOrder = {
      customerName,
      items: structuredItems,
      hasDrinks,
      hasFood,
      drinksCompleted: !hasDrinks,
      foodCompleted: !hasFood,
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

  const completeDrinks = async (order) => {
    try {
      if (order.foodItems.length === 0 || order.foodCompleted) {
        // Entire order is finished
        await deleteDoc(doc(db, 'orders', order.id));
      } else {
        await updateDoc(doc(db, 'orders', order.id), {
          drinksCompleted: true
        });
      }
    } catch (err) {
      console.error('Error completing drinks:', err);
    }
  };

  const completeFood = async (order) => {
    try {
      if (order.drinkItems.length === 0 || order.drinksCompleted) {
        // Entire order is finished
        await deleteDoc(doc(db, 'orders', order.id));
      } else {
        await updateDoc(doc(db, 'orders', order.id), {
          foodCompleted: true
        });
      }
    } catch (err) {
      console.error('Error completing food:', err);
    }
  };

  const _completeOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.error('Error completing order:', err);
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

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim() && !reviewRating) return;

    try {
      const selectedObj = RATING_EMOJIS.find(r => r.level === reviewRating) || RATING_EMOJIS[4];
      await addDoc(collection(db, 'reviews'), {
        name: reviewName.trim() || customerName.trim() || 'אנונימי',
        text: reviewText.trim(),
        rating: reviewRating,
        emoji: selectedObj.emoji,
        label: selectedObj.label,
        timestamp: Date.now()
      });

      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewSubmitted(false);
        setReviewText('');
        setReviewName('');
        setReviewRating(5);
        setShowCustomerReviewModal(false);
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('אירעה שגיאה בשליחת המשוב, אנא נסו שוב.');
    }
  };

  const deleteReview = async (reviewId) => {
    if (window.confirm('האם למחוק ביקורת זו?')) {
      try {
        await deleteDoc(doc(db, 'reviews', reviewId));
      } catch (err) {
        console.error('Error deleting review:', err);
      }
    }
  };

  const formatReviewDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className={`app-container ${view === 'barista' ? 'app-container-wide' : ''}`} dir="rtl">
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

            {/* כפתור צף להשארת ביקורת בצד שמאל למטה */}
            <button 
              type="button" 
              className="fab-review-btn" 
              onClick={() => {
                if (customerName.trim() && !reviewName) setReviewName(customerName);
                setShowCustomerReviewModal(true);
              }}
              title="השאירו ביקורת 🗣️"
            >
              <span className="fab-review-icon">🗣️</span>
              <span className="fab-review-text">ביקורת</span>
            </button>
          </div>
        )}

        {view === 'barista' && isShirel && (
          <div className="barista-view glass-panel">
            <h1 className="title">העמדה של שיראל ✨</h1>
            
            <div className="barista-tabs">
              <button 
                className={baristaTab === 'orders' ? 'active' : ''} 
                onClick={() => setBaristaTab('orders')}
              >
                📋 לוח הזמנות ({pendingDrinksOrders.length + pendingFoodOrders.length})
              </button>
              <button 
                className={baristaTab === 'menu' ? 'active' : ''} 
                onClick={() => setBaristaTab('menu')}
              >
                ⚙️ ניהול תפריט
              </button>
            </div>

            {baristaTab === 'orders' && (
              <div className="barista-parallel-columns" style={{ display: 'flex', flexDirection: 'row', gap: '12px', width: '100%', alignItems: 'flex-start' }}>
                {/* עמודה 1: הזמנות שתייה */}
                <div className="barista-column drinks-col" style={{ flex: '1 1 0px', minWidth: 0 }}>
                  <div className="column-header-bar">
                    <div className="column-header-title">
                      <span>☕</span>
                      <span>הזמנות שתייה</span>
                    </div>
                    <span className="column-header-count drinks-count-badge">
                      {pendingDrinksOrders.length}
                    </span>
                  </div>

                  {pendingDrinksOrders.length === 0 ? (
                    <div className="empty-state">
                      <p>אין שתייה להכנה כרגע! 🎉</p>
                    </div>
                  ) : (
                    <div className="column-orders-list">
                      {pendingDrinksOrders.map(order => (
                        <div key={order.id} className="order-card order-card-drinks">
                          <div className="order-header">
                            <h2>{order.customerName}</h2>
                            <span className="order-time">{order.time}</span>
                          </div>

                          <ul className="order-items">
                            {order.drinkItems.map((item, idx) => (
                              <li key={idx}>🔸 {item.text || item.name}</li>
                            ))}
                          </ul>

                          <button 
                            className="btn-success" 
                            onClick={() => completeDrinks(order)}
                          >
                            סיימתי! ✅
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* עמודה 2: הזמנות מזון */}
                <div className="barista-column food-col" style={{ flex: '1 1 0px', minWidth: 0 }}>
                  <div className="column-header-bar">
                    <div className="column-header-title">
                      <span>🥪</span>
                      <span>הזמנות מזון</span>
                    </div>
                    <span className="column-header-count food-count-badge">
                      {pendingFoodOrders.length}
                    </span>
                  </div>

                  {pendingFoodOrders.length === 0 ? (
                    <div className="empty-state">
                      <p>אין מזון להכנה כרגע! 🎉</p>
                    </div>
                  ) : (
                    <div className="column-orders-list">
                      {pendingFoodOrders.map(order => (
                        <div key={order.id} className="order-card order-card-food">
                          <div className="order-header">
                            <h2>{order.customerName}</h2>
                            <span className="order-time">{order.time}</span>
                          </div>

                          <ul className="order-items">
                            {order.foodItems.map((item, idx) => (
                              <li key={idx}>🔸 {item.text || item.name}</li>
                            ))}
                          </ul>

                          <button 
                            className="btn-success" 
                            onClick={() => completeFood(order)}
                          >
                            סיימתי! ✅
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* עמודה 3: כמה מכל סוג קפה/שתייה להכין */}
                <div className="barista-column summary-col" style={{ flex: '1 1 0px', minWidth: 0 }}>
                  <div className="column-header-bar">
                    <div className="column-header-title">
                      <span>⚡</span>
                      <span>כמה להכין עכשיו</span>
                    </div>
                    <span className="column-header-count summary-count-badge">
                      {totalDrinksToPrepare} כוסות
                    </span>
                  </div>

                  {coffeeSummary.length === 0 ? (
                    <div className="empty-state">
                      <p>אין קפה בתור כרגע! ☕</p>
                    </div>
                  ) : (
                    <div className="column-orders-list">
                      {coffeeSummary.map(item => (
                        <div key={item.name} className="summary-card">
                          <div className="summary-card-header">
                            <div className="summary-card-title">
                              <span>{item.icon}</span>
                              <span>{item.name}</span>
                            </div>
                            <span className="summary-card-total">
                              {item.totalCount} {item.totalCount === 1 ? 'כוס' : 'כוסות'}
                            </span>
                          </div>

                          <div className="summary-groups-list">
                            {Object.entries(item.milkGroups).map(([groupKey, ordersList]) => (
                              <div key={groupKey} className="summary-group-row">
                                <span className="summary-group-name">
                                  {groupKey.includes('חלב') ? '🥛 ' : '🔸 '}{groupKey}: <strong>{ordersList.length}</strong>
                                </span>
                                <span className="summary-group-customers" title={ordersList.map(o => o.customerName).join(', ')}>
                                  ({ordersList.map(o => o.customerName).join(', ')})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                                const { id: _id, ...itemData } = item;
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
                    {[...products]
                      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'))
                      .map(product => (
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
            {/* כפתור צף לצפייה בביקורות בעמדת שיראל */}
            <button 
              type="button" 
              className="fab-review-btn barista-fab-review" 
              onClick={() => setShowBaristaReviewModal(true)}
              title="ביקורות לקוחות 🗣️"
            >
              <span className="fab-review-icon">🗣️</span>
              {reviews.length > 0 && <span className="fab-review-badge">{reviews.length}</span>}
              <span className="fab-review-text">ביקורות</span>
            </button>
          </div>
        )}

        {/* מודאל השארת ביקורת ללקוח */}
        {showCustomerReviewModal && (
          <div className="review-modal-backdrop" onClick={() => !reviewSubmitted && setShowCustomerReviewModal(false)}>
            <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="review-modal-header">
                <h2 className="review-modal-title">
                  <span>🗣️</span>
                  <span>ספרו לנו מה דעתכם!</span>
                </h2>
                <button 
                  type="button" 
                  className="btn-close-modal" 
                  onClick={() => setShowCustomerReviewModal(false)}
                  disabled={reviewSubmitted}
                >
                  ✕
                </button>
              </div>

              <div className="review-modal-body">
                {reviewSubmitted ? (
                  <div className="review-success-banner">
                    <h3>תודה רבה על הביקורת! ❤️</h3>
                    <p>המשוב שלכם עוזר לנו להשתפר ולהעניק את השירות הטוב ביותר ✨</p>
                  </div>
                ) : (
                  <form onSubmit={submitReview} className="review-form">
                    <div className="review-input-group">
                      <label className="review-label">השם שלכם (לא חובה):</label>
                      <input 
                        type="text" 
                        className="review-text-input" 
                        placeholder="איך לקרוא לכם?" 
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                      />
                    </div>

                    <div className="review-input-group">
                      <label className="review-label">מלל חופשי:</label>
                      <textarea 
                        className="review-text-input review-textarea" 
                        placeholder="ספרו לנו על הטעם, השירות, האווירה או כל מה שתרצו..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="emoji-rating-box">
                      <span className="emoji-rating-legend">דרגו אותנו במקום כוכבים:</span>
                      
                      <div className="emoji-rating-row">
                        {RATING_EMOJIS.map((item) => (
                          <button
                            key={item.level}
                            type="button"
                            className={`emoji-option-btn ${reviewRating === item.level ? 'selected' : ''}`}
                            onClick={() => setReviewRating(item.level)}
                            title={item.label}
                          >
                            <span className="emoji-char">{item.emoji}</span>
                            <span className="emoji-level-num">{item.level}</span>
                          </button>
                        ))}
                      </div>

                      <div className="selected-rating-description">
                        <span>{RATING_EMOJIS.find(r => r.level === reviewRating)?.emoji}</span>
                        <span>{RATING_EMOJIS.find(r => r.level === reviewRating)?.label}</span>
                      </div>
                    </div>

                    <button type="submit" className="btn-submit-review">
                      <span>שליחת ביקורת</span>
                      <span>✨</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* מודאל צפייה בביקורות לשיראל */}
        {showBaristaReviewModal && isShirel && (
          <div className="review-modal-backdrop" onClick={() => setShowBaristaReviewModal(false)}>
            <div className="review-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
              <div className="review-modal-header">
                <h2 className="review-modal-title">
                  <span>🗣️</span>
                  <span>ביקורות לקוחות ({reviews.length})</span>
                </h2>
                <button 
                  type="button" 
                  className="btn-close-modal" 
                  onClick={() => setShowBaristaReviewModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="review-modal-body">
                {reviews.length === 0 ? (
                  <div className="barista-review-empty">
                    <div className="barista-review-empty-icon">☕✨</div>
                    <h3>אין ביקורות עדיין</h3>
                    <p>כאשר לקוחות ישלחו ביקורות מהתפריט, הן יופיעו כאן בזמן אמת!</p>
                  </div>
                ) : (
                  <div className="barista-reviews-container">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="barista-review-card">
                        <div className="barista-review-header">
                          <div className="reviewer-info">
                            <span className="reviewer-name">{rev.name || 'אנונימי'}</span>
                            {rev.timestamp && (
                              <span className="review-date-badge">{formatReviewDate(rev.timestamp)}</span>
                            )}
                          </div>
                          
                          <div className="review-actions">
                            <span className={`review-rating-pill rating-pill-${rev.rating || 5}`}>
                              <span>{rev.emoji || '⭐'}</span>
                              <span>{rev.rating ? `${rev.rating}/5` : ''}</span>
                            </span>
                            <button 
                              type="button" 
                              className="btn-delete-review" 
                              onClick={() => deleteReview(rev.id)}
                              title="מחק ביקורת זו"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {rev.text ? (
                          <div className="barista-review-content">
                            "{rev.text}"
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            (דירוג בלבד ללא מלל)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
