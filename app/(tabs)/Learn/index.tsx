import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Foot, TitleOfPage } from "@/components/CustomComponents";
import { MobileBackgroundGradient, styles } from "@/constants/styles";
import { Href, router } from 'expo-router';

type Routes = '/(tabs)/Learn/form';

const Page = () => {
  return (
    <View style={styles.page}>
      <MobileBackgroundGradient />
      <TitleOfPage titleA="Learning" titleB="Center" />
      <View className="flex-row flex-1 w-[85%]">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={localStyles.scroll}
        >
            <View style={localStyles.section}>
              <Text>
                <Text style={localStyles.title}>One-on-One Tutoring</Text>
                <Text style={localStyles.price}> $55 per hour</Text>
              </Text>
              <Text style={localStyles.description}>Offering personalized tutoring services in the following areas:</Text>
              <Text style={localStyles.topic}>Game Development</Text>
              <Text style={localStyles.listItem}>• Fortnite Experiences (UEFN & Verse)</Text>
              <Text style={localStyles.listItem}>• Unreal Engine</Text>
              <Text style={localStyles.listItem}>• Scratch</Text>
              <Text style={localStyles.listItem}>• Roblox</Text>
              <Text style={localStyles.topic}>Computer Science</Text>
              <Text style={localStyles.listItem}>• AP Computer Science A (APCSA)</Text>
              <Text style={localStyles.listItem}>• AP Computer Science Principles (APCSP)</Text>
              <Text style={localStyles.listItem}>• Web Development</Text>
              <Text style={localStyles.listItem}>• UI Design & UX</Text>
              <Text style={localStyles.topic}>Mathematics</Text>
              <Text style={localStyles.listItem}>• Geometry</Text>
              <Text style={localStyles.listItem}>• Algebra I & II</Text>
              <Text style={localStyles.listItem}>• Pre-Calculus & Trigonometry</Text>
              <Text>
                <Text style={localStyles.listItem}>• Calculus</Text>
                <Text style={localStyles.price}> $65 per hour</Text>
              </Text>
              <Text>
                <Text style={localStyles.listItem}>• Statistics</Text>
                <Text style={localStyles.price}> $65 per hour</Text>
              </Text>
            </View>
            <View style={localStyles.section}>
              <Text style={localStyles.title}>Group Classes</Text>
              <Text style={localStyles.description}>I also offer group classes tailored for different age groups:</Text>
              <Text>
                <Text style={localStyles.listItem}>• Intro to Computer Science (Grades 3+)</Text>
                <Text style={localStyles.price}> $30 per hour</Text>
              </Text>
              <Text>
                <Text style={localStyles.listItem}>• AP Computer Science A (APCSA) (Grades 9+)</Text>
                <Text style={localStyles.price}> $40 per hour</Text>
              </Text>
              <Text>
                <Text style={localStyles.listItem}>• AP Computer Science Principles (APCSP) (Grades 9+)</Text>
                <Text style={localStyles.price}> $40 per hour</Text>
              </Text>
              <Text>
                <Text style={localStyles.listItem}>• Basic computer skills (Any age)</Text>
                <Text style={localStyles.price}> $25 per hour</Text>
              </Text>
              <Text>
                <Text style={localStyles.listItem}>• Geometry</Text>
                <Text style={localStyles.price}> $30 per hour</Text>
              </Text>
            <Text style={localStyles.disclaimer}>
              Note: All prices are for meeting online virtually. Please ensure you have a stable internet connection for the best experience. In-person classes are $10 more per hour. Group classes are virtual only as of this time.
            </Text>
            </View>
        </ScrollView>
        <View className="justify-center w-[40%]">
          <Text style={localStyles.caption}>Summer classes are currently open!</Text>
          <Pressable style={styles.button} onPress={() => router.push('/(tabs)/Learn/SignUp' as Href)}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </Pressable>
          <Text style={localStyles.listItem}>Please browse the rest of this website for projects that you could learn how to make.</Text>
        </View>
      </View>
      <Foot/>
    </View>
  );
};

export default Page;

const localStyles = StyleSheet.create({
  section: {
    marginBottom: RFPercentage(2),
  },
  topic: {
    fontSize: RFPercentage(1.25),
    fontWeight: 'bold',
    marginBottom: RFPercentage(0.5),
  },
  title: {
    fontSize: RFPercentage(2.5),
    fontWeight: 'bold',
    marginBottom: RFPercentage(0.5),
  },
  description: {
    fontSize: RFPercentage(1.75),
    fontStyle: 'italic',
    marginBottom: RFPercentage(0.5),
  },
  caption: {
    fontSize: RFPercentage(1.75),
    textAlign: 'center', // Center the caption text
    fontStyle: 'italic',
    marginBottom: RFPercentage(0.5),
  },
  listItem: {
    fontSize: RFPercentage(1.25),
    marginLeft: RFPercentage(0.5),
    marginBottom: RFPercentage(0.25),
  },
  disclaimer: {
    fontSize: RFPercentage(1.25),
    fontStyle: 'italic',
    marginTop: RFPercentage(1),
    width: '80%', // Add this line to constrain the width
    alignSelf: 'center', // Optional: center the disclaimer
  },
  price: {
    fontSize: RFPercentage(1),
    fontWeight: 'bold',
  },
  scroll: {
    // padding: RFPercentage(2),
  },
});