import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { IntakeFormScreen } from '@/components/Services/IntakeFormScreen';

export default function IntakeForm() {
  const { intake } = useLocalSearchParams<{ intake: string }>();
  return <IntakeFormScreen formId={intake ?? ''} />;
}
