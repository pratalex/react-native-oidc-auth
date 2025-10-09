# React Native OIDC Authentication

> OIDC authentication for React Native with shared core and ready-to-use implementations for Expo and Bare React Native.

[![Npm](https://img.shields.io/npm/v/react-native-oidc-auth-core?label=npm%20%7C%20core)](https://www.npmjs.com/package/react-native-oidc-auth-core)
[![Npm](https://img.shields.io/npm/v/react-native-oidc-auth?label=npm%20%7C%20native)](https://www.npmjs.com/package/react-native-oidc-auth)
[![Npm](https://img.shields.io/npm/v/react-native-oidc-auth-expo?label=npm%20%7C%20expo)](https://www.npmjs.com/package/react-native-oidc-auth-expo)

[![License](https://img.shields.io/github/license/pratalex/react-native-oidc-auth.svg?branch=master)](https://github.com/pratalex/react-native-oidc-auth/blob/master/LICENSE)
[![Github Issues](https://img.shields.io/github/issues/pratalex/react-native-oidc-auth.svg?label=issues)](https://github.com/pratalex/react-native-oidc-auth/issues)

---

## Packages

- `react-native-oidc-auth-core`: framework-agnostic core with login, logout, refresh, and secure token storage
  contracts.
- `react-native-oidc-auth-expo`: Expo implementation using expo-auth-session and expo-secure-store.
- `react-native-oidc-auth`: Bare React Native implementation using react-native-app-auth and react-native-keychain.

---

## Table of Contents

- [Why](#why)
- [Features](#features)
- [Install](#install)
- [Getting Started](#getting-started)
    - [Create an OidcAuth instance](#create-an-oidcauth-instance)
    - [Provider setup](#provider-setup)
    - [Hook usage](#hook-usage)
- [Advanced](#advanced)
- [Experimental](#experimental)
- [Examples](#examples)
- [Notes](#notes)
- [License](#license)

## Why

While integrating a React Native app with Keycloak, the only available library I found (react-native-keycloak) was
unmaintained.
I found other OIDC auth clients that worked well, such as:

- react-native-app-auth
- expo-auth-session

However, both lacked:

- Automatic token refresh
- Secure token storage integration

This library fills those gaps and provides an implementation for Expo and Bare React Native.

## Features

- Login, logout, and token refresh
- Secure token storage
- Automatic token refresh
- Implementation for Expo and Bare RN
- Optional registration flow (Keycloak-tested)

## Install

Expo apps:

```sh
npm i react-native-oidc-auth-expo
```

Bare React Native apps:

```sh
npm i react-native-oidc-auth
```

---

## Getting Started

### Create an `OidcAuth` instance

Configure your OIDC provider:

```ts
import { createOidcAuth, type OidcConfiguration, setTracingLogger } from 'react-native-oidc-auth'; // or react-native-oidc-auth-expo

const issuer = `${OIDC_URL}/realms/${OIDC_REALM}`;

const config: OidcConfiguration = {
  issuer,
  clientId: CLIENT_ID ?? '',
  redirectUrl: REDIRECT_URI ?? '',
  postLogoutRedirectUrl: REDIRECT_URI ?? '',
  scopes: ['openid', 'profile'],
  // Bare RN only:
  dangerouslyAllowInsecureHttpRequests: __DEV__,
};

// Optional: Configure tracing
setTracingLogger(tracingLog);

export const oidcAuth = createOidcAuth(config);
```

### Provider setup

Wrap your app with the provider:

```tsx
import React from 'react';
import { OidcAuthProvider } from 'react-native-oidc-auth'; // or react-native-oidc-auth-expo
import { Main } from './components/main';
import { oidcAuth } from './lib/oidc-auth';

export default function App() {
  return (
    <OidcAuthProvider instance={oidcAuth}>
      <Main />
    </OidcAuthProvider>
  );
}
```

### Hook usage

Use the hook to access auth state and actions:

```tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useOidcAuth } from 'react-native-oidc-auth'; // or react-native-oidc-auth-expo

export const Main: React.FC = () => {
  const { isAuthenticated, user, login, logout } = useOidcAuth();

  return (
    <View>
      {isAuthenticated ? (
        <>
          <Text>Home</Text>
          <Text>Email: {user?.email}</Text>
          <Button onPress={logout} title="Logout" />
        </>
      ) : (
        <>
          <Text>Login</Text>
          <Button onPress={login} title="Login" />
        </>
      )}
    </View>
  );
};
```

## Advanced

You can depend on `react-native-oidc-auth-core` to build your own adapter for alternative auth/secure storage libraries.

## Experimental

**This feature does not
perform [dynamic client registration](https://openid.net/specs/openid-connect-registration-1_0.html)**.

Instead, it allows you to directly display the registration page and retrieve the token after completing the
registration flow (tested with Keycloak only).

1. Set the registration endpoint:

```ts
const config: OidcConfiguration = {
  // ...
  registrationPageEndpoint: `${issuer}/protocol/openid-connect/registrations`,
};
```

2. Call register from your UI:

```tsx
import React from "react";
import { View, Text, Button } from "react-native";
import { useOidcAuth } from "react-native-oidc-auth";

export const Main: React.FC = () => {
  const { isAuthenticated, login, register } = useOidcAuth();

  return (
    <View>
      {!isAuthenticated ? (
        <>
          <Text>Login</Text>
          <Button onPress={login} title="Login" />
          <Button onPress={register} title="Register" />
        </>
      ) : (
        <Text>Home</Text>
      )}
    </View>
  );
};
```

Keycloak flow overview:

- User is redirected to the registration page.
- After submitting, Keycloak sends a verification email.
- The email link returns to the app; the token is stored, and the user is authenticated.

## Examples

See `examples/react-native` and `examples/expo` for demo apps.

## Notes

The logic in the core library is adapted from [Keycloak JS](https://github.com/keycloak/keycloak-js).

## License

MIT
