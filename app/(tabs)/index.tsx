import { Text, View, ScrollView, Dimensions } from "react-native";
import React, { useState } from 'react';
import  { FeaturedCard, Foot, TitleOfPage } from "../../components/CustomComponents";
import Game from "@/components/TicTacToe";
import { styles, BackgroundGradient }  from "../../constants/styles";
import  { tttStyles } from "../../constants/tttStyles";
import { Container } from "react-bootstrap";




export default function Index() {


  return (
    <View style={styles.home}>
      <BackgroundGradient/>
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollHome}
        >
        <TitleOfPage></TitleOfPage>
        <View style={styles.featuredCardContainer}>
          <FeaturedCard></FeaturedCard>
        </View>
        
        <Container style={tttStyles.tttGameContainer}>
          <View style={tttStyles.tttHeader}>
        <Text style={tttStyles.tttHeaderText}>Have a little fun playing Tic-Tac-Toe. This uses React's state property to store all the data about the game and only update needed components. It shows how closely related software development and game design are.</Text>
          </View>
          <View style={tttStyles.tttBoardContainer}>
        <Game></Game>
          </View>
        </Container>
        
        <Foot></Foot>
      </ScrollView>
    </View>
  );
}
