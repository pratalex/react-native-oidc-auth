import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import {useOidcAuth} from 'react-native-oidc-auth-bare';

export const Main: React.FC = () => {
  const {isAuthenticated, user, login, logout} = useOidcAuth();

  return (
    <View style={styles.container}>
      {isAuthenticated ? (
        <>
          <Text>Home Page</Text>
          <Text>{`Email ${user?.email}`}</Text>
          <Button onPress={() => logout()} title="Logout" />
        </>
      ) : (
        <>
          <Text>Login Page</Text>
          <Button onPress={() => login()} title="Login" />
          {/* Experimental */}
          {/*<Button onPress={() => register()} title="Register" />*/}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    gap: 15,
  },
});