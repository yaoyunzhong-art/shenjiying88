import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DomainGovernanceDisplayModel, DomainGovernanceDisplayPreset } from '@m5/types';
import {
  resolveDomainGovernanceRenderItemColor,
  resolveDomainGovernanceDisplayPreset,
} from '@m5/types';

interface DomainGovernanceCardProps {
  model: DomainGovernanceDisplayModel;
  preset?: DomainGovernanceDisplayPreset;
}

export function DomainGovernanceCard({
  model,
  preset = resolveDomainGovernanceDisplayPreset('APP_NATIVE', model.requiresAttention),
}: DomainGovernanceCardProps) {
  const detailSectionTitle = '治理明细';
  const renderSections = model.renderSections;

  return (
    <View style={[styles.card, { backgroundColor: preset.background }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: preset.accentColor }]}>{model.eyebrow}</Text>
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
      <Text style={[styles.sectionTitle, { color: preset.accentColor }]}>{detailSectionTitle}</Text>
      {renderSections.map((section, sectionIndex) => (
        <View key={`${section.title}-${sectionIndex}`} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: preset.accentColor }]}>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <Text
              key={`${section.title}-${item.label}-${itemIndex}`}
              style={[styles.detail, { color: resolveDomainGovernanceRenderItemColor(preset, item.tone) }]}
            >
              {item.label}：{item.value}
            </Text>
          ))}
        </View>
      ))}
      <TouchableOpacity
        testID="domain-governance-cta"
        style={[styles.button, { backgroundColor: preset.buttonBackground }]}
        onPress={() => Alert.alert(model.eyebrow, model.workspaceHref)}
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
  eyebrow: { fontSize: 12, fontWeight: '600' },
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
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700' },
  detail: { marginTop: 6, fontSize: 12 },
  button: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonText: { fontSize: 13, fontWeight: '700' },
});
