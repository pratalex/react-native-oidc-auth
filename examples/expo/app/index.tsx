import {Main} from '@/components/main';
import {OidcAuthProvider} from 'react-native-oidc-auth-expo';
import {expoKeycloak} from '@/lib/oidc-auth';

export default function RootLayout() {
  return (
    <OidcAuthProvider instance={expoKeycloak}>
      <Main />
    </OidcAuthProvider>
  );
}
