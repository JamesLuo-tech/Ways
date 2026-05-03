import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { palette, radius, spacing, floatShadow } from '../../constants/theme';

const TAB_ICONS = {
  explore: ['compass-outline', 'compass'] as const,
  plan: ['map-outline', 'map'] as const,
  tracker: ['radio-outline', 'radio'] as const,
  profile: ['person-outline', 'person'] as const,
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const [inactiveIcon, activeIcon] =
          TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? TAB_ICONS.explore;

        return {
          headerShown: false,
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.textTertiary,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => (
            <View style={styles.tabBarBg}>
              {Platform.OS === 'web' ? (
                <View style={styles.tabBarGlassWeb} />
              ) : (
                <BlurView intensity={80} tint="systemChromeMaterialLight" style={StyleSheet.absoluteFill} />
              )}
            </View>
          ),
          tabBarIcon: ({ color, focused, size }) =>
            focused ? (
              <View style={styles.activeIconWrap}>
                <Ionicons name={activeIcon} size={size - 4} color={palette.accent} />
              </View>
            ) : (
              <Ionicons name={inactiveIcon} size={size - 4} color={color} />
            ),
        };
      }}
    >
      <Tabs.Screen name="explore" options={{ title: '探索' }} />
      <Tabs.Screen name="plan" options={{ title: '规划' }} />
      <Tabs.Screen name="tracker" options={{ title: '记录' }} />
      <Tabs.Screen name="profile" options={{ title: '我的' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: radius.xl,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    ...floatShadow,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  tabBarGlassWeb: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 254, 250, 0.85)',
    backdropFilter: 'blur(24px)',
  } as Record<string, unknown>,
  tabItem: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  activeIconWrap: {
    width: 40,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
});
