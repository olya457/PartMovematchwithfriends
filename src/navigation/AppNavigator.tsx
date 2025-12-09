import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import LoaderScreen from '../screens/LoaderScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ReactionGameModsScreen from '../screens/ReactionGameModsScreen';
import StatisticsNoDataScreen from '../screens/StatisticsNoDataScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChangingSportsScreen from '../screens/ChangingSportsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="loader"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="loader" component={LoaderScreen} />
        <Stack.Screen name="onboarding" component={OnboardingScreen} />
        <Stack.Screen name="register" component={RegisterScreen} />
        <Stack.Screen name="home" component={HomeScreen} />
        <Stack.Screen name="reaction" component={ReactionGameModsScreen} />
        <Stack.Screen name="statistics" component={StatisticsNoDataScreen} />
        <Stack.Screen name="profile" component={ProfileScreen} />
        <Stack.Screen name="changing" component={ChangingSportsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
