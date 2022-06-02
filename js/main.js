
/*
* GameComponent Object : Represent the component of the backjack table : 
* userBox : the player hand
* iaBox : the dealer hand
* mainBox : the non picked card box
* handlers : functions that handle events such as modifications on the boxes
* updateMethods : enumeration for type of methods that can be called for update boxes
* boxTypes : enumeration of box types
* handlerTypes : enumeration of handler types
* updateBox : update a player cards and call the related handlers 
* getCards : retourne a player's cards
*/

//Handler constructors
function Handler(type, action){
	this.action = action;
	this.type = type;
}

//Game Component Constructor
function GameComponents(userBox, iaBox, mainBox){
	this.userBox = userBox;
	this.iaBox = iaBox;
	this.mainBox = mainBox;
	this.handlers = {};
	this.updateMethods = {addCard: Box.prototype.addCard, emptyBox: Box.prototype.empty};
	this.boxTypes = ['User','IA'];
	this.handlerTypes = ['onUserBoxUpdate','onIABoxUpdate'];
}

//Event Handler registering for boxes
GameComponents.prototype.on = function(type, action){
	var handler = new Handler(type, action);
	if(this.handlerTypes.indexOf(type)!=-1 && this.handlers[type])
		this.handlers[type].push(handler);
	else
		this.handlers[type] = [handler]; 
	
};

//Players Box Update
GameComponents.prototype.updateBox = function(boxType, method, arg){
	
	//Check if the method is Box.prototype.add_card or Box.prototype.remove_card
	if(method in this.updateMethods){
		if(this.updateMethods[method] == Box.prototype.empty)
			this.updateMethods[method].call(this[boxType.toLowerCase() + 'Box']);//If yes call method on the related box object
		else{
			if(arg && (typeof arg) == 'object' && 'card' in arg)
				this.updateMethods[method].call(this[boxType.toLowerCase() + 'Box'], arg.card);//If yes call method on the related box object			
		}
	}
	
	//Call the handlers for this event
	if('on'+boxType+'BoxUpdate' in this.handlers)
		var self = this;
		this.handlers['on'+boxType+'BoxUpdate'].forEach(function(handler){ handler.action(handler.type,self); });
};

//Get players Box cards
GameComponents.prototype.getCards = function(boxType){
	if((boxType.toLowerCase()+'Box') in this){
		return this[boxType.toLowerCase() + 'Box'].cards;
	}
};

/*
* Box Object : Represent a box (a group of cards)  
* cards : the cards composing the box
* addCard : Function for adding card to box
* empty : remove all cards from the box
* pickCard : return the next card in the box
* get Value : return the box value (represent the sum of all cards values)
*/

//Card Constructor
function Card(name, value){
	this.name = name;
	this.value = value;
}

//Box Constructor
function Box(){
	this.cards = [];
}

//Add card to box
Box.prototype.addCard = function(card){
	if(card instanceof Card)
		this.cards.push(card);
};

//Empty card box
Box.prototype.empty = function(){
	this.cards = [];	
};

//Pick card from box
Box.prototype.pickCard = function(){
	return this.cards.pop();	
};

Object.defineProperty(Box.prototype, "Value", 
	{get : function(){
		
		var acesValue = this.cards.filter(function(card){ return card.value == 11; }).reduce(function(sum,card){
			return sum + card.value;
		},0);
		
		var value = this.cards.reduce(function(sum,card){
			return sum + card.value;
		},0);
		
		if(value > 21)
			value = value - (acesValue) + (acesValue/11);
		
		return  value;
	}
});

Object.defineProperty(Box.prototype, "Cards", 
	{set : function(cards){
		var self = this;
		cards.forEach(function(card){
			self.addCard(card);
		});
	}
});

/*
* GameComponentsFactory
* create : create a new initialized GameComponents
*/

//GameComponentsFactory Constructor
function GameComponentsFactory(){};

function createGameCardSet(number){
	
	var createSingleCardSet = function(){		
		var namesArray = ['2_of_clubs','3_of_clubs','4_of_clubs','5_of_clubs','6_of_clubs','7_of_clubs','8_of_clubs','9_of_clubs','10_of_clubs','J_of_clubs','Q_of_clubs','K_of_clubs','A_of_clubs',
						 '2_of_diamonds','3_of_diamonds','4_of_diamonds','5_of_diamonds','6_of_diamonds','7_of_diamonds','8_of_diamonds','9_of_diamonds','10_of_diamonds','J_of_diamonds','Q_of_diamonds','K_of_diamonds','A_of_diamonds',
						 '2_of_hearts','3_of_hearts','4_of_hearts','5_of_hearts','6_of_hearts','7_of_hearts','8_of_hearts','9_of_hearts','10_of_hearts','J_of_hearts','Q_of_hearts','K_of_hearts','A_of_hearts',
						 '2_of_spades','3_of_spades','4_of_spades','5_of_spades','6_of_spades','7_of_spades','8_of_spades','9_of_spades','10_of_spades','J_of_spades','Q_of_spades','K_of_spades','A_of_spades'];
		var valuesArray = [2,3,4,5,6,7,8,9,10,10,10,10,11,
						   2,3,4,5,6,7,8,9,10,10,10,10,11,
						   2,3,4,5,6,7,8,9,10,10,10,10,11,
						   2,3,4,5,6,7,8,9,10,10,10,10,11];
		
		var cards = [];
		namesArray.forEach(function(name,index){
			cards.push(new Card(name,valuesArray[index]));
		});		
		return cards;
	}
	
	var gameSet = [];
	
	for(var i=0; i<number; i++){
		gameSet = gameSet.concat(createSingleCardSet());
	}
	
	return gameSet;
}

function shuffle(cards){
	var isCard = function(card){return card instanceof Card}
	if(cards!=null && !cards.every(isCard))
		return;
	var min = 0;
	var max = cards.length;
	var index = 0;
	var cardsTemp = [];
	while(cards.length > 0){
		index = Math.floor(Math.random()*max);	
		cardsTemp.push(cards[index]);
		cards.splice(index,1);
	}
	return cardsTemp;
}

//Create GameComponents object and return it
GameComponentsFactory.prototype.create = function(){
	var mainBox = new Box();
	mainBox.Cards = shuffle(createGameCardSet(6));
	return new GameComponents(new Box(), new Box(), mainBox);
};

/*
* Game Object : Represent the game  
* cards : the cards composing the box
* addCard : Function for adding card to box
* empty : remove all cards from the box
* pickCard : return the next card in the box
* get value : return the box value (represent the sum of all cards values)
* deal : Distribute cards to players (update player card box)
* hit : Distribute on card to user (update user card box)
* stand : Distribute card to ia until cards values exceed 4
* action : call on of hit or deal or stand method and then call checkWin to check if the user win and if this turn of the game is finished
*/

function Game(components){
	this.components = components;
	this.actionTypes = ['Hit','Stand','Deal'];
}

//Reset the players box
Game.prototype.initPart = function(){
	//empty players (player, dealer) boxes
	this.components.updateBox('User','emptyBox');
	this.components.updateBox('IA','emptyBox');
};

//Check if the user is the winner
Game.prototype.checkWin = function(){
	
	var userValue = this.components.userBox.Value;
	
	if(userValue > 21)
		return {userWin: false, end: true};
	
	if(userValue == 21)
		return {userWin: true, end: true};
	
	var iaValue = this.components.iaBox.Value;
	if(iaValue > 21 )
		return {userWin: true, end: true}; 

	if(iaValue < userValue)
		return {userWin: true};
	
	return {userWin: false};
};

//Deal cards
Game.prototype.deal = function(){	
	//Give player 2 cards
	this.components.updateBox('User', 'addCard', {card: this.components.mainBox.pickCard()});
	this.components.updateBox('User', 'addCard', {card: this.components.mainBox.pickCard()});

	//Give dealer a card
	this.components.updateBox('IA', 'addCard', {card: this.components.mainBox.pickCard()});
};

//User request a card
Game.prototype.hit = function(){	
	//Give player 1 card
	this.components.updateBox('User', 'addCard', {card: this.components.mainBox.pickCard()});
};

//User stand on his actual hand
Game.prototype.stand = function(){
	//Give dealer cards until his bow exceed total value of 17
	do{
		this.components.updateBox('IA', 'addCard', {card: this.components.mainBox.pickCard()});
	}while(this.components.iaBox.Value < 17);
}

//Function that call one of Deal, Hit or Stand action base on a specified type and check the winner.
Game.prototype.action = function(actionType){
	if(this.actionTypes.indexOf(actionType)!=-1){
		this[actionType.toLowerCase()]();
	}
	return this.checkWin();
}


