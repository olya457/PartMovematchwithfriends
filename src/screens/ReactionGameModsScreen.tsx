import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Share,
  TextInput,
  Image,
  Pressable,
  StyleSheet as RNStyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'reaction'>;

const { width, height } = Dimensions.get('window');
const IS_SMALL = Math.min(width, height) < 700 || width <= 360;
const VERY_SMALL = height < 670;

const YELLOW = '#FFE651';
const TEXT = '#FFFFFF';
const SUB = '#CFCFCF';
const BG = '#000';

type Mode = 'solo' | 'duo' | null;

const SOLO_KEY = 'pm_stats_solo_v1';
const DUO_KEY  = 'pm_stats_duo_v1';
const PROFILE_KEY = 'pm_profile_v1';

type SportKey = 'tennis' | 'football' | 'volleyball';
const BALL_ASSETS: Record<SportKey, any> = {
  tennis: require('../assets/ball_tennis.png'),
  football: require('../assets/ball_soccer.png'),
  volleyball: require('../assets/ball_volleyball.png'),
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ReactionGameModsScreen({ navigation }: Props) {
  const scale = (n: number) => (VERY_SMALL ? n * 0.9 : IS_SMALL ? n * 0.95 : n);

  const [stage, setStage] = useState<'choose' | 'playing'>('choose');
  const [mode, setMode] = useState<Mode>(null);

  const [sport, setSport] = useState<SportKey>('tennis');

  const [soloPhase, setSoloPhase] = useState<'idle' | 'countdown' | 'startWord' | 'moving' | 'result'>('idle');
  const [soloTime, setSoloTime] = useState<number | null>(null);

  const [duoPhase, setDuoPhase] = useState<'names' | 'countdown' | 'startWord' | 'moving' | 'p1done' | 'p2done' | 'final'>('names');
  const [p1, setP1] = useState('Player 1');
  const [p2, setP2] = useState('Player 2');
  const [p1Time, setP1Time] = useState<number | null>(null);
  const [p2Time, setP2Time] = useState<number | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);

  const clearedP1 = useRef(false);
  const clearedP2 = useRef(false);

  const p1Ref = useRef<TextInput>(null);
  const p2Ref = useRef<TextInput>(null);

  const [count, setCount] = useState<number | null>(null);

  const CARD_SIZE = useMemo(() => Math.min(width - 40, VERY_SMALL ? 320 : 340), []);
  const BALL = IS_SMALL ? 28 : 32;

  const ballX = useRef(new Animated.Value(0)).current;
  const ballY = useRef(new Animated.Value(0)).current;
  const runningRef = useRef(false);
  const startTS = useRef<number | null>(null);

  const centerLeft = (CARD_SIZE - BALL) / 2;
  const centerTop = (CARD_SIZE - BALL) / 2;

  const resetBall = () => {
    runningRef.current = false;
    ballX.stopAnimation();
    ballY.stopAnimation();
    ballX.setValue(0);
    ballY.setValue(0);
    startTS.current = null;
  };

  const hopOnce = () => {
    const margin = 10;
    const travel = CARD_SIZE - BALL - margin * 2;
    const toX = Math.random() * travel - travel / 2;
    const toY = Math.random() * travel - travel / 2;
    const dur = 480 + Math.random() * 340;

    return Animated.parallel([
      Animated.timing(ballX, { toValue: toX, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(ballY, { toValue: toY, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]);
  };

  const loopRandomMoves = () => {
    if (!runningRef.current) return;
    hopOnce().start(({ finished }) => {
      if (!finished || !runningRef.current) return;
      const delay = 60 + Math.random() * 140;
      setTimeout(loopRandomMoves, delay);
    });
  };

  const beginMoveAndTimer = () => {
    resetBall();
    runningRef.current = true;
    startTS.current = Date.now();
    loopRandomMoves();
  };

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(PROFILE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          const s = parsed?.sport as SportKey | undefined;
          if (mounted && s && ['tennis','football','volleyball'].includes(s)) setSport(s);
        } catch {}
      })();
      return () => { mounted = false; };
    }, [])
  );

  const appendSoloResult = async (timeSec: number) => {
    try {
      const raw = await AsyncStorage.getItem(SOLO_KEY);
      const arr: number[] = raw ? JSON.parse(raw) : [];
      arr.push(timeSec);
      await AsyncStorage.setItem(SOLO_KEY, JSON.stringify(arr));
    } catch {}
  };
  const appendDuoResult = async (payload: { p1: string; p2: string; t1: number; t2: number }) => {
    try {
      const raw = await AsyncStorage.getItem(DUO_KEY);
      const arr: Array<{ p1: string; p2: string; t1: number; t2: number; ts: number }> = raw ? JSON.parse(raw) : [];
      arr.push({ ...payload, ts: Date.now() });
      await AsyncStorage.setItem(DUO_KEY, JSON.stringify(arr));
    } catch {}
  };

  const onBallPressIn = () => {
    if (!startTS.current) return;
    const t = (Date.now() - startTS.current) / 1000;
    runningRef.current = false;

    if (mode === 'solo') {
      setSoloTime(t);
      setSoloPhase('result');
      appendSoloResult(t);
    } else {
      if (currentPlayer === 1) {
        setP1Time(t);
        setDuoPhase('p1done');
      } else {
        setP2Time(t);
        setDuoPhase('p2done');
      }
    }
  };

  const runSolo = () => {
    setSoloPhase('countdown');
    setCount(3);
  };
  const beginDuoFor = (player: 1 | 2) => {
    setCurrentPlayer(player);
    setDuoPhase('countdown');
    setCount(3);
  };

  useEffect(() => {
    if (count === null) return;
    if (count > 0) {
      const t = setTimeout(() => setCount((c) => (c ? c - 1 : 0)), 700);
      return () => clearTimeout(t);
    }
    if (mode === 'solo') setSoloPhase('startWord');
    else setDuoPhase('startWord');

    const t2 = setTimeout(() => {
      if (mode === 'solo') setSoloPhase('moving');
      else setDuoPhase('moving');
      beginMoveAndTimer();
    }, 2000);
    return () => clearTimeout(t2);
  }, [count, mode]);

  const format = (t: number | null) => (t == null ? '-' : t.toFixed(3));
  const shareSolo = async () => { try { await Share.share({ message: `My reaction: ${format(soloTime)} sec.` }); } catch {} };
  const shareDuo  = async () => { try { await Share.share({ message: `Reaction duel:\n${p1}: ${format(p1Time)} sec\n${p2}: ${format(p2Time)} sec` }); } catch {} };

  const handleBack = () => {
    if (stage === 'playing') {
      setStage('choose');
      setMode(null);
    } else {
      navigation.goBack();
    }
  };

  const HeaderBar = ({ title }: { title: string }) => (
    <View style={styles.headerWrap}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleBack} activeOpacity={0.9}>
          <Text style={styles.headerBtnIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerBtn}>
          <Image source={require('../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
        </View>
      </View>
    </View>
  );

  const fade = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(shift, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, shift, stage, mode]);

  const BTN_H = scale(IS_SMALL ? 56 : 60);
  const TABS_GAP = scale(22);
  const BALL_SRC = BALL_ASSETS[sport];

  const ContentWrap: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    VERY_SMALL ? (
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 94 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    ) : (
      <View style={[styles.contentDown]}>{children}</View>
    );

  return (
    <View style={styles.root}>
      <HeaderBar title="Reaction game" />
      <Animated.View style={{ flex: 1, width: '100%', alignItems: 'center', opacity: fade, transform: [{ translateY: shift }] }}>
        <ContentWrap>
          {stage === 'choose' && (
            <>
              <Text style={[styles.chooseTitle, { fontSize: scale(16) }]}>Choose a mode</Text>

              <View style={[styles.modeWrap, { gap: TABS_GAP }]}>
                <TouchableOpacity
                  style={[styles.modeBtn, { height: BTN_H, borderRadius: scale(12) }, mode === 'solo' && styles.modeBtnActive]}
                  onPress={() => { setMode('solo'); setStage('playing'); setSoloPhase('idle'); resetBall(); }}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.modeText, { fontSize: scale(16) }, mode === 'solo' && styles.modeTextActive]}>Solo mode</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeBtn, { height: BTN_H, borderRadius: scale(12) }, mode === 'duo' && styles.modeBtnActive]}
                  onPress={() => { setMode('duo'); setStage('playing'); setDuoPhase('names'); setP1Time(null); setP2Time(null); resetBall(); }}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.modeText, { fontSize: scale(16) }, mode === 'duo' && styles.modeTextActive]}>Duo mode</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {stage === 'playing' && mode === 'solo' && (
            <>
              <View style={styles.smallModeBar}><Text style={styles.smallModeText}>Solo mode</Text></View>

              <View style={[styles.card, { width: CARD_SIZE, height: CARD_SIZE }]}>
                {soloPhase === 'idle' && (
                  <TouchableOpacity style={styles.startBtn} onPress={runSolo} activeOpacity={0.9}>
                    <Text style={styles.startText}>Start</Text>
                  </TouchableOpacity>
                )}

                {soloPhase === 'countdown' && count !== null && count > 0 && <Text style={styles.countdown}>{count}</Text>}
                {soloPhase === 'startWord' && <Text style={styles.startWord}>Start</Text>}

                {soloPhase === 'moving' && (
                  <View style={[RNStyleSheet.absoluteFillObject, { pointerEvents: 'box-none' }]}>
                    <AnimatedPressable
                      onPressIn={onBallPressIn}
                      style={[
                        styles.ballWrap,
                        { left: centerLeft, top: centerTop, width: BALL, height: BALL, transform: [{ translateX: ballX }, { translateY: ballY }] },
                      ]}
                      android_ripple={undefined}
                    >
                      <Image source={BALL_SRC} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                    </AnimatedPressable>
                  </View>
                )}
              </View>

              {soloPhase === 'result' && (
                <>
                  <Text style={styles.resultTitle}>Your result</Text>
                  <View style={styles.resultBigPill}><Text style={styles.resultBigPillText}>{format(soloTime)} sec.</Text></View>
                  <Text style={styles.resultHint}>You showed a good result, keep it up!</Text>
                  <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={shareSolo} activeOpacity={0.9}>
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.playAgainBtn]}
                    onPress={() => { setSoloTime(null); setSoloPhase('idle'); }}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.actionBtnText}>Play again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.replace('home')} style={styles.homeLink}>
                    <Text style={styles.homeLinkText}>Home</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {stage === 'playing' && mode === 'duo' && (
            <>
              <View style={styles.smallModeBar}><Text style={styles.smallModeText}>Duo mode</Text></View>

              {duoPhase === 'names' && (
                <>
                  <View style={[styles.card, { width: CARD_SIZE, height: CARD_SIZE, padding: 16, justifyContent: 'center' }]}>
                    <Text style={styles.inputLabel}>Enter names</Text>

                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={() => p1Ref.current?.focus()}
                      style={[styles.nameRow, { borderRadius: scale(12), height: scale(46) }]}
                    >
                      <TextInput
                        ref={p1Ref}
                        value={p1}
                        onChangeText={setP1}
                        placeholder="Player 1"
                        placeholderTextColor="#8F8F8F"
                        selectionColor={YELLOW}
                        autoCorrect={false}
                        returnKeyType="next"
                        onFocus={() => {
                          if (!clearedP1.current && (p1 === 'Player 1' || p1.trim() === '')) {
                            clearedP1.current = true;
                            setP1('');
                            setTimeout(() => p1Ref.current?.setNativeProps?.({ selection: { start: 0, end: 0 } }), 0);
                          }
                        }}
                        onSubmitEditing={() => p2Ref.current?.focus()}
                        style={styles.nameInput}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={() => p2Ref.current?.focus()}
                      style={[styles.nameRow, { borderRadius: scale(12), height: scale(46), marginTop: 10 }]}
                    >
                      <TextInput
                        ref={p2Ref}
                        value={p2}
                        onChangeText={setP2}
                        placeholder="Player 2"
                        placeholderTextColor="#8F8F8F"
                        selectionColor={YELLOW}
                        autoCorrect={false}
                        returnKeyType="done"
                        onFocus={() => {
                          if (!clearedP2.current && (p2 === 'Player 2' || p2.trim() === '')) {
                            clearedP2.current = true;
                            setP2('');
                            setTimeout(() => p2Ref.current?.setNativeProps?.({ selection: { start: 0, end: 0 } }), 0);
                          }
                        }}
                        onSubmitEditing={() => beginDuoFor(1)}
                        style={styles.nameInput}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={[styles.actionBtn, { height: scale(IS_SMALL ? 56 : 60) }]} onPress={() => beginDuoFor(1)} activeOpacity={0.9}>
                    <Text style={styles.actionBtnText}>Start</Text>
                  </TouchableOpacity>
                </>
              )}

              {(duoPhase === 'countdown' || duoPhase === 'startWord' || duoPhase === 'moving' || duoPhase === 'p1done' || duoPhase === 'p2done' || duoPhase === 'final') && (
                <>
                  {(duoPhase === 'countdown' || duoPhase === 'startWord' || duoPhase === 'moving') && (
                    <View style={styles.playerTag}><Text style={styles.playerTagText}>{currentPlayer === 1 ? (p1 || 'Player 1') : (p2 || 'Player 2')}</Text></View>
                  )}

                  {(duoPhase === 'countdown' || duoPhase === 'startWord' || duoPhase === 'moving') && (
                    <View style={[styles.card, { width: CARD_SIZE, height: CARD_SIZE }]}>
                      {duoPhase === 'countdown' && count !== null && count > 0 && <Text style={styles.countdown}>{count}</Text>}
                      {duoPhase === 'startWord' && <Text style={styles.startWord}>Start</Text>}
                      {duoPhase === 'moving' && (
                        <View style={[RNStyleSheet.absoluteFillObject, { pointerEvents: 'box-none' }]}>
                          <AnimatedPressable
                            onPressIn={onBallPressIn}
                            style={[
                              styles.ballWrap,
                              { left: centerLeft, top: centerTop, width: BALL, height: BALL, transform: [{ translateX: ballX }, { translateY: ballY }] },
                            ]}
                            android_ripple={undefined}
                          >
                            <Image source={BALL_SRC} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                          </AnimatedPressable>
                        </View>
                      )}
                    </View>
                  )}

                  {duoPhase === 'p1done' && (
                    <TouchableOpacity style={[styles.actionBtn, { height: scale(IS_SMALL ? 56 : 60) }]} onPress={() => beginDuoFor(2)} activeOpacity={0.9}>
                      <Text style={styles.actionBtnText}>Next player</Text>
                    </TouchableOpacity>
                  )}

                  {duoPhase === 'p2done' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { height: scale(IS_SMALL ? 56 : 60) }]}
                      onPress={async () => {
                        if (p1Time != null && p2Time != null) {
                          await appendDuoResult({ p1: p1 || 'Player 1', p2: p2 || 'Player 2', t1: p1Time, t2: p2Time });
                        }
                        setDuoPhase('final');
                      }}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.actionBtnText}>Result</Text>
                    </TouchableOpacity>
                  )}

                  {duoPhase === 'final' && (
                    <>
                      <Text style={styles.resultTitle}>Result</Text>
                      <View style={styles.twoCols}>
                        <View style={styles.resultSmallPill}>
                          <Text style={styles.resultSmallPillName}>{p1 || 'Player 1'}</Text>
                          <Text style={styles.resultSmallPillText}>{format(p1Time)} sec.</Text>
                        </View>
                        <View style={styles.resultSmallPill}>
                          <Text style={styles.resultSmallPillName}>{p2 || 'Player 2'}</Text>
                          <Text style={styles.resultSmallPillText}>{format(p2Time)} sec.</Text>
                        </View>
                      </View>
                      <Text style={styles.resultHint}>You showed a great fight, each of you is worth attention.</Text>
                      <TouchableOpacity style={[styles.actionBtn, styles.shareBtn, { height: scale(IS_SMALL ? 56 : 60) }]} onPress={shareDuo} activeOpacity={0.9}>
                        <Text style={styles.actionBtnText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.playAgainBtn, { height: scale(IS_SMALL ? 56 : 60) }]}
                        onPress={() => { setP1Time(null); setP2Time(null); setDuoPhase('names'); }}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.actionBtnText}>Play again</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => navigation.replace('home')} style={styles.homeLink}>
                        <Text style={styles.homeLinkText}>Home</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </ContentWrap>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, alignItems: 'center', paddingTop: IS_SMALL ? 60 : 64 },
  contentDown: { width: '100%', alignItems: 'center', marginTop: 60 },

  headerWrap: { width: '100%', paddingHorizontal: 16, marginBottom: 14 },
  headerBar: {
    height: 64, borderWidth: 2, borderColor: YELLOW, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
  },
  headerBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: YELLOW, alignItems: 'center', justifyContent: 'center' },
  headerBtnIcon: { color: TEXT, fontSize: 18, fontWeight: '800', marginTop: -1 },
  headerTitle: { flex: 1, textAlign: 'center', color: TEXT, fontSize: 20, fontWeight: '800' },
  headerLogo: { width: 34, height: 34 },

  chooseTitle: { color: TEXT, fontSize: 16, marginTop: 8, marginBottom: 12 },

  modeWrap: { width: '100%', paddingHorizontal: 16 },
  modeBtn: { borderWidth: 2, borderColor: YELLOW, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeBtnActive: { backgroundColor: YELLOW },
  modeText: { color: TEXT, fontSize: 16, fontWeight: '700' },
  modeTextActive: { color: '#0B0B0B' },

  smallModeBar: {
    height: 36, borderWidth: 2, borderColor: YELLOW, borderRadius: 10, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  smallModeText: { color: SUB, fontSize: 12, fontWeight: '800' },

  card: {
    borderWidth: 2, borderColor: YELLOW, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 14, backgroundColor: '#000',
  },

  startBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: YELLOW, borderRadius: 12 },
  startText: { color: '#0B0B0B', fontWeight: '900' },

  countdown: { color: TEXT, fontSize: 80, fontWeight: '900' },
  startWord: { color: TEXT, fontSize: 24, fontWeight: '800' },

  ballWrap: { position: 'absolute' },

  resultTitle: { color: TEXT, fontSize: 14, marginTop: 6, marginBottom: 8 },
  resultBigPill: { minWidth: 170, height: 46, borderRadius: 12, backgroundColor: YELLOW, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginBottom: 8 },
  resultBigPillText: { color: '#0B0B0B', fontWeight: '900' },
  resultHint: { color: SUB, fontSize: 12, textAlign: 'center', paddingHorizontal: 24, marginBottom: 8 },

  actionBtn: { backgroundColor: YELLOW, height: 46, minWidth: 170, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 8 },
  actionBtnText: { color: '#0B0B0B', fontWeight: '900' },
  shareBtn: {},
  playAgainBtn: {},
  homeLink: { marginTop: 8 },
  homeLinkText: { color: SUB, textDecorationLine: 'underline' },

  inputLabel: { color: SUB, marginBottom: 10 },

  nameRow: {
    width: '100%',
    borderWidth: 2,
    borderColor: YELLOW,
    backgroundColor: '#111',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  nameInput: { color: TEXT, fontSize: 16, padding: 0 },

  playerTag: { height: 30, paddingHorizontal: 12, borderRadius: 10, borderWidth: 2, borderColor: YELLOW, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  playerTagText: { color: SUB, fontWeight: '800', fontSize: 12 },

  twoCols: { width: '100%', paddingHorizontal: 16, flexDirection: 'row', gap: 12, marginBottom: 8 },
  resultSmallPill: { flex: 1, borderWidth: 2, borderColor: YELLOW, borderRadius: 12, height: 60, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  resultSmallPillName: { color: SUB, fontSize: 12, marginBottom: 2 },
  resultSmallPillText: { color: TEXT, fontWeight: '900' },
});
