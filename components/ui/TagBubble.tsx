import { Pressable, StyleSheet, Text } from 'react-native';

import { palette, radius, spacing, typography, fontWeight } from '../../constants/theme';

interface TagBubbleProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function TagBubble({ label, selected = false, onPress }: TagBubbleProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[styles.base, selected ? styles.selected : styles.idle]}
    >
      <Text style={selected ? styles.selectedLabel : styles.idleLabel}>#{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  idle: {
    backgroundColor: palette.bgWash,
  },
  selected: {
    backgroundColor: palette.accent,
  },
  idleLabel: {
    color: palette.textSecondary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.medium,
  },
  selectedLabel: {
    color: '#FFFFFF',
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
  },
});
