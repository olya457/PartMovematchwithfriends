import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'REACTION_RESULTS';

export async function saveResult(value: number) {
  try {
    const old = await AsyncStorage.getItem(KEY);
    const arr = old ? JSON.parse(old) : [];
    const newArr = [...arr, { value, ts: Date.now() }];
    await AsyncStorage.setItem(KEY, JSON.stringify(newArr));
  } catch (e) {
    console.log('save error', e);
  }
}

export async function loadResults() {
  try {
    const data = await AsyncStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
