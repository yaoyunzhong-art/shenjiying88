import { View, Text, Button } from '@tarojs/components';
import type { DomainGovernanceDisplayModel } from '@m5/types';
import { buildDomainGovernanceRenderSections } from '@m5/types';

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
  const headerSection = model.headerSection;
  const footerSection = model.footerSection;
  const renderSections = buildDomainGovernanceRenderSections(model);

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
        <Text>{headerSection.eyebrow}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>{headerSection.subtitle}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>{headerSection.titleSlot.value}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>{headerSection.statusBadge.label}：{headerSection.statusBadge.value}</Text>
      </View>
      {renderSections.map((section) => (
        <View key={section.key} style={{ marginTop: '8px' }}>
          <Text>{section.title}</Text>
          {section.slots.map((slot) => (
            <View key={slot.key} style={{ marginTop: '6px' }}>
              <Text>{slot.label}：{slot.value}</Text>
            </View>
          ))}
        </View>
      ))}
      <View style={{ marginTop: '12px' }}>
        <Text>{footerSection.workspaceSlot.label}：{footerSection.workspaceSlot.value}</Text>
      </View>
      <View style={{ marginTop: '12px' }}>
        <Button>{footerSection.ctaLabel}</Button>
      </View>
    </View>
  );
}
