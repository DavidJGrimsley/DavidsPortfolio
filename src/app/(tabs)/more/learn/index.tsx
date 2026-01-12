import { Text, View, ScrollView, Pressable } from 'react-native';
import { Foot } from "@/components/Foot";
import { TitleOfPage } from "@/components/Categories/TitleOfPage";
import { type Href, router } from 'expo-router';

const Page = () => {
  return (
    <View className="flex-1 bg-themed">
      <TitleOfPage titleA="Learning" titleB="Center" />
      <View className="flex-row flex-1 w-[85%]">
        <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-[2%]">
              <Text>
                <Text className="text-3xl font-bold mb-2">One-on-One Tutoring</Text>
                <Text className="text-lg font-bold"> $55 per hour</Text>
              </Text>
              <Text className="text-xl italic mb-2">Offering personalized tutoring services in the following areas:</Text>
              <Text className="text-lg font-bold mb-2">Game Development</Text>
              <Text className="text-base mb-1 ml-2">• Fortnite Experiences (UEFN & Verse)</Text>
              <Text className="text-base mb-1 ml-2">• Unreal Engine</Text>
              <Text className="text-base mb-1 ml-2">• Scratch</Text>
              <Text className="text-base mb-1 ml-2">• Roblox</Text>
              <Text className="text-lg font-bold mb-2">Computer Science</Text>
              <Text className="text-base mb-1 ml-2">• AP Computer Science A (APCSA)</Text>
              <Text className="text-base mb-1 ml-2">• AP Computer Science Principles (APCSP)</Text>
              <Text className="text-base mb-1 ml-2">• Web Development</Text>
              <Text className="text-base mb-1 ml-2">• UI Design & UX</Text>
              <Text className="text-lg font-bold mb-2">Mathematics</Text>
              <Text className="text-base mb-1 ml-2">• Geometry</Text>
              <Text className="text-base mb-1 ml-2">• Algebra I & II</Text>
              <Text className="text-base mb-1 ml-2">• Pre-Calculus & Trigonometry</Text>
              <Text>
                <Text className="text-base mb-1 ml-2">• Calculus</Text>
                <Text className="text-lg font-bold"> $65 per hour</Text>
              </Text>
              <Text>
                <Text className="text-base mb-1 ml-2">• Statistics</Text>
                <Text className="text-lg font-bold"> $65 per hour</Text>
              </Text>
            </View>
            <View className="mb-[2%]">
              <Text className="text-3xl font-bold mb-2">Group Classes</Text>
              <Text className="text-xl italic mb-2">I also offer group classes tailored for different age groups:</Text>
              <Text>
                <Text className="text-base mb-1 ml-2">• Intro to Computer Science (Grades 3+)</Text>
                <Text className="text-lg font-bold"> $30 per hour</Text>
              </Text>
              <Text>
                <Text className="text-base mb-1 ml-2">• AP Computer Science A (APCSA) (Grades 9+)</Text>
                <Text className="text-lg font-bold"> $40 per hour</Text>
              </Text>
              <Text>
                <Text className="text-base mb-1 ml-2">• AP Computer Science Principles (APCSP) (Grades 9+)</Text>
                <Text className="text-lg font-bold"> $40 per hour</Text>
              </Text>
              <Text>
                <Text className="text-base mb-1 ml-2">• Basic computer skills (Any age)</Text>
                <Text className="text-lg font-bold"> $25 per hour</Text>
              </Text>
              <Text>
                <Text className="text-base mb-1 ml-2">• Geometry</Text>
                <Text className="text-lg font-bold"> $30 per hour</Text>
              </Text>
            <Text className="text-base italic mt-3 w-[80%] self-center">
              Note: All prices are for meeting online virtually. Please ensure you have a stable internet connection for the best experience. In-person classes are $10 more per hour. Group classes are virtual only as of this time.
            </Text>
            </View>
        </ScrollView>
        <View className="justify-center w-[40%]">
          <Text className="text-xl text-center italic mb-2">Summer classes are currently open!</Text>
          <Pressable className="self-center px-4 py-2.5 rounded-2.5 mb-2.5" onPress={() => router.push('/(tabs)/learn/SignUp' as Href)}>
            <Text className="font-bold text-themed text-center">Sign Up</Text>
          </Pressable>
          <Text className="text-base ml-2 mb-1">Please browse the rest of this website for projects that you could learn how to make.</Text>
        </View>
      </View>
      <Foot/>
    </View>
  );
};

export default Page;
