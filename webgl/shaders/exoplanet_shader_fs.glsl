
    precision mediump float;

    // Use texture
    uniform int textureFlag;
    uniform int lightingFlag;
    uniform sampler2D textureSampler;
    uniform vec3 exoplanetColor;

    // These are the input params per fragment,
    // interpolated by webGL
    varying vec3 eyePosition;
    varying vec3 normal;
    varying vec2 textureCoord; // texture coords
    varying vec3 lightPosition; // position of light in camera pos

    vec3 getMaterialColor() {
        if(textureFlag==1) {
            vec4 textureColor = texture2D(textureSampler, vec2(textureCoord.s, textureCoord.t));
            return textureColor.rgb;
        } else {
            return exoplanetColor;
        }
    }

    void main(void) {
        // TODO: pass in instead of hard-coding
        // diffuse, ambient, and specular materials
        vec3 Kd = getMaterialColor();

        if(lightingFlag==0) {
            gl_FragColor = vec4(Kd, 1.);
            return;
        }
        
        // light source (hardcoded for now)
        vec3 lightColor = vec3(1., 1., 1.);

        // Normalized normal
        vec3 N = normalize(normal);

        // point light from (0,0,0), which is where the camera is always
        vec3 L = normalize(lightPosition - eyePosition);
        vec3 V = normalize(-eyePosition);
        vec3 R = normalize(reflect(-L, N));

        vec3 Ks = vec3(1, 1, 1);
        vec3 Ka = vec3(0.2, 0.2, 0.2);

        // compute the diffuse color coefficient
        float Rd = max(0., dot(L, N));

        vec3 diffuse = Rd * Kd * lightColor;
        vec3 ambient = Ka * Kd * lightColor;
        vec3 specular = pow(max(0.,dot(R,V)), 2.) * vec3(0.2,0.2,0.2);

        // Tell webgl what the fragment color is
        gl_FragColor = vec4(diffuse + ambient + specular, 1.);
    }
