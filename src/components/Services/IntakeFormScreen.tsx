import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { FORM_SUBMIT_ENDPOINT, intakeForms, type IntakeField } from '@/constants/intakeForms';
import { ThemedText } from '@/components/UI/ThemedText';
import { TabContainer } from '@/components/navigation/TabContainer';
import { useThemeColor } from '@/hooks/useThemeColor';

interface IntakeFormScreenProps {
  formId: string;
}

export const IntakeFormScreen = ({ formId }: IntakeFormScreenProps) => {
  const form = formId ? intakeForms[formId] : undefined;
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const titleA = formId === 'survey' ? 'What are' : 'Let\'s Get';
  const titleB = formId === 'survey' ? 'your thoughts?' : 'Started';

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const accentColor = useThemeColor({}, 'accent');
  const cardColor = useThemeColor({}, 'background');

  const defaultValues = useMemo(() => {
    if (!form) return {} as Record<string, string>;
    return form.fields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {} as Record<string, string>);
  }, [form]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({
    defaultValues,
  });

  if (!form) {
    return (
      <View className="flex-1 bg-themed items-center justify-center p-5">
        <ThemedText className="text-lg mb-4">Form not found</ThemedText>
        <Pressable
          className="bg-tint px-4 py-2 rounded-2"
          onPress={() => router.back()}
        >
          <ThemedText inverse>Go back</ThemedText>
        </Pressable>
      </View>
    );
  }

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
      payload.append('_subject', `${form.title} submission`);
      payload.append('_template', 'table');
      payload.append('service', form.title);

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
        titleA={titleA}
        titleB={titleB}
        showFooter={false}
        seo={{
          title: form.title,
          description: form.description,
          path: `/services/${form.id}`,
          keywords: [
            'services',
            'project intake',
            'website building',
            'app development',
            'API development',
            'quote',
          ],
          type: 'website',
        }}
        lead={
          <>
            <ThemedText className="text-2xl font-bold mb-2">{form.title}</ThemedText>
            <ThemedText className="text-base opacity-85">
              {form.description}
            </ThemedText>
          </>
        }
      >
        <View className="w-full max-w-[980px]">
          <View className="rounded-3xl border border-white/10 bg-themed/80 p-[4%]">
            {form.fields.map((field) => {
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
                  Submit intake
                </ThemedText>
              )}
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
            <ThemedText className="text-2xl font-bold mb-2">Thanks for submitting!</ThemedText>
            <ThemedText className="text-base opacity-85 mb-5">
              I’ll get back to you soon.
            </ThemedText>
            <Pressable
              onPress={() => {
                setIsSuccessOpen(false);
                router.push('/(tabs)/services');
              }}
              className="bg-tint rounded-2.5 px-4 py-3 items-center"
            >
              <ThemedText inverse className="font-bold text-base">
                I’m excited
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};
