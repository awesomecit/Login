import { useMemo } from 'react';
import { store, useAuthStore } from '../lib/store.ts';
import { getTranslation } from '../lib/i18n/index.ts';
import { StandalonePolicyModal, PolicyConfig } from '../packages/policies/index.ts';

export function PolicyModal() {
  const { policyModal, currentLang } = useAuthStore();

  const config = useMemo<PolicyConfig>(() => {
    return {
      brandName: '',
      labels: {
        termsTab: getTranslation(currentLang, 'policies.termsTab'),
        privacyTab: getTranslation(currentLang, 'policies.privacyTab'),
        closeButton: getTranslation(currentLang, 'policies.close'),
      },
      terms: {
        title: getTranslation(currentLang, 'policies.termsTitle'),
        lastUpdatedText: getTranslation(currentLang, 'policies.termsLastUpdated'),
        sections: [
          {
            title: getTranslation(currentLang, 'policies.termsSection1Title'),
            body: getTranslation(currentLang, 'policies.termsSection1Body'),
          },
          {
            title: getTranslation(currentLang, 'policies.termsSection2Title'),
            body: getTranslation(currentLang, 'policies.termsSection2Body'),
          },
          {
            title: getTranslation(currentLang, 'policies.termsSection3Title'),
            body: getTranslation(currentLang, 'policies.termsSection3Body'),
          },
        ],
      },
      privacy: {
        title: getTranslation(currentLang, 'policies.privacyTitle'),
        lastUpdatedText: getTranslation(currentLang, 'policies.privacyLastUpdated'),
        complianceBadge: 'GDPR Verified',
        sections: [
          {
            title: getTranslation(currentLang, 'policies.privacySection1Title'),
            body: getTranslation(currentLang, 'policies.privacySection1Body'),
          },
          {
            title: getTranslation(currentLang, 'policies.privacySection2Title'),
            body: getTranslation(currentLang, 'policies.privacySection2Body'),
          },
          {
            title: getTranslation(currentLang, 'policies.privacySection3Title'),
            body: getTranslation(currentLang, 'policies.privacySection3Body'),
          },
        ],
      },
    };
  }, [currentLang]);

  return (
    <StandalonePolicyModal
      isOpen={policyModal.isOpen}
      activeTab={policyModal.tab}
      config={config}
      onClose={() => store.closePolicyModal()}
      onTabChange={(tab) => store.openPolicyModal(tab)}
    />
  );
}
