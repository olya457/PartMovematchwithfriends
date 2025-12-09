import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'onboarding'>;

const { width, height } = Dimensions.get('window');
const IS_SMALL = Math.min(width, height) < 700 || width <= 360;
const VERY_SMALL = height < 670;

const YELLOW = '#FFE651';
const CARD_BG = '#0B0B0B';
const TEXT = '#FFFFFF';
const SUBTEXT = '#CFCFCF';

const PAGES = [
  {
    key: 'p1',
    img: require('../assets/onboarding1.png'),
    title: 'Sharpen Your Reaction',
    text: 'Catch the ball in a split second — it can fly in any direction. Test your speed and accuracy in a dynamic game of reaction.',
    btn: 'Next',
  },
  {
    key: 'p2',
    img: require('../assets/onboarding2.png'),
    title: 'Pick Your Ball Style',
    text: 'Choose your sport — tennis, soccer, or volleyball. The entire interface and ball adapt to your choice.',
    btn: 'Okay',
  },
  {
    key: 'p3',
    img: require('../assets/onboarding3.png'),
    title: 'Challenge & Compare',
    text: 'Play alone or invite a friend. After each game, get your average reaction time and track your progress in statistics.',
    btn: 'Start',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const logoY = useRef(new Animated.Value(-16)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const blockY = useRef(new Animated.Value(18)).current;
  const blockOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(logoY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(blockY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(blockOpacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoY, logoOpacity, blockY, blockOpacity]);

  const handleNext = () => {
    if (index < PAGES.length - 1) {
      const next = index + 1;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      navigation.navigate('register');
    }
  };

  const buttonLabel = useMemo(() => PAGES[index].btn, [index]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={[styles.logoWrap, { transform: [{ translateY: logoY }], opacity: logoOpacity }]}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.View style={{ flex: 1, transform: [{ translateY: blockY }], opacity: blockOpacity }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'stretch' }}
          >
            {PAGES.map((p) => (
              <View key={p.key} style={{ width, paddingHorizontal: 20 }}>
                <View style={styles.card}>
                  <Image source={p.img} style={styles.cardImage} resizeMode="cover" />
                </View>
                <Text style={styles.title}>{p.title}</Text>
                <Text style={styles.text}>{p.text}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <View style={[styles.bottomBar, { transform: [{ translateY: -40 }] }]}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View key={`dot-${i}`} style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.9}>
          <Text style={styles.btnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const TOP_OFFSET = (IS_SMALL ? 8 : 12) + 60;
const CARD_SIZE = Math.min(width - 40, VERY_SMALL ? 290 : IS_SMALL ? 310 : 320);
const TITLE_SIZE = VERY_SMALL ? 20 : IS_SMALL ? 21 : 22;
const TEXT_SIZE = VERY_SMALL ? 14 : 15;
const BTN_PAD_V = VERY_SMALL ? 12 : 14;
const BTN_MIN_W = VERY_SMALL ? 108 : 120;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  logoWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: TOP_OFFSET, marginBottom: IS_SMALL ? 8 : 12 },
  logo: { width: Math.min(width * 0.46, 210), height: VERY_SMALL ? 40 : 46 },
  card: {
    alignSelf: 'center',
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: YELLOW,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 20,
  },
  cardImage: { width: '100%', height: '100%' },
  title: { color: TEXT, fontSize: TITLE_SIZE, fontWeight: '700', textAlign: 'center', paddingHorizontal: 4, marginTop: 6, marginBottom: 6 },
  text: { color: SUBTEXT, fontSize: TEXT_SIZE, lineHeight: TEXT_SIZE * 1.4, textAlign: 'center', paddingHorizontal: 4, marginBottom: 12 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: IS_SMALL ? 20 : 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dots: { flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'flex-start' },
  dot: { width: 18, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#3A3A3A', backgroundColor: '#1E1E1E' },
  dotActive: { backgroundColor: '#FFE651', borderColor: '#FFE651' },
  dotInactive: { opacity: 0.7 },
  btn: { backgroundColor: '#FFE651', paddingVertical: BTN_PAD_V, paddingHorizontal: 22, borderRadius: 12, minWidth: BTN_MIN_W, alignItems: 'center' },
  btnText: { color: '#0B0B0B', fontSize: VERY_SMALL ? 15 : 16, fontWeight: '800' },
});
