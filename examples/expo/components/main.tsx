import React from 'react';
import {View, Text, Button} from 'react-native';
import {useOidcAuth} from 'react-native-oidc-auth-expo';

export const Main: React.FC = () => {
  const {isAuthenticated, user, login, logout} = useOidcAuth();

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      {isAuthenticated ? (
        <View>
          <Text>Home Page</Text>
          <Text>{`Email ${user?.email}`}</Text>
          <Button onPress={() => logout()} title="Déconnexion" />
        </View>
      ) : (
        <View>
          <Text>Login Page</Text>
          <Button onPress={() => login()} title="Connexion" />
        </View>
      )}
    </View>
  );
};
