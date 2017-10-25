var layers = [];
console.log(atob("RnJlZHJpayBBbmRlcnNzb24gMjAxNyA8ZnJlZHJpa2FuZGVyc3NvbkBtYWMuY29tPg=="));

window["addLayer"] = newLayer;
var currentLayer = null;

function newLayer() {
    var cI = layers.indexOf(currentLayer);
    if(cI < 0 || (cI+1) >= layers.length) {
        var c = document.createElement('canvas');
        c.width = window.innerWidth;
        c.height = window.innerHeight;
        c.style.width = document.getElementById('overview').width + 'px';
        c.style.height = document.getElementById('overview').height + 'px';
        var ctx = c.getContext("2d");
        ctx.globalAlpha = 0.1;
        c.style.display='block';

        layers.push({ canvas: c, ctx: ctx});
        var theLayer = layers[layers.length-1];

        c.onmousedown = function (layer) {
            currentLayer = theLayer;
            updateLayerInfo();
        }.bind(this, theLayer);

        currentLayer = theLayer;
        document.getElementById('layers').appendChild(c);

    } else {
        currentLayer = layers[cI+1];
    }

    updateLayerInfo()
}

window["removeLayer"] = function removeLayer() {
    var cI = layers.indexOf(currentLayer);
    if(cI >= 0) {
        layers.splice(cI, 1);
        window["clearLayer"]();
        currentLayer.canvas.parentNode.removeChild(currentLayer.canvas);
        if(layers.length === 0) {
            newLayer();
        } else {
            currentLayer = layers[0];
        }
    }
    updateLayerInfo();
}

window["clearLayer"] = function clearLayer() {
    currentLayer.ctx.clearRect(0,0,currentLayer.canvas.width,currentLayer.canvas.height);
    document.getElementById('overview').getContext("2d").clearRect(0,0, document.getElementById('overview').width,  document.getElementById('overview').height);
    document.getElementById('paintlayer').getContext("2d").fillRect(0,0,currentLayer.canvas.width, currentLayer.canvas.height);
  /*  layers.forEach(function (layer) {
        document.getElementById('paintlayer').getContext("2d").drawImage(layer.canvas,0,0,currentLayer.canvas.width,currentLayer.canvas.height);
    });*/
}

function getActiveLayer() {
    //console.log('Current layer is ' + layers.indexOf(currentLayer));
    return currentLayer;
}

function updateLayerInfo() {
    var workingLayer = layers.indexOf(currentLayer);

    document.getElementById('layerInfo').innerText = 'Layer ' + (workingLayer+1) + '/' + layers.length;
}

window["exportPng"] = function () {
    var string = document.getElementById('paintlayer').toDataURL("image/png");
    var iframe = "<iframe width='100%' height='100%' src='" + string + "'></iframe>"
    var x = window.open();
    x.document.open();
    x.document.write(iframe);
    x.document.close();
};


var currentBrush = 'hardBrush';

window["liveBrush"] = false;

window["setBrush"] = function (brush, live) {
    window["activateBrush"](brush, live);
};

window["brushes"] = {
    "softBrush": function (bctx, size, center, canvas) {
        bctx.filter = 'blur(1.5px)';
        bctx.clearRect(0,0,canvas.width, canvas.height);
        bctx.beginPath();
        bctx.arc(center,center,size,0,2*Math.PI);
        bctx.fill();
    },
    "hardBrush": function (bctx, size, center, canvas) {
        bctx.filter = 'none';
        bctx.clearRect(0,0,canvas.width, canvas.height);
        bctx.beginPath();
        bctx.arc(center,center,size,0,2*Math.PI);
        bctx.fill();
    },
    "dotBrush": function (bctx, size, center, canvas) {
        bctx.filter = 'none';
        bctx.clearRect(0,0,canvas.width, canvas.height);
        for(var i=0;i<5*size;i++) {
            bctx.beginPath();
            bctx.arc(center + (Math.random()*(size*2)) - size,center + (Math.random()*(size*2))-size,0.5,0,2*Math.PI);
            bctx.fill();
        }
    },
    "calligraphyBrush": function (bctx, size, center, canvas) {
        bctx.filter = 'none';
        bctx.clearRect(0,0,canvas.width, canvas.height);
        bctx.beginPath();
        bctx.lineWidth=size/2;
        var offset = 0;

        if(window["liveBrush"]) {
            offset = Math.random()%360 - 180;
            bctx.rotate(offset);
        }

        var halfsize = size/2;
        bctx.strokeStyle = bctx.fillStyle;
        bctx.moveTo(center - halfsize,center - halfsize);
        bctx.lineTo(center + halfsize,center + halfsize);
        bctx.stroke();
/*        bctx.beginPath();
        bctx.arc(center,center,size,0,2*Math.PI);
        bctx.fill();*/
    },
    "imageBrush": function (bctx, size, center, canvas) {
        bctx.clearRect(0,0,canvas.width, canvas.height);
        var img = new Image();
        img.onload = function() {
            bctx.drawImage(img, 0, 0, document.getElementById('brush').width, document.getElementById('brush').height);
        };
        img.src = 'http://webneel.com/daily/sites/default/files/images/daily/09-2013/17-most-amazing-photo-hight-sea-tide.jpg'; //https://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png';
    }
};

window["main"] = function ()
{
    var eraseMode = false;
    var animCb = null;
    var ctr = 100;
    var callback = function () {
        if(animCb) {
            animCb();
        }
        if(ctr-- < 0) {
            ctr = 100;

            var cvs = document.getElementById('overview');
            var ctx = cvs.getContext("2d");

            layers.forEach(function (layer) {
               ctx.drawImage(layer.canvas,0, 0, cvs.width, cvs.height);
            });
            //ctx.drawImage(currentLayer.canvas/*document.getElementById('paintlayer')*/,0, 0, cvs.width, cvs.height);
        }
        var pcvs = document.getElementById('paintlayer');
        var pctx = pcvs.getContext("2d");
        pctx.clearRect(0,0,pcvs.width,pcvs.height);
        layers.forEach(function (layer) {
            pctx.drawImage(layer.canvas,0, 0, pcvs.width, pcvs.height);
        });
        window.requestAnimationFrame(callback);
    };

    callback();
    var gcolor = 'black';
    var gblendMode = 'source-over';
    var bmousetrack = false;
    var pmousetrack = false;

    var paintcanvas = document.getElementById('paintlayer');
    var overviewcanvas = document.getElementById('overview');

    var brushcanvas = document.getElementById('brush');
    var colorpalette = document.getElementById('colorPalette');
    var cctx = colorpalette.getContext("2d");

    var bctx = brushcanvas.getContext("2d");
    var brushSizeMax = 128;

    var aspect = window.innerHeight/window.innerWidth;

    overviewcanvas.style.width = '200px';
    overviewcanvas.style.height= parseInt(200*aspect) + 'px';
    overviewcanvas.width = 200;
    overviewcanvas.height= parseInt(200*aspect);
    newLayer();

    paintcanvas.style.width = paintcanvas.width = window.innerWidth;
    paintcanvas.style.height = paintcanvas.height = window.innerHeight;
    document.getElementById('brushSize').onmousemove = function () {
        generateBrush(document.getElementById('brushSize').value);
    };

    window["activateBrush"] = function (brush, live) {
        currentBrush = brush;
        window["liveBrush"] = live;
        bctx.setTransform(1, 0, 0, 1, 0, 0);
        generateBrush();
    };

    createColorPalette();

    var cpsampling = false;

    colorpalette.onmouseup = function () {
        cpsampling = false;
    };

    colorpalette.onmousemove = function (ev) {
        if(cpsampling) {
            var xOffset = colorpalette.offsetLeft;
            var yOffset = colorpalette.offsetTop;

            var buff = cctx.getImageData(0, 0, colorpalette.width, colorpalette.height);
            var index = ((ev.clientX - xOffset) + (ev.clientY-yOffset) * colorpalette.width) * 4;


            var r=buff.data[index++];
            var g=buff.data[index++];
            var b=buff.data[index++];
            document.getElementById('rcslider').value = r;
            document.getElementById('gcslider').value = g;
            document.getElementById('bcslider').value = b;
            var rgb = 'rgb(' + r +','+ g+ ',' + b+')';
            generateBrush(undefined, rgb);
        }
    };

    colorpalette.onmouseout = function () {
        cpsampling = false;
    };

    colorpalette.onmousedown = function (ev) {
        cpsampling = true;
        var xOffset = colorpalette.offsetLeft;
        var yOffset = colorpalette.offsetTop;

        var buff = cctx.getImageData(0, 0, colorpalette.width, colorpalette.height);
        var index = ((ev.clientX - xOffset) + (ev.clientY-yOffset) * colorpalette.width) * 4;

        var r=buff.data[index++];
        var g=buff.data[index++];
        var b=buff.data[index++];
        var rgb = 'rgb(' + r +','+ g+ ',' + b+')';
        document.getElementById('rcslider').value = r;
        document.getElementById('gcslider').value = g;
        document.getElementById('bcslider').value = b;

        generateBrush(undefined, rgb);
    };
    document.getElementById('rcslider').onmousemove = document.getElementById('gcslider').onmousemove =document.getElementById('bcslider').onmousemove = function() {
       var rgb = 'rgb(' + document.getElementById('rcslider').value  +','+ document.getElementById('gcslider').value+ ',' + document.getElementById('bcslider').value+')';
       generateBrush(undefined, rgb);
    };


    var gb = 0;
    document.getElementById('gslider').onmousemove = function () {
        gb = document.getElementById('gslider').value;
        createColorPalette();
    };

    function createColorPalette() {
        var r = 0;
        var g = 0;
        var b = gb || 0;
        var hd = 255/colorpalette.width;
        var vd = 255/colorpalette.height;

        var buff = cctx.getImageData(0, 0, colorpalette.width, colorpalette.height);
        for(var y =0;y<colorpalette.height;y++) {
            g = 0;
            for(var x = 0;x<colorpalette.width;x++)
            {
                var index = (x + y * colorpalette.width) * 4;

                buff.data[index++]=r;
                buff.data[index++]=(g+=hd);
                buff.data[index++]=b;
                buff.data[index++]=255;
            }
            r+=vd;
        }

        cctx.putImageData(buff, 0, 0);
    }



    // Just a lame brush
    function generateBrush(size, color) {
        if(color || gcolor) {
            gcolor = bctx.fillStyle = color || gcolor;
            gblendMode = 'source-over';
        } else {

            bctx.fillStyle = "black";
//            gblendMode = 'overlay';
        }

        if(!size){
            size=document.getElementById('brushSize').value;
        }
        window["brushes"][currentBrush](bctx, size, brushSizeMax/2, brushcanvas);

        document.getElementById('brushSizeText').innerText = size + ' px';
    }
    generateBrush(13);

/*    bc.fillStyle = "#000000";
    bc.filter = 'blur(2px)';
    bc.beginPath();
    bc.arc(100,75,50,0,2*Math.PI);
    bc.fill();*/
    //bc.fillRect(0,0,brushcanvas.width, brushcanvas.height);

  /*  brushcanvas.onmousedown = function (ev) {
        bmousetrack = true;
        console.log(ev);
    };

    brushcanvas.onmouseup = function (ev) {
        bmousetrack = false;
        console.log(ev);
    };

    brushcanvas.onmousemove = function (ev) {
        if(bmousetrack) {
            var buff = bc.getImageData(0, 0, paintcanvas.width, paintcanvas.height);
            var index = (ev.clientX + ev.clientY * paintcanvas.width) * 4;


            var r = buff.data[index++]=0;
            var g = buff.data[index++]=0;
            var b = buff.data[index++]=0;
            var a = buff.data[index++]=255;

            bc.putImageData(buff, 0, 0);
        }
    }*/

    var ctx = getActiveLayer().ctx; //currentLayer.ctx; //paintcanvas.getContext("2d");
    ctx.globalCompositeOperation = gblendMode;
    ctx.globalAlpha = 0.1;

    function smoothLine(sX, sY, eX, eY, ctx) {
        var xOffset = paintcanvas.offsetLeft + brushSizeMax/2;
        var yOffset = paintcanvas.offsetTop + brushSizeMax/2;
        var steep = false;
        var t = null;
        if(Math.abs(sX - eX) < Math.abs(sY - eY)) {
            t = sX;
            sX = sY;
            sY = t;

            t = eX;
            eX = eY;
            eY = t;
            steep = true;
        }

        if(sX > eX) {
            t = sX;
            sX = eX;
            eX = t;

            t = sY;
            sY = eY;
            eY = t;
        }

        var dx = eX - sX;
        var dy = eY - sY;
        var err2 = Math.abs(dy)*2;
        var err = 0;
        var y = sY;
        for(var x=sX;x<=eX;x++) {
            if(window["liveBrush"] && x%4 == 0) {
                generateBrush();
            }
            if(steep) {
                getActiveLayer().ctx.drawImage(brushcanvas, y - xOffset, x - yOffset);
            } else {
                getActiveLayer().ctx.drawImage(brushcanvas, x - xOffset, y - yOffset);
            }
            err += err2;
            if(err > dx) {
                y += (eY > sY ? 1 : -1);
                err -= dx * 2;
            }
        }
    }

    paintcanvas.onmousedown = function (ev) {
        getActiveLayer().ctx.globalCompositeOperation = gblendMode;
        //console.log('blend ' + gblendMode);

        if(!pmousetrack) {
            var xOffset = paintcanvas.offsetLeft + brushSizeMax/2;
            var yOffset = paintcanvas.offsetTop + brushSizeMax/2;
            currentPos = ev;
            lastPos = ev;
            getActiveLayer().ctx.drawImage(brushcanvas, ev.clientX - xOffset, ev.clientY - yOffset);
            animCb = pmousetrack = function () {
                if(lastPos && currentPos) {
                    var startX = lastPos.clientX;
                    var endX = currentPos.clientX;
                    var startY = lastPos.clientY;
                    var endY = currentPos.clientY;
                    if(startX != endX ||startY!=endY) {
                        smoothLine(startX, startY, endX, endY, getActiveLayer().ctx);
                    } else {
                        var alp = getActiveLayer().ctx.globalAlpha;
                        ctx.globalAlpha = 0.01;
                        if(window["liveBrush"]) {
                            generateBrush();
                        }
                        getActiveLayer().ctx.drawImage(brushcanvas, currentPos.clientX - xOffset + (Math.random()*5)-2.5, currentPos.clientY - yOffset + (Math.random()*5)-2.5);
                        getActiveLayer().ctx.globalAlpha = alp;
                    }
                }
                lastPos = currentPos;
            };

        }
    };

    /*paintcanvas.onmouseout =
    */document.getElementById('palette').onmouseover = paintcanvas.onmouseup = function (ev) {
        if(pmousetrack) {
            animCb = null;
       //     clearInterval(pmousetrack);
        }
        pmousetrack = null;
        lastPos = null;
        currentPos = null;
    };

    var lastPos = null;
    var currentPos = null;

    paintcanvas.onmousemove = function (ev) {
        if(pmousetrack) {
            if(!lastPos || !currentPos) {
                currentPos = lastPos = ev;
            }
           // lastPos = currentPos;
            currentPos = ev;

            // var buff = ctx.getImageData(0, 0, paintcanvas.width, paintcanvas.height);
            //var index = (ev.clientX + ev.clientY * paintcanvas.width) * 4;


           /* var r = buff.data[index++]=0
            var g = buff.data[index++]=255;
            var b = buff.data[index++]=0;
            var a = buff.data[index++]=255;

            console.log(index);*/
            //ctx.putImageData(buff, 0, 0);
        }
    }
};
