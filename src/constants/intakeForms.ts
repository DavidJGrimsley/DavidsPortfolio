/**
 * Intake Forms Configuration
 * 
 * Centralized config for all service intake forms
 */

export type IntakeFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'url'
  | 'number';

export interface IntakeField {
  name: string;
  label: string;
  placeholder?: string;
  type: IntakeFieldType;
  required?: boolean;
  options?: string[];
  helper?: string;
}

export interface IntakeFormConfig {
  id: string;
  title: string;
  description: string;
  fields: IntakeField[];
}

export const FORM_SUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/DavidJGrimsley@gmail.com';

export const intakeForms: Record<string, IntakeFormConfig> = {
  'app-development': {
    id: 'app-development',
    title: 'App Development Intake',
    description: 'Tell me about your app idea and requirements.',
    fields: [
      {
        name: 'contactName',
        label: 'Your name',
        placeholder: 'Full name',
        type: 'text',
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        placeholder: 'you@email.com',
        type: 'email',
        required: true,
      },
      {
        name: 'phone',
        label: 'Phone (optional)',
        placeholder: '(555) 123-4567',
        type: 'phone',
      },
      {
        name: 'appTitle',
        label: 'App/project name',
        placeholder: 'Project name',
        type: 'text',
        required: true,
      },
      {
        name: 'platform',
        label: 'Target platform',
        type: 'select',
        required: true,
        options: ['iOS', 'Android', 'Web', 'All of the above', 'Not sure yet'],
      },
      {
        name: 'overview',
        label: 'What does the app do?',
        placeholder: 'Describe the core idea and goal',
        type: 'textarea',
        required: true,
      },
      {
        name: 'keyFeatures',
        label: 'Key features',
        placeholder: 'List the must-have features',
        type: 'textarea',
      },
      {
        name: 'targetAudience',
        label: 'Target users',
        placeholder: 'Who is this app for?',
        type: 'text',
      },
      {
        name: 'timeline',
        label: 'Ideal timeline',
        placeholder: 'When do you want to launch?',
        type: 'select',
        options: ['ASAP', '1-2 months', '3-6 months', '6+ months', 'Not sure yet'],
      },
      {
        name: 'budget',
        label: 'Estimated budget',
        placeholder: 'Budget range or target',
        type: 'select',
        options: ['<$2k', '$2k-$5k', '$5k-$10k', '$10k+', 'Not sure yet'],
      },
      {
        name: 'references',
        label: 'Reference apps or links',
        placeholder: 'Any examples or inspiration?',
        type: 'textarea',
      },
    ],
  },
  'website-building': {
    id: 'website-building',
    title: 'Website Intake',
    description: 'Let’s define the purpose and scope of your website.',
    fields: [
      {
        name: 'contactName',
        label: 'Your name',
        placeholder: 'Full name',
        type: 'text',
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        placeholder: 'you@email.com',
        type: 'email',
        required: true,
      },
      {
        name: 'phone',
        label: 'Phone (optional)',
        placeholder: '(555) 123-4567',
        type: 'phone',
      },
      {
        name: 'purpose',
        label: 'What is the purpose of the site?',
        type: 'select',
        required: true,
        options: ['Business', 'Portfolio', 'Landing page', 'E-commerce', 'Personal brand', 'Other'],
      },
      {
        name: 'pages',
        label: 'Pages you need',
        placeholder: 'Home, About, Services, Contact, etc.',
        type: 'textarea',
        required: true,
      },
      {
        name: 'features',
        label: 'Features or functionality',
        placeholder: 'Bookings, forms, blog, payments, etc.',
        type: 'textarea',
      },
      {
        name: 'contentReady',
        label: 'Do you have content prepared?',
        type: 'select',
        options: ['Yes, content is ready', 'Some content ready', 'No, need help with content'],
      },
      {
        name: 'timeline',
        label: 'Ideal timeline',
        type: 'select',
        options: ['ASAP', '1-2 months', '3-6 months', '6+ months', 'Not sure yet'],
      },
      {
        name: 'budget',
        label: 'Estimated budget',
        type: 'select',
        options: ['<$1k', '$1k-$3k', '$3k-$7k', '$7k+', 'Not sure yet'],
      },
      {
        name: 'references',
        label: 'Reference sites or inspiration',
        placeholder: 'Links you like',
        type: 'textarea',
      },
    ],
  },
  'game-development': {
    id: 'game-development',
    title: 'Game Development Intake',
    description: 'Share your game concept and goals.',
    fields: [
      {
        name: 'contactName',
        label: 'Your name',
        placeholder: 'Full name',
        type: 'text',
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        placeholder: 'you@email.com',
        type: 'email',
        required: true,
      },
      {
        name: 'phone',
        label: 'Phone (optional)',
        placeholder: '(555) 123-4567',
        type: 'phone',
      },
      {
        name: 'gameTitle',
        label: 'Game title or working name',
        placeholder: 'Project name',
        type: 'text',
        required: true,
      },
      {
        name: 'platform',
        label: 'Target platform',
        type: 'select',
        required: true,
        options: ['PC/Console', 'Mobile', 'Web', 'Roblox', 'Fortnite/UEFN', 'Other'],
      },
      {
        name: 'overview',
        label: 'Game concept',
        placeholder: 'Describe the gameplay and goals',
        type: 'textarea',
        required: true,
      },
      {
        name: 'style',
        label: 'Art/style inspiration',
        placeholder: 'Visual style references',
        type: 'textarea',
      },
      {
        name: 'timeline',
        label: 'Ideal timeline',
        type: 'select',
        options: ['ASAP', '1-2 months', '3-6 months', '6+ months', 'Not sure yet'],
      },
      {
        name: 'budget',
        label: 'Estimated budget',
        type: 'select',
        options: ['<$2k', '$2k-$5k', '$5k-$10k', '$10k+', 'Not sure yet'],
      },
      {
        name: 'references',
        label: 'Reference games or links',
        placeholder: 'Examples or inspiration',
        type: 'textarea',
      },
    ],
  },
  'tutoring': {
    id: 'tutoring',
    title: 'Tutoring Intake',
    description: 'Tell me about your learning goals.',
    fields: [
      {
        name: 'contactName',
        label: 'Student/parent name',
        placeholder: 'Full name',
        type: 'text',
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        placeholder: 'you@email.com',
        type: 'email',
        required: true,
      },
      {
        name: 'phone',
        label: 'Phone (optional)',
        placeholder: '(555) 123-4567',
        type: 'phone',
      },
      {
        name: 'subject',
        label: 'Subject(s)',
        placeholder: 'Math, CS, Fortnite, Roblox, etc.',
        type: 'text',
        required: true,
      },
      {
        name: 'level',
        label: 'Current level',
        type: 'select',
        options: ['Middle school', 'High school', 'College', 'Adult learner', 'Other'],
      },
      {
        name: 'goals',
        label: 'Learning goals',
        placeholder: 'What do you want to achieve?',
        type: 'textarea',
        required: true,
      },
      {
        name: 'availability',
        label: 'Availability',
        placeholder: 'Days/times that work best',
        type: 'textarea',
      },
    ],
  },
  'online-presence': {
    id: 'online-presence',
    title: 'Online Presence Consultation',
    description: 'Let’s discuss your online business presence.',
    fields: [
      {
        name: 'contactName',
        label: 'Your name',
        placeholder: 'Full name',
        type: 'text',
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        placeholder: 'you@email.com',
        type: 'email',
        required: true,
      },
      {
        name: 'businessName',
        label: 'Business name',
        placeholder: 'Company name',
        type: 'text',
      },
      {
        name: 'industry',
        label: 'Industry',
        placeholder: 'What do you do?',
        type: 'text',
      },
      {
        name: 'profiles',
        label: 'Profiles you already have',
        placeholder: 'Google, Apple, Yelp, LinkedIn, etc.',
        type: 'textarea',
      },
      {
        name: 'goals',
        label: 'What do you want to improve?',
        placeholder: 'Visibility, reviews, accuracy, etc.',
        type: 'textarea',
        required: true,
      },
      {
        name: 'timeline',
        label: 'Ideal timeline',
        type: 'select',
        options: ['ASAP', '1-2 months', '3-6 months', '6+ months', 'Not sure yet'],
      },
    ],
  },
  'survey': {
    id: 'survey',
    title: 'Website Feedback Survey',
    description: 'Help us improve by sharing your feedback.',
    fields: [
      {
        name: 'contactName',
        label: 'Your name (optional)',
        placeholder: 'Full name',
        type: 'text',
      },
      {
        name: 'email',
        label: 'Email (optional)',
        placeholder: 'you@email.com',
        type: 'email',
      },
      {
        name: 'rating',
        label: 'Overall rating',
        type: 'select',
        options: ['5 - Excellent', '4 - Great', '3 - Okay', '2 - Needs work', '1 - Poor'],
      },
      {
        name: 'feedback',
        label: 'What should I improve?',
        placeholder: 'Your feedback',
        type: 'textarea',
        required: true,
      },
    ],
  },
};

export function getIntakeForm(id: string): IntakeFormConfig | undefined {
  return intakeForms[id];
}
