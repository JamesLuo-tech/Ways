import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cardShadow, fontWeight, palette, radius, spacing, typography } from '../../constants/theme';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  accessory?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, accessory }: PageHeaderProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    ...cardShadow,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: typography.caption,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.textPrimary,
    fontSize: typography.title2,
    fontWeight: fontWeight.bold,
    lineHeight: 28,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typography.subhead,
    lineHeight: 22,
  },
  accessory: {
    paddingTop: spacing.xs,
  },
});
