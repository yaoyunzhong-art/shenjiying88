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
  const renderSections = model.renderSections;

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
        <Text>{model.eyebrow}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>{model.subtitle}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>{model.title}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>治理状态：{model.statusLabel}</Text>
      </View>
      {renderSections.map((section, sectionIndex) => (
        <View key={`${section.title}-${sectionIndex}`} style={{ marginTop: '8px' }}>
          <Text>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <View key={`${section.title}-${item.label}-${itemIndex}`} style={{ marginTop: '6px' }}>
              <Text>{item.label}：{item.value}</Text>
            </View>
          ))}
        </View>
      ))}
      <View style={{ marginTop: '12px' }}>
        <Text>{model.workspaceLabel}：{model.workspaceHref}</Text>
      </View>
      <View style={{ marginTop: '12px' }}>
        <Button>{model.ctaLabel}</Button>
      </View>
    </View>
  );
}
