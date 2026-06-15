import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';

const AuthContext = createContext(null);

function mapFirebaseUser(user) {
  if (!user) return null;
  const storedPhone = localStorage.getItem(`phone_${user.uid}`) || '';
  return {
    id: user.uid,
    email: user.email || '',
    username: user.displayName || (user.email ? user.email.split('@')[0] : ''),
    full_name: user.displayName || '',
    phone: user.phoneNumber || storedPhone,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(mapFirebaseUser(currentUser));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(firebaseAuth, email, password);
    setUser(mapFirebaseUser(res.user));
    return mapFirebaseUser(res.user);
  };

  const register = async (data) => {
    const res = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
    const displayName = data.full_name?.trim() || data.username?.trim() || data.email.split('@')[0];
    if (displayName) {
      await updateProfile(res.user, { displayName });
    }
    if (data.phone?.trim()) {
      localStorage.setItem(`phone_${res.user.uid}`, data.phone.trim());
    }
    const refreshedUser = firebaseAuth.currentUser;
    setUser(mapFirebaseUser(refreshedUser));
    return mapFirebaseUser(refreshedUser);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(firebaseAuth, provider);
    setUser(mapFirebaseUser(res.user));
    return mapFirebaseUser(res.user);
  };

  const logout = async () => {
    await signOut(firebaseAuth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
