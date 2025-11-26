import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, StatusBar, SafeAreaView, Image 
} from 'react-native';
import { Colors } from '../constants/Colors';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to BrightSteps',
    subtitle: 'The easiest way to manage your child\'s learning progress.',
    emoji: '👋',
    color: Colors.primary, 
  },
  {
    id: '2',
    title: 'Connected Learning',
    subtitle: 'Your Au Pair uploads lessons directly to this device.',
    emoji: '🔗',
    color: Colors.secondary,
  },
  {
    id: '3',
    title: 'Track Every Step',
    subtitle: 'See exactly how much of a video or document has been completed.',
    emoji: '📈',
    color: Colors.success,
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // Update the dots indicator when scrolling
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleFinish = async () => {
    try {
      // 1. Update Firebase so we don't show this again
      const uid = auth.currentUser.uid;
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        onboardingComplete: true
      });
      
      // 2. Navigate to Main App
      // We use reset to prevent going back to onboarding
      navigation.reset({
        index: 0,
        routes: [{ name: 'ChildSelect' }],
      });
    } catch (e) {
      console.error("Onboarding Error", e);
      // Fallback navigation
      navigation.navigate('ChildSelect'); 
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <View style={[styles.imageContainer, { backgroundColor: item.color + '15' }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        style={{ flex: 1 }}
      />

      {/* Footer: Dots & Button */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                { backgroundColor: currentIndex === index ? Colors.primary : Colors.inputBackground, 
                  width: currentIndex === index ? 20 : 10 }
              ]} 
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  
  slide: {
    width: width,
    height: height * 0.7, // Take up top 70%
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  
  imageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: { fontSize: 80 },
  
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  footer: {
    height: height * 0.20, // Bottom 20%
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },

  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});