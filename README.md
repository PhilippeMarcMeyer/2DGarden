# 2DSandBox
Playing with basic 2D in canvas

Step 1 : Let's start with 2D as my school lessons in trigonometry are long forgotten

Let's draw squares at diverse distances from the origin point (0,0)  
Add circles to show that represent their future rotation along the camera origin
let's rotate the camera angle around the origin and draw an arrow to indicate direction
the head of the arrow uses arctant2() to calculate its angle (good pratice)
The camera is also able to move back and forth.

ToDO : 
Move the background and not the player who will stay un the center
make an infinite (or wide) area, with random items (rocks, flowers, ponds, flowers, bushes)
store the coordinates of the game in local storage or in a database (maybe firebase)
add creatures and narration
add variations with time (mobs, vegetation)
add capacity to hold some items and put then in different locations
add multiplayer capicity

There could me mobs alike ants, that search for food, establish new colonies from time to time (like bees)
they rather follow known paths btu there are explorers among them. The player(s) leave a track behind maybe scent/smell
that evaporate with time. They don't like intruders to cros their main trails and will chase them, calling for reinforcements
the player can use a shield deployed from his body in several steps (it's not instantaneous) and fire stars (that he collects) that make the bugs dizzy
and lose track. The shield and the body must heal after taking dammage. The player is looking for its own food, stars and water.
What will be difficult is to make the mobs act togeter in a strategy to take the player over by number. Like ants they can spit acid.
The play ground should be infinite it could be self generated but consistent and kept in a json storage onto a server (if we want it to become multiplayer)
greater goals to find, agriculture ? houses to build ? underground passages ?

#Step 1 illustrated

![result for step 1](https://raw.githubusercontent.com/PhilippeMarcMeyer/2DSansBox/master/img/2dstuff.png)
