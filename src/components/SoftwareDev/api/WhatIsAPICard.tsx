import React from 'react';
import { InfoCard } from '@/components/SoftwareDev/InfoCard';

export function WhatIsAPICard() {
  return (
    <InfoCard
      icon="🌐"
      title="What is an API?"
      paragraphs={[
        "An API (Application Programming Interface) is a set of rules and protocols that allows different software applications to communicate with each other. APIs define the methods and data structures that developers can use to interact with external services.",
        "REST APIs use HTTP requests to perform operations like retrieving data (GET), creating resources (POST), updating information (PUT), and deleting items (DELETE). They return structured data, typically in JSON format, making them easy to integrate into web and mobile applications."
      ]}
    />
  );
}
