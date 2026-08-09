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
  ShieldIcon 
} from './icons';
import { INITIAL_USER, MOCK_USERS, MOCK_CYCLES, MOCK_CHAT } from './mockData';

function App() {
  const [activeTab, setActiveTab] = useState('group'); // group, chat, scoring, leaderboard, profile
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('culinary_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });
  
  const [cycleData, setCycleData] = useState(() => {
    const saved = localStorage.getItem('culinary_cycle');
    return saved ? JSON.parse(saved) : MOCK_CYCLES[0];
  });

  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem('culinary_chat');
    return saved ? JSON.parse(saved) : MOCK_CHAT;
  });

  const [newMessageText, setNewMessageText] = useState('');
  
  // Scoring state
  const [selectedDinnerToScore, setSelectedDinnerToScore] = useState(null);
  const [foodGrade, setFoodGrade] = useState(8);
  const [hospitalityGrade, setHospitalityGrade] = useState(8);
  const [atmosphereGrade, setAtmosphereGrade] = useState(8);

  useEffect(() => {
    localStorage.setItem('culinary_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('culinary_cycle', JSON.stringify(cycleData));
  }, [cycleData]);

  useEffect(() => {
    localStorage.setItem('culinary_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const getUserById = (id) => {
    if (id === 'currentUser') return userProfile;
    return MOCK_USERS.find(u => u.id === id) || { name: 'משתתף נוסף', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' };
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg = {
      id: `m_${Date.now()}`,
      userId: 'currentUser',
      text: newMessageText,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages([...chatMessages, newMsg]);
    setNewMessageText('');

    // Trigger auto reply simulation after 1.5 seconds for demo feel
    setTimeout(() => {
      const replies = [
        "וואו, נשמע מעולה!",
        "אני ממש מחכה לזה.",
        "אל תשכחו להגיע בזמן :)",
        "הכי טוב חריף!",
        "תודה רבה על התיאום!"
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const randomUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      
      const replyMsg = {
        id: `m_${Date.now() + 1}`,
        userId: randomUser.id,
        text: replyMsgTextOverride(randomUser.id, randomReply),
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, replyMsg]);
    }, 1500);
  };

  const replyMsgTextOverride = (userId, defaultText) => {
    if (userId === 'user2') return "אשמח לדעת אם יהיו מנות ללא גלוטן :)";
    return defaultText;
  };

  const submitScore = () => {
    if (!selectedDinnerToScore) return;
    
    const updatedDinners = cycleData.dinners.map(dinner => {
      if (dinner.id === selectedDinnerToScore.id) {
        return {
          ...dinner,
          ratings: {
            ...dinner.ratings,
            currentUser: { food: foodGrade, hospitality: hospitalityGrade, atmosphere: atmosphereGrade }
          }
        };
      }
      return dinner;
    });

    setCycleData({
      ...cycleData,
      dinners: updatedDinners
    });
    
    setSelectedDinnerToScore(null);
    setActiveTab('leaderboard');
  };

  // Calculate scores for leaderboard
  const getLeaderboard = () => {
    const scores = cycleData.participants.map(pId => {
      const user = getUserById(pId);
      const dinner = cycleData.dinners.find(d => d.hostId === pId);
      
      let totalPoints = 0;
      let voterCount = 0;

      if (dinner && dinner.ratings) {
        Object.values(dinner.ratings).forEach(r => {
          totalPoints += r.food + r.hospitality + r.atmosphere;
          voterCount++;
        });
      }

      // Calculate average (out of 30 points max per voter)
      const averageScore = voterCount > 0 ? (totalPoints / voterCount).toFixed(1) : 'טרם דורג';

      return {
        id: pId,
        user,
        averageScore: averageScore === 'טרם דורג' ? 0 : parseFloat(averageScore),
        displayScore: averageScore,
        voters: voterCount
      };
    });

    return scores.sort((a, b) => b.averageScore - a.averageScore);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={userProfile.image} alt={userProfile.name} className="avatar-small" />
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>היי, {userProfile.name}</span>
        </div>
        <div className="logo-container">
          <ChefHatIcon style={{ color: 'var(--primary)' }} />
          <h1 className="logo-text">בואו לאכול איתי</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-content">
        
        {/* Tab 1: Group dinner cycle */}
        {activeTab === 'group' && (
          <div>
            <div style={{ marginBottom: '20px', textAlign: 'right' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{cycleData.name}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                סבב ארוחות פעיל באיזור {cycleData.location}
              </p>
            </div>

            {/* Participants summary */}
            <div className="card" style={{ padding: '12px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--secondary)' }}>חברי הסבב שלך:</h3>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-around' }}>
                {cycleData.participants.map(pId => {
                  const user = getUserById(pId);
                  return (
                    <div key={pId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <img src={user.image} alt={user.name} className="avatar-medium" style={{ border: pId === 'currentUser' ? '2px solid var(--primary)' : '2px solid transparent' }} />
                      <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{user.name.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dinners List */}
            {cycleData.dinners.map((dinner, idx) => {
              const host = getUserById(dinner.hostId);
              const isCurrentUser = dinner.hostId === 'currentUser';
              const hasVoted = dinner.ratings && dinner.ratings.currentUser;
              
              return (
                <div key={dinner.id} className="card" style={{ borderLeft: dinner.status === 'completed' ? '4px solid #10b981' : '4px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={host.image} alt={host.name} className="avatar-medium" />
                      <div style={{ textAlign: 'right' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>האירוח של {host.name}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dinner.date}</span>
                      </div>
                    </div>
                    <div>
                      {dinner.status === 'completed' ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>הושלם</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: 'rgba(255, 94, 54, 0.15)', color: 'var(--primary)' }}>בקרוב</span>
                      )}
                    </div>
                  </div>

                  {/* Profile snippet of host for trust */}
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px', marginBottom: '12px', textAlign: 'right', fontSize: '13px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <MapPinIcon width="14" height="14" style={{ color: '#3b82f6' }} />
                      <span style={{ fontWeight: '500' }}>{host.neighborhood}, {host.city}</span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <ShieldIcon width="14" height="14" style={{ color: '#10b981' }} />
                      <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 'bold' }}>פרופיל מאומת</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                      "{host.bio}"
                    </p>
                  </div>

                  {/* Culinary preferences check */}
                  {(host.allergies.length > 0 || host.dietaryRestrictions.length > 0) && (
                    <div className="badge-container" style={{ marginBottom: '12px' }}>
                      {host.dietaryRestrictions.map((d, i) => (
                        <span key={i} className="badge badge-diet">{d}</span>
                      ))}
                      {host.allergies.map((a, i) => (
                        <span key={i} className="badge badge-allergy">אלרגיה ל{a}</span>
                      ))}
                    </div>
                  )}

                  {/* Menu details */}
                  <div style={{ textAlign: 'right', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--secondary)' }}>
                      <ChefHatIcon width="16" height="16" />
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>התפריט המתוכנן:</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                      <div><strong style={{ color: 'var(--primary)' }}>מנה ראשונה:</strong> {dinner.menu.appetizer}</div>
                      <div><strong style={{ color: 'var(--primary)' }}>מנה עיקרית:</strong> {dinner.menu.main}</div>
                      <div><strong style={{ color: 'var(--primary)' }}>קינוח:</strong> {dinner.menu.dessert}</div>
                    </div>
                  </div>

                  {/* Actions (Vote/Status) */}
                  {dinner.status === 'completed' && !isCurrentUser && (
                    <div style={{ marginTop: '12px' }}>
                      {hasVoted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 'bold', justifyContent: 'center' }}>
                          <CheckIcon />
                          <span>דירגת אירוח זה!</span>
                        </div>
                      ) : (
                        <button 
                          className="btn-primary" 
                          style={{ padding: '8px 12px', fontSize: '13px' }}
                          onClick={() => {
                            setSelectedDinnerToScore(dinner);
                            setActiveTab('scoring');
                          }}
                        >
                          דרג את האירוח
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Live Scoring/Voting Panel */}
        {activeTab === 'scoring' && (
          <div>
            {selectedDinnerToScore ? (
              <div className="card">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <img src={getUserById(selectedDinnerToScore.hostId).image} alt="" className="avatar-large" style={{ marginBottom: '10px' }} />
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>דירוג האירוח של {getUserById(selectedDinnerToScore.hostId).name}</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>הדירוג שלך הוא אנונימי לחלוטין ויקבע מי ינצח בסבב!</p>
                </div>

                {/* Slider 1: Food */}
                <div className="slider-container">
                  <div className="slider-label">
                    <span style={{ color: 'var(--primary)' }}>{foodGrade} מתוך 10</span>
                    <span>איכות האוכל והמנות</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={foodGrade} 
                    onChange={(e) => setFoodGrade(parseInt(e.target.value))} 
                    className="grade-slider" 
                  />
                </div>

                {/* Slider 2: Hospitality */}
                <div className="slider-container">
                  <div className="slider-label">
                    <span style={{ color: 'var(--primary)' }}>{hospitalityGrade} מתוך 10</span>
                    <span>רמת האירוח והיחס</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={hospitalityGrade} 
                    onChange={(e) => setHospitalityGrade(parseInt(e.target.value))} 
                    className="grade-slider" 
                  />
                </div>

                {/* Slider 3: Atmosphere */}
                <div className="slider-container">
                  <div className="slider-label">
                    <span style={{ color: 'var(--primary)' }}>{atmosphereGrade} מתוך 10</span>
                    <span>האווירה והכימיה החברתית</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={atmosphereGrade} 
                    onChange={(e) => setAtmosphereGrade(parseInt(e.target.value))} 
                    className="grade-slider" 
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="btn-primary" onClick={submitScore}>שלח דירוג אנונימי</button>
                  <button className="btn-primary" style={{ background: '#252836', color: '#fff' }} onClick={() => {
                    setSelectedDinnerToScore(null);
                    setActiveTab('group');
                  }}>ביטול</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <StarIcon style={{ width: '48px', height: '48px', color: 'var(--primary)', marginBottom: '16px' }} />
                <h3>אין אירועים שממתינים לדירוג כרגע</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  הדירוג נפתח אוטומטית מיד לאחר סיום אחת הארוחות בסבב!
                </p>
                <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setActiveTab('group')}>חזרה לסבב</button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <TrophyIcon style={{ width: '48px', height: '48px', color: 'var(--secondary)', marginBottom: '10px' }} />
              <h2>טבלת המובילים בסבב</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>הניקוד מחושב כממוצע מתוך 30 נקודות אפשריות לכל מצביע</p>
            </div>

            <div className="card" style={{ padding: '8px' }}>
              {getLeaderboard().map((row, index) => {
                const isCurrentUser = row.id === 'currentUser';
                return (
                  <div key={row.id} className="leaderboard-row" style={{ backgroundColor: isCurrentUser ? 'rgba(255, 94, 54, 0.05)' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`rank-circle rank-${index + 1}`}>{index + 1}</span>
                      <img src={row.user.image} alt="" className="avatar-medium" style={{ width: '40px', height: '40px' }} />
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{row.user.name}</span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>מנת דגל: {row.user.signatureDish}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)' }}>
                        {row.averageScore > 0 ? `${row.averageScore} נק'` : 'ממתין לדירוג'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {row.voters > 0 ? `לפי ${row.voters} מצביעים` : 'לא הוזנו קולות'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', textAlign: 'right' }}>
              <h4 style={{ fontSize: '14px', color: '#3b82f6', marginBottom: '4px', fontWeight: 'bold' }}>איך נקבע הניצחון?</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                בסיום ארבעת המפגשים, המארח בעל ממוצע הניקוד הגבוה ביותר יוכתר כמנצח הסבב ויזכה בעיטור השף המצטיין של השבוע!
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Chat Room */}
        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.map(msg => {
                const isMine = msg.userId === 'currentUser';
                const sender = getUserById(msg.userId);

                return (
                  <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : 'other'}`}>
                    {!isMine && <div className="chat-sender">{sender.name}</div>}
                    <div>{msg.text}</div>
                    <span className="chat-time">{msg.timestamp}</span>
                  </div>
                );
              })}
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
        )}

        {/* Tab 5: My Profile settings */}
        {activeTab === 'profile' && (
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src={userProfile.image} alt={userProfile.name} className="avatar-large" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{userProfile.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>שכונת {userProfile.neighborhood}, {userProfile.city}</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label>שם מלא</label>
                <input 
                  type="text" className="input-field" 
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>עיר מגורים</label>
                <input 
                  type="text" className="input-field" 
                  value={userProfile.city}
                  onChange={(e) => setUserProfile({ ...userProfile, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>שכונה (חשוב ליצירת אמון עם חברי הסבב)</label>
                <input 
                  type="text" className="input-field" 
                  value={userProfile.neighborhood}
                  onChange={(e) => setUserProfile({ ...userProfile, neighborhood: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>ספר קצת על עצמך (אהבה לאוכל, תחביבים)</label>
                <textarea 
                  className="input-field" rows="3"
                  value={userProfile.bio}
                  onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-group">
                <label>מנת דגל</label>
                <input 
                  type="text" className="input-field" 
                  value={userProfile.signatureDish}
                  onChange={(e) => setUserProfile({ ...userProfile, signatureDish: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>סגנון אירוח מועדף</label>
                <input 
                  type="text" className="input-field" 
                  value={userProfile.hostingStyle}
                  onChange={(e) => setUserProfile({ ...userProfile, hostingStyle: e.target.value })}
                />
              </div>

              {/* Allergies and dietary restrictions checkboxes */}
              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>מגבלות דיאטטיות / כשרות</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {['כשר', 'טבעוני', 'צמחוני', 'ללא גלוטן', 'ללא לקטוז'].map(diet => {
                    const isChecked = userProfile.dietaryRestrictions.includes(diet);
                    return (
                      <button 
                        type="button" key={diet}
                        className="badge"
                        style={{ 
                          backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                          color: isChecked ? '#10b981' : 'var(--text-muted)',
                          border: isChecked ? '1px solid #10b981' : '1px solid var(--border-color)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const updated = isChecked
                            ? userProfile.dietaryRestrictions.filter(d => d !== diet)
                            : [...userProfile.dietaryRestrictions, diet];
                          setUserProfile({ ...userProfile, dietaryRestrictions: updated });
                        }}
                      >
                        {diet}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>אלרגיות רפואיות</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {['בוטנים', 'אגוזים', 'לקטוז', 'גלוטן', 'פירות ים', 'שומשום'].map(allergy => {
                    const isChecked = userProfile.allergies.includes(allergy);
                    return (
                      <button 
                        type="button" key={allergy}
                        className="badge"
                        style={{ 
                          backgroundColor: isChecked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                          color: isChecked ? '#ef4444' : 'var(--text-muted)',
                          border: isChecked ? '1px solid #ef4444' : '1px solid var(--border-color)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const updated = isChecked
                            ? userProfile.allergies.filter(a => a !== allergy)
                            : [...userProfile.allergies, allergy];
                          setUserProfile({ ...userProfile, allergies: updated });
                        }}
                      >
                        {allergy}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'center', direction: 'rtl', marginTop: '20px' }}>
                <ShieldIcon style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#10b981', textAlign: 'right', fontWeight: 'bold' }}>
                  המידע שלך מוגן ומיועד אך ורק לחברי הסבב שלך כדי להבטיח אירוח בטוח ומותאם.
                </span>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="app-nav">
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <UserIcon />
          <span>פרופיל</span>
        </button>
        <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageSquareIcon />
          <span>צ'אט</span>
        </button>
        <button className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          <TrophyIcon />
          <span>מובילים</span>
        </button>
        <button className={`nav-item ${activeTab === 'scoring' ? 'active' : ''}`} onClick={() => setActiveTab('scoring')}>
          <StarIcon />
          <span>דירוג</span>
        </button>
        <button className={`nav-item ${activeTab === 'group' ? 'active' : ''}`} onClick={() => setActiveTab('group')}>
          <UsersIcon />
          <span>הסבב שלי</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
