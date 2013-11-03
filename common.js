(function(exports){

  
   // Test de fonction commune client/serveur
   exports.test = function(){
        return 'common.js'
    };


  // Constructeur objet joueur
  exports.joueur = function joueur(name,color,number,keyLeft,keyUp,keyRight,keyDown) {
      this.type = "player";
      this.name = name;
      this.color = "#8ED6FF";
      this.level = false;
      this.number = number;
      this.score = 0;
      this.startX = 10;
      this.startY = 10;
      this.playerX = this.startX;
      this.playerY = this.startY;   
      this.KeyLeft = keyLeft;
      this.KeyUp = keyUp;
      this.KeyRight = keyRight;
      this.KeyDown = keyDown;
      this.vitesseX = 0;
      this.vitesseY = 0;
      this.lastTimeCollision = 99999;
      this.width = 30;
      this.heigth = 30;
      this.numLevel = 1;
      this.active = true;
      this.idUnique = 0;
  }   

  // Constructeur objet move player
  exports.playerMove = function (idUnique,playerX,playerY,vitesseX,vitesseY) {
      this.playerX = 0;
      this.playerY = 0;   
      this.vitesseX = 0;
      this.vitesseY = 0;
      this.idUnique = 0;
  } 



  // Création d'un identifiant unique pour les joueurs
  // Source : http://www.ietf.org/rfc/rfc4122.txt
  exports.createUUID = function () {
      var s = [];
      var hexDigits = "0123456789abcdef";
      for (var i = 0; i < 36; i++) {
          s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
      }
      s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
      s[8] = s[13] = s[18] = s[23] = "-";
  
      var uuid = s.join("");
      return uuid;
  }
    

    
  // objet niveau
  exports.level = function(){
        //level.number =0;
        //level.endLevel = false;
        //level.chrono;
        //level.type;
  }
    


  // Constructeur  objet rectangle
  exports.rectangle = function(x,y,hauteur,largeur,vx,vy,fragmentable,idUnique) {
          this.type = "rectangle";
          this.x = x;
          this.y = y ;
          this.hauteur = hauteur;
          this.largeur = largeur;
          this.vx = vx;
          this.vy = vy;
          this.fillColor = 'black';
          this.strokeColor = 'red' ;
          this.lineWidth = 1;
          // Pour la gestion de la fragmentation en débris...
          this.fragmentable = fragmentable;
          this.visible = true; 
          this.idUnique = idUnique;
          this.idParent = 0; 
  } 
    
  // Constructeur objet cercle
  exports.cercle = function (x,y,rayon,vx,vy,fillColor,strokeColor,lineWidth,fragmentable,idUnique) {
          this.type = "cercle";
          this.x = x;
          this.y = y ;
          this.rayon = rayon;
          this.vx = vx;
          this.vy = vy;        
          this.fillColor = fillColor;
          this.strokeColor = strokeColor ;
          this.lineWidth = lineWidth;
          // Pour la gestion de la fragmentation en débris...
          this.fragmentable = fragmentable;
          this.visible = true; 
          this.idUnique = idUnique;
          this.idParent = 0; 
  }
    
 
  // Dessins ------------------------------- > 
  
    
   // Dessine un rectangle
  exports.dessineRectangle = function (context,canvas,rect) {
         context.save;
         context.beginPath();
         context.fillStyle = rect.fillColor;
         context.fillRect(rect.x,rect.y,rect.largeur,rect.hauteur);
         context.strokeStyle = rect.strokeColor;
         context.lineWidth = rect.lineWidth;
         context.strokeRect(rect.x,rect.y,rect.largeur,rect.hauteur);
         context.closePath;
         context.restore;
  }

    
  
  // Dessine un cercle
  exports.dessineCercle = function dessineCercle(context, canvas, cercle) {
          context.beginPath();
          context.arc(cercle.x, cercle.y, cercle.rayon, 0, 2 * Math.PI, false);
          context.closePath();
          // sauver contexte courant
          context.save();
          context.fillStyle = cercle.fillColor;
          context.fill();
          context.lineWidth = cercle.lineWidth;
          context.strokeStyle = cercle.strokeColor;
          context.stroke();
          // Restaurer le contexte courant.
          context.restore();
  }

    
  
  // On écrit les messages de dialogues dans une zone dédiée... 
  // Ici un second Canvas indépendant du premier...
  // Règle par la même occasion le bug de recession
  // du fillcolor texte/collision.
  exports.writeMessage = function (message, level) {
          if (level) {
            message = level.type + level.number + " : " + message;
          }
          var messageCanvas = document.getElementById('messageCanvas');
          var messageContext = messageCanvas.getContext('2d');
          messageContext.clearRect(0, 0, messageCanvas.width, messageCanvas.height);
          messageContext.font = '18pt Calibri';
          messageContext.fillStyle = 'black';
          messageContext.textAlign="center"; 
          messageContext.fillText(message, messageCanvas.width/2 , 25);
  }


  // dessins < ---------------------------------
  
  
  

  // Non modifié
  exports.getMousePos = function (canvas, evt) {
          // get canvas position
          var obj = canvas;
          var top = 0;
          var left = 0;
          while (obj && obj.tagName != 'BODY') {
              top += obj.offsetTop;
              left += obj.offsetLeft;
              obj = obj.offsetParent;
          }
          // return relative mouse position
          var mouseX = evt.clientX - left + window.pageXOffset;
          var mouseY = evt.clientY - top + window.pageYOffset;
          return {
              x:mouseX,
              y:mouseY
          };
  }
  /**/
      
  
  
   // Dessins ------------------------------- > 
  

  // Dessin des obstacles
  // avec incrémentation des obstacles en fonction du niveau
  exports.drawObstacles = function (canvas,context,level) {
     // 1 obstacle ++ par niveau...
     for(i = 0; i < level.number; i++) {
       
       if ( obstacles[i].visible == true) {
         switch(obstacles[i].type) {
           
           case 'rectangle':
              exports.rebondObstaclesRect2(canvas,obstacles[i]);   
              exports.dessineRectangle(context,canvas,obstacles[i])
           break;
           case 'cercle' :
              exports.rebondObstaclesCirc (canvas,obstacles[i]);   
              exports.dessineCercle(context,canvas,obstacles[i]);
           break;
           
           
          }
       }
     }
  }
  /**/
      
  

  // Dessin des débris
  exports.drawDebris = function (canvas,context) {
   for( oneDebris in debris) {
   
        switch(debris[oneDebris].type) {
         
         case 'rectangle':
            exports.rebondObstaclesRect2(canvas,debris[oneDebris]);   
            exports.dessineRectangle(context,canvas,debris[oneDebris])
         break;
         
         case 'cercle' :
            exports.rebondObstaclesCirc (canvas,debris[oneDebris]);   
            exports.dessineCercle(context,canvas,debris[oneDebris]);
         break;
         
         
        }
   
      }
   }
  
  // Dessin du joueur
  exports. drawOnePlayer2 = function(canvas,context,joueur) {
    var x = joueur.playerX;
    var y = joueur.playerY;
    // Pour centrer le dossard du joueur
    var hText = joueur.width/2;
    var vText = joueur.heigth/2;
    // Uniquement Si le joueur n'as pas finit son niveau
    if (joueur.level == false) {
      if (exports.doChrono(joueur.lastTimeCollision) < 2000 ) {
           joueur.color = "orange";
          }
      else joueur.color = "#8ED6FF";
      context.save();
      context.fillRect(x,y,joueur.width,joueur.heigth);
      context.font = "25pt Calibri";
      context.lineWidth = 20;
      context.fillStyle = joueur.color;
      context.textAlign="center";
      context.textBaseline = 'middle';
      context.fillText(joueur.number,x+hText,y+vText);
      context.restore();
    }
  }
  
  
  // Non modifié
  exports.rectsOverlap = function (x0, y0, w0, h0, x2, y2, w2, h2) {
    if ((x0 > (x2 + w2)) || ((x0 + w0) < x2))
        return false;
  
    if ((y0 > (y2 + h2)) || ((y0 + h0) < y2))
        return false;
    
    return true;
  }
          
  // Non modifié
  exports.circRectsOverlap =  function(x0, y0, w0, h0, cx, cy, r) {
      var testX=cx; 
      var testY=cy; 
      
      if (testX < x0) testX=x0; 
      if (testX > (x0+w0)) testX=(x0+w0); 
      if (testY < y0) testY=y0; 
      if (testY > (y0+h0)) testY=(y0+h0); 
  
      return (((cx-testX)*(cx-testX)+(cy-testY)*(cy-testY))<r*r); 
  }

  // Non modifié
  exports. drawTarget = function(canvas, context, x, y, r, fillColor) {
            
            context.save();
            context.beginPath();
            context.arc(x, y, r, 0, 2*Math.PI, false);
            context.fillStyle=fillColor;
            context.fill();
            context.lineWidth = 5;
            context.strokeStyle = "green";
            context.stroke();
            context.restore();
            
  }

  // Test de collision individuel.
  // L'objet "joueur" embarque ses propres 
  // coordonnées de position et vitesses xy en attributs...
  exports.checkCollisionsWithObstacles2 = function (context, joueur, debris) {
    var touche = false;
    // Boucle d'obstacles en fonction du niveau...
    for(i = 0; i < level.number; i++) {
      
      if (obstacles[i].visible == true ) {
      
        switch(obstacles[i].type) {
         
         case 'rectangle':
            touche = exports.rectsOverlap(
              joueur.playerX, 
              joueur.playerY, 
              joueur.width , 
              joueur.heigth , 
              obstacles[i].x, 
              obstacles[i].y, 
              obstacles[i].largeur, 
              obstacles[i].hauteur
              );
         
         break;
         
         case 'cercle':
            touche = exports.circRectsOverlap(
              joueur.playerX, 
              joueur.playerY, 
              joueur.width , 
              joueur.heigth ,
              obstacles[i].x, 
              obstacles[i].y, 
              obstacles[i].rayon
             );
         break;                     
         
         }
         
         if(touche) {
            context.fillStyle = 'red';
         
            // Rebond joueur                   
            exports.ranDomAxeRebond(joueur,obstacles[i]);
             
            // Si l'obstacle est fragmentable... et visible...
            if (obstacles[i].fragmentable == true){
                  exports.createDebris (obstacles[i],debris,context)
            }
            
            return touche;
        } else { 
          context.fillStyle ='black';
        }
        
      }
    }                    
  }
  
  // Test de collision pour les débris.
  // a refactoriser avec les tests d'obstacles
  exports.checkCollisionsWithDebris = function (context, joueur) {
    var touche = false;
    for( oneDebris in debris) {
      
        switch( debris[oneDebris].type) {
         
         case 'rectangle':
            touche = exports.rectsOverlap(
              joueur.playerX, 
              joueur.playerY, 
              joueur.width , 
              joueur.heigth , 
              debris[oneDebris].x,                  
              debris[oneDebris].y, 
              debris[oneDebris].largeur, 
              debris[oneDebris].hauteur
              );
         
         break;
         
         case 'cercle':
            touche = exports.circRectsOverlap(
              joueur.playerX, 
              joueur.playerY, 
              joueur.width , 
              joueur.heigth ,
              debris[oneDebris].x, 
              debris[oneDebris].y, 
              debris[oneDebris].rayon
             );
         break;                     
         
         }
         
         if(touche) {
            context.fillStyle = 'red';                   
            exports.ranDomAxeRebond(joueur,debris[oneDebris]);
            return touche;
        } else { 
          context.fillStyle ='black';
        }
        
      }
  }                    
 
  // Fragmentation: obstacles crées a la volée...
  exports.createDebris = function (obstacle,debris,context){
        // Pour éviter de créer 2 fois le même débris chez plusieurs client
        // On teste ldUnique de l'obstacle parent
        // Et on le compare aux UUID des débris déjas crées...
        var isExist = false;
        for ( i in debris) {
           if ( obstacle.idUnique == "Deb1-"+debris[i].idUnique || obstacle.idUnique == "Deb2-"+debris[i].idUnique){
              isExist = true;
              } 
           }
        if (isExist == false) {
            // On crée 2 nouveaux débris en divisant le premier 
            context.fillStyle = 'yellow';
            obstacle.visible = false;
            
            var newHauteur = obstacle.hauteur/2;
            var newLargeur = obstacle.largeur/2;
            var newX = obstacle.x;
            var newY = obstacle.y;
            var newY2 = obstacle.y + newHauteur;
            debris.push(new exports.rectangle(newX,newY,newHauteur,newLargeur,1,-1,false,"Deb1-"+obstacle.idUnique));
            debris.push(new exports.rectangle(newX,newY2,newHauteur,newLargeur,-1,1,false,"Deb2-"+obstacle.idUnique));
          };
          
      };
      
     
  // Détection des sorties de piste
  // Avec replacement automatique du joueur a sa position de départ...
  exports.checkSortieDePiste = function (canvas,joueur){
    if (joueur.level == false) {  
        if (
            joueur.playerX < -joueur.width
            || joueur.playerX > canvas.width 
            || joueur.playerY < -joueur.heigth 
            || joueur.playerY > canvas.height
            )
            {
            //message = "Le joueur N°"+joueur.number;
            //message += " ("+joueur.name+")";
            //message += " Vient de sortir de piste !";
            joueur.playerX = joueur.startX;
            joueur.playerY = joueur.startY;
            joueur.vitesseX = 0; joueur.vitesseY = 0.
            };
  
      }
  }
      
  // Detection de fin de niveau
  // Si 1 seul joueur n'as pas encore atteind la cible
  // On considère que le niveau n'est pas encore terminé... 
  exports.checkLevel = function (level){
        level.endLevel = true;
        for (joueur in listeJoueurs){
          if (listeJoueurs[joueur].level == false){
             level.endLevel = false;
             break;
          }
        } 
        if (level.endLevel == true){
          message = " terminé !";
        }
  }  
        
  // Initialisation du niveau supérieur
  exports.passLevel = function(level) {
      
      // alert ('exports.passLevel(): Alert modal synchrone pour simuler un LAG ...');
      
      level.number += 1 ;
      level.endLevel = false;
  
      // Pour chaque joueur
      // On réinitialise les positions de départ,
      // les vitesses et le flag de fin de niveau...
      for (joueur in listeJoueurs){
          listeJoueurs[joueur].level = false;
          listeJoueurs[joueur].playerX = listeJoueurs[joueur].startX;
          listeJoueurs[joueur].playerY = listeJoueurs[joueur].startY;
          listeJoueurs[joueur].vitesseX = 0; listeJoueurs[joueur].vitesseY = 0.
       }
       
       // On vire les débris de la piste
       debris = new Array();
       
       // On remet tous les obstacles en mode visible
       for (obstacle in obstacles){
          obstacles[obstacle].visible = true;
       }
       
       
  } 
      
      
  // Rebond de collision aléatoire pour le joueur
  // On peut l'améliorer en detectant le vecteur du joueur
  // Et choisir un vecteur de rebond en fonction
  exports.ranDomAxeRebond  = function(objet, obstacle) {
      objet.lastTimeCollision = new Date();
      
      // alert (objet.lastTimeCollision) ;
      if (objet.vitesseX > 1) objet.vitesseX = -1;
      else if (objet.vitesseX < 0) objet.vitesseX = 1;
      if (objet.vitesseY > 1) objet.vitesseY = -1;
      else if (objet.vitesseY < 0) objet.vitesseY = 1;          
  
      if (obstacle.vitesseX > 1) objet.vitesseX += -1;
      else if (obstacle.vitesseX < 0) objet.vitesseX += 1;
      if (obstacle.vitesseY > 1) objet.vitesseY = -1;
      else if (obstacle.vitesseY < 0) objet.vitesseY = 1;
  
  }    
      
  // Correction et factorisation des rebonds
  // des obstacles rectangulaires
  exports.rebondObstaclesRect2 = function (canvas,obstacle) {
          
          obstacle.x += obstacle.vx; 
          if (obstacle.x <= 75) 
            obstacle.vx = -obstacle.vx; 
          if ((obstacle.x+obstacle.largeur) > canvas.width) 
            obstacle.vx = -obstacle.vx; 
          
          obstacle.y += obstacle.vy; 
          if (obstacle.y <= 0) 
            obstacle.vy = -obstacle.vy; 
          if ((obstacle.y+obstacle.hauteur) > canvas.height) 
            obstacle.vy = -obstacle.vy; 
  }
      
      
  // + rebonds pour obstacles circulaires
  exports.rebondObstaclesCirc = function (canvas,obstacle) {
  
          obstacle.x += obstacle.vx; 
          if (obstacle.x <= 75+obstacle.rayon) 
            obstacle.vx = -obstacle.vx; 
          if ((obstacle.x+obstacle.rayon) > canvas.width) 
            obstacle.vx = -obstacle.vx; 
          
          obstacle.y += obstacle.vy; 
          if (obstacle.y <= 0+obstacle.rayon) 
            obstacle.vy = -obstacle.vy; 
          if ((obstacle.y+obstacle.rayon) > canvas.height) 
            obstacle.vy = -obstacle.vy; 
  }
      
      
      
  // Fonctions temporelles
  // ( Cpte a rebour, chronos, conversions et affichages )
  // ---------------------------
  
  
  // Compte a rebour
  exports.decompte = function (){
  
    if (endDecompte == false ) {
      if(secondeDecompte <= 1) {pl = "";
      } else { pl = "s";
      }
      message = "Départ dans " +secondeDecompte + " seconde" + pl;
      if(secondeDecompte == 0 || secondeDecompte < 0) {
        secondeDecompte = 0;
        message = "GO >>>>>";
        // clearInterval(decompte);
        clearInterval(timer);
        // Le clearInterval etant capricieux:
        // je rajoute un test d'état...            
        endDecompte = true;
      }
      exports.writeMessage(message);
      secondeDecompte--;
      }
    }    
  
  
  
  // Retourne un crhono brut
  exports.doChrono = function (startTime){
      var time=new Date(); 
      var temps_ecoule = time.getTime()-startTime;          
      return temps_ecoule; 
  }
  
  // Conversion des millisecondes en hr, mn et secondes
  // Adaptation de https://coderwall.com/p/wkdefg
  exports. msToTime = function(duration) {
      var milliseconds = parseInt((duration%1000)/100)
          , seconds = parseInt((duration/1000)%60)
          , minutes = parseInt((duration/(1000*60))%60)
          , hours = parseInt((duration/(1000*60*60))%24);
           
      var affichage = "";
      if (hours > 0.0 ) affichage += hours + " h ";
      if (minutes > 0.0 ) affichage += minutes + " min ";
      affichage += seconds + " sec ";
      affichage += milliseconds+"/100";
      return affichage;
  }
  
  // Affichage du Chrono en temps réel
  exports.showChrono = function (time){
    time = exports.doChrono(time);
    time = exports.msToTime(time);
    document.getElementById('chrono').innerHTML = "Chrono: " + time;
  }
  
  
  // Retourne un chrono ss forme textuelle
  exports.getChrono = function (time){
      time = exports.doChrono(time);
      time = exports.msToTime(time);
      // document.getElementById('chrono').innerHTML = "Chrono: " + affichage;
      return time; 
  
  }
  
  
  // Afficher le framerate de la machine cliente
  // Adapté de: http://jsfiddle.net/vZP3u/
  exports.showFPS = function (lastRun){
      var delta = (new Date().getTime() - lastRun)/1000;
      lastRun = new Date().getTime();
      fps = 1/delta;         
      document.getElementById("fps").innerHTML = "Framerate: "+fps+ " fps";
      return lastRun;
  
  }
        
  
  //------------------------------------------------------------
      
  // Dessin de la zone protégée
  exports.drawStartLine = function (context,canvas){
          context.save();
          var cote = 25; //Côté des carrés
          context.strokeStyle = '#cccccc';
          context.lineWidth = 1;
          
          //Lignes verticales
          for (var i = 1; i < 4; i++){
              context.beginPath();
              context.moveTo(cote*i, 0);
              context.lineTo(cote*i, canvas.height);
              context.closePath();
              context.stroke();
          }
          
          //Lignes horizontales
          for (var i = 1; i < canvas.height/cote; i++){
              context.beginPath();
              context.moveTo(0, cote*i);
              context.lineTo(cote*3, cote*i);
              context.closePath();
              context.stroke();
          }	
          context.restore();
        }      
        
        
             
  // Affichage du Score de niveau
  exports.showScores = function (canvas,context,listeJoueurs,startTime,level,endMessage){
  
    context.clearRect(0,0, canvas.width, canvas.height);
    context.font = '18pt Calibri';
    context.fillStyle = 'black';
    context.textAlign="center"; 
  
    // Pour le centrage vertical
    // Chaque ligne fait 30 pixel...
    // On a 1 ligne pour le niveau + 1 ligne par joueur...
    var messageHauteur = canvas.height/2;
    var nbLignes = nbJoueurs+1;       
    var decalLignes = nbLignes*15; 
    messageHauteur -= decalLignes;
    
    var message = "";
    var levelAff = level.number;
    levelAff = levelAff-1; 
    if ( endMessage == "GAME OVER" ) { 
        message = endMessage;
        
    } else {
       // message = "Niveau "+ level.number;
       message = "Niveau "+levelAff;
       message += " terminé en " + exports.getChrono(startTime);
    }
    
  
    context.save();
    context.fillText(message, canvas.width/2 , messageHauteur);
    // On classe les joueurs par scores
    listeJoueurs.sort(function(a,b) {
      return b.score - a.score;
    });
    // Et on affiche une ligne par joueurs
    for (joueur in listeJoueurs) {
          messageHauteur += 30;
          message = "Joueur N°"+listeJoueurs[joueur].number;
          message += " "+listeJoueurs[joueur].name;
          message += " : "+listeJoueurs[joueur].score + " points ";
          context.fillText(message, canvas.width/2 , messageHauteur );
    }
    context.restore();      
  }


})(typeof exports === 'undefined'? this['common']={}: exports);