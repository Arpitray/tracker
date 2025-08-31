// LandingPage.jsx
// Layout and navbar for the landing page
import React, { useState, useRef, useEffect } from 'react';
import { auth } from './firebase';
import { flushSync } from 'react-dom';
import HabitCard from './components/HabitCard';

function LandingPage({ user, onLogout }) {
  return (
  <div className="min-h-screen bg-[#FFF1B0] overflow-x-hidden">
      {/* Navbar */}
      <nav className="w-full bg-[#FF8E42] flex items-center justify-between px-8 py-6 border-b-2 border-orange-300 overflow-x-hidden">
        {/* Logo */}
        <div className="text-6xl font-bold select-none">
          <span className="text-black drop-shadow-[2px_2px_0px_#FF3C00]">Trac</span>
          <span className="text-[#FF3C00] drop-shadow-[2px_2px_0px_black]">er</span>
        </div>
        
        {/* User Profile Section */}
        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-yellow-300 font-semibold">Welcome back!</div>
              <div className="text-yellow-200 text-sm">{user.name || user.email}</div>
            </div>
            <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
              ) : (
                <span className="text-black font-bold text-lg">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-10 text-2xl font-semibold overflow-x-hidden">
            <a href="#" className="text-yellow-300 underline underline-offset-8 decoration-4 decoration-yellow-300">Home</a>
            <a href="#" className="text-yellow-300 hover:underline hover:underline-offset-8 hover:decoration-4 hover:decoration-yellow-300 transition">Features</a>
            <a href="#" className="text-yellow-300 hover:underline hover:underline-offset-8 hover:decoration-4 hover:decoration-yellow-300 transition">Pricing</a>
            <a href="#" className="text-yellow-300 hover:underline hover:underline-offset-8 hover:decoration-4 hover:decoration-yellow-300 transition">Contact us</a>
          </div>
        )}
      </nav>


      {/* Main content placeholder */}
      <div className="pt-24 pb-16 flex flex-col items-center">
        {/* single card area with add button */}
        <div className="w-full flex justify-center mt-12 px-8">
          <div className="relative">
            {/* single card (user-editable) */}
            <SingleCardArea user={user} />

            {/* plus button */}
          </div>
        </div>
      </div>
    </div>
  );
}

function SingleCardArea({ user }) {
  const STORAGE_KEY = `tracker.cards.v1.${user?.id || 'guest'}`;

  // start with no cards; user will create the first card with the + button
  const [cards, setCards] = useState(() => []);

  // load persisted cards: if user logged in, listen to Firestore; otherwise use localStorage
  useEffect(() => {
    let unsub = null;
    let didFallbackLoad = false;
    async function loadLocal() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((c) => ({ ...c, createdAt: c.createdAt ? Number(new Date(c.createdAt).getTime()) : Date.now(), editing: false, manualProgress: typeof c.manualProgress === 'undefined' ? true : c.manualProgress }));
          setCards(normalized);
        }
      } catch (e) {
        // ignore
      }
      didFallbackLoad = true;
    }

    if (user && user.id) {
      // listen to Firestore user cards
      try {
        // Use dynamic import instead of require
        import('./lib/firebaseClient_Enhanced').then(({ listenUserCards }) => {
          unsub = listenUserCards(user.id, (items) => {
            console.log('Firestore listener received items:', items);
            // normalize doc ids as id and default manualProgress when absent
            let mapped = items.map((d) => ({ ...d, id: d.id, manualProgress: typeof d.manualProgress === 'undefined' ? true : d.manualProgress }));
            // Sort by createdAt descending (newest first)
            mapped = mapped.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            console.log('Mapped items (sorted newest first):', mapped);

            // Clear any stale local fallback for this user so Firestore is the single source of truth
            try {
              const storageKey = `tracker.cards.v1.${user.id}`;
              if (localStorage.getItem(storageKey)) {
                localStorage.removeItem(storageKey);
              }
            } catch (e) {}

            // Remove any Firestore items that we've just saved locally (pendingSavedIds) - they'll already be in state
            const filteredMapped = mapped.filter(m => !pendingSavedIds.current.has(m.id));

            setCards(prevCards => {
              // Remove temp cards that match incoming Firestore items (by title/details/editing)
              const tempCards = prevCards.filter(c => {
                if (!/^\d+$/.test(String(c.id))) return false;
                return !filteredMapped.some(fc => fc.title === c.title && fc.details === c.details && fc.editing === c.editing);
              });

              // Combine filtered Firestore docs with remaining temp cards
              const combined = [...filteredMapped, ...tempCards];
              console.log('Combined result (strict dedupe with pendingSavedIds):', combined);
              return combined;
            });
          });
        }).catch((e) => {
          loadLocal();
        });
      } catch (e) {
        // if firestore not available, fallback
        loadLocal();
      }
    } else {
      loadLocal();
    }

    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  // persist to localStorage only when not using Firestore
  useEffect(() => {
    if (user && user.id) return; // Firestore will persist
    try {
      const toStore = cards.map((c) => {
        const copy = { ...c };
        delete copy.editing;
        return copy;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      // ignore
    }
  }, [cards, user]);

  // global pointer handlers: ensure drags finish cleanly even if pointer events occur outside the card
  useEffect(() => {
    function onGlobalPointerMove(e) {
      const s = dragState.current;
      if (!s || !s.id) return;
      s.lastClientX = e.clientX;
      s.lastClientY = e.clientY;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      const nx = Math.round(s.originX + dx);
      const ny = Math.round(s.originY + dy);
      if (s.el && s.el.style) s.el.style.transform = `translate(${nx}px, ${ny}px)`;
    }

    function onGlobalPointerUp(e) {
      const s = dragState.current;
      if (!s || !s.id) return;
      const endX = (typeof e.clientX === 'number') ? e.clientX : s.lastClientX || s.startX;
      const endY = (typeof e.clientY === 'number') ? e.clientY : s.lastClientY || s.startY;
      const dx = endX - s.startX;
      const dy = endY - s.startY;
      const nx = Math.round(s.originX + dx);
      const ny = Math.round(s.originY + dy);
      // persist
      setCards((arr) => arr.map((c) => (c.id === s.id ? { ...c, x: nx, y: ny } : c)));
      // restore element style
      if (s.el && s.el.style) {
        s.el.style.transition = s.prevTransition || '';
        s.el.style.willChange = '';
        s.el.style.transform = `translate(${nx}px, ${ny}px)`;
      }
      // try to release any pointer capture that may have been left
      try {
        if (s.el && typeof s.pointerId !== 'undefined' && s.el.releasePointerCapture) {
          s.el.releasePointerCapture(s.pointerId);
        }
      } catch (err) {}
      dragState.current = {};
    }

    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
    };
  }, []);
  const refs = useRef({});
  const dragState = useRef({});
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [congratsFor, setCongratsFor] = useState(null);
  const lastAddRef = useRef(0);
  const lastDeleteRef = useRef(0);
  const lastCompletionRef = useRef({});
  const pendingOperations = useRef(new Set()); // Track pending operations to avoid listener conflicts
  const pendingSavedIds = useRef(new Set()); // recently saved firestore ids to ignore briefly in listener

  useEffect(() => {
    // focus any card that is in editing mode
    Object.entries(refs.current).forEach(([id, el]) => {
      if (!el) return;
      const c = cards.find((x) => String(x.id) === String(id));
      if (c && c.editing) {
        el.focus();
        // expand to content
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      }
    });
  }, [cards]);


  function computeAutoPercent(card) {
    // Progress is based solely on completions.
    // If a deadline exists, totalDays = days between createdAt and deadline (at least 1).
    // percent = completions / totalDays * 100.
    const completions = card.completions || 0;
    // If this card uses manual progress (simple mode), treat any completion as full completion.
    // This makes simple habits show the congratulations overlay after the first completion.
    if (card.manualProgress) {
      return completions > 0 ? 100 : 0;
    }
    if (card.deadline) {
      const start = card.createdAt ? (typeof card.createdAt === 'number' ? card.createdAt : new Date(card.createdAt).getTime()) : Date.now();
      const end = new Date(card.deadline).getTime();
      const msPerDay = 24 * 60 * 60 * 1000;
      const rawDays = Math.ceil(Math.max(1, (end - start) / msPerDay));
      const pct = Math.round((completions / rawDays) * 100);
      return Math.max(0, Math.min(100, pct));
    }
    // No deadline: treat each completion as a fixed increment (5%)
    return Math.max(0, Math.min(100, completions * 5));
  }

  function displayPercent(card) {
    return computeAutoPercent(card);
  }

  // focus inline title input when requested
  useEffect(() => {
    if (!editingTitleId) return;
    const el = refs.current[`inline-title-${editingTitleId}`];
    if (el) {
      el.focus();
      try { el.select(); } catch (e) {}
    }
  }, [editingTitleId]);

  // Note: Auto-save removed to prevent unwanted saves. Users must explicitly save cards.

  function addCard() {
    // debounce rapid double calls (pointerdown + click)
    const now = Date.now();
    if (now - (lastAddRef.current || 0) < 500) return; // Increased debounce to 500ms
    lastAddRef.current = now;
    
    const id = Date.now();
    // rotation between -15 and +15 degrees
    const min = -15;
    const max = 15;
    const rotation = Math.floor(Math.random() * (max - min + 1)) + min;
    const newCard = {
      id,
      title: '',
      completed: false,
      streak: 0,
      details: '',
      progress: 0,
      deadline: null,
      completions: 0,
      x: 0,
      y: 0,
      ownerId: user?.id || 'guest',
      createdAt: Date.now(),
      editing: true,
      manualProgress: true,
      rotation,
    };
    
    // Only add to local state - don't save to Firestore until user explicitly saves
    setCards((s) => [newCard, ...s]);
    
    // initialize draft for the new card
    setDrafts((d) => ({ ...d, [id]: { title: '', details: '', deadline: '', showAdvanced: false, completions: 0 } }));
  }

  function saveCard(id) {
    console.log('SaveCard called for ID:', id);
    
    // Force any pending state updates to complete immediately
    flushSync(() => {
      // This empty function forces React to flush pending updates
    });
    
    // Now get the latest draft state
    const d = drafts[id] || {};
    
    // Also read from DOM as backup
    const titleEl = refs.current && refs.current[`title-${id}`];
    const detailsEl = refs.current && refs.current[id];
    const deadlineEl = refs.current && refs.current[`deadline-${id}`];
    
    const titleValue = d.title || (titleEl ? titleEl.value : '');
    const detailsValue = d.details || (detailsEl ? detailsEl.value : '');
    const deadlineValue = d.deadline || (deadlineEl ? deadlineEl.value : '');

    console.log('Save data:', { titleValue, detailsValue, deadlineValue, drafts: d });

    const patch = {
      title: titleValue || 'Untitled Habit',
      details: detailsValue || '',
      deadline: deadlineValue || '',
      advanced: !!d.showAdvanced,
      manualProgress: !d.showAdvanced,
      completions: d.completions ?? 0,
      editing: false,
    };

    if (user && user.id) {
      import('./lib/firebaseClient_Enhanced').then(({ saveCard }) => {
        const existing = cards.find((c) => c.id === id);
        // For temporary cards, remove the ID so Firestore creates a new one
        const isTemporary = /^\d+$/.test(String(id));
        const payload = { ...existing, ...patch };
        if (isTemporary) {
          delete payload.id;
        }
        saveCard(user.id, payload).then((saved) => {
            if (isTemporary) {
            // Remove temp card and insert saved card at the start so saved card appears first
            setCards((s) => [saved, ...s.filter((c) => c.id !== id)]);
            // mark this saved id as pending so listener won't re-add it briefly
            pendingSavedIds.current.add(saved.id);
            setTimeout(() => pendingSavedIds.current.delete(saved.id), 2000);
            // clean up draft for temp id
            setDrafts((d0) => {
              const copy = { ...d0 };
              delete copy[id];
              return copy;
            });
          } else {
            // Update existing card
            setCards((s) => s.map((c) => (c.id === id ? saved : c)));
            setDrafts((d0) => {
              const copy = { ...d0 };
              delete copy[id];
              return copy;
            });
          }
        }).catch((error) => {
          setCards((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
          setDrafts((d0) => {
            const copy = { ...d0 };
            delete copy[id];
            return copy;
          });
        });
      }).catch((error) => {
        setCards((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        setDrafts((d0) => {
          const copy = { ...d0 };
          delete copy[id];
          return copy;
        });
      });
    } else {
      setCards((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      setDrafts((d0) => {
        const copy = { ...d0 };
        delete copy[id];
        return copy;
      });
    }
  }

  function updateField(id, patch) {
    setCards((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function startEdit(id) {
    const c = cards.find((x) => x.id === id);
    if (!c) return;
    // set editing flag
    setCards((s) => s.map((x) => (x.id === id ? { ...x, editing: true } : x)));
    setDrafts((d) => ({
      ...d,
      [id]: {
        title: c.title,
        details: c.details,
        // include progress in draft but keep advanced UI closed by default
        progress: c.progress ?? 0,
        deadline: c.deadline ?? '',
        showAdvanced: false,
        completions: c.completions ?? 0,
      },
    }));
    // focus will be handled by effect when refs updated
  }

  function cancelEdit(id) {
    // Check if this is a new card that hasn't been saved yet (has temporary numeric ID and empty title)
    const card = cards.find(c => c.id === id);
    const isUnsavedNewCard = card && 
      /^\d+$/.test(String(card.id)) && // temporary numeric ID
      (!card.title || card.title.trim() === '') && // no title set
      (!card.details || card.details.trim() === ''); // no details set
    
    if (isUnsavedNewCard) {
      // Remove the card entirely since it's new and unsaved
      setCards((s) => s.filter((c) => c.id !== id));
      setDrafts((d) => {
        const copy = { ...d };
        delete copy[id];
        return copy;
      });
    } else {
      // Just exit edit mode for existing cards
      setCards((s) => s.map((x) => (x.id === id ? { ...x, editing: false } : x)));
      setDrafts((d) => {
        const copy = { ...d };
        delete copy[id];
        return copy;
      });
    }
  }

  function recordCompletion(id) {
    console.log('Recording completion for card:', id);
    
    // Prevent rapid double-clicks on completion button
    const now = Date.now();
    if (now - (lastCompletionRef.current?.[id] || 0) < 1000) return;
    if (!lastCompletionRef.current) lastCompletionRef.current = {};
    lastCompletionRef.current[id] = now;
    
    const current = cards.find((c) => c.id === id);
    if (!current) {
      console.log('Card not found for completion:', id);
      return;
    }
    
    // Prevent recording completion on cards without a title
    if (!current.title || current.title.trim() === '') {
      alert('Please add a title to this habit before recording progress.');
      return;
    }
    
    const newCompletions = (current.completions || 0) + 1;
    const newProgress = computeAutoPercent({ ...current, completions: newCompletions });
    const newStreak = (current.streak || 0) + 1;

    console.log('Completion data:', { current, newCompletions, newProgress, newStreak });

    // update state
    const patch = { 
      completions: newCompletions, 
      progress: newProgress, 
      streak: newStreak, 
      completed: newProgress >= 100, 
      anim: true 
    };
    
    // Update local state immediately
    setCards((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    
    if (user && user.id) {
      import('./lib/firebaseClient_Enhanced').then(({ saveCard }) => {
        const payload = { ...current, ...patch };
        
        // For temporary cards, remove ID so Firestore creates proper one
        const isTemporary = /^\d+$/.test(String(id));
        if (isTemporary) {
          delete payload.id;
        }
        
        console.log('Saving completion to Firestore:', payload);
        
        saveCard(user.id, payload).then((saved) => {
          console.log('Completion saved to Firestore:', saved);
          
          if (isTemporary) {
            // Replace temporary card with Firestore card
            setCards((s) => s.map((c) => (c.id === id ? saved : c)));
          } else {
            // Update existing card
            setCards((s) => s.map((c) => (c.id === id ? saved : c)));
          }
        }).catch((err) => {
          console.error('Failed to save completion:', err);
        });
      }).catch((err) => {
        console.error('Failed to import saveCard for completion:', err);
      });
    }

    // if finished, show congrats overlay
    if (newProgress >= 100 && !current.manualProgress) setCongratsFor(id);

    // clear animation after short delay
    setTimeout(() => {
      setCards((s) => s.map((c) => (c.id === id ? { ...c, anim: false } : c)));
    }, 150);
  }

  function restartCard(id) {
    setCards((s) => s.map((c) => (c.id === id ? { ...c, completions: 0, progress: 0, streak: 0, completed: false } : c)));
    setCongratsFor(null);
  }

  function deleteCard(id) {
    // Prevent rapid double-clicks
    const now = Date.now();
    if (now - (lastDeleteRef.current || 0) < 1000) return; // 1 second debounce for delete
    lastDeleteRef.current = now;
    
    // Mark as pending operation
    pendingOperations.current.add(id);
    
    if (user && user.id) {
      import('./lib/firebaseClient_Enhanced').then(({ deleteCard }) => {
        deleteCard(user.id, id).then(() => {
          setCards((s) => s.filter((c) => c.id !== id));
          pendingOperations.current.delete(id);
        }).catch(() => {
          setCards((s) => s.filter((c) => c.id !== id));
          pendingOperations.current.delete(id);
        });
      }).catch(() => {
        setCards((s) => s.filter((c) => c.id !== id));
        pendingOperations.current.delete(id);
      });
    } else {
      setCards((s) => s.filter((c) => c.id !== id));
      pendingOperations.current.delete(id);
    }
    setCongratsFor(null);
  }

  return (
    <div className="flex items-start">
      <div className="flex flex-wrap gap-6 items-start justify-center">
        {cards.map((card) => (
          <div
            key={card.id}
            className="inline-block"
            onPointerDown={(e) => {
              // start dragging this card
              // ignore pointerdown for interactive elements inside the card so clicks (Save/Delete/etc.) work
              if (e.target) {
                const tag = (e.target.tagName || '').toUpperCase();
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' || tag === 'SELECT' || e.target.isContentEditable) return;
                // if clicking an element inside a button/link etc., respect that
                const interactive = e.target.closest && e.target.closest('button,a,input,textarea,select,[contenteditable=true]');
                if (interactive) return;
              }
              const el = e.currentTarget;
              try { el.setPointerCapture(e.pointerId); } catch (err) {}
              // save previous transition so we can restore it later
              const prevTransition = el.style ? el.style.transition : '';
              if (el.style) {
                el.style.transition = 'none';
                el.style.willChange = 'transform';
              }
              dragState.current = {
                id: card.id,
                startX: e.clientX,
                startY: e.clientY,
                originX: card.x || 0,
                originY: card.y || 0,
                el,
                pointerId: e.pointerId,
                prevTransition,
              };
            }}
            onPointerMove={(e) => {
              const s = dragState.current;
              if (!s || s.id !== card.id) return;
              const dx = e.clientX - s.startX;
              const dy = e.clientY - s.startY;
              const nx = Math.round(s.originX + dx);
              const ny = Math.round(s.originY + dy);
              // move the element visually
              if (s.el && s.el.style) s.el.style.transform = `translate(${nx}px, ${ny}px)`;
            }}
            onPointerUp={(e) => {
              const s = dragState.current;
              if (!s || s.id !== card.id) return;
              try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
              const dx = e.clientX - s.startX;
              const dy = e.clientY - s.startY;
              const nx = Math.round(s.originX + dx);
              const ny = Math.round(s.originY + dy);
              // persist
              setCards((arr) => arr.map((c) => (c.id === card.id ? { ...c, x: nx, y: ny } : c)));
              // reset drag state
              dragState.current = {};
            }}
            style={{ touchAction: 'none', transform: `translate(${card.x || 0}px, ${card.y || 0}px)`, display: 'inline-block' }}
          >
            <HabitCard>
            {card.editing ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                saveCard(card.id);
              }} className="space-y-3">
                <input
                  ref={(el) => (refs.current[`title-${card.id}`] = el)}
                  value={drafts[card.id]?.title ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [card.id]: { ...(d[card.id] || {}), title: e.target.value } }))}
                  placeholder="Habit title"
                  className="w-full bg-transparent outline-none font-semibold text-2xl"
                />

                <textarea
                  ref={(el) => (refs.current[card.id] = el)}
                  value={drafts[card.id]?.details ?? ''}
                  onChange={(e) => {
                    setDrafts((d) => ({ ...d, [card.id]: { ...(d[card.id] || {}), details: e.target.value } }));
                    // auto-resize
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  className="w-full resize-none bg-transparent outline-none text-[1.05rem] leading-relaxed"
                  rows={3}
                  placeholder="Details (e.g. Drink 2L daily)"
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Simple mode</div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Advanced</label>
                    <input
                      type="checkbox"
                      checked={!!drafts[card.id]?.showAdvanced}
                      onChange={(e) => setDrafts((d) => ({ ...d, [card.id]: { ...(d[card.id] || {}), showAdvanced: e.target.checked } }))}
                    />
                  </div>
                </div>

                {drafts[card.id]?.showAdvanced && (
                  <div className="flex gap-3 items-center">
                    <label className="text-sm">Deadline:</label>
                    <input
                      type="date"
                      ref={(el) => (refs.current[`deadline-${card.id}`] = el)}
                      value={drafts[card.id]?.deadline ?? ''}
                      onChange={(e) => {
                        setDrafts((d) => ({ ...d, [card.id]: { ...(d[card.id] || {}), deadline: e.target.value } }));
                      }}
                      onBlur={(e) => {
                        setDrafts((d) => ({ ...d, [card.id]: { ...(d[card.id] || {}), deadline: e.target.value } }));
                      }}
                      className="text-sm bg-transparent outline-none"
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button type="button" onPointerDown={(e)=>e.stopPropagation()} onClick={() => cancelEdit(card.id)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                  <button type="submit" onPointerDown={(e)=>e.stopPropagation()} className="px-3 py-1 bg-yellow-400 rounded">Save</button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-2xl cursor-text" onDoubleClick={() => startEdit(card.id)}>{card.title || 'Untitled habit'}</h3>
                </div>

                <p className="mt-3 text-[1.02rem] text-gray-800 leading-relaxed break-words">{card.details}</p>

                  <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-end">
                    <div className="text-xs text-gray-500 whitespace-nowrap">Created: {new Date(card.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Due: {card.deadline ? new Date(card.deadline).toLocaleDateString() : '—'}</div>
                    {card.advanced && (
                      <div className="flex items-center gap-2">
                        <CircularProgress percent={displayPercent(card)} size={40} stroke={6} />
                        <div className="text-xs text-gray-600">{displayPercent(card)}%</div>
                      </div>
                    )}
                  </div>

                  {/* bottom-centered action row */}
                  <div className="mt-3 flex justify-center items-center gap-4">
                    <button
                      onClick={() => recordCompletion(card.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border ${card.anim ? 'bg-green-500' : 'bg-white'}`}
                      title="Mark completion"
                    >
                      ✓
                    </button>

                    <div className="text-sm px-3 py-1 bg-yellow-100 rounded">Streak: {card.streak}</div>

                    <button onClick={() => startEdit(card.id)} className="text-sm px-3 py-1 bg-blue-100 rounded">Edit</button>
                    
                    <button 
                      onClick={() => deleteCard(card.id)} 
                      className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      title="Delete card"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
            </HabitCard>
          </div>
        ))}
        {/* add button sits inside the flow after the cards */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); addCard(); }}
          aria-label="Add habit"
          title="Add habit"
          className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-md hover:scale-105 transition self-center"
        >
          +
        </button>
        
  {/* development-only debug buttons removed */}
      </div>
      {/* Congratulation overlay */}
      {congratsFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-center shadow-xl">
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-sm text-gray-600 mb-4">You've completed this habit.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => restartCard(congratsFor)} className="px-4 py-2 bg-green-500 text-white rounded">Start again</button>
              <button onClick={() => deleteCard(congratsFor)} className="px-4 py-2 bg-red-500 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;

function CircularProgress({ percent = 0, size = 48, stroke = 6 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#eee"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#F59E0B"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
