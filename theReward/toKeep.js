function collideRayLine(borders, raySrc, rayDest) {
    let distMin = 999;
    let pt = null;
    let ray = {
      p1: {
        x: raySrc.x,
        y: raySrc.y
      },
      p2: {
        x: rayDest.x,
        y: rayDest.y
      }
    };
    let rayLength = getDistance(ray.p1, ray.p2);
    borders.forEach((b) => {
      let interPt = intersectPointLineLine(ray, b.line)
      let rayInterceptedLength = getDistance(ray.p1, interPt)
      if (rayInterceptedLength <= getDistance(ray.p1, ray.p2)) {
        if (rayInterceptedLength < distMin) {
          distMin = rayInterceptedLength;
          pt = {
            ...interPt
          };
        }
      }
    });
    if (pt === null) {
      return null;
    } else {
      return {
        endPt: {
          ...pt
        },
        d: distMin
      };
    }
  }
  function intersectionPointOf2FiniteLines(lineA, lineB) {
    // Does not return intersection of lines of same equation
    let equationA = getEquationOfLine(lineA);
    let equationB = getEquationOfLine(lineB);
    if (equationA.horizontal && equationA.horizontal) {
      return null;
    }
    if (equationA.vertical && equationA.vertical) {
      return null;
    }
    if (equationA.horizontal && equationA.vertical) {
      let mayBePt = {
        x: lineA.p1.x,
        y: lineB.p1.y
      };
      if (getDistance(lineA.p1, mayBePt) <= getDistance(lineA.p1, lineA.p2)) {
        return mayBePt;
      } else {
        return null;
      }
    }
    if (equationA.horizontal) {
      let y = lineA.y;
      // equationB.slope * x + equationB.c == y
      // x = (y - equationB.c )/equationB.slope 
      let x = (y - equationB.c) / equationB.slope;
      let mayBePt = {
        x: x,
        y: y
      };
      if (getDistance(lineB.p1, mayBePt) <= getDistance(lineB.p1, lineB.p2)) {
        return mayBePt;
      } else {
        return null;
      }
    }
    if (equationB.horizontal) {
      let y = lineB.y;
      let x = (y - equationA.c) / equationA.slope;
      let mayBePt = {
        x: x,
        y: y
      };
      if (getDistance(lineA.p1, mayBePt) <= getDistance(lineA.p1, lineA.p2)) {
        return mayBePt;
      } else {
        return null;
      }
    }
    if (equationA.vertical) {
      let x = lineA.x;
      //  y = equationB.slope * x + equationB.c
      let y = (equationB.slope * x) + equationB.c;
      let mayBePt = {
        x: x,
        y: y
      };
      if (getDistance(lineB.p1, mayBePt) <= getDistance(lineB.p1, lineB.p2)) {
        return mayBePt;
      } else {
        return null;
      }
    }
    if (equationB.vertical) {
      let x = lineB.x;
      let y = (equationA.slope * x) + equationA.c;
      let mayBePt = {
        x: x,
        y: y
      };
      if (getDistance(lineA.p1, mayBePt) <= getDistance(lineA.p1, lineA.p2)) {
        return mayBePt;
      } else {
        return null;
      }
    }
    // if we have 2 equations
  }
