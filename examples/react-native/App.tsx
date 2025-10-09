import React from 'react';
import { Main } from './components/main.tsx';
import { OidcAuthProvider } from 'react-native-oidc-auth';
import { oidcAuth } from './lib/oidc-auth.ts';

function App() {
  return (
    <OidcAuthProvider instance={oidcAuth}>
      <Main />
    </OidcAuthProvider>
  );
}

export default App;
