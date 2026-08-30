import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useApp } from '../lib/store';

export default function Index() {
  const [hydrated, setHydrated] = useState(useApp.persist.hasHydrated());
  const onboarded = useApp((st) => st.onboarded);

  useEffect(() => useApp.persist.onFinishHydration(() => setHydrated(true)), []);

  if (!hydrated) return null;
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
