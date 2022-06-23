<template>
    <div id="topContainer">
        <div id="gameArea">
          <Board v-bind:board="board" v-bind:playerColor="playerColor" v-bind:turn="turn" v-bind:forcedPiece="forcedPiece" @newBoardState="handleNewGameState"/>
        </div>
        <div id="sideBar">
          <div id="textbox">
            {{message}}
          </div>
          <div id="buttonHolder">
            <button id="concede" class="not-implemented">Concede</button>
            <button id="offerDraw" class="not-implemented">Offer Draw</button>
            <button v-if="gameOver" @click="$emit('stopPlaying')">Return to main page</button>
          </div>
          <div id="whiteTaken">
            
          </div>
          <div id="blackTaken">

          </div>
        </div>
    </div>

</template>

<script>
import Board from './Board.vue';
import axios from 'axios';
import { API,  graphqlOperation} from 'aws-amplify';

export default {
  name: 'GameWindow',
  mounted() {
    if(this.user?.username.toLowerCase() == this.game?.blackPlayer.toLowerCase() ){
      this.playerColor = "black"
    }
    else
    {
      this.playerColor = "white"
    }
    this.setBoard(this.game?.currentGameState)
    this.setTurn(this.game?.currentGameState)
    this.listenForMove()
  },
  components: {
    Board
  },
  props: ["user", "game"],
  data() {
    return {
      board: [],
      playerColor: null,
      turn: "black",
      forcedPiece: null,
      api_url: "https://api.checkers2022.com/graphql",
      gameOver: false
    }
  },
  methods: {
    setBoard(gameState) {
      let boardString = gameState.substring(0,32)
      let board = boardString.split("").map(Number)
      if(this.playerColor == "white") {
        board.reverse()
      }
      this.board = board
      this.message = "Blacks turn"
    },
    setTurn(gameState){
      let turn = gameState.substring(32,33)
      console.log("setting turn gamestate" + gameState + " turn extracted: " + turn)
      if (turn == "0") {
        this.turn = "black"
        this.forcedPiece = null
        this.message = "Blacks turn"
      } else if (turn == "1") {
        this.turn = "white"
        this.forcedPiece = null
        this.message = "Whites turn"
      } else if (turn == "2") {
        this.turn = "blackContinuation"
        this.forcedPiece = parseInt(gameState.substring(33))
        this.message = "Black must continue to capture"
      } else if (turn == "3") {
        this.turn = "whiteContinuation"
        this.forcedPiece = 31 - parseInt(gameState.substring(33))
        this.message = "White must continue to capture"
      }
    },
    listenForMove(){
      this.subscription = API.graphql(
          graphqlOperation(`subscription MySubscription {
                              onMakeMove(gameId: "${this.game?.gameId}") {
                                currentGameState
                                gameId
                                gameResult
                                gameResultReason
                              }
                            }`)
      ).subscribe({
          next: (response) => this.handleMoveMade(response.value.data.onMakeMove),
          error: error => console.warn(error)
      });
    },
    handleNewGameState(gameState){
      this.setGameState(gameState)
      this.postGameState(gameState)
    },
    handleMoveMade(game){
      if (game == null){
        alert("We are sorry, it seems an invalid move has been attempted, and we are unable to continue the game correctly")
      }
      this.setGameState(game.currentGameState)
      if (game.gameResult != null){
        this.message = game.gameResult + " because " + game.gameResultReason
        this.gameOver = true
      }

    },
    setGameState(gameState){
      console.log("setting game state: " + gameState)
      this.setBoard(gameState)
      this.setTurn(gameState)
    },
    async postGameState(gameState) {
      try {
        let config = {
          headers: {
            "Authorization": this.user.signInUserSession.idToken.jwtToken
          }
        }
        let data = JSON.stringify({
          query: `mutation makeMove($gameId: ID!, $newGameState: String!) {
          makeMove(gameId: $gameId, newGameState: $newGameState) {
            currentGameState
            gameId
            gameResult
            gameResultReason
          }
        }`,
          variables: {
            "gameId": this.game?.gameId,
            "newGameState": gameState
          }
        });
        const response = await axios.post(
          this.api_url,
          data,config
        );
        // JSON responses are automatically parsed.
        console.log(response);
      } catch (error) {
        console.log(error);
      }
    }
  }
}



</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

#topContainer {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 2fr 1fr;
  height: 100vh; 
}

#gameArea {
  padding: 20px;
}

#sideBar {
  grid-column: 2;
  background-color: #373534;
  display: flex;
  align-items: center;
}

#textbox {
  color: beige;
}

.not-implemented {
  background-color: darkgray ;
}

</style>
