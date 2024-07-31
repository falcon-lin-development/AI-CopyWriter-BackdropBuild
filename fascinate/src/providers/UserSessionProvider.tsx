'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store'; // Assuming you've exported AppDispatch from your store
import { initSession } from '@/redux/features/session/slice';
import { initCookies } from '@/redux/features/cookies/slice';

export default function UserSessionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();


  useEffect(() => {
    dispatch(initCookies());
    dispatch(initSession());
  }, [dispatch]);

  return <>{children}</>;
}