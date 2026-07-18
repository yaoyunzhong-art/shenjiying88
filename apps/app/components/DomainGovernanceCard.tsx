import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DomainGovernanceDisplayModel, DomainGovernanceDisplayPreset } from '@m5/types';
import { resolveDomainGovernanceDisplayPreset } from '@m5/types';

interface DomainGovernanceCardProps {
  model: DomainGovernanceDisplayModel;
  preset?: DomainGovernanceDisplayPreset;
}

export function DomainGovernanceCard({
  model,
  preset = resolveDomainGovernanceDisplayPreset('APP_NATIVE', model.requiresAttention),
}: DomainGovernanceCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: preset.background }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: preset.titleColor }]}>{model.title}</Text>
          <Text style={[styles.subtitle, { color: preset.subtitleColor }]}>{model.subtitle}</Text>
        </View>
        <Text
          style={[
            styles.status,
            {
              color: preset.statusColor,
              backgroundColor: preset.statusBackground,
            },
          ]}
        >
          {model.statusLabel}
        </Text>
      </View>
      <Text style={[styles.primary, { color: preset.titleColor }]}>{model.sourceSummary}</Text>
      <Text style={[styles.meta, { color: preset.summaryColor }]}>{model.countsSummary}</Text>
      {model.detailLines.map((line) => (
        <Text key={line} style={[styles.detail, { color: preset.detailColor }]}>
          {line}
        </Text>
      ))}
      <Text style={[styles.href, { color: preset.accentColor }]}>{model.workspaceSummary}</Text>
      <TouchableOpacity
        testID="domain-governance-cta"
        style={[styles.button, { backgroundColor: preset.buttonBackground }]}
        onPress={() => Alert.alert(model.title, model.workspaceHref)}
      >
        <Text style={[styles.buttonText, { color: preset.buttonTextColor }]}>{model.ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { marginTop: 4, fontSize: 12 },
  status: {
    fontSize: 13,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  primary: { marginTop: 10, fontSize: 15, fontWeight: '600' },
  meta: { marginTop: 8, fontSize: 14 },
  detail: { marginTop: 6, fontSize: 12 },
  href: { marginTop: 8, fontSize: 12 },
  button: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonText: { fontSize: 13, fontWeight: '700' },
});
