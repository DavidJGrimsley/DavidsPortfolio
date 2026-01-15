import { View, Pressable } from 'react-native';
import { ThemedText } from "@/components/UI/ThemedText";
import { type Href, router } from 'expo-router';
import { TabContainer } from "@/components/Navigation/TabContainer";

const Page = () => {
  return (
    <TabContainer titleA="Learning" titleB="Center" contentClassName="py-[6%]">
      <View className="flex-row flex-1 w-full">
        <View className="flex-1 pr-6">
          <View className="mb-[2%]">
            <View className="flex-row flex-wrap items-baseline">
              <ThemedText headingLevel={2} visualHeadingLevel={2} className="text-3xl font-bold mb-2">One-on-One Tutoring</ThemedText>
              <ThemedText className="text-lg font-bold text-tint"> $55 per hour</ThemedText>
            </View>
            <ThemedText className="text-xl italic mb-2 opacity-85">Offering personalized tutoring services in the following areas:</ThemedText>
            <ThemedText headingLevel={3} visualHeadingLevel={3} className="text-lg font-bold mb-2">Game Development</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• Fortnite Experiences (UEFN & Verse)</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• Unreal Engine</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• Scratch</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• Roblox</ThemedText>
            <ThemedText headingLevel={3} visualHeadingLevel={3} className="text-lg font-bold mb-2">Computer Science</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• AP Computer Science A (APCSA)</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• AP Computer Science Principles (APCSP)</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• Web Development</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• UI Design & UX</ThemedText>
            <ThemedText headingLevel={3} visualHeadingLevel={3} className="text-lg font-bold mb-2">Mathematics</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• Geometry</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• Algebra I & II</ThemedText>
            <ThemedText className="text-base mb-1 ml-2">• Pre-Calculus & Trigonometry</ThemedText>
            <View className="flex-row flex-wrap items-baseline">
              <ThemedText className="text-base mb-1 ml-2">• Calculus</ThemedText>
              <ThemedText className="text-lg font-bold text-tint"> $65 per hour</ThemedText>
            </View>
            <View className="flex-row flex-wrap items-baseline">
              <ThemedText className="text-base mb-1 ml-2">• Statistics</ThemedText>
              <ThemedText className="text-lg font-bold text-tint"> $65 per hour</ThemedText>
            </View>
          </View>
          <View className="mb-[2%]">
            <ThemedText headingLevel={2} visualHeadingLevel={2} className="text-3xl font-bold mb-2">Group Classes</ThemedText>
            <ThemedText className="text-xl italic mb-2 opacity-85">I also offer group classes tailored for different age groups:</ThemedText>
            <View className="flex-row flex-wrap items-baseline">
              <ThemedText className="text-base mb-1 ml-2">• Intro to Computer Science (Grades 3+)</ThemedText>
              <ThemedText className="text-lg font-bold text-tint"> $30 per hour</ThemedText>
            </View>
            <View className="flex-row flex-wrap items-baseline">
              <ThemedText className="text-base mb-1 ml-2">• AP Computer Science A (APCSA) (Grades 9+)</ThemedText>
              <ThemedText className="text-lg font-bold text-tint"> $40 per hour</ThemedText>
            </View>
            <View className="flex-row flex-wrap items-baseline">
              <ThemedText className="text-base mb-1 ml-2">• AP Computer Science Principles (APCSP) (Grades 9+)</ThemedText>
              <ThemedText className="text-lg font-bold text-tint"> $40 per hour</ThemedText>
            </View>
            <View className="flex-row flex-wrap items-baseline">
              <ThemedText className="text-base mb-1 ml-2">• Basic computer skills (Any age)</ThemedText>
              <ThemedText className="text-lg font-bold text-tint"> $25 per hour</ThemedText>
            </View>
            <View className="flex-row flex-wrap items-baseline">
              <ThemedText className="text-base mb-1 ml-2">• Geometry</ThemedText>
              <ThemedText className="text-lg font-bold text-tint"> $30 per hour</ThemedText>
            </View>
            <ThemedText className="text-base italic mt-3 w-[80%] self-center opacity-70">
              Note: All prices are for meeting online virtually. Please ensure you have a stable internet connection for the best experience. In-person classes are $10 more per hour. Group classes are virtual only as of this time.
            </ThemedText>
          </View>
        </View>
        <View className="justify-center w-[40%]">
          <ThemedText className="text-xl text-center italic mb-2 text-tint">Summer classes are currently open!</ThemedText>
          <Pressable className="self-center px-4 py-2.5 rounded-2.5 mb-2.5 bg-tint" onPress={() => router.push('/(tabs)/learn/SignUp' as Href)}>
            <ThemedText inverse className="font-bold text-center">Sign Up</ThemedText>
          </Pressable>
          <ThemedText className="text-base ml-2 mb-1">Please browse the rest of this website for projects that you could learn how to make.</ThemedText>
        </View>
      </View>
    </TabContainer>
  );
};

export default Page;
