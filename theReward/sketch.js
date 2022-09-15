const rockModels = [{
    "name": "A",
    "diameter": 80,
    "pos": {
      "x": 125,
      "y": 180
    },
    color: "#776655"
  },
  {
    "name": "B",
    "diameter": 80,
    "pos": {
      "x": 215,
      "y": 300
    },
    color: "#997755"
  },
  {
    "name": "C",
    "diameter": 100,
    "pos": {
      "x": 230,
      "y": 152
    },
    color: "#557799"
  },
  {
    "name": "D",
    "diameter": 125,
    "pos": {
      "x": 400,
      "y": 400
    },
    color: "#557799"
  }
];
    let inGame = false;
    const size = 600;
    const mobs = [{
      type: "ant",
      name: "warrior",
      color : "#dd0000",
      size: 12,
      sightLength :120,
      sightAngle : 2 * Math.PI /4,
      move: 6,
      pos: {
        x: -10,
        y: -10
      },
      rot: 0
    }, {
      type: "bug",
      name: "defender",
      color : "#00dd00",
      size: 6,
      move: 3,
      sightLength :80,
      sightAngle : 2 * Math.PI /3,
      pos: {
        x: -10,
        y: -10
      },
      rot: 0
    }];
    let rocks = [];
    let context;
    function setup() {
      createCanvas(size, size);
      context = drawingContext;
        rocks = rockModels.map((r) => {
           let rock = {name : r.name, pos : r.pos, color : r.color,multiplier: r.multiplier,diameter:r.diameter};
          return rock;
      })
      framerate = 20;
    }
    
    function draw() {
      background(102,160,80);
      rocks.forEach((r) => {
          context.save();
          context.beginPath();
          context.fillStyle = "#000000";
          context.fillText(r.name, r.pos.x -4, r.pos.y);

          context.save();
          context.beginPath();
          context.strokeStyle = "#eeeeee";
          noFill();
          circle( r.pos.x , r.pos.y, r.diameter);
          context.stroke();
          context.restore();
      });
      mobs.forEach((m) => {
        context.save();
        context.beginPath();
        context.strokeStyle = "#000";
        context.fillStyle = m.color;
        circle( m.pos.x , m.pos.y, m.size);
	      context.closePath();
		    context.stroke();
        context.fill();
        let dir;
        let dest = [];
        context.beginPath();
        context.strokeStyle = m.color;
        context.fillStyle = m.color;

        dir = polarToCart(m.rot);
        let begin = {x : m.pos.x + (dir.x*m.size/2), y :m.pos.y+(dir.y*m.size/2)}
        dest.push({x:begin.x + (dir.x* m.sightLength),y:begin.y + (dir.y * m.sightLength)});
        for(let i = m.rot - (m.sightAngle /2);i <= m.rot;i+=0.1 ){
          dir = polarToCart(m.rot +i);
          dest.push({x:begin.x + (dir.x* m.sightLength),y:begin.y + (dir.y * m.sightLength)});
        }


        dest.forEach((d,i) => {
          if(i > 0){
            context.moveTo(begin.x, begin.y);
            context.lineTo(d.x, d.y);
          }

        });
        context.closePath();
        context.stroke();
        context.beginPath();
        context.strokeStyle = "#000";
        context.moveTo(begin.x, begin.y);
        context.lineTo(dest[0].x, dest[0].y);
        context.closePath();
        context.stroke();
        context.restore();

      });
      if(!inGame){
          mobs.forEach((m) => {
              m.pos.x = Math.floor((Math.random() * size));
              m.pos.y = Math.floor((Math.random() * size));
              m.rot = getRandomRotation();
          });
          let isOnRock = false;
          mobs.forEach((m) => {
            rocks.forEach((r) => {
               let dist = getDistance(m.pos,r.pos);
               if(dist <= (r.diameter / 2) + m.size){
                isOnRock = true;
               }
          });
        });
        if(isOnRock){
          mobs.forEach((m) => {
            m.pos.x = -10;
            m.pos.y = -10;
        });
        }else{
          inGame = true;
        }
      }
    }
    
    function getDistance(ptA, ptB, name) {
      if (!(ptA && ptA.x != undefined && ptA.y != undefined && ptB && ptB.x != undefined && ptB.y != undefined)) {
        if (!name) name = "???";
        console.log(`Err getDistance ${name}`);
        return 9999;
      }
      return Math.sqrt(Math.pow(ptB.x - ptA.x, 2) + Math.pow(ptB.y - ptA.y, 2));
    }

    function getRandomRotation(){
      return Math.floor((Math.random() * Math.PI * 2) * 100) / 100;
    }

    function polarToCart(rot){
      return {x: Math.cos(rot), y :- Math.sin(rot)}
    }