import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Modal, Text, TextInput } from 'react-native';

import ServicesPage from '@/app/(tabs)/services';
import { GET } from '@/app/api/content+api';
import { IntakeFormScreen } from '@/components/Services/IntakeFormScreen';
import { TabContainer } from '@/components/navigation/TabContainer';
import { FORM_SUBMIT_ENDPOINT } from '@/constants/intakeForms';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
}));

jest.mock('@/components/navigation/TabContainer', () => ({
  TabContainer: ({ children, lead, leadBody }: {
    children?: React.ReactNode;
    lead?: React.ReactNode;
    leadBody?: string;
  }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return React.createElement(View, null, lead, React.createElement(Text, null, leadBody), children);
  },
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: () => '#11181C',
}));

jest.mock('@react-native-picker/picker', () => ({ Picker: 'Picker' }));

function textContent(node: renderer.ReactTestInstance): string {
  return node.children.map((child) => (
    typeof child === 'string' ? child : textContent(child)
  )).join('');
}

function visibleText(root: renderer.ReactTestInstance): string[] {
  return findAllByType(root, Text).map(textContent);
}

function findAllByType(root: renderer.ReactTestInstance, component: unknown) {
  return root.findAll((node) => node.type === component);
}

function submitButton(root: renderer.ReactTestInstance) {
  return root.findAll((node) => typeof node.props.onPress === 'function')
    .find((node) => textContent(node) === 'Submit intake')!;
}

async function fillRequiredFields(root: renderer.ReactTestInstance, email = 'owner@example.com') {
  await act(async () => {
    const inputs = findAllByType(root, TextInput);
    inputs[0].props.onChangeText('Business Owner');
    inputs[1].props.onChangeText(email);
    inputs[4].props.onChangeText('Configure email for my domain.');
  });
}

describe('business email hosting service and intake', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  let testRenderer: renderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    fetchMock.mockReset();
    mockPush.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(async () => {
    await act(async () => testRenderer?.unmount());
    testRenderer = undefined;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('renders the actual API response through the content client and opens the mail-hosting intake', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      expect(url).toBe('/api/content');
      return GET();
    });

    await act(async () => {
      testRenderer = renderer.create(<ServicesPage />);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const root = testRenderer!.root;
    const card = root.findAll((node) => typeof node.props.onPress === 'function').find((node) => (
      visibleText(node).includes('Business Email Hosting')
    ))!;
    expect(card).toBeDefined();
    expect(visibleText(card)).toEqual([
      'Business Email Hosting',
      'Your domain. Your inbox. Professionally configured.',
      'Move beyond generic email addresses with secure, professional email using your own domain, configured from server to inbox.',
      'What you get:',
      '• Professional addresses like info@yourdomain.com',
      '• Secure sending, receiving, spam-authentication, and SSL',
      '• Webmail plus phone and computer setup',
    ]);
    expect(card.props.style({ pressed: false }).borderColor).toBe('#14b8a6');
    const container = root.findByType(TabContainer);
    expect(container.props.leadBody).toContain('business email hosting');
    expect(container.props.seo.keywords).toContain('business email hosting');
    expect(container.props.seo.structuredData.serviceType).toContain('Business email hosting');
    expect(container.props.seo.title).toContain('Email Hosting');
    expect(container.props.seo.description).toContain('business email hosting');

    await act(async () => card.props.onPress());

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/services/mail-hosting');
  });

  it('renders the five intake fields with the existing input types and required markers', async () => {
    await act(async () => {
      testRenderer = renderer.create(<IntakeFormScreen formId="mail-hosting" />);
    });

    const root = testRenderer!.root;
    expect(visibleText(root)).toEqual(expect.arrayContaining([
      'Business Email Hosting Intake',
      'Tell me about your domain and email needs.',
      'Your name *',
      'Reply email *',
      'Domain',
      'Approximate mailbox count',
      'Email hosting needs *',
    ]));
    const inputs = findAllByType(root, TextInput);
    expect(inputs).toHaveLength(5);
    expect(inputs[1].props.keyboardType).toBe('email-address');
    expect(inputs[1].props.autoCapitalize).toBe('none');
    expect(inputs[3].props.keyboardType).toBe('numeric');
    expect(inputs[4].props.multiline).toBe(true);
    expect(root.findByType(TabContainer).props.seo.path).toBe('/services/mail-hosting');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks empty required fields and invalid reply email before any request', async () => {
    await act(async () => {
      testRenderer = renderer.create(<IntakeFormScreen formId="mail-hosting" />);
    });

    const root = testRenderer!.root;
    await act(async () => submitButton(root).props.onPress());

    expect(visibleText(root)).toEqual(expect.arrayContaining([
      'Your name is required',
      'Reply email is required',
      'Email hosting needs is required',
    ]));
    expect(fetchMock).not.toHaveBeenCalled();

    await fillRequiredFields(root, 'invalid-email');
    await act(async () => submitButton(root).props.onPress());

    expect(visibleText(root)).toContain('Enter a valid email address');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([false, true])('submits valid intake with optional fields populated: %s', async (includeOptional) => {
    fetchMock.mockResolvedValue({ ok: true });
    const appendSpy = jest.spyOn(FormData.prototype, 'append');
    await act(async () => {
      testRenderer = renderer.create(<IntakeFormScreen formId="mail-hosting" />);
    });

    const root = testRenderer!.root;
    await fillRequiredFields(root);
    if (includeOptional) {
      await act(async () => {
        const inputs = findAllByType(root, TextInput);
        inputs[2].props.onChangeText('example.com');
        inputs[3].props.onChangeText('4');
      });
    }
    await act(async () => submitButton(root).props.onPress());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(FORM_SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: expect.any(FormData),
    });
    expect(appendSpy.mock.calls).toEqual([
      ['_subject', 'Business Email Hosting Intake submission'],
      ['_template', 'table'],
      ['service', 'Business Email Hosting Intake'],
      ['contactName', 'Business Owner'],
      ['email', 'owner@example.com'],
      ...(includeOptional ? [['domain', 'example.com'], ['mailboxCount', '4']] : []),
      ['requirements', 'Configure email for my domain.'],
    ]);
    expect(findAllByType(root, Modal)[0].props.visible).toBe(true);
    expect(findAllByType(root, TextInput).map((input) => input.props.value)).toEqual(['', '', '', '', '']);
  });

  it('preserves entered values and displays the existing error when submission fails', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    await act(async () => {
      testRenderer = renderer.create(<IntakeFormScreen formId="mail-hosting" />);
    });

    const root = testRenderer!.root;
    await fillRequiredFields(root);
    await act(async () => submitButton(root).props.onPress());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(visibleText(root)).toContain('Submission failed. Please try again.');
    expect(findAllByType(root, Modal)[0].props.visible).toBe(false);
    expect(findAllByType(root, TextInput)[0].props.value).toBe('Business Owner');
  });
});
