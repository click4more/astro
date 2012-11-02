var spaceWebGL = window.spaceWebGL = {};

spaceWebGL.allBodies = {};

spaceWebGL.initGL = function(canvas) {
    try {
        spaceWebGL.gl = canvas.getContext("experimental-webgl");
        spaceWebGL.gl.viewportWidth = canvas.width;
        spaceWebGL.gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!spaceWebGL.gl) {
        alert("Could not initialise WebGL, sorry :-(");
        return false;
    } else {
        return true;
    }
}

spaceWebGL.getShader = function(gl, id) {
    var str = spaceWebGL.shaderSource[id];

    var shader;
    if (id.endswith("_fs")) { //shaderScript.type == "x-shader/x-fragment") {
        shader = spaceWebGL.gl.createShader(spaceWebGL.gl.FRAGMENT_SHADER);
    } else if (id.endswith("_vs")){ //shaderScript.type == "x-shader/x-vertex") {
        shader = spaceWebGL.gl.createShader(spaceWebGL.gl.VERTEX_SHADER);
    } else {
        throw "shader id should end in _fs for frag shaders or _vs for vert shaders";
    }

    spaceWebGL.gl.shaderSource(shader, str);
    spaceWebGL.gl.compileShader(shader);

    if (!spaceWebGL.gl.getShaderParameter(shader, spaceWebGL.gl.COMPILE_STATUS)) {
        alert(spaceWebGL.gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

// Creates a ready-to-use shader program using given fs and vs
spaceWebGL.createShaderProgram = function(fsid, vsid) {
    var fs = spaceWebGL.getShader(spaceWebGL.gl, fsid);
    var vs = spaceWebGL.getShader(spaceWebGL.gl, vsid);

    p = spaceWebGL.gl.createProgram();
    spaceWebGL.gl.attachShader(p, vs);
    spaceWebGL.gl.attachShader(p, fs);
    spaceWebGL.gl.linkProgram(p);

    if (!spaceWebGL.gl.getProgramParameter(p, spaceWebGL.gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    
    spaceWebGL.gl.useProgram(p);

    // enable vertices to be passed in at once as attributes
    p.vertexPositionAttribute = spaceWebGL.gl.getAttribLocation(p, "vertexPosition");
    spaceWebGL.gl.enableVertexAttribArray(p.vertexPositionAttribute);
    
    // Remember locations for uniform variables for matrices
    p.pMatrixUniform = spaceWebGL.gl.getUniformLocation(p, "uPMatrix");
    p.mvMatrixUniform = spaceWebGL.gl.getUniformLocation(p, "uMVMatrix");

    // enable vertex normals to be passed in at once as attributes
    p.vertexNormalAttribute = spaceWebGL.gl.getAttribLocation(p, "vertexNormal");
    spaceWebGL.gl.enableVertexAttribArray(p.vertexNormalAttribute);
    
    // normal matrix
    p.nMatrixUniform = spaceWebGL.gl.getUniformLocation(p, "uNMatrix");
    
    // texture coordinates as attributes
    p.textureCoordAttribute = spaceWebGL.gl.getAttribLocation(p, "vertexTextureCoord");
    spaceWebGL.gl.enableVertexAttribArray(p.textureCoordAttribute); 
   
    // texture uniforms
    p.samplerUniform = spaceWebGL.gl.getUniformLocation(p, "textureSampler");
    p.textureFlag = spaceWebGL.gl.getUniformLocation(p, "textureFlag");
    
    // lighting uniforms
    p.lightingFlag = spaceWebGL.gl.getUniformLocation(p, "lightingFlag");
    p.lightPosition = spaceWebGL.gl.getUniformLocation(p, "uLightPosition");
    p.exoplanetColor = spaceWebGL.gl.getUniformLocation(p, "exoplanetColor");

    return p;
}


spaceWebGL.initShaders = function() {
    spaceWebGL.exoplanetShaderProgram = spaceWebGL.createShaderProgram("exoplanet_shader_fs", "exoplanet_shader_vs");
}

spaceWebGL.mvMatrix = mat4.create();
spaceWebGL.mvMatrixStack = [];
spaceWebGL.pMatrix = mat4.create();

spaceWebGL.mvPushMatrix = function() {
    var copy = mat4.create();
    mat4.set(spaceWebGL.mvMatrix, copy);
    spaceWebGL.mvMatrixStack.push(copy);
}

spaceWebGL.mvPopMatrix = function() {
    if (spaceWebGL.mvMatrixStack.length == 0) {
        throw "Invalid pospaceWebGL.pMatrix!";
    }
    spaceWebGL.mvMatrix = spaceWebGL.mvMatrixStack.pop();
}

spaceWebGL.setMatrixUniforms = function() {
    spaceWebGL.gl.uniformMatrix4fv(spaceWebGL.currentProgram.pMatrixUniform, false, spaceWebGL.pMatrix);
    spaceWebGL.gl.uniformMatrix4fv(spaceWebGL.currentProgram.mvMatrixUniform, false, spaceWebGL.mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(spaceWebGL.mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    spaceWebGL.gl.uniformMatrix3fv(spaceWebGL.currentProgram.nMatrixUniform, false, normalMatrix);
}


spaceWebGL.degToRad = function(degrees) {
    return degrees * Math.PI / 180;
}


// Camera location, spherical coords center on the sun
spaceWebGL.distance = 1;
spaceWebGL.azith = 0;
spaceWebGL.elev = -10;

// Mouse events
spaceWebGL.mouseDown = false;
spaceWebGL.lastMouseX = null;
spaceWebGL.lastMouseY = null;

spaceWebGL.handleMouseDown = function(event) {
    spaceWebGL.mouseDown = true;
    spaceWebGL.lastMouseX = event.clientX;
    spaceWebGL.lastMouseY = event.clientY;
}
spaceWebGL.handleMouseUp = function(event) {
    spaceWebGL.mouseDown = false;
}
spaceWebGL.handleMouseMove = function(event) {
    if (!spaceWebGL.mouseDown) {
        return;
    }
    // get the vector that we just dragged (dx, dy)
    var newX = event.clientX;
    var newY = event.clientY;
    var deltaX = newX - spaceWebGL.lastMouseX;
    var deltaY = newY - spaceWebGL.lastMouseY;
    spaceWebGL.lastMouseX = newX;
    spaceWebGL.lastMouseY = newY;

    // turn that into rotation
    var sens = 1./(spaceWebGL.distance*spaceWebGL.distance*500); //sensitivity
    spaceWebGL.azith -= deltaX * sens;
    spaceWebGL.elev -= deltaY * sens * 0.7;
}


// Key events
spaceWebGL.zoomFactor = 0.01;
spaceWebGL.handleKeyDown = function(event) {
    var char = String.fromCharCode(event.keyCode);
    if(char.toLowerCase() == "w"){
        spaceWebGL.zoom(-spaceWebGL.zoomFactor);
    } else if(char.toLowerCase() == "e"){
        spaceWebGL.zoom(-spaceWebGL.zoomFactor*5);
    } else if(char.toLowerCase() == "s"){
        spaceWebGL.zoom(spaceWebGL.zoomFactor);
    } else if(char.toLowerCase() == "d"){
        spaceWebGL.zoom(spaceWebGL.zoomFactor*5);
    }
}

spaceWebGL.handleKeyUp = function(event) {
}

spaceWebGL.zoom = function(factor) {
    spaceWebGL.distance += factor;
}


spaceWebGL.handleLoadedTexture = function(texture) {
    spaceWebGL.gl.pixelStorei(spaceWebGL.gl.UNPACK_FLIP_Y_WEBGL, true);
    spaceWebGL.gl.bindTexture(spaceWebGL.gl.TEXTURE_2D, texture);
    spaceWebGL.gl.texImage2D(spaceWebGL.gl.TEXTURE_2D, 0, spaceWebGL.gl.RGBA, spaceWebGL.gl.RGBA, spaceWebGL.gl.UNSIGNED_BYTE, texture.image);
    spaceWebGL.gl.texParameteri(spaceWebGL.gl.TEXTURE_2D, spaceWebGL.gl.TEXTURE_MAG_FILTER, spaceWebGL.gl.LINEAR);
    spaceWebGL.gl.texParameteri(spaceWebGL.gl.TEXTURE_2D, spaceWebGL.gl.TEXTURE_MIN_FILTER, spaceWebGL.gl.LINEAR_MIPMAP_NEAREST);
    spaceWebGL.gl.generateMipmap(spaceWebGL.gl.TEXTURE_2D);

    spaceWebGL.gl.bindTexture(spaceWebGL.gl.TEXTURE_2D, null);
}

spaceWebGL.initTexture = function(texturePath) {
    texture = spaceWebGL.gl.createTexture();
    texture.image = new Image();
    texture.image.src = texturePath;
    return texture;
}

spaceWebGL.getTemperatureEstimateMinMax = function() {
    var min = 1.;
    var max = 0.; 
    for(var i=0; i<spaceWebGL.exoplanetData.length; i++) {
        var exoplanet = spaceWebGL.exoplanetData[i];
        var solarMass = exoplanet['st_mass']!="" ? exoplanet['st_mass'] : exoplanet['st_rad'];
        if(solarMass=="") continue;

        var ratio = solarMass / exoplanet['pl_orbsmax'];

        if(ratio < min) min = ratio;
        else if(ratio > max) max = ratio;
    }

    return {min: min, max: max};
}

spaceWebGL.lerp = function(a, b, t) {
    return a*(1-t) + b*t;
}

spaceWebGL.computeExoplanetColor = function(exoplanet, range) {
    // color gradient
    var green = range.min;
    var yellow = /*(range.max-range.min)*0.5 + range.min; // */(range.max-1.)*0.3;
    var red = range.max;
    
    var solarMass = exoplanet['st_mass']!="" ? exoplanet['st_mass'] : exoplanet['st_rad'];

    // if mass of star is unknown, return gray
    if(solarMass=="") {
        return {r: 0.3, g: 0.3, b: 0.3};
    }
    
    var value = solarMass / exoplanet['pl_orbsmax'];
    
    var r, g, b, t;
    if (value < yellow) {
        t = (value - green)/(yellow - green);
        r = spaceWebGL.lerp(0, 1, t);
        g = spaceWebGL.lerp(0.6, 1, t);
        b = spaceWebGL.lerp(0.3, 0, t);
    } else {
        t = (value - yellow)/(red - yellow);
        r = 1.;
        g = spaceWebGL.lerp(1, 0, t);
        b = 0.;
    }

    return {r: r, g: g, b: b};
}

spaceWebGL.initBody = function(name, radius, azith, elev, orbitRadius, texturePath, exoplanetColor) {

    //TODO: modify according to radius
    var latitudeBands = 30;
    var longitudeBands = 30;

    var body = {};
    body.name = name;
    body.radius = radius;
    body.azith = azith;
    body.elev = elev;
    body.orbitRadius = orbitRadius;
    if(texturePath!="") {
        body.texture = spaceWebGL.initTexture(texturePath);
    } else if(exoplanetColor) {
        body.exoplanetColor = exoplanetColor;
    }

    // save for lookup
    spaceWebGL.allBodies[name] = body;

    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);

            normalData.push(x);
            normalData.push(y);
            normalData.push(z);
            textureCoordData.push(u);
            textureCoordData.push(v);
            vertexPositionData.push(body.radius * x);
            vertexPositionData.push(body.radius * y);
            vertexPositionData.push(body.radius * z);
        }
    }

    var indexData = [];
    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }

    body.vertexNormalBuffer = spaceWebGL.gl.createBuffer();
    spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ARRAY_BUFFER, body.vertexNormalBuffer);
    spaceWebGL.gl.bufferData(spaceWebGL.gl.ARRAY_BUFFER, new Float32Array(normalData), spaceWebGL.gl.STATIC_DRAW);
    body.vertexNormalBuffer.itemSize = 3;
    body.vertexNormalBuffer.numItems = normalData.length / 3;

    body.vertexTextureCoordBuffer = spaceWebGL.gl.createBuffer();
    spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ARRAY_BUFFER, body.vertexTextureCoordBuffer);
    spaceWebGL.gl.bufferData(spaceWebGL.gl.ARRAY_BUFFER, new Float32Array(textureCoordData), spaceWebGL.gl.STATIC_DRAW);
    body.vertexTextureCoordBuffer.itemSize = 2;
    body.vertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

    body.vertexPositionBuffer = spaceWebGL.gl.createBuffer();
    spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ARRAY_BUFFER, body.vertexPositionBuffer);
    spaceWebGL.gl.bufferData(spaceWebGL.gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), spaceWebGL.gl.STATIC_DRAW);
    body.vertexPositionBuffer.itemSize = 3;
    body.vertexPositionBuffer.numItems = vertexPositionData.length / 3;

    body.vertexIndexBuffer = spaceWebGL.gl.createBuffer();
    spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ELEMENT_ARRAY_BUFFER, body.vertexIndexBuffer);
    spaceWebGL.gl.bufferData(spaceWebGL.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), spaceWebGL.gl.STATIC_DRAW);
    body.vertexIndexBuffer.itemSize = 1;
    body.vertexIndexBuffer.numItems = indexData.length;

    return body;
}

spaceWebGL.initBodies = function() {
    spaceWebGL.bodies = [];
    spaceWebGL.exoplanets = [];
    var distanceMultiplier = 1.;
    var kmAu = 149597870; // mean distance from earth to sun in km
    var kmSunRadius = 695500;
    var auSunRadius = kmSunRadius/kmAu;
    var displayedSunRadius = auSunRadius;
    spaceWebGL.sun = spaceWebGL.initBody("Sun", auSunRadius, 0, 0, 0, 'textures/sun.gif', null);

    for(planet in spaceWebGL.solarsystemData) {
        planetData = spaceWebGL.solarsystemData[planet];
        spaceWebGL.bodies.push(
            spaceWebGL.initBody(
                planet, // name
                planetData['radiuse']/kmAu, //radius
                5.0,
                0.0,
                distanceMultiplier*planetData['au']+displayedSunRadius, // orb radius
                planetData['image'], // tex path
                {r:0, g:0, b:0} // default body color
            )
        );
    }

    var planetAzith = 0.0; //TODO: actual physical planetAzith/elev instead of a spiral?
    var kmEarthRadius = spaceWebGL.solarsystemData['Earth']['radiuse'];
    var temperatureMinMax = spaceWebGL.getTemperatureEstimateMinMax();
    for(var i=0; i<spaceWebGL.exoplanetData.length; i++) {
        var planet = spaceWebGL.exoplanetData[i];
        spaceWebGL.exoplanets.push(
            spaceWebGL.initBody(
                planet['pl_hostname']+planet['pl_letter'], //name
                1.*planet['pl_rade']*kmEarthRadius/kmAu, //radius
                planetAzith,
                0.0, 
                distanceMultiplier*planet['pl_orbsmax']+displayedSunRadius, //orbit radius
                "", //texture path
                spaceWebGL.computeExoplanetColor(planet, temperatureMinMax) // color of planet
            )
        );
        planetAzith += 10.0;
    }
}

spaceWebGL.planetZoomTarget = null;
spaceWebGL.planetZoomT = 0.0;
spaceWebGL.handlePlanetZoom = function() {
    var selected = $('.ui-selected');

    if(!selected.exists()) {
        return;
    }
    
    spaceWebGL.planetZoomTarget = selected.attr("id");

    // start animation
    if(spaceWebGL.planetZoomT == 0){
        var body = spaceWebGL.allBodies[spaceWebGL.planetZoomTarget];
        var planetAzith0 = spaceWebGL.azith;
        while(planetAzith0 > body.azith) planetAzith0 -= 360.0;
        if(body.azith - planetAzith0 > 180.0) planetAzith0 += 360;
        var radiusMultiplier = body.name=="Sun" ? 1. : $('#radius-multiplier-slider').slider("value");
        planetZoomPoints = [
            {r:Math.abs(spaceWebGL.distance), elev:spaceWebGL.elev, azith:planetAzith0},
            {r:body.orbitRadius + body.radius*radiusMultiplier*20, elev:body.elev, azith:body.azith}
        ];
    }

    // animation -- update the camera location
    var t = spaceWebGL.planetZoomT;
    spaceWebGL.azith = planetZoomPoints[0].azith*(1-t) + planetZoomPoints[1].azith*t;
    spaceWebGL.elev = planetZoomPoints[0].elev*(1-t) + planetZoomPoints[1].elev*t;
    // quadratic "bounce" for the camera distance from the sun, zoom out and "swoop" back in
    // dist = at^2 + bt + c
    var a = -10; 
    var b = planetZoomPoints[1].r - planetZoomPoints[0].r - a;
    var c = planetZoomPoints[0].r;
    spaceWebGL.distance = a*t*t + b*t + c;

    // end animation
    if(spaceWebGL.planetZoomT == 1.0){
        spaceWebGL.planetZoomT = 0.0;
        spaceWebGL.planetZoomTarget = 0.0;
        selected.removeClass('ui-selected');
    } else {
        // advance the animation
        spaceWebGL.planetZoomT += 1/30;
        if(spaceWebGL.planetZoomT > 1.0){
            spaceWebGL.planetZoomT = 1.0;
        }
    }
}

spaceWebGL.setMatrices = function() {
    spaceWebGL.gl.viewport(0, 0, spaceWebGL.gl.viewportWidth, spaceWebGL.gl.viewportHeight);
    spaceWebGL.gl.clear(spaceWebGL.gl.COLOR_BUFFER_BIT | spaceWebGL.gl.DEPTH_BUFFER_BIT);

    mat4.perspective(30, spaceWebGL.gl.viewportWidth / spaceWebGL.gl.viewportHeight, 0.0001, 10000.0, spaceWebGL.pMatrix);
    mat4.identity(spaceWebGL.mvMatrix);
    mat4.translate(spaceWebGL.mvMatrix, [0, 0, -spaceWebGL.distance]);
    mat4.rotate(spaceWebGL.mvMatrix, -spaceWebGL.degToRad(spaceWebGL.elev), [1, 0, 0]);
    mat4.rotate(spaceWebGL.mvMatrix, -spaceWebGL.degToRad(spaceWebGL.azith), [0, 1, 0]);
}

// Draws everything - called per frame
spaceWebGL.drawScene = function() {
    var scaleOnlySolar = $('#scale-only-solarsystem-checkbox').is(':checked');
    var radiusMultiplier = $('#radius-multiplier-slider').slider("value");
    spaceWebGL.currentProgram = spaceWebGL.exoplanetShaderProgram;
    spaceWebGL.gl.useProgram(spaceWebGL.currentProgram);

    // Pass in light info
    spaceWebGL.gl.uniform3f(spaceWebGL.currentProgram.lightPosition, 0., 0., -10.);

    for(var i=0; i<=spaceWebGL.bodies.length; i++) {
        var scale = radiusMultiplier;
        spaceWebGL.mvPushMatrix();
        var body;
        if (i==spaceWebGL.bodies.length) {
            body = spaceWebGL.sun;
            spaceWebGL.gl.uniform1i(spaceWebGL.currentProgram.lightingFlag, 0);
            scale = 1.;
        } else {
            body = spaceWebGL.bodies[i];
            spaceWebGL.gl.uniform1i(spaceWebGL.currentProgram.lightingFlag, 1);
        }
        mat4.rotate(spaceWebGL.mvMatrix, spaceWebGL.degToRad(body.azith), [0,1,0]);
        mat4.rotate(spaceWebGL.mvMatrix, spaceWebGL.degToRad(body.elev), [1,0,0]);
        mat4.translate(spaceWebGL.mvMatrix, [0, 0, body.orbitRadius]);
        mat4.scale(spaceWebGL.mvMatrix, [scale, scale, scale]);

        spaceWebGL.handleLoadedTexture(body.texture);
        spaceWebGL.gl.activeTexture(spaceWebGL.gl.TEXTURE0);
        spaceWebGL.gl.bindTexture(spaceWebGL.gl.TEXTURE_2D, body.texture);
        spaceWebGL.gl.uniform1i(spaceWebGL.currentProgram.samplerUniform, 0);
        spaceWebGL.gl.uniform1i(spaceWebGL.currentProgram.textureFlag, 1);

        spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ARRAY_BUFFER, body.vertexPositionBuffer);
        spaceWebGL.gl.vertexAttribPointer(spaceWebGL.currentProgram.vertexPositionAttribute, body.vertexPositionBuffer.itemSize, spaceWebGL.gl.FLOAT, false, 0, 0);

        spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ARRAY_BUFFER, body.vertexTextureCoordBuffer);
        spaceWebGL.gl.vertexAttribPointer(spaceWebGL.currentProgram.textureCoordAttribute, body.vertexTextureCoordBuffer.itemSize, spaceWebGL.gl.FLOAT, false, 0, 0);

        spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ARRAY_BUFFER, body.vertexNormalBuffer);
        spaceWebGL.gl.vertexAttribPointer(spaceWebGL.currentProgram.vertexNormalAttribute, body.vertexNormalBuffer.itemSize, spaceWebGL.gl.FLOAT, false, 0, 0);

        spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ELEMENT_ARRAY_BUFFER, body.vertexIndexBuffer);
        spaceWebGL.setMatrixUniforms();
        spaceWebGL.gl.drawElements(spaceWebGL.gl.TRIANGLES, body.vertexIndexBuffer.numItems, spaceWebGL.gl.UNSIGNED_SHORT, 0);
        spaceWebGL.gl.bindTexture(spaceWebGL.gl.TEXTURE_2D, null);

        spaceWebGL.mvPopMatrix();

        var cameraPos = [0,0,0];
        mat4.multiplyVec3(spaceWebGL.mvMatrix, cameraPos);
    }
    
    // Draw exoplanets
    var scale = scaleOnlySolar ? 1. : radiusMultiplier;
    for(var i=0; i<spaceWebGL.exoplanets.length; i++) {
        spaceWebGL.mvPushMatrix();
        mat4.rotate(spaceWebGL.mvMatrix, spaceWebGL.degToRad(spaceWebGL.exoplanets[i].azith), [0,1,0]);
        mat4.rotate(spaceWebGL.mvMatrix, spaceWebGL.degToRad(spaceWebGL.exoplanets[i].elev), [1,0,0]);
        mat4.translate(spaceWebGL.mvMatrix, [0, 0, (spaceWebGL.exoplanets[i].orbitRadius)]);
        mat4.scale(spaceWebGL.mvMatrix, [scale, scale, scale]);
        
        // Turn off texturing
        spaceWebGL.gl.uniform1i(spaceWebGL.currentProgram.textureFlag, 0);

        // Turn on lighting
        spaceWebGL.gl.uniform1i(spaceWebGL.currentProgram.lightingFlag, 1);

        // Set planet color
        spaceWebGL.gl.uniform3f(
            spaceWebGL.currentProgram.exoplanetColor,
            spaceWebGL.exoplanets[i].exoplanetColor.r,
            spaceWebGL.exoplanets[i].exoplanetColor.g,
            spaceWebGL.exoplanets[i].exoplanetColor.b
        )

        spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ARRAY_BUFFER, spaceWebGL.exoplanets[i].vertexPositionBuffer);
        spaceWebGL.gl.vertexAttribPointer(spaceWebGL.currentProgram.vertexPositionAttribute, spaceWebGL.exoplanets[i].vertexPositionBuffer.itemSize, spaceWebGL.gl.FLOAT, false, 0, 0);

        spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ARRAY_BUFFER, spaceWebGL.exoplanets[i].vertexNormalBuffer);
        spaceWebGL.gl.vertexAttribPointer(spaceWebGL.currentProgram.vertexNormalAttribute, spaceWebGL.exoplanets[i].vertexNormalBuffer.itemSize, spaceWebGL.gl.FLOAT, false, 0, 0);

        spaceWebGL.gl.bindBuffer(spaceWebGL.gl.ELEMENT_ARRAY_BUFFER, spaceWebGL.exoplanets[i].vertexIndexBuffer);
        spaceWebGL.setMatrixUniforms();
        spaceWebGL.gl.drawElements(spaceWebGL.gl.TRIANGLES, spaceWebGL.exoplanets[i].vertexIndexBuffer.numItems, spaceWebGL.gl.UNSIGNED_SHORT, 0);

        spaceWebGL.mvPopMatrix();
    } 
}

spaceWebGL.tick = function() {
    // if canvas is not visible, don't draw 
    if($('#space-webgl').css('display')=='none') {
        return;
    }
    requestAnimFrame(spaceWebGL.tick);
    spaceWebGL.setMatrices();
    spaceWebGL.drawScene();
    spaceWebGL.handlePlanetZoom();
}


spaceWebGL.webGLStart = function(solarsystemData, exoplanetData) {
    spaceWebGL.solarsystemData = solarsystemData;
    spaceWebGL.exoplanetData = exoplanetData;

    var canvas = document.getElementById("space-webgl");
    spaceWebGL.initGL(canvas);
    spaceWebGL.initShaders();
    spaceWebGL.initBodies();

    spaceWebGL.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    spaceWebGL.gl.enable(spaceWebGL.gl.DEPTH_TEST);

    canvas.onmousedown = spaceWebGL.handleMouseDown;
    document.onmouseup = spaceWebGL.handleMouseUp;
    document.onmousemove = spaceWebGL.handleMouseMove;
    document.onkeydown = spaceWebGL.handleKeyDown;
    document.onkeyup = spaceWebGL.handleKeyUp;

    spaceWebGL.tick();
}
