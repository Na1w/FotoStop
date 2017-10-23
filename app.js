window["exportPng"] = function () {
    var string = document.getElementById('paintlayer').toDataURL("image/png");
    var iframe = "<iframe width='100%' height='100%' src='" + string + "'></iframe>"
    var x = window.open();
    x.document.open();
    x.document.write(iframe);
    x.document.close();
};

window["main"] = function ()
{
    var gcolor = 'black';
    var gblendMode = 'source-over';
    var bmousetrack = false;
    var pmousetrack = false;

    var paintcanvas = document.getElementById('paintlayer');
    var brushcanvas = document.getElementById('brush');
    var colorpalette = document.getElementById('colorPalette');
    var cctx = colorpalette.getContext("2d");

    var bctx = brushcanvas.getContext("2d");
    var brushSizeMax = 128;

    document.getElementById('brushSize').onmousemove = function () {
        console.log(document.getElementById('brushSize').value);
        generateBrush(document.getElementById('brushSize').value);
    };

    createColorPalette();

    colorpalette.onmousedown = function (ev) {
        var xOffset = colorpalette.offsetLeft;
        var yOffset = colorpalette.offsetTop;

        var buff = cctx.getImageData(0, 0, colorpalette.width, colorpalette.height);
        var index = ((ev.clientX - xOffset) + (ev.clientY-yOffset) * colorpalette.width) * 4;

        var rgb = 'rgb(' + buff.data[index++] +','+buff.data[index++] + ',' + buff.data[index++] +')';
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
        bctx.filter = 'blur(1px)';
        bctx.clearRect(0,0,brushcanvas.width, brushcanvas.height);
        bctx.beginPath();
        bctx.arc(brushSizeMax/2,brushSizeMax/2,size,0,2*Math.PI);
        bctx.fill();
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

    var ctx = paintcanvas.getContext("2d");
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
            if(steep) {
                ctx.drawImage(brushcanvas, y - xOffset, x - yOffset);
            } else {
                ctx.drawImage(brushcanvas, x - xOffset, y - yOffset);
            }
            err += err2
            if(err > dx) {
                y += (eY > sY ? 1 : -1);
                err -= dx * 2;
            }
        }
    }

    paintcanvas.onmousedown = function (ev) {
        ctx.globalCompositeOperation = gblendMode;
        //console.log('blend ' + gblendMode);

        if(!pmousetrack) {
            var xOffset = paintcanvas.offsetLeft + brushSizeMax/2;
            var yOffset = paintcanvas.offsetTop + brushSizeMax/2;
            currentPos = ev;
            lastPos = ev;
            ctx.drawImage(brushcanvas, ev.clientX - xOffset, ev.clientY - yOffset);
            pmousetrack = setInterval(function () {
                if(lastPos && currentPos) {
                    var startX = lastPos.clientX;
                    var endX = currentPos.clientX;
                    var startY = lastPos.clientY;
                    var endY = currentPos.clientY;
                    if(startX != endX ||startY!=endY) {
                        smoothLine(startX, startY, endX, endY, ctx);
                    } else {
                        var alp = ctx.globalAlpha;
                        ctx.globalAlpha = 0.01;
                        ctx.drawImage(brushcanvas, currentPos.clientX - xOffset + (Math.random()*5)-2.5, currentPos.clientY - yOffset + (Math.random()*5)-2.5);
                        ctx.globalAlpha = alp;
                    }
                }
                lastPos = currentPos;
            }, 1/60.0);

        }
        console.log('mouse is down');
    };

    paintcanvas.onmouseup = function (ev) {
        clearInterval(pmousetrack);

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
