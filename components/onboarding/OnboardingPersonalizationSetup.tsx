import React from 'react';
import OnboardingPersonalizationWrapper from './OnboardingPersonalizationWrapper';

interface OnboardingPersonalizationSetupProps {
  step: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
  };
  onNext: () => void;
  onBack: () => void;
}

export default function OnboardingPersonalizationSetup({ 
  step, 
  onNext, 
  onBack 
}: OnboardingPersonalizationSetupProps) {
  const handleComplete = () => {
    // User completed personalization
    onNext();
  };

  const handleSkip = () => {
    // User skipped personalization
    onNext();
  };

  return (
    <OnboardingPersonalizationWrapper 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}