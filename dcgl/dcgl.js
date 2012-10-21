// DC <dcposch@stanford.edu>
// Oct 2012
// Relies on:
// * jquery
// * webgl-utils
// * gl-matrix

window.DCGL = (function(){

    /**
     * Creates a WebGL context on the given canvas element.
     * * canvas -- the dom element. canvas.width/height should be initialized
     * * debug -- boolean for debug verification (webgl-debug.js), default=true 
     *
     * The resulting WebGL context has a few extra properties.
     * * gl.canvas
     * * gl.canvas.width/height sets the viewport
     * * gl.camera
     * * gl.camera.loc = [x,y,z] sets the camera location, default [0,0,0]
     * * gl.camera.azith/elev sets the camera direction, default 0,0
     * * gl.shaders
     * * gl.buffers
     */
    function createGL(canvas, debug){
        // create
        var gl = WebGLUtils.setupWebGL(canvas);
        if(typeof(debug)=="undefined" || debug){
            gl = WebGLDebugUtils.makeDebugContext(gl);
        }
        checkNN(gl);

        // extensions
        gl.canvas = canvas;
        gl.viewport(0,0,canvas.width,canvas.height);
        gl.shaders = {};
        gl.camera = {
            azith: 0,
            elev: 0,
            loc: [0,0,0]
        };
        gl.buffers = {};

        // default params
        gl.clearColor(0.0, 0.0, 0.3, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        return gl;
    }

    /** Runs the animation loop.
      * renderFunction will get three arguments:
      * * t, time in seconds, starting from 0.0
      * * dt, time in seconds since the last frame
      * * frameNum, counting up from 1 
      * Uses requestAnimFrame for efficiency. Prints FPS stats.
      */
    function animate(renderFunction, element){
        var startTime = new Date().getTime()/1000.0;
        var lastTime = 0;
        var frameNum = 1;
        (function animloop(){
            //update time
            var t = (new Date().getTime())/1000.0 - startTime;
            var dt = t - lastTime;
            lastTime = t;
            frameNum++;
            if(frameNum % 100 == 0){
                console.log((1/dt)+" fps");
            }

            //render frame
            renderFunction(t, dt, frameNum);

            //wait
            requestAnimFrame(animloop, element);
        })(); 
    }

    /// SHADERS and VARIABLES
    function getShader(id, shaders, gl) {
        //memoize
        if(shaders[id])
            return shaders[id];
        
        //get the source
        console.log("finding and compiling shader "+id);
        var source, type;
        var shaderScript = document.getElementById(id) || die("can't find "+id);
        source = shaderScript.firstChild.textContent;
        type = shaderScript.type;
        if (shaderScript.type == "x-shader/x-fragment") {
            type = gl.FRAGMENT_SHADER;
        } else if (type == "x-shader/x-vertex") {
            type = gl.VERTEX_SHADER;
        } else {
            die("unrecognized shader type "+type);
        }

        //create the shader
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);

        //compile
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            die(gl.getShaderInfoLog(shader));
        }

        shaders[id] = shader;
        return shader;
    }

    function getShaderProgram(vertexShader, fragmentShader, vars, gl) {
        //memoize
        var shaders = gl.shaders;
        shaders.vertex = shaders.vertex || {};
        shaders.fragment = shaders.fragment || {};
        shaders.program = shaders.program || {};
        var key = vertexShader + "_" + fragmentShader;
        var prog = null;
        if(shaders.program[key]){
            prog = shaders.program[key];
        } else {
            prog = gl.createProgram();
            shaders.program[key] = prog;

            //compile the shaders, if needed
            var vs = getShader(vertexShader, shaders.vertex, gl);
            var fs = getShader(fragmentShader, shaders.fragment, gl);
        
            //...then link them
            console.log("linking shader program "+key);
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);
            gl.getProgramParameter(prog, gl.LINK_STATUS) || 
                die("could not link shaders");

            // store the attribute and uniform locations
            prog.loc = {};
            for(var i = 0; i < vars.length; i++){
                var key = vars[i];
                var loc;
                if(key[0]=="a"){
                    loc = gl.getAttribLocation(prog, key);
                    gl.enableVertexAttribArray(loc);
                } else if(key[0]=="u"){
                    loc = gl.getUniformLocation(prog, key);
                }
                prog.loc[key] = checkNN(loc);
            }
        }
        return prog;
    }

    function createBuffer(arr, elemSize, gl){
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
        buf.numElems = arr.length / elemSize;
        buf.elemSize = elemSize;
        return buf;
    }


    // *** DEBUG AIDS ***
    function die(msg){
        throw msg;
    }

    function checkNN(o){
        if(o==null) throw "param shouldn't be null";
        return o;
    }

    return {
        createGL: createGL,
        animate: animate,
        createBuffer: createBuffer,
        getShaderProgram: getShaderProgram
    };
})()
