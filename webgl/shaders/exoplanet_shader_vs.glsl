
    // These are the input params per vertex,
    // specified when we bind vertex positions, normals, and
    // text coords as attributes
    attribute vec3 vertexPosition;
    attribute vec3 vertexNormal;
    attribute vec2 vertexTextureCoord;

    // The modelview, projection, and normal matrix passed in
    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    uniform mat3 uNMatrix;

    uniform vec3 uLightPosition;

    // These are the output values for the shader, to be
    // interpolated across vertices and passed in per fragment
    // to the fragment shader
    varying vec3 eyePosition; // pos of vertex in eye (camera) space
    varying vec3 normal; // normal at vertex
    varying vec2 textureCoord;
    varying vec3 lightPosition;

    void main(void) {
        // Transform vertex to get eye-space position of vertex
        vec4 eyePositionHomo = uMVMatrix*vec4(vertexPosition, 1); // homogenous
        eyePosition = eyePositionHomo.xyz;

        // Transform normal appropriately and save
        normal = uNMatrix*vertexNormal;

        // Just copy texture coords
        textureCoord = vertexTextureCoord;

        // Transform light position into eye space
        lightPosition = (uMVMatrix*vec4(uLightPosition, 1)).xyz;
        
        // Transform again to get clip-space coordinates via the
        // projection matrix. The gl_Position variable tells webGL
        // where the vertex should go
        gl_Position = uPMatrix * uMVMatrix * vec4(vertexPosition, 1.0);

    }
