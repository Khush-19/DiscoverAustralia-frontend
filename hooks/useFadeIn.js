import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Returns an Animated style that fades + slides up slightly each time the
 * screen comes into focus. Apply to the root Animated.View of any screen.
 *
 *   const fadeStyle = useFadeIn();
 *   return <Animated.View style={[{ flex: 1 }, fadeStyle]}>...</Animated.View>;
 */
export default function useFadeIn(duration = 210) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(7)).current;

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      translateY.setValue(7);
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration, useNativeDriver: true }),
      ]).start();
    }, [])
  );

  return { opacity, transform: [{ translateY }] };
}
