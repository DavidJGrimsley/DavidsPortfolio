import { ThemedText } from "@/components/UI/ThemedText";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, TextInput, View, Linking } from "react-native";
import { type Href, router } from "expo-router";
import { Controller, useForm } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { TabContainer } from "@/components/navigation/TabContainer";
import { FORM_SUBMIT_ENDPOINT, intakeForms, type IntakeField } from '@/constants/intakeForms';
import { useThemeColor } from '@/hooks/useThemeColor';


export default function Index() {
  const contactForm = intakeForms['contact'];
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const accentColor = useThemeColor({}, 'accent');
  const cardColor = useThemeColor({}, 'background');

  const defaultValues = useMemo(() => {
    return contactForm.fields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {} as Record<string, string>);
  }, [contactForm]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({
    defaultValues,
  });

  const getKeyboardType = (field: IntakeField) => {
    switch (field.type) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      case 'number':
        return 'numeric';
      case 'url':
        return 'url';
      default:
        return 'default';
    }
  };

  const getAutoCapitalize = (field: IntakeField) => {
    if (field.type === 'email' || field.type === 'url') return 'none';
    return 'sentences';
  };

  const onSubmit = async (data: Record<string, string>) => {
    setSubmitError(null);

    try {
      const payload = new FormData();
      payload.append('_subject', `${contactForm.title} submission`);
      payload.append('_template', 'table');
      payload.append('service', contactForm.title);

      Object.entries(data).forEach(([key, value]) => {
        if (value != null && String(value).trim().length > 0) {
          payload.append(key, String(value));
        }
      });

      const response = await fetch(FORM_SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: payload,
      });

      if (!response.ok) {
        throw new Error('Submission failed. Please try again.');
      }

      reset(defaultValues);
      setIsSuccessOpen(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submission failed.');
    }
  };

  return (
    <>
      <TabContainer
        titleA="Contact"
        titleB="me"
        leadBody="I believe accessibility and transparency are some of the most important factors in choosing where and with whom to do business. I’d love to hear from you."
        leadSubBody="Please feel free to contact me via email, social media, or the form below. There are also specialized forms on the services page for starting a project."
        seo={{
          title: 'Contact',
          description:
            'Contact David Grimsley to discuss website building, app development, APIs, tutoring, game development, or online presence services.',
          path: '/contact',
          keywords: [
            'contact',
            'website quote',
            'website developer',
            'app developer',
            'API developer',
            'freelance developer',
          ],
          type: 'website',
        }}
      >
        <View className="w-full max-w-[980px]">
          {/* Resume download section */}
          <View className="items-center my-5">
            <Pressable
              className="px-4 py-2.5 rounded-2.5 bg-tint"
              onPress={() => Linking.openURL('https://docs.google.com/document/d/1IOsUDX_CZRx1tp4kEjWDSaAtIdriN8bdn4dvhgpoWsk/edit?usp=sharing')}
            >
              <ThemedText inverse className="text-base font-bold">
                View Resume
              </ThemedText>
            </Pressable>
          </View>

          {/* Contact Form */}
          <View className="rounded-3xl border border-white/10 bg-themed/80 p-[4%] mb-6">
            <ThemedText className="text-2xl font-bold mb-2">{contactForm.title}</ThemedText>
            <ThemedText className="text-base opacity-85 mb-4">
              {contactForm.description}
            </ThemedText>

            {contactForm.fields.map((field) => {
              const isSelect = field.type === 'select';
              const error = errors[field.name];

              return (
                <View key={field.name} className="mb-[4%]">
                  <ThemedText className="text-base font-semibold mb-1">
                    {field.label}
                    {field.required ? ' *' : ''}
                  </ThemedText>
                  {field.helper ? (
                    <ThemedText className="text-sm text-secondary mb-2">
                      {field.helper}
                    </ThemedText>
                  ) : null}

                  <Controller
                    control={control}
                    name={field.name}
                    rules={{
                      required: field.required ? `${field.label} is required` : false,
                      ...(field.type === 'email'
                        ? {
                            pattern: {
                              value: /\S+@\S+\.\S+/,
                              message: 'Enter a valid email address',
                            },
                          }
                        : {}),
                    }}
                    render={({ field: controllerField }) =>
                      isSelect ? (
                        <View
                          style={{
                            backgroundColor: cardColor,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: tintColor + '25',
                            overflow: 'hidden',
                          }}
                        >
                          <Picker
                            selectedValue={controllerField.value}
                            onValueChange={controllerField.onChange}
                            style={{
                              color: textColor,
                              backgroundColor: cardColor,
                              minHeight: 52,
                            }}
                            dropdownIconColor={textColor}
                          >
                            <Picker.Item label="Select an option" value="" />
                            {field.options?.map((option) => (
                              <Picker.Item key={option} label={option} value={option} />
                            ))}
                          </Picker>
                        </View>
                      ) : (
                        <TextInput
                          style={{
                            backgroundColor: cardColor,
                            color: textColor,
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: tintColor + '25',
                            minHeight: field.type === 'textarea' ? 120 : 48,
                            textAlignVertical: field.type === 'textarea' ? 'top' : 'center',
                          }}
                          placeholder={field.placeholder}
                          placeholderTextColor={textColor + '60'}
                          value={controllerField.value}
                          onChangeText={controllerField.onChange}
                          keyboardType={getKeyboardType(field)}
                          autoCapitalize={getAutoCapitalize(field)}
                          autoCorrect={field.type !== 'email' && field.type !== 'url'}
                          multiline={field.type === 'textarea'}
                          numberOfLines={field.type === 'textarea' ? 5 : 1}
                        />
                      )
                    }
                  />

                  {error ? (
                    <ThemedText className="text-sm text-tint mt-1">
                      {error.message as string}
                    </ThemedText>
                  ) : null}
                </View>
              );
            })}

            {submitError ? (
              <ThemedText className="text-sm text-tint mb-3">{submitError}</ThemedText>
            ) : null}

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="bg-tint rounded-2.5 px-4 py-3 items-center"
              style={{ opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={accentColor} />
              ) : (
                <ThemedText inverse className="font-bold text-base">
                  Send message
                </ThemedText>
              )}
            </Pressable>
          </View>

          {/* Survey section */}
          <View className="w-full max-w-130 p-4 rounded-xl my-5 bg-accent">
            <ThemedText className="text-base text-center mb-3">After you’ve explored the site or completed your reason for visiting, please take two minutes to fill out the usability survey so I can apply your suggestions to improve the website and experience.</ThemedText>
            <Pressable className="self-center px-4 py-2.5 rounded-2.5 bg-tint" onPress={() => router.push('/(tabs)/services/survey' as Href)}>
              <ThemedText inverse className="text-base font-bold">Survey</ThemedText>
            </Pressable>
          </View>
        </View>
      </TabContainer>

      <Modal
        transparent
        animationType="fade"
        visible={isSuccessOpen}
        onRequestClose={() => setIsSuccessOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 p-6">
          <View className="bg-themed rounded-3xl p-6 w-full max-w-[420px] border border-white/10">
            <ThemedText className="text-2xl font-bold mb-2">Thanks for reaching out!</ThemedText>
            <ThemedText className="text-base opacity-85 mb-5">
              I'll get back to you soon.
            </ThemedText>
            <Pressable
              onPress={() => setIsSuccessOpen(false)}
              className="bg-tint rounded-2.5 px-4 py-3 items-center"
            >
              <ThemedText inverse className="font-bold text-base">
                Close
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

