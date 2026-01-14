/**
 * Intake Forms Configuration
 * 
 * Centralized config for all service intake forms
 */

export interface IntakeFormConfig {
  id: string;
  title: string;
  description: string;
  formUrl: string;
}

export const intakeForms: Record<string, IntakeFormConfig> = {
  'app-development': {
    id: 'app-development',
    title: 'App Development Intake',
    description: 'Tell us about your app idea and requirements.',
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSemBxe0Z6JYAZi8D9ZeMBU9HTRxqC-QlsSWoBTG6LvYKGDWsA/viewform?embedded=true',
  },
  'website-building': {
    id: 'website-building',
    title: 'Website Intake',
    description: 'Let\'s discuss your website needs and vision.',
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfyVF35E5-vuZP7WORUDtUC36tJrnTrWUFzRGa41FGxqelV4Q/viewform?usp=sf_link',
  },
  'game-development': {
    id: 'game-development',
    title: 'Game Development Intake',
    description: 'Share your game concept and goals.',
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSemBxe0Z6JYAZi8D9ZeMBU9HTRxqC-QlsSWoBTG6LvYKGDWsA/viewform?embedded=true',
  },
  'tutoring': {
    id: 'tutoring',
    title: 'Tutoring Intake',
    description: 'Tell us about your learning goals.',
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSca1rbKUU94fup06Ko-wW3vVOLxNuMJNOaqnbMh6tJdyiJ1dw/viewform?usp=header',
  },
  'online-presence': {
    id: 'online-presence',
    title: 'Online Presence Consultation',
    description: 'Let\'s discuss your online business presence.',
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfyVF35E5-vuZP7WORUDtUC36tJrnTrWUFzRGa41FGxqelV4Q/viewform?usp=sf_link',
  },
  'survey': {
    id: 'survey',
    title: 'Website Feedback Survey',
    description: 'Help us improve by sharing your feedback.',
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSe3eYnP_example/viewform',
  },
};

export function getIntakeForm(id: string): IntakeFormConfig | undefined {
  return intakeForms[id];
}
