import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  SafeAreaView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'loader'>;

const { width, height } = Dimensions.get('window');
const IS_SMALL = Math.min(width, height) < 700 || width <= 360;
const VERY_SMALL = height < 670;

export default function LoaderScreen({ navigation }: Props) {
  const logoY = useRef(new Animated.Value(-28)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const y1 = useRef(new Animated.Value(0)).current;
  const y2 = useRef(new Animated.Value(0)).current;
  const y3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => navigation.replace('onboarding'), 5000);
    return () => clearTimeout(t);
  }, [navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoY, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    const bounceLoop = (val: Animated.Value, delayMs: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(val, {
            toValue: -18,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(350),
        ]),
        { resetBeforeIteration: true }
      ).start();

    bounceLoop(y1, 0);
    bounceLoop(y2, 180);
    bounceLoop(y3, 360);
  }, [logoY, logoOpacity, y1, y2, y3]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap} pointerEvents="none">
          <Animated.Image
            source={require('../assets/logo.png')}
            style={[
              styles.logo,
              { transform: [{ translateY: logoY }], opacity: logoOpacity },
            ]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.ballsWrap}>
          <Animated.Image
            source={require('../assets/ball_tennis.png')}
            style={[styles.ball, { transform: [{ translateY: y1 }] }]}
            resizeMode="contain"
          />
          <Animated.Image
            source={require('../assets/ball_soccer.png')}
            style={[styles.ball, { transform: [{ translateY: y2 }] }]}
            resizeMode="contain"
          />
          <Animated.Image
            source={require('../assets/ball_volleyball.png')}
            style={[styles.ball, { transform: [{ translateY: y3 }] }]}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const LOGO_W = Math.min(width * 0.72, 360);
const LOGO_H = VERY_SMALL ? 92 : 120;
const BALL_SIZE = VERY_SMALL ? 40 : IS_SMALL ? 44 : 52;
const BALLS_BOTTOM = VERY_SMALL ? 48 + 30 : IS_SMALL ? 48 + 30 : 64 + 30;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safe: { flex: 1 },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', 
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  logo: {
    width: LOGO_W,
    height: LOGO_H,
  },
  ballsWrap: {
    width: '100%',
    position: 'absolute',
    bottom: BALLS_BOTTOM,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 22,
  },
  ball: {
    width: BALL_SIZE,
    height: BALL_SIZE,
  },
});
