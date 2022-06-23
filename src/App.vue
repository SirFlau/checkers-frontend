<template>
  <Authenticator :login-mechanisms="['username']" :sign-up-attributes="['email', 'username']">
    <template v-slot="{ user, signOut }">
      <div id="topcontainer">
        
        <div id="topbar">
          <button @click="findGame" v-if="!playing">Find Game</button>
          <button @click="signOut">Sign Out</button> 
        </div>
        
        <div id="sidebar">

        </div>

        <div id="main">
          <div id="board" v-if="playing">
            <GameWindow v-bind:user="user" v-bind:game="game" @stopPlaying="playing=false"/>
          </div>
          <div v-else>
            <h1>Welcome to Checkers2022.com</h1>
            <img src="@/assets/frontpage-board.jpg" id="board-img">
            <h1>The rules</h1>
            <iframe width="560" height="315" src="https://www.youtube.com/embed/GnHQJ-PSBB0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            <h2>Movement</h2>
            <ul>
              <li>Movement is always done diagonally, thus all pieces will always be on dark colored squares</li>
              <li>You can only move one of your pieces per turn</li>
              <li>Your pieces can only move into empty squares</li>
              <li>Your pieces can only move one square at a time</li>
            </ul>
            <h2>Capture</h2>
            <ul>
              <li>If an opponents piece is diagonally in front of you, and the space behind it is empty, that piece is available for capture</li>
              <li>If you have any available captures on your turn, you must perform one those available captures</li>
              <li>You perform a capture by moving your piece into the empty square behind your opponents piece, this removes the opponents piece from the board</li>
              <li>If you land in a square, where another capture is available, you must also perform that capture in the same turn</li>
            </ul>
            <h2>Kings</h2>
            <ul>
              <li>If one of your pieces makes it all the way across the board, and reaches the back rank, it becomes a king</li>
              <li>Kings can move and capture both forwards and back</li>
              <li>When a piece becomes a king, your turn ends, even if a capture is available for the newly made kking</li>
            </ul>
            <h2>Winning</h2>
            <ul>
              <li>You win the game if your opponent has no legal moves, this typically happens because they have no pieces left</li>
            </ul>
          </div>
        </div>
      </div>
    
    </template>
  </Authenticator>
</template>


<script>
import GameWindow from './components/GameWindow.vue'
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-vue';
import { API,  graphqlOperation} from 'aws-amplify';

import "@aws-amplify/ui-vue/styles.css";
import axios from 'axios';



const auth = useAuthenticator();



export default {
  name: 'App',
  components: {
    Authenticator,
    GameWindow
  },
  data() {
    return {
      playing: false,
      game: null,
      subscription: null

    }
  },
  methods: {
    findGame (){
      if(this.subscription){
        this.subscription.unsubscribe()
      }
      this.listenForGame();
      this.requestGame();

    },
    async requestGame() {
      try {
        let config = {
          headers: {
            "Authorization": auth.user?.signInUserSession.idToken.jwtToken
          }
        }
        let data = JSON.stringify({
          query: `mutation findGame {
          findGame 
        }`
        });
        
        const response = await axios.post(
          "https://api.checkers2022.com/graphql",
          data,
          config
        );
        // JSON responses are automatically parsed.
        console.log(response);
      } catch (error) {
        console.log(error);
      }
    },
    listenForGame(){
      this.subscription = API.graphql(
          graphqlOperation(`subscription MySubscription2 {
                              onCreateGame(user: "${auth.user?.username}") {
                                blackPlayer
                                currentGameState
                                gameId
                                whitePlayer
                              }
                            }`)
      ).subscribe({
          next: ({ provider, value }) => this.handleGameFound(provider, value),
          error: error => console.warn(error)
      });
    },
    handleGameFound(provider, value){
      console.log(JSON.stringify(provider))
      console.log(JSON.stringify(value))
      this.game = value.data.onCreateGame
      this.subscription.unsubscribe()
      this.playing = true
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#topcontainer {
  display: grid;
  grid-template-rows: 50px 1fr;
  grid-template-columns: 50px 1fr;
  height: 100vh;    
}

#topbar{
  grid-column: 1/3;
  background-color: #2c2e2b;
  display: flex;
  align-items: center;
  justify-content: right;
}

#sidebar{
  grid-row: 2;
  background-color: #373534;
  display: flex;
  align-items: center;
}

#main{
  grid-row: 2;
  grid-column: 2;
  background-color: #312e2b
}

#board {
  margin: 20px;
}

#board-img {
  height: 40vh;
  widows: 40vh;
}

button {
  background-color: #4CAF50; /* Green */
  border: none;
  color: white;
  padding: 15px 32px;
  margin: 10px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  border-radius: 15px;
}

h1 {
  color: beige;
}

h2 {
  color: beige;
}

li {
  color: beige;
}

ul {
  list-style: none;
}

</style>
