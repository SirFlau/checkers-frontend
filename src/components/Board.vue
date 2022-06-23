<template>
  <div class="board">
    <div v-for="column in 8" :key="column" style="width: 100%">
      <div v-for="row in 8" :key="row">
        <div class="square" :class="squareColor(column, row)" @click.stop="makeMove(column,row)">
          <div :id="'piece_' + column + '_' + row" class="piece"
               :class="[classMapping[board[convertCoordinatesToIndex(column, row)]], getSelectionClass('piece_' + column + '_' + row)]"
               @click.stop="selectPiece(column, row)"
               >
               <img class="crown" :class="classMapping[board[convertCoordinatesToIndex(column, row)]]" src="@/assets/crown.svg" alt="King"/>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script>


export default {
  name: 'Board',
  props: ["board", "playerColor", "turn", "forcedPiece"],
  data() {
    return {
      classMapping: {
        0: "empty",
        1: "white",
        2: "white king",
        3: "black",
        4: "black king"
      },
      selected_piece: null,
      
    }
  },
  methods: {
    // We can add our functions here
    squareColor(column, row) {
      if (row % 2 + column % 2 == 1){
        return "dark"
      }
      else {
        return "light"
      }
    },
    convertCoordinatesToIndex(column, row) {
      if (this.squareColor(row, column) == 'light'){
        return null;
      }
      return (row-1) * 4 + Math.floor((column-1)/2);
    },
    selectPiece(column, row){
      let id = 'piece_' + column + '_' + row
      let index = this.convertCoordinatesToIndex(column, row)
      let piece = this.classMapping[this.board[index]]
      if (this.selected_piece === id) {
        this.selected_piece = null
        return
      }
      if (!piece.includes(this.playerColor)){
        return
      }
      this.selected_piece = id;
    },
    getSelectionClass(id){
      if (id == this.selected_piece){
        return 'selected'
      }
      return ''
    },
    findForcedMoves(){
      let forced_moves = []
      
      let turn_piece_types = []
      
      if (this.turn.includes("black")) {
        turn_piece_types.push(3)
        turn_piece_types.push(4)
      } else {
        turn_piece_types.push(1)
        turn_piece_types.push(2)
      }

      for (let i = 0; i < 32; i++) {
        let piece_type = this.board[i]
        if (!turn_piece_types.includes(piece_type)) {
          continue
        }
        
        let check = this.checkTake(i, piece_type)
        
        for(let x = 0; x < check.length; x++) {

          forced_moves.push([check[x]["start_square"], check[x]["target_square"]])
        }
      }
      return forced_moves
    },
    checkTake(index, piece_type){
      let directions = ["forward_right", "forward_left"]
      let result = []

      //if king, also check backwards directions
      if (piece_type == 2 || piece_type == 4) {
        directions.push("back_left")
        directions.push("back_right")
      }

      for (let i = 0; i < directions.length; i++){
        let neighbour_square = this.getIndexOfNeighbour(index, directions[i])
        if (neighbour_square == null) {
          continue 
        }
        if ((this.board[neighbour_square] == 1 || this.board[neighbour_square] == 2) && (piece_type == 3 || piece_type == 4)){
          let behind_neighbour = this.getIndexOfNeighbour(neighbour_square, directions[i])
          if (behind_neighbour == null) {
            continue
          }
          if (this.board[behind_neighbour] === 0) {
            result.push({
              "start_square": index,
              "target_square": behind_neighbour,
              "captured": neighbour_square})
          }
        }
        if ((this.board[neighbour_square] == 3 || this.board[neighbour_square] == 4) && (piece_type == 1 || piece_type == 2)){
          let behind_neighbour = this.getIndexOfNeighbour(neighbour_square, directions[i])
          if (behind_neighbour == null) {
            continue
          }
          if (this.board[behind_neighbour] === 0) {
            result.push({
              "start_square": index,
              "target_square": behind_neighbour,
              "captured": neighbour_square})
          }
        }
      }
      return result
    },
    getIndexOfNeighbour(index, direction){
      let direction_map = {
        "forward_left": {"correction": -4, "row_change": 1},
        "forward_right": {"correction": -3, "row_change": 1},
        "back_left": {"correction": 4, "row_change": -1},
        "back_right": {"correction": 5, "row_change": -1}
      }
      let direction_info = direction_map[direction]

      let row_index = this.getRowByIndex(index)
      let result = index + direction_info["correction"] - row_index % 2

      let result_row_index = this.getRowByIndex(result)
      if (row_index - result_row_index != direction_info["row_change"]){
        return null
      }
      if (result_row_index < 0 || result_row_index > 7) {
        return null
      }
      return result
    },
    getRowByIndex(index){
      return Math.floor(index/4)
    },
    makeMove(column, row) {
      //Attempt to move the selected piece to a clicked square

      if(!this.turn.includes(this.playerColor)){
        return // If not this players turn, do nothing.
      }

      if (this.selected_piece == null){
        return //If no piece is selected, return
      }
      let square_index = this.convertCoordinatesToIndex(column, row);  //Get the square clicked
      let piece_index = this.getPieceIndexById(this.selected_piece);  //Get the square of the currently selected piece
      if (square_index == piece_index) {
        return //if piece is already in the target square, do nothing and return
      }
      console.log("validating move...")
      if (this.validateMoveLegal(piece_index, square_index)){
        //move logic
        let newBoard = [...this.board]
        let piece_type = newBoard[piece_index]
        newBoard[piece_index] = 0,
        newBoard[square_index] = piece_type
        
        //capture logic
        let additional_move_required = false;
        let captures = this.checkTake(piece_index, piece_type)
        for (let i=0; i < captures.length; i++){
          if (square_index == captures[i]["target_square"]){
            newBoard[captures[i]["captured"]] = 0  //remove taken piece from the board
            console.log("check additional captures possible" + JSON.stringify(this.checkTake(square_index, piece_type)))
            additional_move_required = this.checkTake(square_index, piece_type).length > 0  //check if additional capture(s) are required
            break;
          }
        }

        //promote logic
        if (this.getRowByIndex(square_index) == 0 && (piece_type == 1 || piece_type == 3)){
          newBoard[square_index] += 1  //promote to king
        }

        if (this.playerColor == "white"){
          newBoard.reverse()
        }

        console.log("additional move required: " + additional_move_required)
        let gameState = newBoard.join("")
        if (this.turn.includes("white") && additional_move_required){
          gameState = gameState + "3" + (31 - square_index)
        }else if(this.turn.includes("white") && !additional_move_required) {
          gameState = gameState + "0"
        }else if (this.turn.includes("black") && additional_move_required) {
          gameState = gameState + "2" + square_index
        } else if(this.turn.includes("black") && !additional_move_required) {
          gameState = gameState + "1"
        }
        this.$emit('newBoardState', gameState)
      }
      this.selected_piece = null;
    },
    validateMoveLegal(piece_index, square_index){
      // check if you are forced to continue moving with a capture
      if(this.forcedPiece != null && piece_index != this.forcedPiece) {
        console.log("forced piece: " + this.forcedPiece + " must move")
        return
      }

      // if there are forced moves, check if this move is one of them
      let forced_moves = this.findForcedMoves()
      console.log("forced moves found: " + JSON.stringify(forced_moves) )
      if (forced_moves.length != 0) {
        console.log("checking forced moves")
        for (let i = 0; i < forced_moves.length; i++){
          if (JSON.stringify(forced_moves[i]) == JSON.stringify([piece_index, square_index])) {
            return true
          }
        }
        return false
      }
      //if the move is not targeting an empty space, it is illegal
      if (this.board[square_index] != 0) {
        console.log("target square not empty")
        return false
      }
      let piece_type = this.board[piece_index]
      let valid_move_locations = this.getForwardNeighbours(piece_index)
      console.log("valid move locations" + JSON.stringify(valid_move_locations))
      if (piece_type == 2 || piece_type == 4) {
        valid_move_locations = valid_move_locations.concat(this.getBackNeighbours(piece_index))
      }
      return valid_move_locations.includes(square_index)      
    },
    getForwardNeighbours(index){
      let result = []
      let forward_left = this.getIndexOfNeighbour(index, "forward_left")
      let forward_right = this.getIndexOfNeighbour(index, "forward_right")
      if (forward_left != null) {
        result.push(forward_left)
      }
      if (forward_right != null) {
        result.push(forward_right)
      }
      return result
    },
    getBackNeighbours(index){
      let result = []
      let back_left = this.getIndexOfNeighbour(index, "back_left")
      let back_right = this.getIndexOfNeighbour(index, "back_right")
      if (back_left != null) {
        result.push(back_left)
      }
      if (back_right != null) {
        result.push(back_right)
      }
      return result
    },
    getPieceIndexById(id){
      let split = id.split("_")
      return this.convertCoordinatesToIndex(split[1], split[2])
    }
  }
}


</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.board {
  display: flex;
  width: 10vh;
  border-style: solid;
}

.square {
  position: relative;
  width: 10vh;
  padding-top: 100%;
  -webkit-box-sizing: content-box !important;
  -moz-box-sizing: content-box !important;
  box-sizing: content-box !important;
}

div{
  -webkit-box-sizing: content-box !important;
  -moz-box-sizing: content-box !important;
  box-sizing: content-box !important;
}

.piece {
  position: absolute;
  left: 1vh;
  right: 1vh;
  top: 1vh;
  bottom: 1vh;
  border-radius: 50%;
  display: none;
  justify-content: center;
  -webkit-transition: -webkit-transform .2s ease-out;
  -moz-transition: -moz-transform .2s ease-out;
  -o-transition: -o-transform .2s ease-out;
  -ms-transition: -ms-transform .2s ease-out; 
  transition: transform .2s ease-out; 
}

.piece:hover {
   -webkit-transform:scale(1.1);
   -moz-transform:scale(1.1);
   -o-transform:scale(1.1);
   transform:scale(1.1);
}

.piece.white {
  background-color: antiquewhite;
  display: flex;
}

.piece.black {
  background-color: black;
  display: flex;
}

.light {
  background-color: burlywood;
}
.dark {
  background-color: brown;
}

.piece.selected {
  border-style: solid;
  border-width: 4px;
  -webkit-transform:scale(1.1);
  -moz-transform:scale(1.1);
  -o-transform:scale(1.1);
  transform:scale(1.1)
}

.piece.white.selected {
  border-color: grey;
}

.piece.black.selected {
  border-color: darkgrey;
}

.crown {
  width: 80%;
  display: none;
}

.crown.king {
  display: block;
}

</style>
