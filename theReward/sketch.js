
const rockModels = [
    {"name": "A","diameter":80,"pos" : {"x":125,"y":180},"multiplier" : 65,color : "#776655", "poly": [{"x": -0.37,"y": -0.164}, {"x": -0.2,"y": -0.357}, {"x": -0.11,"y": -0.31}, {"x": -0.053,"y": -0.38}, {"x": -0.02,"y": -0.444}, {"x": 0.14,"y": -0.357}, {"x": 0.187,"y": -0.26}, {"x": 0.333,"y": -0.317}, {"x": 0.4,"y": -0.287}, {"x": 0.543,"y": 0.16}, {"x": 0.43,"y": 0.336}, {"x": 0.307,"y": 0.293}, {"x": 0.28,"y": 0.326}, {"x": 0.31,"y": 0.48}, {"x": 0.293,"y": 0.6}, {"x": 0.13,"y": 0.586}, {"x": -0.023,"y": 0.536}, {"x": -0.093,"y": 0.44}, {"x": -0.123,"y": 0.333}, {"x": -0.103,"y": 0.206}, {"x": -0.243,"y": 0.34}, {"x": -0.343,"y": 0.336}, {"x": -0.46,"y": 0.173}, {"x": -0.487,"y": 0.046}, {"x": -0.437,"y": 0.02}, {"x": -0.417,"y": -0.054}, {"x": -0.447,"y": -0.127}, {"x": -0.37,"y": -0.164}]},
    {"name": "B","diameter":80,"pos" : {"x":215,"y":300},"multiplier" : 52,color : "#997755","poly": [{"x": -0.333,"y": -0.38}, {"x": -0.46,"y": -0.194}, {"x": -0.493,"y": 0.15}, {"x": -0.38,"y": 0.456}, {"x": -0.197,"y": 0.646}, {"x": -0.143,"y": 0.82}, {"x": 0.047,"y": 0.783}, {"x": 0.18,"y": 0.606}, {"x": 0.407,"y": 0.416}, {"x": 0.557,"y": 0.28}, {"x": 0.693,"y": 0.19}, {"x": 0.557,"y": -0.117}, {"x": 0.33,"y": -0.19}, {"x": 0.147,"y": -0.414}, {"x": -0.117,"y": -0.464}, {"x": -0.333,"y": -0.38}]},
    {"name": "C","diameter":100,"pos" : {"x":230,"y":152},"multiplier" : 67,color : "#557799","poly": [{"x": -0.05,"y": -0.624},{"x": -0.233,"y": -0.53},{"x": -0.403,"y": -0.394},{"x": -0.483,"y": -0.247},{"x": -0.577,"y": -0.024},{"x": -0.597,"y": 0.16},{"x": -0.57,"y": 0.253},{"x": -0.23,"y": 0.46},{"x": -0.173,"y": 0.56},{"x": -0.13,"y": 0.626},{"x": -0.053,"y": 0.57},{"x": -0.01,"y": 0.473},{"x": 0.153,"y": 0.446},{"x": 0.407,"y": 0.25},{"x": 0.477,"y": 0.03},{"x": 0.53,"y": -0.224},{"x": 0.597,"y": -0.3},{"x": 0.54,"y": -0.414},{"x": 0.387,"y": -0.397},{"x": 0.163,"y": -0.417},{"x": 0.043,"y": -0.517},{"x": -0.05,"y": -0.624}]}
    ];
    
    let rocks = [];
    let context;
    function setup() {
      createCanvas(400, 400);
      context = drawingContext;
    
        rocks = rockModels.map((r) => {
           let rock = {name : r.name, pos : r.pos, color : r.color,multiplier: r.multiplier,diameter:r.diameter, poly : [...r.poly]};
          rock.poly.forEach((pt) => {
            pt.x = pt.x * r.multiplier + r.pos.x;
            pt.y = pt.y * r.multiplier + r.pos.y;
            
          })
          rock.center = getCenter(rock.poly);
          return rock;
      })
      console.log(rocks)
    }
    
    function draw() {
      background(102,160,80);
      rocks.forEach((r) => {
          context.save();
          context.beginPath();
          context.fillStyle = r.color;
          context.strokeStyle = "#000000";
          context.moveTo(r.poly[0].x, r.poly[0].y);
          let ptsNr = r.poly.length;
          for(let i = 1; i < ptsNr; i++){
              context.lineTo(r.poly[i].x, r.poly[i].y);
          }
          context.closePath();
          context.stroke();
          context.fill();
          context.restore();

          context.fillStyle = "#000000";
          context.fillText(r.name, r.center.x -4, r.center.y);

          context.save();
          context.beginPath();
          context.strokeStyle = "#eeeeee";
          noFill();
          circle( r.center.x , r.center.y, r.diameter);
          context.stroke();
          context.restore();
        
      })
    }
    
    function getCenter(arr) {
        let minX, maxX, minY, maxY;
        for (var i = 0; i < arr.length; i++) {
            minX = (arr[i].x < minX || minX == null) ? arr[i].x : minX;
            maxX = (arr[i].x > maxX || maxX == null) ? arr[i].x : maxX;
            minY = (arr[i].y < minY || minY == null) ? arr[i].y : minY;
            maxY = (arr[i].y > maxY || maxY == null) ? arr[i].y : maxY;
        }
        return { x: Math.floor((minX + maxX) / 2), y: Math.floor((minY + maxY) / 2) };
    }