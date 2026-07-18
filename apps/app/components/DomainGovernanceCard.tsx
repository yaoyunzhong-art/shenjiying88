import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DomainGovernanceDisplayModel } from '@m5/types';

interface DomainGovernanceCardProps {
  model: DomainGovernanceDisplayModel;
}

export function DomainGovernanceCard({ model }: DomainGovernanceCardProps) {
  return (
    <View style={[styles.card, model.requiresAttention ? styles.cardAttention : styles.cardAligned]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{model.title}</Text>
          <Text style={styles.subtitle}>{model.subtitle}</Text>
        </View>
        <Text style={styles.status}>{model.statusLabel}</Text>
      </View>
      <Text style={styles.primary}>{model.sourceSummary}</Text>
      <Text style={styles.meta}>{model.countsSummary}</Text>
      {model.detailLines.map((line) => (
        <Text key={line} style={styles.detail}>
          {line}
        </Text>
      ))}
      <Text style={styles.href}>{model.workspaceSummary}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => Alert.alert(model.title, model.workspaceHref)}
      >
        <Text style={styles.buttonText}>{model.ctaLabel}</Text>
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
  cardAttention: {
    backgroundColor: '#0F172A',
  },
  cardAligned: {
    backgroundColor: '#0F172A',
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
  title: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  subtitle: { marginTop: 4, fontSize: 12, color: '#94A3B8' },
  status: { fontSize: 13, fontWeight: '700', color: '#93C5FD' },
  primary: { marginTop: 10, fontSize: 15, fontWeight: '600', color: '#F8FAFC' },
  meta: { marginTop: 8, fontSize: 14, color: '#CBD5E1' },
  detail: { marginTop: 6, fontSize: 12, color: '#93C5FD' },
  href: { marginTop: 8, fontSize: 12, color: '#93C5FD' },
  button: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#1D4ED8',
  },
  buttonText: { fontSize: 13, fontWeight: '700', color: '#EFF6FF' },
});
