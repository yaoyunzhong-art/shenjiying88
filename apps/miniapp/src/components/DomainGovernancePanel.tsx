import { View, Text, Button } from '@tarojs/components';
import type { DomainGovernanceDisplayModel } from '@m5/types';

interface DomainGovernancePanelProps {
  model: DomainGovernanceDisplayModel;
  heading: string;
  background: string;
}

export function DomainGovernancePanel({
  model,
  heading,
  background,
}: DomainGovernancePanelProps) {
  return (
    <View
      style={{
        marginTop: '20px',
        padding: '16px',
        borderRadius: '16px',
        background,
      }}
    >
      <Text>{heading}</Text>
      <View style={{ marginTop: '8px' }}>
        <Text>{model.subtitle}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>{model.statusSummary}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>{model.countsSummary}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>{model.sourceSummary}</Text>
      </View>
      {model.detailLines.map((line) => (
        <View key={line} style={{ marginTop: '8px' }}>
          <Text>{line}</Text>
        </View>
      ))}
      <View style={{ marginTop: '8px' }}>
        <Text>治理后台入口：{model.workspaceHref}</Text>
      </View>
      <View style={{ marginTop: '12px' }}>
        <Button>{model.ctaLabel}</Button>
      </View>
    </View>
  );
}
