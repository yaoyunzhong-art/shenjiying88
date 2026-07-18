import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DomainGovernanceDisplayModel, DomainGovernanceDisplayPreset } from '@m5/types';
import {
  buildDomainGovernanceRenderSections,
  resolveDomainGovernanceDetailSlotColor,
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
  const headerSection = model.headerSection;
  const footerSection = model.footerSection;
  const renderSections = buildDomainGovernanceRenderSections(model);

  return (
    <View style={[styles.card, { backgroundColor: preset.background }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: preset.accentColor }]}>{headerSection.eyebrow}</Text>
          <Text style={[styles.title, { color: preset.titleColor }]}>{headerSection.titleSlot.value}</Text>
          <Text style={[styles.subtitle, { color: preset.subtitleColor }]}>{headerSection.subtitle}</Text>
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
          {headerSection.statusBadge.value}
        </Text>
      </View>
      <Text style={[styles.sectionTitle, { color: preset.accentColor }]}>{detailSectionTitle}</Text>
      {renderSections.map((section) => (
        <View key={section.key} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: preset.accentColor }]}>{section.title}</Text>
          {section.slots.map((slot) => (
            <Text key={slot.key} style={[styles.detail, { color: resolveDomainGovernanceDetailSlotColor(preset, slot.tone) }]}>
              {slot.label}：{slot.value}
            </Text>
          ))}
        </View>
      ))}
      <TouchableOpacity
        testID="domain-governance-cta"
        style={[styles.button, { backgroundColor: preset.buttonBackground }]}
        onPress={() => Alert.alert(headerSection.eyebrow, footerSection.workspaceSlot.value)}
      >
        <Text style={[styles.buttonText, { color: preset.buttonTextColor }]}>{footerSection.ctaLabel}</Text>
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
