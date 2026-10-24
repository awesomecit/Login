export type PolicyTab = 'terms' | 'privacy';

export interface PolicySection {
  id?: string;
  title: string;
  body: string;
}

export interface PolicyDocument {
  title: string;
  subtitle?: string;
  lastUpdatedText?: string;
  complianceBadge?: string;
  sections: PolicySection[];
}

export interface PolicyConfig {
  brandName: string;
  labels: {
    termsTab: string;
    privacyTab: string;
    closeButton: string;
  };
  terms: PolicyDocument;
  privacy: PolicyDocument;
}

export interface PolicyModalProps {
  isOpen: boolean;
  activeTab?: PolicyTab;
  config: PolicyConfig;
  onClose: () => void;
  onTabChange?: (tab: PolicyTab) => void;
}
