var KalmanFilter = require('kalmanjs').default;
//var kalmanStrongArgs = {R: 5, Q: 0, B: 1, A: 1.0};
var kalmanStrongArgs = {R: 0.9, Q: 60.4, B: 1.0, A: 1.0}; //{R: 0.01, Q: 20.3, B: 1.0, A: 1.0};
//var kalmanDefault =  {R: 0.9, Q: 10.4, B: 1.0, A: 1.0};// {R: 1.0, Q: 2.5, B: 4, A: 1.0};
var kalmanDefault =  {R: 1.0, Q: 1.0, B: 1.0, A: 1.0};// {R: 1.0, Q: 2.5, B: 4, A: 1.0};

var usesKalman = false;
var kfY = null;
var kfLY = null;
var kfLX = null;
var kfX = null;

var gReplayMode = false;
var replayPackets = [];

window['replayPackets'] = replayPackets;

var replayLive = [];

var gPreviousPacket = null;

window['replay'] = function () {
    gReplayMode = true;
    gPreviousPacket = null;
    replayLive = JSON.parse(JSON.stringify(replayPackets))
    replayStuff();
};

function replayStuff() {
    var packet = replayLive.shift();
    if(packet) {
        var timing = 0;
        var paintcanvas = document.getElementById('paintlayer');

        switch(packet.cmd) {
            case 'PAINTSTART':
//                console.log('paintstart', packet);
                paintcanvas.onmousedown(packet.data.ev);
                break;
            case 'PAINTMOVE':
//                console.log('paintmove', );
                timing = packet.stamp - gPreviousPacket.stamp;
                paintcanvas.onmousemove(packet.data.ev);
                break;
            case 'PAINTSTOP':
//                console.log('paintstop');
                paintcanvas.onmouseup(packet);
                break;
        }
        gPreviousPacket = packet;
        setTimeout(replayStuff, timing);
    } else {
        gReplayMode = false;
    }
}

function insertPacket(command, data) {
    if(!gReplayMode) {
        replayPackets.push({ stamp: Date.now(), cmd: command, data: data});
    }
}

//var kf = new KalmanFilter();


var brushSizeMax = 512;

var lastPos = null;
var currentPos = null;

var currentLayer = null;
var gcolor = 'black';
var gblendMode = 'source-over';
var geraseMode = false;
var gsoftness = 0;
var gImgCache = null;
var traceColor = null;

function getTintedImage(image) {
    var    buffer = document.createElement("canvas");
    var    bufferContext = buffer.getContext("2d");

    var w =  document.getElementById('brush').width,
        h = document.getElementById('brush').height;

    buffer.width = w;
    buffer.height = h;

    var size = document.getElementById('brushSize').value;
    var scale = size/(brushSizeMax/2);
    bufferContext.translate((brushSizeMax/2)-size, (brushSizeMax/2)-size);
    bufferContext.scale(scale,scale);

    bufferContext.clearRect(0,0,w,h);
    bufferContext.fillStyle = traceColor || gcolor;
    bufferContext.fillRect(0, 0, w, h);

    bufferContext.globalCompositeOperation = 'multiply';
    bufferContext.drawImage(image, 0, 0, w, h);

    bufferContext.globalCompositeOperation = 'destination-atop';
    bufferContext.drawImage(image, 0, 0, w, h);

    return buffer;
}

var layers = [];
console.log(atob("RnJlZHJpayBBbmRlcnNzb24gMjAxNyA8ZnJlZHJpa2FuZGVyc3NvbkBtYWMuY29tPg=="));

window["addLayer"] = newLayer;


function wrapTouchEvents(el) {
    el.addEventListener('touchstart', function (ev) {
        var fakeMouse = {
            pageX:ev.touches[0].pageX,
            pageY:ev.touches[0].pageY

        };
        el.onmousedown && el.onmousedown(fakeMouse);
        ev.preventDefault();
    });

    el.addEventListener('touchmove', function (ev) {
        var fakeMouse = {
            pageX:ev.touches[0].pageX,
            pageY:ev.touches[0].pageY
        };
        el.onmousemove && el.onmousemove(fakeMouse);
        ev.preventDefault();
    });

    el.addEventListener('touchend', function (ev) {
        var fakeMouse = {};
        el.onmouseup && el.onmouseup(fakeMouse);
        el.onmouseout && el.onmouseout(fakeMouse);
        ev.preventDefault();
    });
}

function newLayer() {
    insertPacket('NEW_LAYER');

    var cI = layers.indexOf(currentLayer);
   // if(cI < 0 || (cI+1) >= layers.length) {
        var container = document.createElement('div');
    //<input type="range" id="rcslider" value="0" max="255" min="0" step="1" style="display: block;margin: 5px;'">

        var s = document.createElement('input');
        var c = document.createElement('canvas');
        var b = document.createElement('button');

        s.type = 'range'
        s.value = '100';
        s.min = '0';
        s.max = '100';



        container.appendChild(c);
        container.appendChild(b);
        container.appendChild(s);

        c.width = Math.max(window.innerWidth, window.innerHeight);
        c.height = Math.max(window.innerWidth, window.innerHeight);
        c.style.width = document.getElementById('overview').width + 'px';
        c.style.height = document.getElementById('overview').height + 'px';
        var ctx = c.getContext("2d");
        ctx.globalAlpha = 1.0;// 0.1;
        c.style.display='block';
        var theLayer = { canvas: c, ctx: ctx, container: container, opacity: 1.0};

        layers.splice(cI, 0, theLayer);


        container.draggable=true;
        s.draggable = false;

        s.onmousedown = function () {
          container.draggable = false;
        };

        s.onmouseup = function () {
            container.draggable = true;
        };

        s.ondragstart = function () {
            return false;
        };

        s.onmousemove = function (ev) {
            c.getContext("2d");
            theLayer.opacity = s.value/100;
        };//.bind(this, s, theLayer);

        wrapTouchEvents(c);


        container.addEventListener('dragstart', function (ev) {

            var src = layers.indexOf(currentLayer);
            ev.dataTransfer.setData("srcLayer", src);
            ev.stopPropagation();
        });

        container.addEventListener('dragover',  function (ev) {

            ev.preventDefault();
        });


        b.type = 'button';
        b.innerText = 'Rotate 90';
        b.onclick = function () {
            var tcv = document.createElement('canvas');
            tcv.width = theLayer.canvas.width;
            tcv.height = theLayer.canvas.height;
            var tc = tcv.getContext("2d");
            tc.translate(theLayer.canvas.width/2, theLayer.canvas.height/2);
            tc.rotate(90 * Math.PI/180);
            tc.translate(-theLayer.canvas.width/2,-theLayer.canvas.height/2);

            tc.drawImage(theLayer.canvas,0,0);
            var t =    theLayer.ctx.globalAlpha;
            var m =    theLayer.ctx.globalCompositeOperation;
            theLayer.ctx.globalAlpha = 1.0;
            theLayer.ctx.globalCompositeOperation = 'source-over';
            theLayer.ctx.clearRect(0,0,theLayer.canvas.width,theLayer.canvas.height);
            theLayer.ctx.drawImage(tcv,0,0);
            theLayer.ctx.globalAlpha = t;
            theLayer.ctx.globalCompositeOperation = m;
            /*
            theLayer.ctx.translate(theLayer.canvas.width/2, theLayer.canvas.height/2);
            theLayer.ctx.rotate(90 * Math.PI/180);
            theLayer.ctx.translate(-theLayer.canvas.width/2,-theLayer.canvas.height/2);
            var imgData= theLayer.ctx.getImageData(0,0,theLayer.canvas.width,theLayer.canvas.height);
            theLayer.ctx.setTransform(1, 0, 0, 1, 0, 0);
            theLayer.ctx.putImageData(imgData,0,0);*/
        };

        container.addEventListener('drop', function (ev) {
            var src = ev.dataTransfer.getData("srcLayer");

            for(var i = 0;i<layers.length;i++) {
                if(layers[i].container === ev.currentTarget) {
                    var sE = layers.splice(src, 1)[0];
                    layers.splice(i, 0, sE);
                    updateLayerInfo();
                    break;
                }
            }
            ev.preventDefault();
        });

        c.onmousedown = function (layer) {
            currentLayer = theLayer;
            updateLayerInfo();
        }.bind(this, theLayer);

        var holder = document.getElementById('layerHolder');
        if(cI < 0 || cI + 1 >= layers.length) {
            var trace = document.createElement('div');
            var tracebox = document.createElement('input');
            tracebox.id = 'traceLayer';
            tracebox.type = 'checkbox';
            var tracelabel = document.createElement('label');
            tracelabel.innerText = 'Trace Layer';
            trace.appendChild(tracebox);
            trace.appendChild(tracelabel);

//            tracebox.onclick = function () { alert('yep')};

            container.appendChild(trace);
            holder.appendChild(container);
        } else {
            currentLayer.container["insertAdjacentElement"]('afterend',container);
        }
        currentLayer = theLayer;
 /*   } else {
        currentLayer = layers[cI+1];
    }*/

    updateLayerInfo()
}

window["removeLayer"] = function removeLayer() {
    insertPacket('REMOVE_LAYER');
    var cI = layers.indexOf(currentLayer);
    if(cI >= 0) {
        layers.splice(cI, 1);
        window["clearLayer"]();
        currentLayer.container.parentNode.removeChild(currentLayer.container);
        if(layers.length === 0) {
            newLayer();
        } else {
            if(cI<layers.length) {
                currentLayer = layers[cI];
            } else {
                currentLayer = layers[0];
            }
        }
    }
    updateLayerInfo();
}

window["clearLayer"] = function clearLayer() {
    insertPacket('CLEAR_LAYER');
    currentLayer.ctx.clearRect(0,0,currentLayer.canvas.width,currentLayer.canvas.height);
    document.getElementById('overview').getContext("2d").clearRect(0,0, document.getElementById('overview').width,  document.getElementById('overview').height);
    document.getElementById('paintlayer').getContext("2d").fillRect(0,0,currentLayer.canvas.width, currentLayer.canvas.height);
  /*  layers.forEach(function (layer) {
        document.getElementById('paintlayer').getContext("2d").drawImage(layer.canvas,0,0,currentLayer.canvas.width,currentLayer.canvas.height);
    });*/
}

function sampleTraceLayer() {
    if(!currentPos) {
        return;
    }
    var paintcanvas = layers[0].canvas;

    var xOffset = paintcanvas.offsetLeft + brushSizeMax/2;
    var yOffset = paintcanvas.offsetTop + brushSizeMax/2;

    var cctx = layers[0].ctx;

    var buff = cctx.getImageData(0, 0, paintcanvas.width, paintcanvas.height);
    var index = ((currentPos.pageX) + (currentPos.pageY) * paintcanvas.width) * 4;

    var r=buff.data[index++];
    var g=buff.data[index++];
    var b=buff.data[index++];
    var a=buff.data[index++];

    document.getElementById('rcslider').value = r;
    document.getElementById('gcslider').value = g;
    document.getElementById('bcslider').value = b;
    var rgb = 'rgba(' + r +','+ g+ ',' + b+', ' + a +')';
    traceColor = rgb;
}

function getActiveLayer() {
    //console.log('Current layer is ' + layers.indexOf(currentLayer));
    return currentLayer;
}

function updateLayerInfo() {

    var workingLayer = layers.indexOf(currentLayer);
    for(var i=0;i<layers.length;i++) {
        if(i === workingLayer) {
            layers[i].canvas.style.border='1px solid red'
        } else {
            layers[i].canvas.style.border='';
        }
    }

    var tmp = document.getElementById('layerHolder');
    var newHolder = document.createElement('div');
    newHolder.id = 'layerHolder';
    layers.forEach(function (layer) {
        newHolder.appendChild(layer.container);
    });

    tmp.parentNode.replaceChild(newHolder, tmp);

    document.getElementById('layerInfo').innerText = 'Layer ' + (workingLayer+1) + '/' + layers.length;
}

window["exportPng"] = function () {
    alert('This feature is broken. Right click the picture and save it instead.');

    var string = document.getElementById('paintlayer').toDataURL("image/png");
    /*r iframe = "<iframe width='100%' height='100%' src='" + string + "'></iframe>"
    var x = window.open();
    x.document.open();
    x.document.write(iframe);
    x.document.close();*/
    window.href = string;
};


var currentBrush = 'hardBrush';

window["liveBrush"] = false;

window["toggleKalman"] = function () {
    insertPacket('TOGGLE_KALMAN');
    usesKalman = !usesKalman;
};

window["enableEraser"] = function () {
    insertPacket('TOGGLE_ERASER');
    geraseMode = !geraseMode;
    document.getElementById('eraseMode').style.border = '1px solid red';

    window["recompileBrush"]();
};

window["setBrush"] = function (brush, live) {
    insertPacket('SET_BRUSH', { brush: brush, live: live });
    window["activateBrush"](brush, live);
};

window["brushes"] = {
   /* "softBrush": function (bctx, size, center, canvas) {
        bctx.filter = 'blur(1.5px)';
        bctx.clearRect(0,0,canvas.width, canvas.height);
        bctx.beginPath();
        bctx.arc(center,center,size,0,2*Math.PI);
        bctx.fill();
    },*/
    "hardBrush": function (bctx, size, center, canvas) {
//        bctx.filter = 'none';
        bctx.filter = 'blur(' + gsoftness + 'px)';

        bctx.clearRect(0,0,canvas.width, canvas.height);
        bctx.beginPath();
        bctx.arc(center,center,size,0,2*Math.PI);
        bctx.fill();
    },
    "dotBrush": function (bctx, size, center, canvas) {
//        bctx.filter = 'none';
        var blurFactor = window["liveBrush"] ? 0.001 : 0.2;
        bctx.filter = 'blur(' + (gsoftness * blurFactor) + 'px)';

        bctx.clearRect(0,0,canvas.width, canvas.height);
        for(var i=0;i<5*size;i++) {
            bctx.beginPath();
            var cx = (Math.random()*(size*2)) - size;
            var cy = (Math.random()*(size*2)) - size;
            if(Math.sqrt((cx*cx) + (cy*cy)) < size) {
                bctx.arc(center + cx,center + cy,0.5,0,2*Math.PI);
            }
            bctx.fill();
        }
    },
    "calligraphyBrush": function (bctx, size, center, canvas) {
//        bctx.filter = 'none';
        var blurFactor = 1.0;
        bctx.clearRect(0,0,canvas.width, canvas.height);
        bctx.beginPath();
        bctx.lineWidth=size/2;
        var offset = 0;

        if(window["liveBrush"]) {
            blurFactor = 0.4;
            offset = Math.random()%360 - 180;
            bctx.rotate(offset /** Math.PI / 180*/);
        }

        bctx.filter = 'blur(' + (gsoftness * blurFactor) + 'px)';

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
        bctx.filter = 'blur(' + gsoftness + 'px)';
      //  bctx.setTransform(1, 0, 0, 1, 0, 0);
        bctx.clearRect(0,0,canvas.width, canvas.height);
        if(gImgCache === null ) {
            var img = new Image();

            img.onload = function() {
                gImgCache = img;

                if(window["liveBrush"]) {
                    var offset = Math.random()%360 - 180;

                    bctx.translate( document.getElementById('brush').width/2, document.getElementById('brush').width/2);
                    bctx.rotate(offset/* *  Math.PI / 180*/);
                    bctx.translate( -document.getElementById('brush').width/2, -document.getElementById('brush').width/2);

                }
                bctx.drawImage(getTintedImage(gImgCache), 0, 0, document.getElementById('brush').width, document.getElementById('brush').height);

            };
            img.src = 'assets/transp.png';
        } else {
            if(window["liveBrush"]) {
                var offset = Math.random()%360 - 180;
                bctx.translate( document.getElementById('brush').width/2, document.getElementById('brush').width/2);
                bctx.rotate(offset /**  Math.PI / 180*/);
                bctx.translate( -document.getElementById('brush').width/2, -document.getElementById('brush').width/2);

            }
            bctx.drawImage(getTintedImage(gImgCache), 0, 0, document.getElementById('brush').width, document.getElementById('brush').height);
          /*  var tmp = bctx.globalCompositeOperation;
            bctx.globalCompositeOperation = 'destination-in';
            bctx.fillRect(0,0, document.getElementById('brush').width, document.getElementById('brush').height );
            bctx.globalCompositeOperation = tmp;*/
        }

        //img.src = 'http://webneel.com/daily/sites/default/files/images/daily/09-2013/17-most-amazing-photo-hight-sea-tide.jpg'; //https://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png';
    }
};

var forceHidden = false;

window["main"] = function ()
{
    document.getElementById('brush').width = brushSizeMax;
    document.getElementById('brush').height = brushSizeMax;

    document.onkeyup = function (ev) {
        insertPacket('KEYUP', { ev: { key: ev.key}});
    };

    document.onkeydown = function (ev) {
        insertPacket('KEYDOWN', { ev: { key: ev.key}});
       /* if(ev.key === 'Alt') {
            document.getElementById('palette').style.opacity = '0.0';
            document.getElementById('palette').style.pointerEvents = 'none';
            document.getElementById('overviewOverlay').style.opacity = '0.0';
            document.getElementById('overviewOverlay').style.pointerEvents = 'none';
        }*/
    };

    document.onkeydown = function (ev) {
        switch(ev.key) {
            case "Alt":
                forceHidden = true;
                document.getElementById('palette').style.opacity = '0.0';
                document.getElementById('palette').style.pointerEvents = 'none';
                document.getElementById('overviewOverlay').style.opacity = '0.0';
                document.getElementById('overviewOverlay').style.pointerEvents = 'none';
                break;
            case "Shift":
                geraseMode = true;
                window["recompileBrush"]();
                break;
            default:
                break;
        }
    };

    document.onkeyup = function (ev) {
        switch(ev.key) {
            case "Alt":
                forceHidden = false;
                document.getElementById('palette').style.opacity = '1.0';
                document.getElementById('palette').style.pointerEvents = 'all';
                document.getElementById('overviewOverlay').style.opacity = '1.0';
                document.getElementById('overviewOverlay').style.pointerEvents = 'all';
                break;
            case "Shift":
                geraseMode = false;
                window["recompileBrush"]();
                break;
            default:
                break;
        }
    };

    var animCb = null;
    var ctr = 100;
    document.getElementById('fileupload').onchange = function (ev) {
        var file = document.getElementById('fileupload').files[0];
        if (file) {
            var url = URL.createObjectURL(file);
            var img = new Image();
            img.onload = function() {
                var t = getActiveLayer().ctx.globalAlpha;
                getActiveLayer().ctx.globalAlpha = 1.0;
                getActiveLayer().ctx.drawImage(img, 200, 0);
                getActiveLayer().ctx.globalAlpha = t;
            }
            img.src = url;
        }
    };

    var callback = function () {
        if(animCb) {
            animCb();
        }
        if(ctr-- < 0) {
            ctr = 100;

            var cvs = document.getElementById('overview');
            var ctx = cvs.getContext("2d");
            ctx.clearRect(0,0,cvs.width, cvs.height);
            layers.forEach(function (layer) {
               ctx.globalAlpha = layer.opacity;
               ctx.drawImage(layer.canvas,0, 0, cvs.width, cvs.height);
            });
            //ctx.drawImage(currentLayer.canvas/*document.getElementById('paintlayer')*/,0, 0, cvs.width, cvs.height);
        }
        var pcvs = document.getElementById('paintlayer');
        var pctx = pcvs.getContext("2d");
        pctx.clearRect(0,0,pcvs.width,pcvs.height);
        layers.forEach(function (layer) {
            pctx.globalAlpha = layer.opacity;
            pctx.drawImage(layer.canvas,0, 0, pcvs.width, pcvs.height);
        });
        window.requestAnimationFrame(callback);
    };

    callback();
    var bmousetrack = false;
    var pmousetrack = false;

    var paintcanvas = document.getElementById('paintlayer');
    var overviewcanvas = document.getElementById('overview');

    var brushcanvas = document.getElementById('brush');
    var colorpalette = document.getElementById('colorPalette');
    var cctx = colorpalette.getContext("2d");

    var bctx = brushcanvas.getContext("2d");

    var aspect = 1.0; // window.innerHeight/window.innerWidth;

    overviewcanvas.style.width = '100px';
    overviewcanvas.style.height= parseInt(100*aspect) + 'px';
    overviewcanvas.width = 100;
    overviewcanvas.height= parseInt(100*aspect);
    newLayer();

    paintcanvas.style.width = paintcanvas.width = Math.max(window.innerWidth, window.innerHeight); //window.innerWidth;
    paintcanvas.style.height = paintcanvas.height = Math.max(window.innerWidth, window.innerHeight); //window.innerHeight;

    wrapTouchEvents(document.getElementById('brushSize'));
    wrapTouchEvents(document.getElementById('brushSoft'));
    wrapTouchEvents(document.getElementById('brushOpacity'));

    document.getElementById('brushSoft').onmousemove = function () {
        gsoftness = document.getElementById('brushSoft').value;

        window["recompileBrush"]();
        //generateBrush();
    };

    document.getElementById('brushSize').onmousemove = function () {
        generateBrush(document.getElementById('brushSize').value);
    };

    document.getElementById('brushOpacity').onmousemove = function () {
        generateBrush();
    };

    window["recompileBrush"] = function () {
        window["activateBrush"](currentBrush, window["liveBrush"], geraseMode );
    };

    window["activateBrush"] = function (brush, live, erase) {
        geraseMode = erase;
        if(!geraseMode) {
            document.getElementById('eraseMode').style.border = '';
        }
        currentBrush = brush;
        window["liveBrush"] = live;
        bctx.setTransform(1, 0, 0, 1, 0, 0);
        generateBrush();
    };

    createColorPalette();

    var cpsampling = false;

    wrapTouchEvents(colorpalette);

    colorpalette.onmouseup = function () {
        cpsampling = false;
    };

    colorpalette.onmousemove = function (ev) {
        if(cpsampling) {

            var buff = cctx.getImageData(0, 0, colorpalette.width, colorpalette.height);
            var mX = Math.min(Math.max(ev.offsetX, 0), colorpalette.width);
            var mY = Math.min(Math.max(ev.offsetY, 0), colorpalette.height);
            var index = (mX + mY * colorpalette.width) * 4;


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
        var mX = Math.min(Math.max(ev.offsetX, 0), colorpalette.width);
        var mY = Math.min(Math.max(ev.offsetY, 0), colorpalette.height);
        var index = (mX + mY * colorpalette.width) * 4;

        var buff = cctx.getImageData(0, 0, colorpalette.width, colorpalette.height);

        var r=buff.data[index++];
        var g=buff.data[index++];
        var b=buff.data[index++];
        var rgb = 'rgb(' + r +','+ g+ ',' + b+')';
        document.getElementById('rcslider').value = r;
        document.getElementById('gcslider').value = g;
        document.getElementById('bcslider').value = b;

        generateBrush(undefined, rgb);
    };

    wrapTouchEvents(document.getElementById('rcslider'));
    wrapTouchEvents(document.getElementById('gcslider'));
    wrapTouchEvents(document.getElementById('bcslider'));

    document.getElementById('rcslider').onmousemove = document.getElementById('gcslider').onmousemove = function() {
       var rgb = 'rgb(' + document.getElementById('rcslider').value  +','+ document.getElementById('gcslider').value+ ',' + document.getElementById('bcslider').value+')';
       generateBrush(undefined, rgb);
    };
    document.getElementById('bcslider').onmousemove = function () {
        createColorPalette();
        var rgb = 'rgb(' + document.getElementById('rcslider').value  +','+ document.getElementById('gcslider').value+ ',' + document.getElementById('bcslider').value+')';
        generateBrush(undefined, rgb);
    };

    function createColorPalette() {
        var r = 0;
        var g = 0;
        var b = document.getElementById('bcslider').value || 0;
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
        if(!geraseMode) {
            if(traceColor) {
                bctx.fillStyle = traceColor;
                gblendMode = 'source-over';
            } else if(color || gcolor) {
                gcolor = bctx.fillStyle = traceColor || color || gcolor;
                gblendMode = 'source-over';
            } else {
                bctx.fillStyle = "black";
                gblendMode = 'source-over';
            }
        } else {
            gblendMode = 'destination-out';
        }

        if(!size){
            size=document.getElementById('brushSize').value;
        }
        bctx.globalAlpha = document.getElementById('brushOpacity').value*2;
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
            var index = (ev.pageX + ev.pageY * paintcanvas.width) * 4;


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

    wrapTouchEvents(paintcanvas);

    paintcanvas.ontouchmove = function (ev) {
        //console.log(ev);
    };

    paintcanvas.onmousedown = function (ev) {
        insertPacket('PAINTSTART', { ev: { pageX: ev.pageX, pageY: ev.pageY}});

        var args = usesKalman ? kalmanStrongArgs : kalmanDefault;
        kfX = new KalmanFilter(args);
        kfY = new KalmanFilter(args);
        kfLX = new KalmanFilter(args);
        kfLY = new KalmanFilter(args);

        for(var i = 0; i < 100;i++) {
            kfLX.filter(ev.pageX,0);
            kfX.filter(ev.pageX,0);
            kfLY.filter(ev.pageY,0);
            kfY.filter(ev.pageY,0);
        }

        getActiveLayer().ctx.globalCompositeOperation = gblendMode;
        //console.log('blend ' + gblendMode);

        if(!pmousetrack) {
            var xOffset = paintcanvas.offsetLeft + brushSizeMax/2;
            var yOffset = paintcanvas.offsetTop + brushSizeMax/2;


            currentPos = { pageX: ev.pageX,
                           pageY: ev.pageY};

            lastPos = currentPos;


            var trace = document.getElementById('traceLayer');

            if(trace.checked) {
                sampleTraceLayer();
                generateBrush();
            } else {
                traceColor = null;
            }

            getActiveLayer().ctx.globalAlpha = document.getElementById('brushOpacity').value/2;
            getActiveLayer().ctx.drawImage(brushcanvas, ev.pageX - xOffset, ev.pageY - yOffset);
            animCb = pmousetrack = function () {
                if(lastPos && currentPos) {
                    var startX = parseInt(kfLX.filter(lastPos.pageX,0));
                    var endX = parseInt(kfX.filter(currentPos.pageX,0));
                    var startY = parseInt(kfLY.filter(lastPos.pageY,0));
                    var endY = parseInt(kfY.filter(currentPos.pageY,0));
                    //console.log(startX,startY,endX,endY);
                    if(startX != endX ||startY!=endY) {
                        smoothLine(startX, startY, endX, endY, getActiveLayer().ctx);
                    } else {
                        var alp = getActiveLayer().ctx.globalAlpha;
                        getActiveLayer().ctx.globalAlpha = 0.01;
                        if(window["liveBrush"]) {
                            generateBrush();
                        }
                        getActiveLayer().ctx.drawImage(brushcanvas, kfX.filter(currentPos.pageX, 0) - xOffset + (Math.random()*5)-2.5, kfY.filter(currentPos.pageY, 0) - yOffset + (Math.random()*5)-2.5);
                        getActiveLayer().ctx.globalAlpha = alp;
                    }
                }
                lastPos = currentPos;
            };

        }
    };

    document.getElementById('overviewOverlay').onmouseleave = function () {
    };

    document.getElementById('overviewOverlay').onmouseover = function () {
        if(animCb) {
            document.getElementById('overviewOverlay').style.opacity = '0';
            document.getElementById('overviewOverlay').style.pointerEvents = 'none';
        }
    };

    document.getElementById('palette').onmouseover = function () {
        if(animCb) {
            document.getElementById('palette').style.opacity = '0';
            document.getElementById('palette').style.pointerEvents = 'none';
        }
    };

    paintcanvas.onmouseup = function (ev) {
        if(!forceHidden) {
            document.getElementById('palette').style.opacity = '1.0';
            document.getElementById('palette').style.pointerEvents = 'all';
            document.getElementById('overviewOverlay').style.opacity = '1.0';
            document.getElementById('overviewOverlay').style.pointerEvents = 'all';
        }


        if(pmousetrack) {
            insertPacket('PAINTSTOP');

            animCb = null;
       //     clearInterval(pmousetrack);
        }
        pmousetrack = null;
        lastPos = null;
        currentPos = null;
    };


    paintcanvas.onmousemove = function (ev) {
        if(pmousetrack) {
            insertPacket('PAINTMOVE', { ev: { pageX: ev.pageX, pageY: ev.pageY}});

            if(!lastPos || !currentPos) {
                console.log('setting pos');
                currentPos = { pageX: ev.pageX, pageY: ev.pageY};
                lastPos = { pageX: ev.pageX, pageY: ev.pageY};
               // currentFPos = lastFPos = currentPos = lastPos = ev;
            }
           // lastPos = currentPos;
            //            console.log(ev);

            currentPos = { pageX: ev.pageX /* + (Math.random()*25)-12.5*/,
                           pageY: ev.pageY /* + (Math.random()*25)-12.5*/};

            //currentPos = ev;

            // var buff = ctx.getImageData(0, 0, paintcanvas.width, paintcanvas.height);
            //var index = (ev.pageX + ev.pageY * paintcanvas.width) * 4;


           /* var r = buff.data[index++]=0
            var g = buff.data[index++]=255;
            var b = buff.data[index++]=0;
            var a = buff.data[index++]=255;

            console.log(index);*/
            //ctx.putImageData(buff, 0, 0);
        }
    }
};
