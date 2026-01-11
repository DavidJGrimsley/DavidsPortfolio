import { Text, View, ScrollView, Dimensions } from "react-native";
import React, { useState } from 'react';
import { FeaturedCard } from "../../components/FeaturedCard";
import { Foot } from "../../components/Foot";
import { TitleOfPage } from "../../components/Categories/TitleOfPage";
import Game from "../../components/TicTacToe";
import { BackgroundGradient } from "@/components/Gradients";
import { Container } from "react-bootstrap";




export default function Index() {


  return (
    <View className="flex-1 mb-[1%]">
      <BackgroundGradient/>
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        className="items-center py-[2%] flex-1"
        >
        <TitleOfPage></TitleOfPage>
        
        {/* <View style={styles.homeContent}> */}
          <View className="items-center p-[2%] my-[2%]">
            <FeaturedCard></FeaturedCard>
          </View>
          
          <Container className="flex justify-center items-center flex-row flex-wrap w-full px-[1%]">
            <View className="mr-[2%] mb-[2%] w-[90%] max-w-150 bg-themed rounded-[2%] opacity-60 flex justify-center items-center">
          <Text className="p-[2%] text-[2.5%] text-center text-secondary">Have a little fun playing Tic-Tac-Toe. This uses React's state property to store all the data about the game and only update needed components. It shows how closely related software development and game design are.</Text>
            </View>
            <View className="flex justify-center items-center bg-tint rounded-[1%] p-[1%] text-center w-[95%] max-w-100 self-center">
          <Game></Game>
            </View>
          </Container>
        {/* </View> */}
        
        <Foot></Foot>
      </ScrollView>
    </View>
  );
}

