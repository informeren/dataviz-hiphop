// Visualization based on work by Amelia Bellamy-Royds: http://fiddle.jshell.net/6cW9u/8/

// !Configuration

var data = [
  {name: 'Clemens', x: 5523, img: './images/clemens.jpg', audio: './audio/clip1.mp3'},
  {name: 'Humleridderne', x: 2431, audio: './audio/clip2.mp3'},
  {name: 'Østkyst Hustlers', x: 3747, img: './images/hustlers.jpg', audio: './audio/clip1.mp3'},
  {name: 'Hvid Sjokolade', x: 4761, img: './images/hvidsjokolade.jpg', audio: './audio/clip2.mp3'},
  {name: 'Johnson', x: 1753, img: './images/johnson.jpg', audio: './audio/clip1.mp3'},
  {name: 'L.O.C.', x: 4042, img: './images/loc.jpg', audio: './audio/clip2.mp3'},
  {name: 'Malk de Koijn', x: 4750, audio: './audio/clip1.mp3'},
  {name: 'Marwan', x: 1899, img: './images/marwan.jpg', audio: './audio/clip2.mp3'},
  {name: 'MC Einar', x: 1965, audio: './audio/clip1.mp3'},
  {name: 'Niarn', x: 2743, img: './images/niarn.jpg', audio: './audio/clip2.mp3'},
  {name: 'Pede B', x: 3893, img: './images/pedeb.jpg', audio: './audio/clip1.mp3'},
  {name: 'Per Vers', x: 3139, img: './images/pervers.jpg', audio: './audio/clip2.mp3'},
  {name: 'Rockers by Choice', x: 4137, img: './images/rockers.jpg', audio: './audio/clip2.mp3'},
  {name: 'Suspekt', x: 4235, img: './images/suspekt.jpg', audio: './audio/clip1.mp3'},
  {name: 'Anders Fogh Rasmussen', x: 3575, img: './images/fogh.jpg', audio: './audio/clip2.mp3'},
  {name: 'Lars Løkke', x: 2719, img: './images/hunk.jpg', audio: './audio/clip1.mp3'},
  {name: 'Helle Thorning', x: 3168, img: './images/thorning.jpg', audio: './audio/clip2.mp3'},
  {name: 'Johannes V. Jensen', x: 4557, img: './images/vjensen.jpg', audio: './audio/clip1.mp3'},
  {name: 'Yahya Hassan', x: 3636, img: './images/yahya.jpg', audio: './audio/clip2.mp3'},
];

var maxRadius = 0;
var radius = 40;
var padding = 10;
var mobile = false;

var width = $('body').width();
var margin = {
  top: 0,
  right: 70,
  bottom: 0,
  left: 30,
};
var graphOffset = 200;

var xMin = 1500;
var xMax = 6000;

if (width < 769) {
  radius = 20;
  mobile = true;
  graphOffset = 250;
  margin.right = 50;
}

// !Chart

var chart = d3.select('#chart');
var x = d3.scale.linear().domain([xMin, xMax]).range([margin.left, width - margin.right]);

var quadtree = d3.geom.quadtree()
  .x(function(d) { return x(d.x); })
  .y(0)
  .extent([[x(xMin), 0],[x(xMax), 0]]);
var quadroot = quadtree([]);

chart.selectAll('div')
  .data(data)
  .enter()
  .append('div')
  .attr('class', function(d) {
 	  return 'artist';
  })
  .style('background-image', function(d) {
 	  return d.img ? 'url(' + d.img + ')' : 'url(./images/none.png)';
  })
  .style('left', width/2 + 'px')
  .style('top', '200px')
  .style('opacity', '0')
  .each(function(d, i) {
    d3.select(this)
      .transition().delay(50*i).duration(200)
      .style('left', function (d) { return x(d.x) + 'px'; })
      .style('top', calculateOffset(maxRadius))
      .style('opacity', '1');

    quadroot.add(d)
  })
	.on('mouseover', function(d) {
    var xPosition = parseFloat(d3.select(this).style("left"));
	  var yPosition = parseFloat(d3.select(this).style("top"));

    xPosition -= 70; // account for tooltip border
    yPosition += 93; // account for bubble size

  	d3.select('#tooltip')
  		.style('left', xPosition + 'px')
  		.style('top', yPosition + 'px')
  		.select('span')
  		.html('<strong>' + d.name + '</strong><br />' + d.x + ' unikke ord<br />');

    if (mobile) {
    	d3.select('#tooltip')
    		.style('left', '10px')
    		.style('top', '10px');
    }

    d3.select('#tooltip').classed('hidden', false);

    d3.select(this).select('div')
      .classed('hidden', false)
      .transition().duration(750)
      .style('opacity', '1');
	})
	.on('mouseout', function() {
    d3.select('#tooltip').classed('hidden', true);

    d3.select(this).select('div')
      .classed('hidden', true)
      .transition().duration(250)
      .style('opacity', '0');
	})
  .append('div')
  .classed('hidden', true)
  .style('opacity', 0)
  .append('img')
  .attr('src', './images/play.png')
  .classed('play', true)
	.on('click', function(d) {
    var loop = new Audio(d.audio);
    loop.play();
	});

var svg = d3.select('svg');

var xAxis = d3.svg.axis()
  .scale(x)
  .innerTickSize(0)
  .outerTickSize(0)
  .orient('bottom')
  .ticks(5)
  .tickFormat(function(d) { return d; });

svg.append('g')
  .attr('class', 'x axis')
  .attr('transform', 'translate(0,' + 475 + ')')
  .call(xAxis);

var scaleLines = [2000, 3000, 4000, 5000, 6000];
for (var i = 0; i < scaleLines.length; i++) {
  svg.append('g')
    .attr('class', 'scale')
    .attr('transform', 'translate(' + x(scaleLines[i]) + ', 0)')
    .append('line')
    .attr('y1', '25')
    .attr('y2', '475');
}

// !Utility functions

function findNeighbours(root, scaledX, scaledR, maxR) {
  var neighbours = [];

  root.visit( function(node, x1, y1, x2, y2) {
    var p = node.point;
    if (p) {
      var overlap, x2 = x(p.x), r2 = radius;
      if (x2 < scaledX) {
        overlap = (x2+r2 + padding >= scaledX-scaledR);
      }
      else {
        overlap = (scaledX + scaledR + padding >= x2-r2);
      }
      if (overlap) {
        neighbours.push(p);
      }
    }

    return (x1-maxR > scaledX + scaledR + padding)
        && (x2+maxR < scaledX - scaledR - padding);
  });

  return neighbours;
}

function calculateOffset(maxR) {
  return function(d) {
    neighbours = findNeighbours(quadroot, x(d.x), radius, maxR);

    var n = neighbours.length;
    var upperEnd = 0, lowerEnd = 0;

    if (n) {
      var j=n, occupied=new Array(n);
      while (j--) {
        var p = neighbours[j];
        var hypoteneuse = radius + radius + padding;

        var base = x(d.x) - x(p.x);

        var vertical = Math.sqrt(Math.pow(hypoteneuse,2) - Math.pow(base, 2));

        occupied[j] = [p.offset+vertical, p.offset-vertical];
      }
      occupied = occupied.sort(function(a,b) {
        return a[0] - b[0];
      });
      lowerEnd = upperEnd = 1/0;

      j=n;
      while (j--){
        if (lowerEnd > occupied[j][0]) {
          upperEnd = Math.min(lowerEnd, occupied[j][0]);
          lowerEnd = occupied[j][1];
        }
        else {
          lowerEnd = Math.min(lowerEnd, occupied[j][1]);
        }
      }
    }

    d.offset = Math.round((Math.abs(upperEnd) < Math.abs(lowerEnd)) ? upperEnd : lowerEnd);
    offset = d.offset
    offset += graphOffset;
    offset += 'px';

    return offset;
  };
}
