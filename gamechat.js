//var ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
//var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

var PORT = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT  || 8080;
var IPADDRESS = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

// We need to use the express framework: have a real web servler that knows how to send mime types etc.
var express=require('express');

// Init globals variables for each module required
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);


// Indicate where static files are located  
// Ajout buffa, sinon veut externaliser les js et les css  
app.configure(function () {    
    app.use(express.static(__dirname + '/'));    
});    
/**/


 
// launch the http server on given port
//Get the environment variables we need.
//server.listen(8080);
server.listen(PORT, IPADDRESS);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/MoteurDeJeux-v7.html');
});
/**/

// Méthodes communes client/serveur
var common = require('./common');

// usernames which are currently connected to the chat
var usernames = {};

// Listes
var listePlayers = {};

// Fonction de clonage
// Because le slice(0) ne fonctionne 
// pas sur un objet....
function clone(obj){
    var copy = JSON.parse(JSON.stringify(obj));
    return copy;
}

var listeObstacles = {};  

/*
// Non fragmentables
listeObstacles[0] = new common.rectangle(350,200,100,100,1,1,false,common.createUUID());
listeObstacles[1] = new common.rectangle(350,200,100,100,1,1,false,common.createUUID());
listeObstacles[2] = new common.rectangle(350,200,100,100,-1,-1,false,common.createUUID());
listeObstacles[3] = new common.rectangle(100,100,20,20,3,10,false,common.createUUID());
listeObstacles[4] = new common.rectangle(75,0,30,100,10,0,false,common.createUUID());
listeObstacles[5] = new common.cercle(150,100,30,5,5,'blue','red',10,false,common.createUUID());
listeObstacles[6] = new common.rectangle(350,200,100,100,1,1,false,common.createUUID());
/**/

// Fragmentables...
listeObstacles[0] = new common.rectangle(350,200,100,100,1,1,true,common.createUUID());
listeObstacles[1] = new common.rectangle(350,200,100,100,1,1,true,common.createUUID());
listeObstacles[2] = new common.rectangle(350,200,100,100,-1,-1,true,common.createUUID());
listeObstacles[3] = new common.rectangle(100,100,20,20,3,10,true,common.createUUID());
listeObstacles[4] = new common.rectangle(75,0,30,100,10,0,true,common.createUUID());
listeObstacles[5] = new common.cercle(150,100,30,5,5,'blue','red',10,false,common.createUUID());
listeObstacles[6] = new common.rectangle(350,200,100,100,1,1,true,common.createUUID());

// Sauvegarde du tableau d'obstacle de départ pour les resets...
var listeObstacleDepart = clone(listeObstacles);

var listeDebris = {};
var listObservers = {};

// Flags d'états coté serveur
var lockServerGameSession = false;

// Comptage des joueurs dans la liste
// Avec une boucle bien bourrin because le length fait un NaN sur un objet
var getNbPlayers = function(listePlayers){
   var nbPlayers = 0;
        for (var i in listePlayers) {
                    nbPlayers ++;
        }
    return nbPlayers;
}

io.sockets.on('connection', function (socket) {

    // Fonction générique de message...
    // Marre de devoir différencier le client émeteur des autres...
    function sendMessage(message){
        socket.emit('updatechat', 'SERVER', message );
        socket.broadcast.emit('updatechat', 'SERVER', message);
    }
    
    
   // Demande de récupération de la liste des obstacles...
   socket.on('getListObstacles', function(){
      io.sockets.emit('receivedObstacles', listeObstacles);
    });
   
    // Reset des flags d'état coté serveur
    function reinitFlagsServer(){
      lockServerGameSession = false;
      // On met a jour les autres users
      io.sockets.emit('receiveLockServerGame', lockServerGameSession);
    }
  
    // Récupération des flags serveurs...
    socket.on('getLockGame', function(){
       io.sockets.emit('receiveLockServerGame', lockServerGameSession);
    }); 
    
    
    // when the client emits 'addPlayer', this listens and executes
	  socket.on('addPlayer',function(player,maxPlayers,lockGameSession){
    
        // comptage du nombre de coureurs
        var nbPlayers = getNbPlayers (listePlayers);
        player.number = nbPlayers+1;
        
        // test fonctions communes 
        //var test123 = common.test();
        //sendMessage(test123);
        
        // Si plus de joueurs, on remet les etats de jeu à true...
        if ( nbPlayers == 0 ) {reinitFlagsServer();}
        
        if ( nbPlayers == maxPlayers 
             || lockGameSession == true
             || lockServerGameSession == true
            ) {
          var message = 'Inscriptions Course closes !';
          socket.emit('updatechat', 'SERVER', message );
          socket.broadcast.emit('updatechat', 'SERVER', message);
          return;    
        }
        
        var playerKey =  "("+player.number+") "+player.name;
        // we store the player in the socket session for this client
    		socket.player = playerKey;
    		// add the client's player to the global list
        listePlayers[playerKey] = player;
    		// echo to client they've connected
    		socket.emit('updatechat', 'SERVER', 'VS etes '+ player.name );
        
    		// echo globally (all clients) that a person has connected
    		socket.broadcast.emit('updatechat', 'SERVER', player.name + ' en piste');
    		// update the list of players in game, client-side
        io.sockets.emit('updatePlayers', listePlayers);
    	 }); 
                  
  
   
      /*// Reception des nouvelles coordonnées d'un joueur
      socket.on('testSenpPlayerMoves',function(
                        idUnique
                        ,playerX
                        ,playerY
                        ,vitesseX
                        ,vitesseY
                        ){
                        
       var message = idUnique+" "+playerX+"-"+playerY+"-"+vitesseX+"-"+vitesseY; 
       socket.broadcast.emit('updatechat', 'player', message);                 
      });
      /**/

      // Idem sendPlayersMoves en version objet 
      // On le reçoit en boucle toutes les 15 milisecondes...
      socket.on('senpPlayerMovesObject',function(moveObject){ 
        socket.broadcast.emit('updateMoves',moveObject);
      });

   
       // A la reception des listes d'obstacles d'un joueur...
       socket.on('sendPlayerObstacles',function(listObject){ 
            // Maintenant, reste plus qu'à
            // -- > Attendre la reception de tous les joueurs
            // -- > Un fois tous recut, comparer
            // et mettre a jour l'ensemble de la liste...
            // 1 : Con crée une liste temporaire
            // On compare les obstacles 1 par un..
            for ( object in listObject) {
                 //var toto = listObject[object];
                 //sendMessage(toto.x);
                 for ( obstacle in listeObstacles) {
                     //sendMessage(listObject[object].idUnique);
                     if  (listeObstacles[obstacle].idUnique == listObject[object].idUnique) {
                          listeObstacles[obstacle] = listObject[object];
                        //sendMessage(listeObstacles[obstacle].idUnique);
                     }
                     /**/
                 }
                 
            }
            io.sockets.emit('receivedObstacles', listeObstacles);
       });
    
       

       // A la reception des listes de débris d'un joueur...
       socket.on('sendPlayerDebris',function(listObject){ 
            for ( object in listObject) {
                 //var toto = listObject[object];
                 //sendMessage(toto.x);
                 var isExist = false;
                 var cpt = 0;
                 for ( i in listeDebris) {
                      // On teste s'il est présent ou pas 
                      // Si présent, on le met a jour
                      if  (listeDebris[i].idUnique == listObject[object].idUnique) {
                        listeDebris[i] = listObject[object];
                        isExist = true;
                      };
                      cpt++;
                 };
                 /**/ 
                 // Si pas présent, on l'ajoute... 
                 if ( isExist == false) {
                     listeDebris[cpt] = listObject[object];
                 };
                 
            }
            // Et on renvoie a liste a tous les joueurs...
            io.sockets.emit('receivedDebris', listeDebris);
       });
    
    
    
    // when the client emits 'updatePlayerDistant', this listens and executes
	  socket.on('updatePlayerDistant',function(player){
        for (var i in listePlayers) {
          if (player.idUnique == listePlayers[i].idUnique){
                // listePlayers[i] = localPlayer;
                // listePlayers[i].number = 99;
                listePlayers[i].playerX = player.playerX;
                listePlayers[i].playerY =  player.playerY;
                listePlayers[i].vitesseX =  player.vitesseX;
                listePlayers[i].vitesseY =  player.vitesseY;
          }
                    
        }
    	 }); 
                  
   // Récupération de la liste des joueurs...
   socket.on('getListPlayers', function(){
      //io.sockets.emit('receiveListPlayers', listePlayers);
      //io.sockets.emit('receiveUpdatedPlayers', listePlayers);
      io.sockets.emit('receiveUpdatedPlayers', listePlayers);
    
    });
    
   // Récupération de la liste des joueurs pour affichage simple...
   socket.on('getSpectateursListPlayers', function(){
      //io.sockets.emit('receiveListPlayers', listePlayers);
      io.sockets.emit('updatePlayersForSpectateurs', listePlayers);
    });
    
    
   // Récupération du nombre de joueurs
   socket.on('getNbPlayers', function(){
      var nbPlayers = getNbPlayers (listePlayers);
      io.sockets.emit('updateNbPlayers', nbPlayers);
    }); 
    
   // reception d'un flag de verouillage
   socket.on('sendLockGame', function(lockGameSession) {
      lockServerGameSession = lockGameSession;
      // socket.emit('updatechat', 'SERVER', 'session verouillée');
      sendMessage( socket.player +' a fermé les inscriptions et lancé la course');
      // On rebalance le flag a tt le monde...
      io.sockets.emit('updateLockServerGame', lockServerGameSession);
   }); 
  
   // reception d'un nettoyage des débris
   socket.on('clearDebris', function() { 
       listeDebris = {};
   });
  
  
  // when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.username, data);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser',function(username){
    // we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'Vous êtes connecté');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('updatechat', 'SERVER', username + ' connecté');
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
    // update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
    // echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' déconnecté');
	
    // Add titi >>> Delete player
    // Si bien sur c'est un joueur et pas juste un user
    if (socket.player) {
      delete listePlayers[socket.player];
      // On verifie le nombre de joueurs
      // Et si zero, on réinitialize le flag de verouillage...
      // Et on remet le tableau d'obstace a son état d'origine... 
      var nbPlayers = getNbPlayers (listePlayers);
      if ( nbPlayers == 0 ) {
        reinitFlagsServer();
        // effacement et recréation des obstacles...
        listeObstacles = {};
        listeObstacles = clone(listeObstacleDepart);
        // Suppression des débris...
        listeDebris = {};
        }
      // Udpate liste des joueurs
      io.sockets.emit('updatePlayers', listePlayers);
  		socket.broadcast.emit('updatechat', 'SERVER', socket.player + ' quitte la course');
    }
  
  });
  
  

  
  
  
  
  
  
});