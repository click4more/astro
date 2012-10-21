DCGL
====

webgl quick start

why?
----
webgl can do some [very cool stuff](http://media.tojicode.com/q3bsp/). but the api is platypus, an odd mix of two very different languages--C and Javascript. at first glance, it's just the OpenGL ES C api, a big state machine that doesn't feel like javascript at all. the shaders use GLSL, a variant of C. on the other hand, it's javascript, so there's even less type safety than in C.

sadly, webgl does not "fail fast", at all. say you want to draw a few points. so you make a vertex shader, a fragment shader. the vertex shader starts with

    attribute vec3 aVertexPosition; 

...for the location of each vertex. this being opengl, you have to specify "aVertexPosition" in at least four other places.

    var locVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(locVertexPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, myPoints);
    gl.vertexAttribPointer(locVertexPosition, 3, gl.FLOAT, false, 0, 0); 
    //and finally, we can draw those vertex positions...
    gl.drawArrays(gl.POINTS, 0, numPoints);
    
say you remember everything except that cryptic call to `enableVertexAttribArray()`. do you get an exception? of course not. you get the default webgl failure mode, a blank black screen.

this makes debugging difficult and it makes raw webgl a pain to use. most people opt for large libraries like ThreeJS, or they start with a tutorial and carefully modify.

docs
----
* [glMatrix](https://github.com/toji/gl-matrix)
* [webgl-utils](http://code.google.com/p/webglsamples/source/browse/book/webgl-utils.js?r=41401f8a69b1f8d32c6863ac8c1953c8e1e8eba0) 
* [GLSL cheat sheet](http://mew.cx/glsl_quickref.pdf)
* [debug mode](https://www.khronos.org/registry/webgl/sdk/debug/webgl-debug.js)



