import React, { useState, useEffect } from 'react';
import { 
  CompassIcon, 
  UsersIcon, 
  TrophyIcon, 
  MessageSquareIcon, 
  UserIcon, 
  StarIcon, 
  CalendarIcon, 
  MapPinIcon, 
  ChefHatIcon, 
  HeartIcon, 
  CheckIcon, 
  PlusIcon,
  ShieldIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
  EditIcon,
  MapIcon
} from './icons';
import { INITIAL_USER } from './mockData';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';

function App() {
  const [activeTab, setActiveTab] = useState('meals'); // profile, meals, chats
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // App data state
  const [userProfile, setUserProfile] = useState(null);
  const [usersCache, setUsersCache] = useState({});
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Meals state
  const [allMeals, setAllMeals] = useState([]);
  const [showCreateMeal, setShowCreateMeal] = useState(false);
  const [filterMatchingOnly, setFilterMatchingOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10); // default 10km limit

  // New Meal form state
  const [newMealName, setNewMealName] = useState('');
  const [newMealArea, setNewMealArea] = useState('');
  const [newMealDate, setNewMealDate] = useState('');
  const [newMealDescription, setNewMealDescription] = useState('');
  const [newMealMaxGuests, setNewMealMaxGuests] = useState(4);
  const [newMealPreferences, setNewMealPreferences] = useState([]);

  // Chat state
  const [selectedMealIdForChat, setSelectedMealIdForChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        let profile;
        if (userDoc.exists()) {
          profile = userDoc.data();
          if (!profile.dietaryRestrictions) {
            profile.dietaryRestrictions = [];
          }
        } else {
          profile = {
            ...INITIAL_USER,
            id: currentUser.uid,
            name: currentUser.email.split('@')[0],
            image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`,
            badges: ['verified', 'chef'], // default credentials
            dietaryRestrictions: []
          };
          await setDoc(userDocRef, profile);
        }
        setUserProfile(profile);
        loadUsersCache();
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch users cache
  const loadUsersCache = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const cache = {};
      querySnapshot.forEach(doc => {
        cache[doc.id] = doc.data();
      });
      setUsersCache(cache);
    } catch (e) {
      console.error("Error fetching users cache:", e);
    }
  };

  // Real-time listener for Meals
  useEffect(() => {
    if (!user) return;

    const mealsQuery = query(collection(db, 'meals'), orderBy('createdAt', 'desc'));
    const unsubscribeMeals = onSnapshot(mealsQuery, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAllMeals(list);
    });

    return unsubscribeMeals;
  }, [user]);

  // Real-time listener for Chat Room (Filtered by selected meal)
  useEffect(() => {
    if (!user || !selectedMealIdForChat) {
      setChatMessages([]);
      return;
    }

    const chatQuery = query(
      collection(db, 'chats'), 
      where('mealId', '==', selectedMealIdForChat),
      orderBy('timestamp_ms', 'asc')
    );
    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setChatMessages(msgs);
    });
    return unsubscribe;
  }, [user, selectedMealIdForChat]);

  // Create new meal
  const handleCreateMeal = async (e) => {
    e.preventDefault();
    if (!newMealName.trim() || !newMealArea.trim() || !user) return;

    try {
      const newMeal = {
        name: newMealName,
        area: newMealArea,
        date: newMealDate || 'טרם נקבע מועד',
        description: newMealDescription,
        hostId: user.uid,
        preferences: newMealPreferences,
        maxGuests: parseInt(newMealMaxGuests) || 4,
        participants: [user.uid],
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'meals'), newMeal);
      
      // Reset form
      setNewMealName('');
      setNewMealArea('');
      setNewMealDate('');
      setNewMealDescription('');
      setNewMealMaxGuests(4);
      setNewMealPreferences([]);
      setShowCreateMeal(false);
      loadUsersCache();
    } catch (e) {
      console.error("Error creating meal:", e);
    }
  };

  // Join existing meal
  const handleJoinMeal = async (mealId) => {
    if (!user) return;
    try {
      const mealDocRef = doc(db, 'meals', mealId);
      const mealSnap = await getDoc(mealDocRef);
      if (!mealSnap.exists()) return;

      const data = mealSnap.data();
      if (data.participants.includes(user.uid)) return;
      if (data.participants.length >= data.maxGuests) {
        alert("הארוחה מלאה!");
        return;
      }

      const updatedParticipants = [...data.participants, user.uid];
      await updateDoc(mealDocRef, {
        participants: updatedParticipants
      });
      loadUsersCache();
    } catch (e) {
      console.error("Error joining meal:", e);
    }
  };

  // Leave meal
  const handleLeaveMeal = async (mealId) => {
    if (!user) return;
    try {
      const mealDocRef = doc(db, 'meals', mealId);
      const mealSnap = await getDoc(mealDocRef);
      if (!mealSnap.exists()) return;

      const data = mealSnap.data();
      const updatedParticipants = data.participants.filter(p => p !== user.uid);

      if (updatedParticipants.length === 0) {
        await deleteDoc(mealDocRef);
      } else {
        const updates = { participants: updatedParticipants };
        if (data.hostId === user.uid) {
          // Assign next participant as host
          updates.hostId = updatedParticipants[0];
        }
        await updateDoc(mealDocRef, updates);
      }
      
      if (selectedMealIdForChat === mealId) {
        setSelectedMealIdForChat(null);
      }
    } catch (e) {
      console.error("Error leaving meal:", e);
    }
  };

  // Auth actions
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Save profile
  const handleSaveProfile = async (updatedProfile) => {
    setUserProfile(updatedProfile);
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, updatedProfile);
      setUsersCache(prev => ({ ...prev, [user.uid]: updatedProfile }));
    } catch (e) {
      console.error("Error saving profile:", e);
    }
  };

  // Send chat message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user || !selectedMealIdForChat) return;

    try {
      await addDoc(collection(db, 'chats'), {
        mealId: selectedMealIdForChat,
        userId: user.uid,
        text: newMessageText,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        timestamp_ms: Date.now()
      });
      setNewMessageText('');
    } catch (e) {
      console.error("Error sending message:", e);
    }
  };

  // Helper to fetch user details
  const getUserById = (id) => {
    if (id === user?.uid) return userProfile || INITIAL_USER;
    return usersCache[id] || {
      name: 'בשלן אורח',
      image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${id}`,
      neighborhood: 'שכונה כללית',
      city: 'עיר',
      bio: 'חובב אוכל מושבע.',
      allergies: [],
      dietaryRestrictions: [],
      signatureDish: 'טרם נרשמה',
      hostingStyle: 'חם ומזמין',
      badges: ['verified']
    };
  };

  // Render Badges
  const renderBadges = (badgesList) => {
    const list = badgesList || ['verified'];
    return (
      <div className="badge-container" style={{ justifyContent: 'center' }}>
        {list.includes('verified') && (
          <span className="badge badge-verified" title="חשבון מאומת - הוגש צילום תעודה מזהה">
            ✓ מאומת
          </span>
        )}
        {list.includes('gold') && (
          <span className="badge badge-gold" title="מארח זהב - דירוג ממוצע 9.5 ומעלה בסבבים קודמים">
            ★ מארח זהב
          </span>
        )}
        {list.includes('chef') && (
          <span className="badge badge-chef" title="שף מצטיין - זכה במקום הראשון בסבב">
            🍳 שף מצטיין
          </span>
        )}
      </div>
    );
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', direction: 'rtl' }}>
        <ChefHatIcon style={{ width: '48px', height: '48px', color: 'var(--primary)', animation: 'spin 2s linear infinite' }} />
        <p style={{ marginTop: '16px', fontWeight: 'bold' }}>טוען נתונים...</p>
      </div>
    );
  }

  // Not Logged In Screen
  if (!user) {
    return (
      <div className="app-container" style={{ direction: 'rtl' }}>
        <header className="app-header" style={{ justifyContent: 'center' }}>
          <div className="logo-container">
            <ChefHatIcon style={{ color: 'var(--primary)' }} />
            <h1 className="logo-text">בואו לאכול איתי</h1>
          </div>
        </header>

        <main className="app-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <div className="card">
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
              {isRegistering ? 'יצירת פרופיל קולינרי חדש' : 'כניסה למערכת'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
              הצטרף לארוחות ערב מדהימות והכר חברים חדשים בשכונתך
            </p>

            <form onSubmit={handleAuth}>
              <div className="form-group">
                <label>כתובת אימייל</label>
                <input 
                  type="email" className="input-field" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div className="form-group">
                <label>סיסמה (לפחות 6 תווים)</label>
                <input 
                  type="password" className="input-field" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                />
              </div>

              {authError && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '14px', textAlign: 'right' }}>
                  שגיאה: {authError}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ marginBottom: '14px' }}>
                {isRegistering ? 'הרשם וצור פרופיל' : 'התחבר לחשבון'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '13px' }}>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError('');
                }}
              >
                {isRegistering ? 'יש לך כבר חשבון? התחבר כאן' : 'אין לך פרופיל? צור חשבון חדש'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleSignOut} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="התנתק"
          >
            <LogOutIcon style={{ width: '18px', height: '18px' }} />
          </button>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="החלף ערכת נושא"
          >
            {theme === 'dark' ? <SunIcon style={{ width: '18px', height: '18px' }} /> : <MoonIcon style={{ width: '18px', height: '18px' }} />}
          </button>
        </div>
        <div className="logo-container">
          <ChefHatIcon style={{ color: 'var(--primary)' }} />
          <h1 className="logo-text">בואו לאכול איתי</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-content">

        {/* Tab 1: Personal Profile */}
        {activeTab === 'profile' && userProfile && (
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src={userProfile.image} alt={userProfile.name} className="avatar-large" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{userProfile.name}</h3>
              {renderBadges(userProfile.badges)}
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                שכונת {userProfile.neighborhood || 'תל אביב'}, {userProfile.city || 'תל אביב'}
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '13px' }}>העדפות תזונה (סנן והצע ארוחות לפיהן)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {['כשר', 'טבעוני', 'צמחוני', 'ללא גלוטן', 'ללא לקטוז'].map(pref => {
                    const isSelected = (userProfile.dietaryRestrictions || []).includes(pref);
                    return (
                      <button
                        key={pref}
                        type="button"
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                          background: isSelected ? 'rgba(255, 94, 54, 0.15)' : 'var(--bg-input)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => {
                          const current = userProfile.dietaryRestrictions || [];
                          const updated = current.includes(pref) 
                            ? current.filter(p => p !== pref) 
                            : [...current, pref];
                          handleSaveProfile({ ...userProfile, dietaryRestrictions: updated });
                        }}
                      >
                        {pref}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>שם מלא</label>
                <input 
                  type="text" className="input-field" 
                  value={userProfile.name}
                  onChange={(e) => handleSaveProfile({ ...userProfile, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>עיר מגורים</label>
                <input 
                  type="text" className="input-field" 
                  value={userProfile.city}
                  onChange={(e) => handleSaveProfile({ ...userProfile, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>שכונה</label>
                <input 
                  type="text" className="input-field" 
                  value={userProfile.neighborhood}
                  onChange={(e) => handleSaveProfile({ ...userProfile, neighborhood: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>ספר קצת על עצמך</label>
                <textarea 
                  className="input-field" rows="3"
                  value={userProfile.bio}
                  onChange={(e) => handleSaveProfile({ ...userProfile, bio: e.target.value })}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-group">
                <label>מנת דגל</label>
                <input 
                  type="text" className="input-field" 
                  value={userProfile.signatureDish}
                  onChange={(e) => handleSaveProfile({ ...userProfile, signatureDish: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>סגנון אירוח מועדף</label>
                <input 
                  type="text" className="input-field" 
                  value={userProfile.hostingStyle}
                  onChange={(e) => handleSaveProfile({ ...userProfile, hostingStyle: e.target.value })}
                />
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Meals (List view, suggestion by picks, join/create) */}
        {activeTab === 'meals' && userProfile && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>ארוחות פתוחות בשכונה</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  הצטרף לארוחה קיימת או פתח אחת משלך
                </p>
              </div>
              <button 
                onClick={() => setShowCreateMeal(!showCreateMeal)} 
                className="btn-primary" 
                style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                צור ארוחה
              </button>
            </div>

            {/* Create Meal Form */}
            {showCreateMeal && (
              <div className="card" style={{ borderLeft: '4px solid var(--primary)', animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '14px' }}>פתח ארוחה חדשה</h3>
                <form onSubmit={handleCreateMeal}>
                  <div className="form-group">
                    <label>שם הארוחה</label>
                    <input 
                      type="text" className="input-field" required
                      placeholder="למשל: סעודת בשרים מעושנים במרפסת"
                      value={newMealName} onChange={(e) => setNewMealName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>אזור / שכונה</label>
                    <input 
                      type="text" className="input-field" required
                      placeholder="למשל: פלורנטין, תל אביב"
                      value={newMealArea} onChange={(e) => setNewMealArea(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>תאריך ושעה</label>
                    <input 
                      type="text" className="input-field" required
                      placeholder="למשל: יום שישי, 21 באוגוסט ב-20:00"
                      value={newMealDate} onChange={(e) => setNewMealDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>תיאור הארוחה / תפריט מתוכנן</label>
                    <textarea 
                      className="input-field" rows="3" required
                      placeholder="ספר קצת על האוכל, מה תבשלו ומה האווירה..."
                      value={newMealDescription} onChange={(e) => setNewMealDescription(e.target.value)}
                      style={{ resize: 'none' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>כמות אורחים מקסימלית (כולל אותך)</label>
                    <input 
                      type="number" className="input-field" required min="2" max="12"
                      value={newMealMaxGuests} onChange={(e) => setNewMealMaxGuests(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>מאפייני הארוחה (העדפות מותאמות)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['כשר', 'טבעוני', 'צמחוני', 'ללא גלוטן', 'ללא לקטוז'].map(pref => {
                        const isSelected = newMealPreferences.includes(pref);
                        return (
                          <button
                            key={pref}
                            type="button"
                            style={{
                              padding: '4px 10px',
                              borderRadius: '16px',
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                              background: isSelected ? 'rgba(255, 94, 54, 0.15)' : 'var(--bg-input)',
                              color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => {
                              setNewMealPreferences(prev => 
                                prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
                              );
                            }}
                          >
                            {pref}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>פרסם ארוחה</button>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateMeal(false)} 
                      className="btn-primary" 
                      style={{ flex: 1, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filter Toggle */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>התאמה תזונתית בלבד</span>
                <label className="switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={filterMatchingOnly} 
                    onChange={(e) => setFilterMatchingOnly(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '34px',
                    height: '18px',
                    borderRadius: '9px',
                    background: filterMatchingOnly ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    position: 'relative',
                    transition: 'background 0.3s'
                  }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '2px',
                      right: filterMatchingOnly ? '18px' : '2px',
                      transition: 'right 0.3s'
                    }}></div>
                  </div>
                </label>
              </div>
            </div>

            {/* Distance Slider Card */}
            <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', background: 'var(--bg-input)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>טווח מרחק מבוקש:</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {maxDistance >= 10 ? 'ללא הגבלה' : `${maxDistance} ק"מ`}
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1"
                value={maxDistance} 
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--primary)',
                  cursor: 'pointer',
                  height: '6px',
                  borderRadius: '3px',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>1 ק"מ</span>
                <span>3 ק"מ</span>
                <span>5 ק"m</span>
                <span>ללא הגבלה</span>
              </div>
            </div>

            {/* Meals List */}
            <div>
              {(() => {
                const userPrefs = userProfile.dietaryRestrictions || [];
                
                // Helper to check match
                const getMealMatchScore = (meal) => {
                  if (userPrefs.length === 0) return 1; // Match all if user has no prefs
                  const mealPrefs = meal.preferences || [];
                  const matchingCount = userPrefs.filter(p => mealPrefs.includes(p)).length;
                  return matchingCount / userPrefs.length;
                };

                // Helper to calculate distance
                const getDistance = (area1, area2) => {
                  if (!area1 || !area2) return 0.5;
                  
                  const cleanStr = (str) => {
                    return str.replace('שכונת ', '').replace(', תל אביב', '').replace(' תל אביב', '').trim();
                  };

                  const cleanArea1 = cleanStr(area1);
                  const cleanArea2 = cleanStr(area2);

                  if (cleanArea1 === cleanArea2) return 0.2;

                  const locationCoords = {
                    'פלורנטין': { x: 35, y: 70 },
                    'נווה צדק': { x: 20, y: 55 },
                    'כרם התימנים': { x: 45, y: 35 },
                    'צפון ישן': { x: 75, y: 15 },
                    'רוטשילד': { x: 60, y: 50 }
                  };

                  const c1 = locationCoords[cleanArea1] || { x: 50, y: 50 };
                  const c2 = locationCoords[cleanArea2] || { x: 50, y: 50 };

                  const dx = c1.x - c2.x;
                  const dy = c1.y - c2.y;
                  const rawDist = Math.sqrt(dx * dx + dy * dy);
                  const km = Math.round((rawDist * 0.08) * 10) / 10;
                  return km === 0 ? 0.3 : km;
                };

                // Sort: matching score descending, then distance
                const processedMeals = allMeals
                  .map(meal => {
                    const score = getMealMatchScore(meal);
                    const isPerfectMatch = userPrefs.every(p => (meal.preferences || []).includes(p));
                    const distance = getDistance(userProfile.neighborhood, meal.area);
                    return { ...meal, score, isPerfectMatch, distance };
                  })
                  .filter(meal => {
                    if (filterMatchingOnly && !meal.isPerfectMatch) {
                      return false;
                    }
                    if (maxDistance < 10 && meal.distance > maxDistance) {
                      return false;
                    }
                    return true;
                  })
                  .sort((a, b) => b.score - a.score);

                if (processedMeals.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <ChefHatIcon style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', opacity: 0.5 }} />
                      <p style={{ fontSize: '14px' }}>לא נמצאו ארוחות מתאימות לטווח ולסינון שנבחרו.</p>
                    </div>
                  );
                }

                return processedMeals.map(meal => {
                  const host = getUserById(meal.hostId);
                  const isParticipant = meal.participants.includes(user.uid);
                  const isFull = meal.participants.length >= meal.maxGuests;

                  return (
                    <div key={meal.id} className="card" style={{ 
                      borderLeft: meal.isPerfectMatch && userPrefs.length > 0 ? '4px solid #10b981' : '1px solid var(--border-color)',
                      transition: 'transform 0.2s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{meal.name}</h3>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPinIcon style={{ width: '12px', height: '12px' }} /> {meal.area} • {meal.distance} ק"מ
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CalendarIcon style={{ width: '12px', height: '12px' }} /> {meal.date}
                            </span>
                          </div>
                        </div>

                        {meal.isPerfectMatch && userPrefs.length > 0 && (
                          <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                            ✓ מתאים להעדפותיך
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '12px', lineHeight: '1.5' }}>
                        {meal.description}
                      </p>

                      {/* Preference Tags */}
                      {meal.preferences && meal.preferences.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                          {meal.preferences.map(pref => {
                            const isUserPref = userPrefs.includes(pref);
                            return (
                              <span key={pref} style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isUserPref ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)',
                                color: isUserPref ? '#10b981' : 'var(--text-muted)',
                                border: isUserPref ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                                fontWeight: isUserPref ? 'bold' : 'normal'
                              }}>
                                {pref}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Participant avatars and actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '-6px', flexWrap: 'wrap' }}>
                            {meal.participants.map(pId => {
                              const u = getUserById(pId);
                              return (
                                <img 
                                  key={pId} src={u.image} alt={u.name} 
                                  className="avatar-small" 
                                  title={`${u.name} ${meal.hostId === pId ? '(מארח)' : ''}`} 
                                  style={{ border: '2px solid var(--bg-card)', marginLeft: '-8px' }} 
                                />
                              );
                            })}
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '6px' }}>
                            {meal.participants.length}/{meal.maxGuests} משתתפים
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {isParticipant ? (
                            <>
                              <button 
                                onClick={() => {
                                  setSelectedMealIdForChat(meal.id);
                                  setActiveTab('chats');
                                }}
                                className="btn-primary" 
                                style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                              >
                                צ'אט
                              </button>
                              <button 
                                onClick={() => handleLeaveMeal(meal.id)}
                                className="btn-primary" 
                                style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', background: '#ef4444' }}
                              >
                                עזוב
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleJoinMeal(meal.id)}
                              disabled={isFull}
                              className="btn-primary" 
                              style={{ width: 'auto', padding: '6px 14px', fontSize: '12px', background: isFull ? 'rgba(255,255,255,0.05)' : 'var(--primary)', color: isFull ? 'var(--text-muted)' : '#fff' }}
                            >
                              {isFull ? 'מלא' : 'הצטרף'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Tab 3: Chats Room */}
        {activeTab === 'chats' && userProfile && (
          <div className="chat-container">
            {selectedMealIdForChat ? (
              /* Chat Screen for Selected Meal */
              (() => {
                const activeMeal = allMeals.find(m => m.id === selectedMealIdForChat);
                if (!activeMeal) {
                  setSelectedMealIdForChat(null);
                  return null;
                }
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '10px', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSelectedMealIdForChat(null)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', transform: 'rotate(180deg)' }}
                      >
                        ➜
                      </button>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 'bold' }}>{activeMeal.name} - צ'אט</h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeMeal.participants.length} חברים בקבוצה</span>
                      </div>
                    </div>

                    <div className="chat-messages" style={{ height: 'calc(100vh - 290px)' }}>
                      {chatMessages.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
                          אין הודעות בקבוצה עדיין. התחילו לדבר!
                        </p>
                      ) : (
                        chatMessages.map(msg => {
                          const isMine = msg.userId === user.uid;
                          const sender = getUserById(msg.userId);

                          return (
                            <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : 'other'}`}>
                              {!isMine && <div className="chat-sender">{sender.name}</div>}
                              <div>{msg.text}</div>
                              <span className="chat-time">{msg.timestamp}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <form onSubmit={handleSendMessage} className="chat-input-bar">
                      <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 20px', fontSize: '14px' }}>שלח</button>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="כתוב הודעה לקבוצה..."
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        style={{ textAlign: 'right' }}
                      />
                    </form>
                  </div>
                );
              })()
            ) : (
              /* List of Joined/Created Meals Chats */
              <div>
                <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', textAlign: 'right' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800' }}>הצ'אטים שלי</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>עבור לאחת הארוחות שהצטרפת אליהן כדי לתאם פרטים</p>
                </div>

                {(() => {
                  const joined = allMeals.filter(m => m.participants.includes(user.uid));
                  if (joined.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <MessageSquareIcon style={{ width: '48px', height: '48px', color: 'var(--text-muted)', marginBottom: '16px', margin: '0 auto' }} />
                        <h3>אין צ'אטים פעילים</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                          כדי להתחיל לדבר עם בשלנים אחרים, עליך להצטרף לארוחה כלשהי!
                        </p>
                        <button className="btn-primary" style={{ marginTop: '20px', width: 'auto', padding: '10px 20px' }} onClick={() => setActiveTab('meals')}>עבור לארוחות הפתוחות</button>
                      </div>
                    );
                  }

                  return joined.map(meal => {
                    const host = getUserById(meal.hostId);
                    return (
                      <div 
                        key={meal.id} 
                        className="card" 
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', hover: 'background: rgba(255,255,255,0.02)' }}
                        onClick={() => setSelectedMealIdForChat(meal.id)}
                      >
                        <img src={host.image} alt={host.name} className="avatar-medium" />
                        <div style={{ flex: 1, textAlign: 'right' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>{meal.name}</h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>מארח: {host.name.split(' ')[0]} • {meal.participants.length} משתתפים</span>
                        </div>
                        <span style={{ color: 'var(--primary)', fontSize: '18px' }}>➜</span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="app-nav">
        <button className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>
          <MessageSquareIcon />
          <span>צ'אטים</span>
        </button>
        <button className={`nav-item ${activeTab === 'meals' ? 'active' : ''}`} onClick={() => {
          setActiveTab('meals');
          setSelectedMealIdForChat(null);
        }}>
          <ChefHatIcon />
          <span>ארוחות</span>
        </button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <UserIcon />
          <span>פרופיל אישי</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
