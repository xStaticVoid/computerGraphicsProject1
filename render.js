/**
 * Created by Hans Dulimarta.
 *
 * Edited by Cameron Sprowls
 */
let canvas;
let gl;
let allObjs = [];

let projUnif;
let projMat, viewMat;


/* Global variables for consistency through the shapes */
const SIZE_OF_CITY = 100;
const SHAPE_RADIUS = .1;

/* Program essentials */
let autoMove = true;
let time = Date.now();
let camera = mat4.create();

function main() {
    canvas = document.getElementById("my-canvas");

    /* setup window resize listener */
    window.addEventListener('resize', resizeWindow);
    gl = WebGLUtils.create3DContext(canvas, null);

    ShaderUtils.loadFromFile(gl, "vshader.glsl", "fshader.glsl")
        .then (prog => {

            /* put all one-time initialization logic here */
            gl.useProgram (prog);
            gl.clearColor (0, 0, 0, 1);
            gl.enable(gl.CULL_FACE);
            gl.enable(gl.DEPTH_TEST);
            gl.cullFace(gl.BACK);

            /* the vertex shader defines TWO attribute vars and ONE uniform var */
            let posAttr = gl.getAttribLocation (prog, "vertexPos");
            let colAttr = gl.getAttribLocation (prog, "vertexCol");
            Object3D.linkShaderAttrib({
                positionAttr: posAttr,
                colorAttr: colAttr
            });
            let modelUnif = gl.getUniformLocation (prog, "modelCF");
            projUnif = gl.getUniformLocation (prog, "projection");
            viewUnif = gl.getUniformLocation (prog, "view");
            Object3D.linkShaderUniform({
                projection: projUnif,
                view: viewUnif,
                model: modelUnif
            });
            gl.enableVertexAttribArray (posAttr);
            gl.enableVertexAttribArray (colAttr);
            projMat = mat4.create();
            gl.uniformMatrix4fv (projUnif, false, projMat);
            viewMat = mat4.lookAt(mat4.create(),   // Out
                vec3.fromValues (1, 1, 1.5),  // eye coord
                vec3.fromValues (-5, -5, 0),  // center
                vec3.fromValues (0, 0, 1)   // Z is up
            );

            gl.uniformMatrix4fv (viewUnif, false, viewMat);

            /* recalculate new viewport */
            resizeWindow();
            createObject();

            /* initiate the render request */
            window.requestAnimFrame(drawScene);
            window.requestAnimFrame(moveForward);
        });

    // Listener for the movement of the camera/airplane
    window.addEventListener ('keydown', event => {
        let key = String.fromCharCode(event.keyCode);
        switch (key) {
            case '1':
                viewMat = mat4.lookAt(mat4.create(),   // Out
                    vec3.fromValues (1.75, 2, 1.5),  // eye coord
                    vec3.fromValues (-5, -5, 0),  // center
                    vec3.fromValues (0, 0, 1)   // Z is up
                );
                mat4.invert(camera, viewMat);
                mat4.rotateX(camera, camera, -.3);
                mat4.invert(viewMat, camera);
                break;
            case '2':
                viewMat = mat4.lookAt(mat4.create(),   // Out
                    vec3.fromValues (2.25, 0, .2),  // eye coord
                    vec3.fromValues (-5, -5, 0),  // center
                    vec3.fromValues (0, 0, 1)   // Z is up
                );
                mat4.invert(camera, viewMat);
                mat4.rotateY(camera, camera, glMatrix.toRadian(-45));
                mat4.rotateX(camera, camera, glMatrix.toRadian(2));
                mat4.invert(viewMat, camera);
                break;
            case '3':
                viewMat = mat4.lookAt(mat4.create(),   // Out
                    vec3.fromValues (-2.25, -2.25, .5),  // eye coord
                    vec3.fromValues (-5, -5, 0),  // center
                    vec3.fromValues (0, 0, 1)   // Z is up
                );
                mat4.invert(camera, viewMat);
                mat4.rotateY(camera, camera, glMatrix.toRadian(180));
                mat4.invert(viewMat, camera);
                break;
            case 'W':      // Forward down Z
                mat4.invert(camera, viewMat);
                mat4.translate(camera, camera, vec3.fromValues(0, 0, -.1/2));
                mat4.invert(viewMat, camera);
                break;
            case 'S':      // Backward
                mat4.invert(camera, viewMat);
                mat4.translate(camera, camera, vec3.fromValues(0, 0, .1/2));
                mat4.invert(viewMat, camera);
                break;
            case 'Q':      // Angle Up
                mat4.invert(camera, viewMat);
                mat4.rotateX(camera, camera, .1/2);
                mat4.invert(viewMat, camera);
                break;
            case 'E':      // Angle Down
                mat4.invert(camera, viewMat);
                mat4.rotateX(camera, camera, -.1/2);
                mat4.invert(viewMat, camera);
                break;
            case 'A':      // Roll Left
                mat4.invert(camera, viewMat);
                mat4.rotateY(camera, camera, .1/2);
                mat4.invert(viewMat, camera);
                break;
            case 'D':     // Roll Right
                mat4.invert(camera, viewMat);
                mat4.rotateY(camera, camera, -.1/2);
                mat4.invert(viewMat, camera);
                break;
            case 'Z':      // Turn Left
                mat4.invert(camera, viewMat);
                mat4.rotateZ(camera, camera, .1/2);
                mat4.invert(viewMat, camera);
                break;
            case 'C':     // Turn Right
                mat4.invert(camera, viewMat);
                mat4.rotateZ(camera, camera, -.1/2);
                mat4.invert(viewMat, camera);
                break;
            case 'I': //up
                mat4.invert(camera, viewMat);
                mat4.translate(camera, camera, vec3.fromValues(0, .1/2, 0));
                mat4.invert(viewMat, camera);
                break;
            case 'K': //down
                mat4.invert(camera, viewMat);
                mat4.translate(camera, camera, vec3.fromValues(0, -.1/2, 0));
                mat4.invert(viewMat, camera);
                break;
            case 'J': //Left
                mat4.invert(camera, viewMat);
                mat4.translate(camera, camera, vec3.fromValues(-.1/2, 0, 0));
                mat4.invert(viewMat, camera);
                break;
            case 'L': //Right
                mat4.invert(camera, viewMat);
                mat4.translate(camera, camera, vec3.fromValues(.1/2, 0, 0));
                mat4.invert(viewMat, camera);
                break;
            default:
                break;
        }

        gl.uniformMatrix4fv (viewUnif, false, viewMat);
        window.requestAnimationFrame(drawScene);
    });

    // Listener for the drop down menu for the auto-move feature
    const movementMode = document.getElementById("Auto Move");
    movementMode.addEventListener('click', event => {
        switch (movementMode.selectedIndex) {
            case 0:
                autoMove = true;
                moveForward();
                break;
            case 1:
                autoMove = false;
                break;
            default:
                break;
        }
    });
}

function drawScene() {
    // Clear the screen
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    for (let k = 0; k < allObjs.length; k++) {
        allObjs[k].draw(gl);
    }
}

/***
 * Function that moves the camera forward on a different
 * thread so the user can still move around.
 */
function moveForward() {
    if (autoMove) {
        if (new Date() - time > 10) {
            // Update view matrix via the camera
            mat4.invert(camera, viewMat);
            mat4.translate(camera, camera, vec3.fromValues(0, 0, -.01));
            mat4.invert(viewMat, camera);

            time = Date.now();
        }
        // Refresh screen then keep running in a loop
        gl.uniformMatrix4fv(viewUnif, false, viewMat);
        drawScene();
        //window.requestAnimFrame(moveForward);
    }
}

/***
 * Creates all of the "buildings" for the city, pushed them back to the array to be drawn
 *
 * Currently draws the city in a bad grid, works for now until I can move the camera
 */
function createObject() {
    // "Grass"
    let grassColor = vec3.fromValues(51/255, 204/255, 51/255);
    let grass = new PolygonalPrism(gl, {
        topRadius: 3,
        bottomRadius: 3,
        numSides: 360,
        height: .001,
        topColor: grassColor,
        bottomColor: grassColor,
    });

    allObjs.push(grass);

    // Sidewalks
    let sideWalkColor = vec3.fromValues(255/255, 255/255, 204/255);
    let sidewalk = new PolygonalPrism(gl, {
        topRadius: 1,
        bottomRadius: 1,
        numSides: 360,
        height: .001,
        topColor: sideWalkColor,
        bottomColor: sideWalkColor,
    });
    mat4.translate(sidewalk.coordFrame, sidewalk.coordFrame, vec3.fromValues(0, 0, .0001));
    allObjs.push(sidewalk);

    // The four surrounding shrubbery-thingies
    let shrubbery;
    for (let i = 0; i < 4; i++) {
        shrubbery = new Shrubbery(gl);

        mat4.rotateZ(shrubbery.coordFrame, shrubbery.coordFrame, glMatrix.toRadian(90 * i));
        mat4.translate(shrubbery.coordFrame, shrubbery.coordFrame, mat4.fromValues(.5, 0, .0001));

        allObjs.push(shrubbery);
    }

    // Start creating the scene
    let cT = new ClockTower(gl);

    let trashCan1 = new TrashCan(gl, {
        height: .15,
        length: .05,
        color: vec3.fromValues(14/255, 98/255, 234/255),
    });
    mat4.translate(trashCan1.coordFrame, trashCan1.coordFrame, vec3.fromValues(1, 1, 1));

    allObjs.push(cT, trashCan1);

}

function resizeWindow() {
    let w = window.innerWidth - 16;
    let h = 0.75 * window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    mat4.perspective (projMat, glMatrix.toRadian(60), w/h, 0.05, 20);
    gl.uniformMatrix4fv (projUnif, false, projMat);
    gl.viewport(0, 0, w, h);
}

