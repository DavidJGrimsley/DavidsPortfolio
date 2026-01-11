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
                <Text className="text-[2.5%] font-bold mb-[0.5%]">One-on-One Tutoring</Text>
                <Text className="text-[1%] font-bold"> $55 per hour</Text>
              </Text>
              <Text className="text-[1.75%] italic mb-[0.5%]">Offering personalized tutoring services in the following areas:</Text>
              <Text className="text-[1.25%] font-bold mb-[0.5%]">Game Development</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Fortnite Experiences (UEFN & Verse)</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Unreal Engine</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Scratch</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Roblox</Text>
              <Text className="text-[1.25%] font-bold mb-[0.5%]">Computer Science</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• AP Computer Science A (APCSA)</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• AP Computer Science Principles (APCSP)</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Web Development</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• UI Design & UX</Text>
              <Text className="text-[1.25%] font-bold mb-[0.5%]">Mathematics</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Geometry</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Algebra I & II</Text>
              <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Pre-Calculus & Trigonometry</Text>
              <Text>
                <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Calculus</Text>
                <Text className="text-[1%] font-bold"> $65 per hour</Text>
              </Text>
              <Text>
                <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Statistics</Text>
                <Text className="text-[1%] font-bold"> $65 per hour</Text>
              </Text>
            </View>
            <View className="mb-[2%]">
              <Text className="text-[2.5%] font-bold mb-[0.5%]">Group Classes</Text>
              <Text className="text-[1.75%] italic mb-[0.5%]">I also offer group classes tailored for different age groups:</Text>
              <Text>
                <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Intro to Computer Science (Grades 3+)</Text>
                <Text className="text-[1%] font-bold"> $30 per hour</Text>
              </Text>
              <Text>
                <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• AP Computer Science A (APCSA) (Grades 9+)</Text>
                <Text className="text-[1%] font-bold"> $40 per hour</Text>
              </Text>
              <Text>
                <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• AP Computer Science Principles (APCSP) (Grades 9+)</Text>
                <Text className="text-[1%] font-bold"> $40 per hour</Text>
              </Text>
              <Text>
                <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Basic computer skills (Any age)</Text>
                <Text className="text-[1%] font-bold"> $25 per hour</Text>
              </Text>
              <Text>
                <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">• Geometry</Text>
                <Text className="text-[1%] font-bold"> $30 per hour</Text>
              </Text>
            <Text className="text-[1.25%] italic mt-[1%] w-[80%] self-center">
              Note: All prices are for meeting online virtually. Please ensure you have a stable internet connection for the best experience. In-person classes are $10 more per hour. Group classes are virtual only as of this time.
            </Text>
            </View>
        </ScrollView>
        <View className="justify-center w-[40%]">
          <Text className="text-[1.75%] text-center italic mb-[0.5%]">Summer classes are currently open!</Text>
          <Pressable className="self-center px-4 py-2.5 rounded-2.5 mb-2.5" onPress={() => router.push('/(tabs)/learn/SignUp' as Href)}>
            <Text className="font-bold text-themed text-center">Sign Up</Text>
          </Pressable>
          <Text className="text-[1.25%] ml-[0.5%] mb-[0.25%]">Please browse the rest of this website for projects that you could learn how to make.</Text>
        </View>
      </View>
      <Foot/>
    </View>
  );
};

export default Page;
